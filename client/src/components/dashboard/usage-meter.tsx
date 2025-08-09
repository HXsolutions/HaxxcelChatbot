import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const usageData = [
  {
    label: "API Calls",
    current: 8500,
    limit: 10000,
    color: "bg-green-500",
  },
  {
    label: "Storage",
    current: 2.1,
    limit: 5,
    unit: "GB",
    color: "bg-blue-500",
  },
  {
    label: "Conversations",
    current: 1247,
    limit: 2000,
    color: "bg-purple-500",
  },
];

export default function UsageMeter() {
  return (
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Usage This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageData.map((usage, index) => {
          const percentage = (usage.current / usage.limit) * 100;
          
          return (
            <div key={index} className="group hover:bg-gray-700/30 p-2 rounded-lg transition-all duration-300">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">{usage.label}</span>
                <span className="font-medium text-white">
                  {usage.current.toLocaleString()}{usage.unit || ""} / {usage.limit.toLocaleString()}{usage.unit || ""}
                </span>
              </div>
              <Progress value={percentage} className="h-2 bg-gray-700 group-hover:bg-gray-600 transition-colors duration-300" />
            </div>
          );
        })}
        
        <Button className="w-full mt-4 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105">
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}
