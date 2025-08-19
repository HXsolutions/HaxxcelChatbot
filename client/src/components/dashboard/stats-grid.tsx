import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  activeChatbots: number;
  totalConversations: number;
  avgResponseTime: number;
  apiUsage: number;
}

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-6 bg-gray-700/50 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Chatbots",
      value: stats?.activeChatbots || 0,
      icon: "fas fa-robot",
      iconBg: "bg-gradient-to-br from-primary/20 to-cyan-500/20",
      iconColor: "text-primary",
      change: "+12%",
      changeColor: "text-green-400",
      changeLabel: "vs last month",
    },
    {
      title: "Conversations",
      value: stats?.totalConversations?.toLocaleString() || "0",
      icon: "fas fa-comments",
      iconBg: "bg-gradient-to-br from-green-500/20 to-emerald-600/20",
      iconColor: "text-green-400",
      change: "+23%",
      changeColor: "text-green-400",
      changeLabel: "vs last week",
    },
    {
      title: "Response Time",
      value: `${stats?.avgResponseTime?.toFixed(1) || "0"}s`,
      icon: "fas fa-clock",
      iconBg: "bg-gradient-to-br from-yellow-500/20 to-orange-600/20",
      iconColor: "text-yellow-400",
      change: "-5%",
      changeColor: "text-red-400",
      changeLabel: "faster",
    },
    {
      title: "API Usage",
      value: `${Math.round((stats?.apiUsage || 0) / 100)}%`,
      icon: "fas fa-chart-pie",
      iconBg: "bg-gradient-to-br from-purple-500/20 to-violet-600/20",
      iconColor: "text-purple-400",
      change: "87%",
      changeColor: "text-gray-400",
      changeLabel: "of quota",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <Card 
          key={index} 
          className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm hover:from-gray-800/95 hover:to-gray-900/95 transition-all duration-300 transform hover:scale-105 group"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${card.changeColor}`}>
                  {card.change}
                </span>
                <p className="text-xs text-gray-400">{card.changeLabel}</p>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-sm text-gray-300">{card.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
