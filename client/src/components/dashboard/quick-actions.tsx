import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const actions = [
    {
      title: "Create Chatbot",
      icon: "fas fa-plus",
      iconBg: "bg-gradient-to-br from-primary/20 to-cyan-500/20",
      iconColor: "text-primary",
      onClick: () => window.location.href = "/chatbots",
    },
    {
      title: "View Analytics",
      icon: "fas fa-chart-bar",
      iconBg: "bg-gradient-to-br from-green-500/20 to-emerald-600/20",
      iconColor: "text-green-400",
      onClick: () => window.location.href = "/analytics",
    },
    {
      title: "Account Settings",
      icon: "fas fa-cog",
      iconBg: "bg-gradient-to-br from-purple-500/20 to-violet-600/20",
      iconColor: "text-purple-400",
      onClick: () => window.location.href = "/settings",
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start p-3 h-auto bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:text-white hover:border-primary/50 transition-all duration-300 group"
            onClick={action.onClick}
          >
            <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300`}>
              <i className={`${action.icon} ${action.iconColor} text-sm`}></i>
            </div>
            <span className="text-sm font-medium">{action.title}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
