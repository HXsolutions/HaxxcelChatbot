import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Check, Eye, EyeOff, Upload, Palette, Copy, Code, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ChatPlayground from "./chat-playground";
import DataSourcesTab from "./data-sources-tab";

const chatbotSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  llmProvider: z.string().min(1, "LLM provider is required"),
  llmModel: z.string().min(1, "LLM model is required"),
  systemPrompt: z.string().optional(),
  voiceProvider: z.string().optional(),
  voiceEnabled: z.boolean().default(false),
  imageEnabled: z.boolean().default(false),
  // Customization fields
  headerColor: z.string().default("#3B82F6"),
  title: z.string().default("Chat with us"),
  subtitle: z.string().default("We're here to help!"),
  theme: z.enum(["light", "dark"]).default("light"),
  bubbleColor: z.string().default("#3B82F6"),
  logo: z.string().optional(),
  defaultMessages: z.array(z.string()).default(["Hello! How can I help you today?"]),
});

type ChatbotFormData = z.infer<typeof chatbotSchema>;

// Deployment Dialog Component
function DeploymentDialog({ channelId, channelName, chatbotId }: { channelId: string; channelName: string; chatbotId?: string }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const generateEmbedCode = (chatbotId: string) => {
    const domain = window.location.origin;
    return {
      script: `<!-- Haxxcel Chatbot Widget -->
<script>
  (function() {
    var chatWidget = document.createElement('div');
    chatWidget.id = 'haxxcel-chat-widget';
    chatWidget.setAttribute('data-chatbot-id', '${chatbotId}');
    document.body.appendChild(chatWidget);
    
    var script = document.createElement('script');
    script.src = '${domain}/chat-widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`,
      iframe: `<!-- Haxxcel Chatbot iFrame -->
<iframe 
  src="${domain}/widget/${chatbotId}"
  width="400" 
  height="600"
  frameborder="0"
  style="border: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  title="Haxxcel Chatbot">
</iframe>`
    };
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleDeploy = () => {
    if (!chatbotId) {
      toast({
        title: "Create Chatbot First",
        description: "Please create your chatbot before deploying",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
  };

  const embedCodes = chatbotId ? generateEmbedCode(chatbotId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDeploy}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Code className="w-4 h-4 sm:w-5 sm:h-5" />
            Deploy to {channelName}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Get the embed code to add this chatbot to your website
          </DialogDescription>
        </DialogHeader>
        
        {embedCodes && (
          <div className="space-y-4 sm:space-y-6">
            {/* Script Embed */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">JavaScript Embed (Recommended)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCodes.script, "Script code")}
                  className="w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Script
                </Button>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 sm:p-4">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto break-all sm:break-normal">
                  {embedCodes.script}
                </pre>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Add this script to your website's HTML before the closing &lt;/body&gt; tag. The chatbot will appear as a floating widget.
              </p>
            </div>

            {/* iFrame Embed */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">iFrame Embed</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCodes.iframe, "iFrame code")}
                  className="w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy iFrame
                </Button>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 sm:p-4">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto break-all sm:break-normal">
                  {embedCodes.iframe}
                </pre>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Use this iFrame to embed the chatbot as a fixed component in your webpage. You can customize the width and height.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-blue-800">
                  <p className="font-medium mb-1">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy one of the embed codes above</li>
                    <li>Paste it into your website's HTML</li>
                    <li>Your chatbot will be live instantly!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChatbotBuilderProps {
  onClose: () => void;
  chatbot?: any;
}

export default function ChatbotBuilder({ onClose, chatbot }: ChatbotBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>(chatbot?.llmProvider || "google");
  const [activeTab, setActiveTab] = useState("playground");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'idle' | 'testing' | 'connected' | 'failed'}>({});
  const [connectedProviders, setConnectedProviders] = useState<{[key: string]: string[]}>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const form = useForm<ChatbotFormData>({
    resolver: zodResolver(chatbotSchema),
    defaultValues: {
      name: chatbot?.name || "",
      description: chatbot?.description || "",
      llmProvider: chatbot?.llmProvider || "google",
      llmModel: chatbot?.llmModel || "gemini-2.5-pro",
      systemPrompt: chatbot?.systemPrompt || "",
      voiceProvider: chatbot?.voiceProvider || "google",
      voiceEnabled: chatbot?.voiceEnabled || false,
      imageEnabled: chatbot?.imageEnabled || false,
      headerColor: chatbot?.headerColor || "#3B82F6",
      title: chatbot?.title || "Chat with us",
      subtitle: chatbot?.subtitle || "We're here to help!",
      theme: chatbot?.theme || "light",
      bubbleColor: chatbot?.bubbleColor || "#3B82F6",
      logo: chatbot?.logo || "",
      defaultMessages: chatbot?.defaultMessages || ["Hello! How can I help you today?"],
    },
  });

  // Watch form values for live preview
  const watchedValues = form.watch();

  // Auto-save functionality - debounced updates
  useEffect(() => {
    if (!chatbot?.id) return; // Only auto-save for existing chatbots

    const timer = setTimeout(() => {
      const currentValues = form.getValues();
      
      // Auto-save API key when changed
      if (apiKeyValue && apiKeyValue !== chatbot.apiKey) {
        saveCredentials(selectedProvider, apiKeyValue);
      }

      // Auto-save chatbot settings when changed
      if (JSON.stringify(currentValues) !== JSON.stringify(chatbot)) {
        saveChatbotMutation.mutate(currentValues);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [watchedValues, apiKeyValue, selectedProvider, chatbot, form, saveChatbotMutation]);

  // Auto-save credentials function
  const saveCredentials = async (provider: string, apiKey: string) => {
    if (!chatbot?.id || !apiKey.trim()) return;

    try {
      const response = await apiRequest('POST', '/api/user/credentials', {
        type: 'llm_api_key',
        name: `${provider}_api_key`,
        encryptedValue: apiKey,
        metadata: {
          provider,
          chatbotId: chatbot.id,
        }
      });

      if (response.ok) {
        toast({
          title: "Credentials Saved",
          description: `${provider} API key saved automatically`,
        });
      }
    } catch (error) {
      console.error('Auto-save credentials error:', error);
    }
  };

  // Fetch LLM providers
  const { data: llmProviders } = useQuery({
    queryKey: ['/api/llm-providers'],
  });

  // Fetch voice providers
  const { data: voiceProviders } = useQuery({
    queryKey: ['/api/voice-providers'],
  });

  // Fetch available integrations
  const { data: integrations } = useQuery({
    queryKey: ['/api/integrations/available'],
  });

  // Create/update chatbot
  const saveChatbotMutation = useMutation({
    mutationFn: async (data: ChatbotFormData) => {
      const payload = {
        ...data,
        apiKey: apiKeyValue,
      };
      
      if (chatbot) {
        const response = await apiRequest('PUT', `/api/chatbots/${chatbot.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/chatbots', payload);
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatbots'] });
      
      // Only show success toast and close for manual saves, not auto-saves
      if (!chatbot) {
        toast({
          title: "Success",
          description: "Chatbot created successfully",
        });
        onClose();
      } else {
        // For updates, just invalidate queries for real-time updates
        queryClient.invalidateQueries({ queryKey: ['/api/chatbots', chatbot.id] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${chatbot ? 'update' : 'create'} chatbot`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChatbotFormData) => {
    saveChatbotMutation.mutate(data);
  };

  // Test API connection function
  const testConnection = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus(prev => ({ ...prev, [provider]: 'testing' }));

    try {
      const response = await fetch('/api/llm-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'connected' }));
        
        // Fetch available models for the connected provider
        const modelsResponse = await fetch(`/api/llm-providers/${provider}/models?apiKey=${encodeURIComponent(apiKey)}`);
        if (modelsResponse.ok) {
          const models = await modelsResponse.json();
          setConnectedProviders(prev => ({ ...prev, [provider]: models }));
          setAvailableModels(models);
        }

        toast({
          title: "Connected!",
          description: `Successfully connected to ${provider}`,
        });
      } else {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to the provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      toast({
        title: "Connection Error",
        description: "Network error while testing connection",
        variant: "destructive",
      });
    }
  };

  // Update available models when provider changes
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    if (connectedProviders[provider]) {
      setAvailableModels(connectedProviders[provider]);
    } else {
      setAvailableModels([]);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const logoUrl = URL.createObjectURL(file);
      form.setValue('logo', logoUrl);
      
      // In a real app, you would upload to your server/CDN here
      console.log('Logo uploaded:', file.name);
    }
    // Reset input
    event.target.value = '';
  };

  // All Google Workspace integrations
  const googleWorkspaceTools = [
    { id: 'gmail', name: 'Gmail', icon: 'fab fa-google', description: 'Access and manage emails' },
    { id: 'google_drive', name: 'Google Drive', icon: 'fab fa-google-drive', description: 'File storage and sharing' },
    { id: 'google_docs', name: 'Google Docs', icon: 'fas fa-file-alt', description: 'Document creation and editing' },
    { id: 'google_sheets', name: 'Google Sheets', icon: 'fas fa-table', description: 'Spreadsheet management' },
    { id: 'google_slides', name: 'Google Slides', icon: 'fas fa-presentation', description: 'Presentation creation' },
    { id: 'google_calendar', name: 'Google Calendar', icon: 'fas fa-calendar', description: 'Calendar and event management' },
    { id: 'google_meet', name: 'Google Meet', icon: 'fas fa-video', description: 'Video conferencing' },
    { id: 'google_forms', name: 'Google Forms', icon: 'fas fa-clipboard-list', description: 'Form creation and responses' },
  ];

  const otherIntegrations = [
    { id: 'notion', name: 'Notion', icon: 'fas fa-sticky-note', description: 'Knowledge management and collaboration' },
    { id: 'hubspot', name: 'HubSpot', icon: 'fas fa-chart-line', description: 'CRM and marketing automation' },
    { id: 'salesforce', name: 'Salesforce', icon: 'fab fa-salesforce', description: 'Customer relationship management' },
    { id: 'zoho', name: 'Zoho', icon: 'fas fa-briefcase', description: 'Business applications suite' },
    { id: 'shopify', name: 'Shopify', icon: 'fab fa-shopify', description: 'E-commerce platform' },
    { id: 'zapier', name: 'Zapier', icon: 'fas fa-bolt', description: 'Workflow automation' },
    { id: 'make', name: 'Make', icon: 'fas fa-cogs', description: 'Visual automation platform' },
    { id: 'n8n', name: 'n8n', icon: 'fas fa-network-wired', description: 'Open-source automation' },
  ];

  const deploymentChannels = [
    { id: 'website', name: 'Website Widget', icon: 'fas fa-globe', color: 'text-blue-500', description: 'Embed chatbot on your website' },
    { id: 'shopify', name: 'Shopify Store', icon: 'fab fa-shopify', color: 'text-green-600', description: 'Integrate with Shopify store' },
    { id: 'whatsapp', name: 'WhatsApp Business', icon: 'fab fa-whatsapp', color: 'text-green-500', description: 'WhatsApp Business API integration' },
    { id: 'facebook', name: 'Facebook Messenger', icon: 'fab fa-facebook-messenger', color: 'text-blue-600', description: 'Facebook Messenger integration' },
    { id: 'instagram', name: 'Instagram DM', icon: 'fab fa-instagram', color: 'text-pink-500', description: 'Instagram Direct Messages' },
    { id: 'telegram', name: 'Telegram Bot', icon: 'fab fa-telegram', color: 'text-blue-400', description: 'Telegram bot integration' },
  ];

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {chatbot ? 'Edit Chatbot' : 'Create New Chatbot'}
            </CardTitle>
            <p className="text-gray-600 mt-1">
              {chatbot ? 'Update your chatbot configuration' : 'Set up your AI-powered chatbot'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Main Create/Update Button - Moved to top */}
            <div className="flex justify-end space-x-4 pb-6 border-b border-gray-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveChatbotMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
                onClick={(e) => {
                  // Prevent form submission if clicking from within playground
                  if (e.target.closest('.playground-container')) {
                    e.preventDefault();
                    return;
                  }
                }}
              >
                {saveChatbotMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {chatbot ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {chatbot ? 'Update Chatbot' : 'Create Chatbot'}
                  </>
                )}
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="playground">🎮 Playground</TabsTrigger>
                <TabsTrigger value="data">📁 Data Sources</TabsTrigger>
                <TabsTrigger value="basic">⚙️ Basic Setup</TabsTrigger>
                <TabsTrigger value="credentials">🔑 Credentials</TabsTrigger>
                <TabsTrigger value="integrations">🔗 Integrations</TabsTrigger>
                <TabsTrigger value="deployment">🚀 Deployment</TabsTrigger>
              </TabsList>

              {/* Playground Tab - First tab for testing */}
              <TabsContent value="playground" className="space-y-6 mt-6">
                <ChatPlayground chatbotId={chatbot?.id} chatbotConfig={watchedValues} />
              </TabsContent>

              {/* Data Sources Tab - Separate tab */}
              <TabsContent value="data" className="space-y-6 mt-6">
                <DataSourcesTab chatbotId={chatbot?.id} />
              </TabsContent>

              {/* Basic Setup Tab - Enhanced with full customization */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column - Basic Information */}
                    <div className="space-y-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chatbot Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter chatbot name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe your chatbot's purpose" className="h-20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="systemPrompt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>System Prompt</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter instructions for your chatbot (e.g., 'Act as a helpful customer support agent')" 
                                    className="h-24" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>

                      {/* AI Model Configuration */}
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Configuration</h3>
                        
                        <div className="space-y-4">
                          {connectionStatus[selectedProvider] === 'connected' && availableModels.length > 0 && (
                            <FormField
                              control={form.control}
                              name="llmModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>LLM Model</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableModels.map((model: string) => (
                                          <SelectItem key={model} value={model}>
                                            {model}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {connectionStatus[selectedProvider] !== 'connected' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center">
                                <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                                <div className="text-sm text-blue-800">
                                  <p className="font-medium mb-1">Connect API to Select Models</p>
                                  <p>Please go to the <strong>Credentials</strong> tab and connect your {selectedProvider} API key to see available models.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Voice & Features */}
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="voiceEnabled"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3">
                                  <FormControl>
                                    <Checkbox 
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm cursor-pointer">Enable voice input</FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            {form.watch('voiceEnabled') && (
                              <FormField
                                control={form.control}
                                name="voiceProvider"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select voice provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(voiceProviders as any[])?.map((provider: any) => (
                                            <SelectItem key={provider.id} value={provider.id}>
                                              {provider.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}

                            <FormField
                              control={form.control}
                              name="imageEnabled"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3">
                                  <FormControl>
                                    <Checkbox 
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm cursor-pointer">Enable image input</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Right Column - Customization Options */}
                    <div className="space-y-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Chat Widget Customization
                        </h3>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chat Header Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Chat with us" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="subtitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chat Header Subtitle</FormLabel>
                                <FormControl>
                                  <Input placeholder="We're here to help!" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="headerColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Header Color</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input 
                                        type="color" 
                                        {...field} 
                                        className="w-12 h-10 p-1 border rounded cursor-pointer"
                                      />
                                      <Input 
                                        {...field} 
                                        placeholder="#3B82F6"
                                        className="flex-1"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="bubbleColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chat Bubble Color</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input 
                                        type="color" 
                                        {...field} 
                                        className="w-12 h-10 p-1 border rounded cursor-pointer"
                                      />
                                      <Input 
                                        {...field} 
                                        placeholder="#3B82F6"
                                        className="flex-1"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chat Window Theme</FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="light">Light Theme</SelectItem>
                                      <SelectItem value="dark">Dark Theme</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Header Logo URL</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input 
                                      placeholder="https://example.com/logo.png" 
                                      {...field} 
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.svg"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                      />
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        className="cursor-pointer"
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Logo
                                      </Button>
                                      <span className="text-xs text-gray-500">or paste URL above</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>

                      {/* Default Messages */}
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Bot Messages</h3>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="defaultMessages"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Welcome Message</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Hello! How can I help you today?"
                                    value={field.value?.[0] || ""}
                                    onChange={(e) => field.onChange([e.target.value])}
                                    className="h-20"
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">This message will appear when users first open the chat</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> All changes here will reflect instantly in the Playground tab for testing.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Info about saving */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                      <span className="text-sm text-blue-800">
                        <strong>Note:</strong> Changes are automatically reflected in the Playground. Use the main "Create Chatbot" button below to save your chatbot.
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="credentials" className="space-y-6 mt-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Configuration</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Large Language Model (LLM)</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Provider</Label>
                          <Select value={selectedProvider} onValueChange={handleProviderChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select LLM provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="google">Google (Gemini) - Default</SelectItem>
                              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                              <SelectItem value="xai">xAI (Grok)</SelectItem>
                              <SelectItem value="meta">Meta (Llama)</SelectItem>
                              <SelectItem value="mistral">Mistral AI</SelectItem>
                              <SelectItem value="alibaba">Alibaba (Qwen)</SelectItem>
                              <SelectItem value="deepseek">DeepSeek</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="llmApiKey">API Key</Label>
                          <div className="relative">
                            <Input
                              id="llmApiKey"
                              type={showApiKey ? "text" : "password"}
                              placeholder={`Enter your ${selectedProvider} API key`}
                              value={apiKeyValue}
                              onChange={(e) => setApiKeyValue(e.target.value)}
                              className="pr-24"
                            />
                            <div className="absolute right-12 top-0 flex h-full items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute right-1 top-1 h-8 px-3"
                                onClick={() => testConnection(selectedProvider, apiKeyValue)}
                                disabled={connectionStatus[selectedProvider] === 'testing'}
                              >
                                {connectionStatus[selectedProvider] === 'testing' ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin mr-1"></i>
                                    Testing...
                                  </>
                                ) : (
                                  'Connect'
                                )}
                              </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">
                              This API key will be used only for this chatbot
                            </p>
                            {connectionStatus[selectedProvider] && (
                              <div className="flex items-center gap-1 text-sm">
                                {connectionStatus[selectedProvider] === 'connected' && (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 font-medium">Connected</span>
                                  </>
                                )}
                                {connectionStatus[selectedProvider] === 'failed' && (
                                  <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-red-600 font-medium">Not Connected</span>
                                  </>
                                )}
                                {connectionStatus[selectedProvider] === 'testing' && (
                                  <>
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-600 font-medium">Testing...</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Voice Processing</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Voice Provider</Label>
                          <Select defaultValue="google">
                            <SelectTrigger>
                              <SelectValue placeholder="Select voice provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="google">Google Cloud Speech & TTS - Default</SelectItem>
                              <SelectItem value="openai">OpenAI (Whisper & TTS)</SelectItem>
                              <SelectItem value="deepgram">Deepgram</SelectItem>
                              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                              <SelectItem value="azure">Microsoft Azure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="voiceApiKey">Voice API Key</Label>
                          <div className="relative">
                            <Input
                              id="voiceApiKey"
                              type="password"
                              placeholder="Enter voice API key"
                              className="pr-16"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute right-1 top-1 h-8 px-3"
                              disabled
                            >
                              Connect
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Optional: Leave empty to use platform-provided voice processing
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        <i className="fas fa-info-circle mr-1"></i>
                        Credentials will be saved when you create the chatbot
                      </span>
                      <Button type="button" variant="outline" disabled>
                        <i className="fas fa-key mr-2"></i>
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6 mt-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Integration Configuration</h3>
                  
                  {/* Google Workspace Tools */}
                  <div className="mb-8">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Google Workspace</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {googleWorkspaceTools.map((tool) => (
                        <Card key={tool.id} className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <i className={`${tool.icon} text-gray-600`}></i>
                            <h5 className="font-medium">{tool.name}</h5>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                          <div className="space-y-2">
                            <Input placeholder={`${tool.name} credentials`} />
                            <Button variant="outline" size="sm">
                              Test Connection
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Other Integrations */}
                  <div className="mb-8">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Other Integrations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherIntegrations.map((integration) => (
                        <Card key={integration.id} className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <i className={`${integration.icon} text-gray-600`}></i>
                            <h5 className="font-medium">{integration.name}</h5>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                          <div className="space-y-2">
                            <Input placeholder={`${integration.name} credentials`} />
                            <Button variant="outline" size="sm">
                              Test Connection
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        <i className="fas fa-info-circle mr-1"></i>
                        Integration settings will be saved when you create the chatbot
                      </span>
                      <Button type="button" variant="outline" disabled>
                        <i className="fas fa-plug mr-2"></i>
                        Test All Connections
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deployment" className="space-y-6 mt-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Deployment Channels</h3>
                  
                  <div className="space-y-6">
                    {deploymentChannels.map((channel) => (
                      <Card key={channel.id} className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <i className={`${channel.icon} ${channel.color} text-2xl`}></i>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{channel.name}</h4>
                            <p className="text-sm text-gray-600">{channel.description}</p>
                          </div>
                          <div className="ml-auto">
                            {channel.id === 'website' ? (
                              <DeploymentDialog channelId={channel.id} channelName={channel.name} chatbotId={chatbot?.id} />
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                Coming Soon
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {channel.id === 'website' && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                              <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Easy Website Integration</p>
                                <p>Click "Deploy" to get the embed code for your website. No technical setup required!</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {channel.id !== 'website' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`${channel.id}-config`}>Configuration</Label>
                                <Input
                                  id={`${channel.id}-config`}
                                  placeholder={`Enter ${channel.name} configuration`}
                                  disabled
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${channel.id}-credentials`}>Credentials</Label>
                                <Input
                                  id={`${channel.id}-credentials`}
                                  type="password"
                                  placeholder={`Enter ${channel.name} credentials`}
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <i className="fas fa-clock"></i>
                              <span>This integration is coming soon in a future update</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        <i className="fas fa-info-circle mr-1"></i>
                        Create your chatbot first, then use the deployment options
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}