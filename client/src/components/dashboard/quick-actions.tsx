import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const actions = [
    {
      title: "Create Chatbot",
      icon: "fas fa-plus",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: () => window.location.href = "/chatbots",
    },
    {
      title: "View Analytics",
      icon: "fas fa-chart-bar",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      onClick: () => window.location.href = "/analytics",
    },
    {
      title: "Account Settings",
      icon: "fas fa-cog",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      onClick: () => window.location.href = "/settings",
    },
  ];

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start p-3 h-auto"
            onClick={action.onClick}
          >
            <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center mr-3`}>
              <i className={`${action.icon} ${action.iconColor} text-sm`}></i>
            </div>
            <span className="text-sm font-medium">{action.title}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
