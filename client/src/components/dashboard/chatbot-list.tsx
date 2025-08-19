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
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Your Chatbots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Your Chatbots</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Chatbots</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {chatbots && chatbots.length > 0 ? (
          <div className="divide-y divide-gray-700/50">
            {chatbots.slice(0, 3).map((chatbot) => (
              <div key={chatbot.id} className="p-6 hover:bg-gray-700/30 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <i className="fas fa-robot text-white"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{chatbot.name}</h3>
                      <p className="text-sm text-gray-300">{chatbot.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge 
                          variant={chatbot.status === 'active' ? 'default' : 'secondary'}
                          className={chatbot.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-600/20 text-gray-400 border-gray-600/30'}
                        >
                          {chatbot.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Updated {chatbot.updatedAt ? new Date(chatbot.updatedAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors duration-300">
                      <i className="fas fa-chart-bar"></i>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors duration-300">
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
