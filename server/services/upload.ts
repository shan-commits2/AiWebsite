import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter to allow only specific types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/plain', 'text/markdown', 'application/json', 'text/csv',
    'text/javascript', 'text/typescript', 'text/html', 'text/css',
    'application/pdf'
  ];
  
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.txt', '.md', '.json', '.csv',
    '.js', '.ts', '.html', '.css', '.py', '.java', '.cpp', '.c',
    '.pdf'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export interface FileAnalysis {
  type: 'image' | 'text' | 'code' | 'document';
  content?: string;
  metadata?: {
    size: number;
    mimeType: string;
    language?: string;
    lines?: number;
  };
}

export async function analyzeFile(filePath: string, originalName: string, mimeType: string): Promise<FileAnalysis> {
  const stats = fs.statSync(filePath);
  const extension = path.extname(originalName).toLowerCase();
  
  // Determine file type
  let type: FileAnalysis['type'] = 'document';
  if (mimeType.startsWith('image/')) {
    type = 'image';
  } else if (mimeType.startsWith('text/') || ['.txt', '.md', '.json', '.csv'].includes(extension)) {
    type = 'text';
  } else if (['.js', '.ts', '.py', '.html', '.css', '.java', '.cpp', '.c'].includes(extension)) {
    type = 'code';
  }
  
  const analysis: FileAnalysis = {
    type,
    metadata: {
      size: stats.size,
      mimeType,
    }
  };
  
  // For text and code files, read content
  if (type === 'text' || type === 'code') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      analysis.content = content;
      analysis.metadata!.lines = content.split('\n').length;
      
      if (type === 'code') {
        analysis.metadata!.language = getLanguageFromExtension(extension);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }
  
  return analysis;
}

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.json': 'json',
    '.md': 'markdown'
  };
  
  return languageMap[extension] || 'text';
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}