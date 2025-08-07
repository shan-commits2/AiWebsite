import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now. Click the microphone again to stop."
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // For now, we'll use browser's built-in speech recognition as a fallback
      // In a real implementation, you'd send this to a speech-to-text service
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Use browser's speech recognition as fallback
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onTranscription(transcript);
          
          toast({
            title: "Voice input successful",
            description: "Your speech has been converted to text."
          });
        };
        
        recognition.onerror = (event: any) => {
          toast({
            title: "Speech recognition failed",
            description: "Please try again or type your message.",
            variant: "destructive"
          });
        };
        
        recognition.onend = () => {
          setIsProcessing(false);
        };
        
        // We can't directly process the blob with browser API, so we show a message
        toast({
          title: "Processing audio...",
          description: "Please start speaking after clicking the microphone."
        });
        
        recognition.start();
      } else {
        // Fallback: just show that we received audio
        onTranscription("[Voice input received - transcription not available in this browser]");
        toast({
          title: "Voice input received",
          description: "Voice transcription requires a modern browser or speech service."
        });
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Please try again or type your message.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={cn(
        "h-8 w-8 p-0 transition-all duration-200",
        isRecording 
          ? "text-red-400 hover:text-red-300 animate-pulse" 
          : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50",
        isProcessing && "animate-spin"
      )}
      title={
        isRecording 
          ? "Click to stop recording" 
          : "Click to start voice input"
      }
    >
      {isRecording ? (
        <Square className="h-4 w-4 fill-current" />
      ) : isProcessing ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}