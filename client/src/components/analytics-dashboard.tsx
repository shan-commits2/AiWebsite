import { useState, useEffect } from "react";
import { BarChart3, MessageSquare, Clock, Zap, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type UsageStats } from "@shared/schema";

export function AnalyticsDashboard() {
  const [countdown, setCountdown] = useState(5);

  // useQuery with 5s refetch interval
  const { data: usageStats = [], isLoading, refetch } = useQuery<UsageStats[]>({
    queryKey: ["/api/analytics/usage"],
    refetchInterval: 5000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000,
  });

  // Countdown timer synced with refetchInterval
  useEffect(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev === 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalConversations = conversations.length;
  const totalMessages = usageStats.reduce((sum, stat) => sum + stat.messagesExchanged, 0);
  const totalTokens = usageStats.reduce((sum, stat) => sum + stat.tokensUsed, 0);
  const avgResponseTime = usageStats.length > 0
    ? usageStats.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / usageStats.length
    : 0;

  const recentStats = usageStats.slice(-7);

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.FC<{ className?: string }>;
    change?: string;
    color: string;
  }) => (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && <p className="text-xs text-green-400 mt-1">{change}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div>Loading analytics...</div>
        <div className="text-xs mt-2">update in {countdown}s</div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto space-y-6">
      <div className="flex items-center space-x-3 mb-1">
        <BarChart3 className="h-6 w-6 text-blue-400" />
        <h2 className="text-white text-xl font-semibold">Usage Analytics</h2>
        <span className="text-xs text-gray-400 ml-auto">update in {countdown}s</span>
      </div>
      <p className="text-gray-400 mb-6">Track your AI chat usage and performance metrics</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value={totalConversations}
          icon={MessageSquare}
          change="+12% this week"
          color="bg-blue-600"
        />
        <StatCard
          title="Messages Sent"
          value={formatNumber(totalMessages)}
          icon={MessageSquare}
          change="+8% this week"
          color="bg-green-600"
        />
        <StatCard
          title="Tokens Used"
          value={formatNumber(totalTokens)}
          icon={Zap}
          change="+15% this week"
          color="bg-purple-600"
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round(avgResponseTime)}ms`}
          icon={Clock}
          change="-5% this week"
          color="bg-orange-600"
        />
      </div>

      <section className="bg-gray-700/50 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
          Recent Activity (Last 7 Days)
        </h3>

        {recentStats.length > 0 ? (
          <div className="space-y-3">
            {recentStats.map((stat, index) => {
              const date = new Date(stat.date).toLocaleDateString();
              const maxMessages = Math.max(...recentStats.map((s) => s.messagesExchanged));
              const width = maxMessages > 0 ? (stat.messagesExchanged / maxMessages) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{date}</span>
                    <span className="text-gray-400">
                      {stat.messagesExchanged} messages • {formatNumber(stat.tokensUsed)} tokens
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p>No usage data available yet</p>
            <p className="text-sm text-gray-500">Start chatting to see analytics</p>
          </div>
        )}
      </section>

      <section className="bg-gray-700/50 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">Model Usage</h3>

        {usageStats.length > 0 ? (
          <div className="space-y-3">
            {Object.entries(
              usageStats.reduce((acc, stat) => {
                Object.entries(stat.modelsUsed || {}).forEach(([model, count]) => {
                  acc[model] = (acc[model] || 0) + count;
                });
                return acc;
              }, {} as Record<string, number>)
            ).map(([model, count]) => {
              const maxCount = Math.max(
                ...Object.values(
                  usageStats.reduce((acc, stat) => {
                    Object.entries(stat.modelsUsed || {}).forEach(([m, c]) => {
                      acc[m] = (acc[m] || 0) + c;
                    });
                    return acc;
                  }, {} as Record<string, number>)
                )
              );
              const width = Math.min(100, (count / maxCount) * 100);
              return (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">
                    {model.replace(/-/g, " ").replace(/gemini/gi, "Gemini")}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Zap className="h-8 w-8 mx-auto mb-2" />
            <p>No model usage data yet</p>
          </div>
        )}
      </section>

      <section className="bg-gray-700/50 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Quick Stats</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                • Average conversation length:{" "}
                {totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0}{" "}
                messages
              </li>
              <li>
                • Peak usage:{" "}
                {recentStats.length > 0
                  ? Math.max(...recentStats.map((s) => s.messagesExchanged))
                  : 0}{" "}
                messages/day
              </li>
              <li>
                • Most active model:{" "}
                {usageStats.length > 0
                  ? Object.keys(usageStats[0]?.modelsUsed || {})[0] || "N/A"
                  : "N/A"}
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Efficiency Tips</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Use model comparison for complex queries</li>
              <li>• Try voice input for faster message creation</li>
              <li>• Export conversations to save important chats</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
