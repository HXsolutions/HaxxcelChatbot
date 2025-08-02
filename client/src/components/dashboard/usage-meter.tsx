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
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle>Usage This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageData.map((usage, index) => {
          const percentage = (usage.current / usage.limit) * 100;
          
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{usage.label}</span>
                <span className="font-medium">
                  {usage.current.toLocaleString()}{usage.unit || ""} / {usage.limit.toLocaleString()}{usage.unit || ""}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        
        <Button className="w-full mt-4">
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}
