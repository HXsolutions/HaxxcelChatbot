import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    message: "Customer Support Bot deployed",
    time: "2 hours ago",
    color: "bg-green-500",
  },
  {
    message: "New integration added: Gmail",
    time: "5 hours ago",
    color: "bg-blue-500",
  },
  {
    message: "Training data updated",
    time: "1 day ago",
    color: "bg-yellow-500",
  },
];

export default function RecentActivity() {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
            <div>
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
