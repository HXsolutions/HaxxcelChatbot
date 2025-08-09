import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User, Chatbot } from "@shared/schema";

interface PlatformStats {
  totalUsers: number;
  totalChatbots: number;
  totalConversations: number;
  monthlyRevenue: number;
}

interface AdminPanelProps {
  stats?: PlatformStats;
}

interface UserActivity {
  user: string;
  action: string;
  time: string;
  status: string;
}

export default function AdminPanel({ stats }: AdminPanelProps) {
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: allChatbots, isLoading: chatbotsLoading } = useQuery<Chatbot[]>({
    queryKey: ['/api/admin/chatbots'],
  });

  // Mock recent activity data - in real app this would come from API
  const recentActivity: UserActivity[] = [
    {
      user: "sarah@company.com",
      action: "Created new chatbot",
      time: "2 hours ago",
      status: "Success"
    },
    {
      user: "john@startup.co", 
      action: "Upgraded to Pro plan",
      time: "4 hours ago",
      status: "Success"
    },
    {
      user: "admin@agency.com",
      action: "Configured white-label",
      time: "6 hours ago", 
      status: "Enterprise"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Master Admin Panel</h2>
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-medium">{stats?.totalUsers?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Chatbots</span>
                  <span className="font-medium">{stats?.totalChatbots?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Conversations</span>
                  <span className="font-medium">{stats?.totalConversations?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-medium">${stats?.monthlyRevenue?.toLocaleString() || '0'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">API Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Google API</span>
                  <span className="font-medium">1.2M calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OpenAI API</span>
                  <span className="font-medium">847K calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Anthropic API</span>
                  <span className="font-medium">523K calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Other APIs</span>
                  <span className="font-medium">302K calls</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="font-medium text-green-600">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="font-medium">142ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="font-medium text-green-600">0.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="font-medium">2,847</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Users Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUsers?.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                            alt="User" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.planType === 'enterprise' ? 'default' : 'secondary'}>
                            {user.planType}
                          </Badge>
                          {user.isWhiteLabel && (
                            <Badge variant="outline">White Label</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {allUsers && allUsers.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{allUsers.length - 5} more users
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Chatbots Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {chatbotsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allChatbots?.slice(0, 5).map((chatbot) => (
                      <div key={chatbot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <i className="fas fa-robot text-white text-xs"></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{chatbot.name}</p>
                            <p className="text-xs text-gray-500">{chatbot.llmProvider} · {chatbot.llmModel}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'}>
                            {chatbot.status}
                          </Badge>
                          {chatbot.voiceEnabled && (
                            <i className="fas fa-microphone text-blue-500 text-xs" title="Voice enabled"></i>
                          )}
                          {chatbot.imageEnabled && (
                            <i className="fas fa-image text-green-500 text-xs" title="Image enabled"></i>
                          )}
                        </div>
                      </div>
                    ))}
                    {allChatbots && allChatbots.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{allChatbots.length - 5} more chatbots
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentActivity.map((activity, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{activity.user}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{activity.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{activity.time}</td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant={
                              activity.status === 'Success' ? 'default' :
                              activity.status === 'Enterprise' ? 'default' : 
                              'secondary'
                            }
                            className={
                              activity.status === 'Success' ? 'bg-green-100 text-green-800' :
                              activity.status === 'Enterprise' ? 'bg-blue-100 text-blue-800' :
                              ''
                            }
                          >
                            {activity.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Management Actions */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Button variant="outline">
              <i className="fas fa-download mr-2"></i>
              Export User Data
            </Button>
            <Button variant="outline">
              <i className="fas fa-chart-line mr-2"></i>
              Generate Report
            </Button>
            <Button variant="outline">
              <i className="fas fa-cog mr-2"></i>
              System Settings
            </Button>
            <Button variant="outline">
              <i className="fas fa-database mr-2"></i>
              Database Backup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
