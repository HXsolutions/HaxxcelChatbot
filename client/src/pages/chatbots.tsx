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
        title: "Authentication Required",
        description: "Please log in to access chatbots.",
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
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
        
        <div className="p-4 sm:p-6 relative z-10">
          {showBuilder ? (
            <div className="mb-8 animate-fadeIn">
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
              <p className="text-gray-300 mt-4">Loading chatbots...</p>
            </div>
          ) : chatbots && chatbots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn">
              {chatbots.map((chatbot) => (
                <Card 
                  key={chatbot.id} 
                  className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm hover:from-gray-800/95 hover:to-gray-900/95 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group"
                  onClick={() => {
                    setEditingChatbot(chatbot);
                    setShowBuilder(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="fas fa-robot text-white"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{chatbot.name}</h3>
                        <p className="text-sm text-gray-300 truncate">{chatbot.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        variant={chatbot.status === 'active' ? 'default' : 'secondary'}
                        className={chatbot.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-600/20 text-gray-400 border-gray-600/30'}
                      >
                        {chatbot.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {chatbot.llmProvider} · {chatbot.llmModel}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Updated {chatbot.updatedAt ? new Date(chatbot.updatedAt).toLocaleDateString() : 'Recently'}</span>
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 hover:text-primary transition-colors duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Analytics functionality
                          }}
                        >
                          <i className="fas fa-chart-bar"></i>
                        </button>
                        <button 
                          className="p-1 hover:text-primary transition-colors duration-300"
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
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm text-center py-12 animate-fadeIn">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-primary text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No chatbots yet</h3>
                <p className="text-gray-300 mb-4">Create your first AI chatbot to get started</p>
                <Button 
                  onClick={() => setShowBuilder(true)}
                  className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                >
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
