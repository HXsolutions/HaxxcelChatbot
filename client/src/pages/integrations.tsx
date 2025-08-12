import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  features: string[];
  icon: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: integrations, isLoading: integrationsLoading } = useQuery<ToolIntegration[]>({
    queryKey: ['/api/integrations/available'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const categories = integrations ? [...new Set(integrations.map(i => i.category))] : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Integrations" 
          subtitle="Connect your chatbots with external tools and services"
        />
        
        <div className="p-6">
          {integrationsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600 mt-4">Loading integrations...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map(category => {
                const categoryIntegrations = integrations?.filter(i => i.category === category) || [];
                
                return (
                  <div key={category}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryIntegrations.map(integration => (
                        <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <i className={`${integration.icon} text-gray-600`}></i>
                              </div>
                              <div>
                                <CardTitle className="text-base">{integration.name}</CardTitle>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {integration.authType.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {(integration.features || []).slice(0, 3).map(feature => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {(integration.features || []).length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(integration.features || []).length - 3} more
                                </Badge>
                              )}
                            </div>
                            <Button className="w-full" variant="outline">
                              <i className="fas fa-plus mr-2"></i>
                              Connect
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
