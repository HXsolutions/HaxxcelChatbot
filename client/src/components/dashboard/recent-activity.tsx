import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    message: "Customer Support Bot deployed",
    time: "2 hours ago",
    color: "bg-gradient-to-r from-green-500 to-emerald-600",
    icon: "fas fa-robot",
  },
  {
    message: "New integration added: Gmail",
    time: "5 hours ago",
    color: "bg-gradient-to-r from-primary to-cyan-500",
    icon: "fas fa-link",
  },
  {
    message: "Training data updated",
    time: "1 day ago",
    color: "bg-gradient-to-r from-yellow-500 to-orange-600",
    icon: "fas fa-database",
  },
];

export default function RecentActivity() {
  return (
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 group hover:bg-gray-700/30 p-2 rounded-lg transition-all duration-300">
            <div className={`w-8 h-8 ${activity.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <i className={`${activity.icon} text-white text-sm`}></i>
            </div>
            <div>
              <p className="text-sm text-white font-medium">{activity.message}</p>
              <p className="text-xs text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
