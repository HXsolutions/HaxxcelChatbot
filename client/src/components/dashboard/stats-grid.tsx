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
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
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
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12%",
      changeColor: "text-green-600",
      changeLabel: "vs last month",
    },
    {
      title: "Conversations",
      value: stats?.totalConversations?.toLocaleString() || "0",
      icon: "fas fa-comments",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+23%",
      changeColor: "text-green-600",
      changeLabel: "vs last week",
    },
    {
      title: "Response Time",
      value: `${stats?.avgResponseTime?.toFixed(1) || "0"}s`,
      icon: "fas fa-clock",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      change: "-5%",
      changeColor: "text-red-600",
      changeLabel: "faster",
    },
    {
      title: "API Usage",
      value: `${Math.round((stats?.apiUsage || 0) / 100)}%`,
      icon: "fas fa-chart-pie",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "87%",
      changeColor: "text-gray-600",
      changeLabel: "of quota",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor}`}></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium flex items-center ${stat.changeColor}`}>
                <i className="fas fa-arrow-up mr-1"></i>
                {stat.change}
              </span>
              <span className="text-gray-500 text-sm ml-2">{stat.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
