import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Globe, MessageSquare, Instagram, Send, ShoppingCart, Webhook, Copy, ExternalLink } from "lucide-react";

interface DeploymentChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'requires_setup' | 'premium';
  features: string[];
}

interface Chatbot {
  id: string;
  name: string;
  status: string;
}

export default function Deployment() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedChatbot, setSelectedChatbot] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [deploymentConfig, setDeploymentConfig] = useState({
    webhookUrl: '',
    customDomain: '',
    embedCode: '',
  });

  const { data: chatbots = [] } = useQuery<Chatbot[]>({
    queryKey: ['/api/chatbots'],
    enabled: isAuthenticated,
  });

  const deploymentChannels: DeploymentChannel[] = [
    {
      id: 'website',
      name: 'Website Embed',
      description: 'Add a chat widget to your website',
      icon: <Globe className="w-6 h-6" />,
      status: 'available',
      features: ['Custom styling', 'Mobile responsive', 'Analytics tracking']
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Deploy on WhatsApp using Business API',
      icon: <MessageSquare className="w-6 h-6" />,
      status: 'requires_setup',
      features: ['Message templates', 'Media support', 'Business verification']
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      description: 'Connect with Facebook Messenger',
      icon: <MessageSquare className="w-6 h-6" />,
      status: 'requires_setup',
      features: ['Rich messages', 'Quick replies', 'Persistent menu']
    },
    {
      id: 'instagram',
      name: 'Instagram DM',
      description: 'Automate Instagram direct messages',
      icon: <Instagram className="w-6 h-6" />,
      status: 'requires_setup',
      features: ['Story replies', 'Auto responses', 'Media sharing']
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Create a Telegram bot',
      icon: <Send className="w-6 h-6" />,
      status: 'available',
      features: ['Inline keyboards', 'File sharing', 'Group support']
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      description: 'Integrate with your Shopify store',
      icon: <ShoppingCart className="w-6 h-6" />,
      status: 'requires_setup',
      features: ['Product recommendations', 'Order tracking', 'Customer support']
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      description: 'Connect via REST API webhooks',
      icon: <Webhook className="w-6 h-6" />,
      status: 'available',
      features: ['REST API', 'Custom integration', 'Real-time events']
    }
  ];

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

  const generateEmbedCode = (chatbotId: string) => {
    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    document.head.appendChild(script);
  })();
</script>`;
  };

  const handleDeploy = () => {
    if (!selectedChatbot || !selectedChannel) {
      toast({
        title: "Missing Information",
        description: "Please select both a chatbot and deployment channel",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deployment Started",
      description: `Deploying ${chatbots.find(c => c.id === selectedChatbot)?.name} to ${deploymentChannels.find(c => c.id === selectedChannel)?.name}`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Deployment" 
          subtitle="Deploy your chatbots across multiple channels"
          action={
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Deploy Chatbot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Deploy Chatbot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chatbot">Select Chatbot</Label>
                    <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a chatbot to deploy" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatbots.map((chatbot) => (
                          <SelectItem key={chatbot.id} value={chatbot.id}>
                            {chatbot.name} ({chatbot.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="channel">Deployment Channel</Label>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose deployment channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {deploymentChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              {channel.icon}
                              {channel.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedChannel === 'website' && (
                    <div>
                      <Label htmlFor="embed">Embed Code</Label>
                      <div className="relative">
                        <Textarea
                          value={selectedChatbot ? generateEmbedCode(selectedChatbot) : ''}
                          readOnly
                          className="font-mono text-sm"
                          rows={6}
                        />
                        <Button
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generateEmbedCode(selectedChatbot))}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedChannel === 'webhook' && (
                    <div>
                      <Label htmlFor="webhook">Webhook URL</Label>
                      <Input
                        placeholder="https://your-app.com/webhook"
                        value={deploymentConfig.webhookUrl}
                        onChange={(e) => setDeploymentConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      />
                    </div>
                  )}
                  <Button 
                    onClick={handleDeploy} 
                    className="w-full"
                    disabled={!selectedChatbot || !selectedChannel}
                  >
                    Deploy Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        
        <div className="p-6">
          <div className="grid gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Deployment Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentChannels.map((channel) => (
                  <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                            {channel.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{channel.name}</CardTitle>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            channel.status === 'available' ? 'default' : 
                            channel.status === 'requires_setup' ? 'secondary' : 'outline'
                          }
                        >
                          {channel.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{channel.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {channel.features.slice(0, 2).map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {channel.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{channel.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={channel.status === 'available' ? 'default' : 'outline'}
                        disabled={channel.status === 'premium'}
                      >
                        {channel.status === 'available' ? 'Deploy' : 
                         channel.status === 'requires_setup' ? 'Setup Required' : 'Coming Soon'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {chatbots.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Deployments</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Deployments</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Deploy your chatbots to start serving customers across channels
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
