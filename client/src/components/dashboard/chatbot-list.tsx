import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Chatbot } from "@shared/schema";

export default function ChatbotList() {
  const { data: chatbots, isLoading } = useQuery<Chatbot[]>({
    queryKey: ['/api/chatbots'],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Your Chatbots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle>Your Chatbots</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chatbots</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {chatbots && chatbots.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {chatbots.slice(0, 3).map((chatbot) => (
              <div key={chatbot.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <i className="fas fa-robot text-white"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chatbot.name}</h3>
                      <p className="text-sm text-gray-600">{chatbot.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'}>
                          {chatbot.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Updated {new Date(chatbot.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <i className="fas fa-chart-bar"></i>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <i className="fas fa-cog"></i>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-robot text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chatbots yet</h3>
            <p className="text-gray-600">Create your first AI chatbot to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
