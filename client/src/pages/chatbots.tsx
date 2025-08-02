import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ChatbotBuilder from "@/components/chatbot/chatbot-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Chatbot } from "@shared/schema";

export default function Chatbots() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: chatbots, isLoading: chatbotsLoading } = useQuery<Chatbot[]>({
    queryKey: ['/api/chatbots'],
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
        window.location.href = "/api/login";
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-auto lg:ml-0">
        <Header 
          title={showBuilder ? (editingChatbot ? "Edit Chatbot" : "Create New Chatbot") : "Chatbots"}
          subtitle={showBuilder ? (editingChatbot ? "Modify your chatbot settings and configuration" : "Configure your new AI chatbot") : "Create and manage your AI chatbots"}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
          action={
            !showBuilder ? (
              <Button onClick={() => setShowBuilder(true)}>
                <i className="fas fa-plus mr-2"></i>
                New Chatbot
              </Button>
            ) : (
              <Button variant="outline" onClick={() => {
                setShowBuilder(false);
                setEditingChatbot(null);
              }}>
                <i className="fas fa-arrow-left mr-2"></i>
                Back to List
              </Button>
            )
          }
        />
        
        <div className="p-4 sm:p-6">
          {showBuilder ? (
            <div className="mb-8">
              <ChatbotBuilder 
                onClose={() => {
                  setShowBuilder(false);
                  setEditingChatbot(null);
                }} 
                chatbot={editingChatbot}
              />
            </div>
          ) : (
            <>
              {chatbotsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600 mt-4">Loading chatbots...</p>
            </div>
          ) : chatbots && chatbots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {chatbots.map((chatbot) => (
                <Card 
                  key={chatbot.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setEditingChatbot(chatbot);
                    setShowBuilder(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-robot text-white"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{chatbot.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{chatbot.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'}>
                        {chatbot.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {chatbot.llmProvider} · {chatbot.llmModel}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Updated {chatbot.updatedAt ? new Date(chatbot.updatedAt).toLocaleDateString() : 'Recently'}</span>
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 hover:text-primary-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Analytics functionality
                          }}
                        >
                          <i className="fas fa-chart-bar"></i>
                        </button>
                        <button 
                          className="p-1 hover:text-primary-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // More options functionality
                          }}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No chatbots yet</h3>
                <p className="text-gray-600 mb-4">Create your first AI chatbot to get started</p>
                <Button onClick={() => setShowBuilder(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Create Chatbot
                </Button>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
