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
import { ToolsTab } from "./tools-tab";

// Component to show vector store (single unified data source)
function VectorStoreDisplay({ chatbotId, onAddToPrompt }: { chatbotId?: string, onAddToPrompt: (text: string) => void }) {
  const { data: dataSources } = useQuery<any[]>({
    queryKey: [`/api/chatbots/${chatbotId}/data-sources`],
    enabled: !!chatbotId,
  });

  if (!chatbotId) {
    return (
      <div className="text-sm text-gray-500 p-2 bg-gray-100 border border-gray-200 rounded">
        Create your chatbot first to see data sources here
      </div>
    );
  }

  const hasData = dataSources && Array.isArray(dataSources) && dataSources.length > 0;
  const processedCount = hasData ? dataSources.filter((s: any) => s.processed && s.vectorized).length : 0;

  return (
    <div 
      className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm cursor-pointer hover:bg-blue-100 transition-colors"
      onClick={() => {
        const vectorStoreText = `Use uploaded data sources to answer questions when relevant.`;
        onAddToPrompt(vectorStoreText);
      }}
      title="Click to add instruction to use data sources"
    >
      <i className="fas fa-database text-blue-600"></i>
      <span className="font-medium">Data Sources</span>
      {hasData && Array.isArray(dataSources) && (
        <span className="text-xs text-gray-600">
          ({processedCount}/{dataSources.length} ready)
        </span>
      )}
      <span className={`px-2 py-1 rounded text-xs ml-auto ${
        hasData && processedCount > 0 ? 'bg-green-100 text-green-800' :
        hasData ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-600'
      }`}>
        {hasData && processedCount > 0 ? 'Ready' : 
         hasData ? 'Processing' : 'Empty'}
      </span>
    </div>
  );
}

const chatbotSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  llmProvider: z.string().min(1, "LLM provider is required"),
  llmModel: z.string().min(1, "LLM model is required"),
  systemPrompt: z.string().optional(),
  voiceProvider: z.string().optional(),
  voiceApiKey: z.string().optional(),
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            Deploy to {channelName}
          </DialogTitle>
          <DialogDescription>
            Get the professional embed code to seamlessly integrate your AI chatbot into your website
          </DialogDescription>
        </DialogHeader>
        
        {embedCodes && (
          <div className="space-y-8">
            {/* Script Embed */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">JS</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">JavaScript Embed</h4>
                    <p className="text-xs text-green-400">Recommended • Dynamic Integration</p>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(embedCodes.script, "Script code")}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Script
                </Button>
              </div>
              <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {embedCodes.script}
                </pre>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-blue-400 mb-1">Usage Instructions:</p>
                  <p>Add this script before the closing &lt;/body&gt; tag. The chatbot will appear as a floating widget on your website.</p>
                </div>
              </div>
            </div>

            {/* iFrame Embed */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-bold text-xs">IF</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">iFrame Embed</h4>
                    <p className="text-xs text-purple-400">Static • Fixed Component</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(embedCodes.iframe, "iFrame code")}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy iFrame
                </Button>
              </div>
              <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {embedCodes.iframe}
                </pre>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-purple-400 mb-1">Usage Instructions:</p>
                  <p>Use this iFrame to embed the chatbot as a fixed component. You can customize the width and height attributes.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-cyan-500/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h5 className="font-semibold text-white mb-3">Quick Setup Guide</h5>
                  <ol className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</span>
                      Choose your preferred embed method above
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</span>
                      Copy the embed code to your clipboard
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</span>
                      Paste it into your website's HTML source
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400">✓</span>
                      Your AI chatbot is now live!
                    </li>
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
      voiceApiKey: chatbot?.voiceApiKey || "",
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

  // Load existing API keys and test connections when chatbot loads
  useEffect(() => {
    if (chatbot?.voiceApiKey) {
      form.setValue('voiceApiKey', chatbot.voiceApiKey);
    }
    
    // Load existing API key from user credentials if available
    if (chatbot?.id) {
      loadExistingCredentials();
    }
  }, [chatbot, form]);

  // Function to load existing credentials for the chatbot
  const loadExistingCredentials = async () => {
    if (!chatbot?.id) return;
    
    try {
      const response = await fetch('/api/user/credentials');
      if (response.ok) {
        const credentials = await response.json();
        
        // Find LLM API key for this chatbot and provider
        const llmCredential = credentials.find((cred: any) => 
          cred.type === 'llm_api_key' && 
          cred.metadata?.chatbotId === chatbot.id &&
          cred.metadata?.provider === chatbot.llmProvider
        );
        
        if (llmCredential) {
          // Get the actual API key value
          const keyResponse = await fetch(`/api/user/credentials/${llmCredential.id}/value`);
          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            setApiKeyValue(keyData.value);
            
            // Test the connection automatically
            if (keyData.value) {
              await testConnection(chatbot.llmProvider, keyData.value);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  // Watch form values for live preview
  const watchedValues = form.watch();

  // Create/update chatbot mutation - MUST be defined before useEffect hooks
  const saveChatbotMutation = useMutation({
    mutationFn: async (data: ChatbotFormData) => {
      const payload = {
        ...data,
        apiKey: apiKeyValue,
        voiceApiKey: data.voiceApiKey,
      };
      
      const url = chatbot ? `/api/chatbots/${chatbot.id}` : '/api/chatbots';
      const method = chatbot ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, payload);
      
      if (!response.ok) {
        throw new Error('Failed to save chatbot');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate and refetch both individual chatbot and list
      queryClient.invalidateQueries({ queryKey: ['/api/chatbots'] });
      if (result.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/chatbots', result.id] });
      }
      
      // If creating new chatbot, close the builder and show success
      if (!chatbot && onClose) {
        // Close the builder after successful creation
        setTimeout(() => {
          onClose();
        }, 1500); // Give time for user to see the success message
      }
      
      toast({
        title: chatbot ? "Chatbot updated!" : "Chatbot created!",
        description: chatbot ? "Your chatbot has been updated successfully." : "Your new chatbot is ready to use.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save chatbot",
        variant: "destructive",
      });
    },
  });

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

  // Remove auto-save to prevent performance issues
  // Users will manually save their changes

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
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white">
              {chatbot ? 'Edit Chatbot' : 'Create New Chatbot'}
            </CardTitle>
            <p className="text-gray-300 mt-1">
              {chatbot ? 'Update your chatbot configuration' : 'Set up your AI-powered chatbot'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-700/50">
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Main Create/Update Button - Moved to top */}
            <div className="flex justify-end space-x-4 pb-6 border-b border-gray-700/50">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-primary/50">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveChatbotMutation.isPending}
                className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary-600 hover:to-cyan-600 transition-all duration-300"
                onClick={(e) => {
                  // Prevent form submission if clicking from within playground
                  const target = e.target as HTMLElement;
                  if (target.closest('.playground-container') || target.closest('[data-playground]')) {
                    e.preventDefault();
                    e.stopPropagation();
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
              <TabsList className="grid w-full grid-cols-6 bg-gray-700/50 border-gray-600/50">
                <TabsTrigger value="playground" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">🎮 Playground</TabsTrigger>
                <TabsTrigger value="data" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">📁 Data Sources</TabsTrigger>
                <TabsTrigger value="basic" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">⚙️ Basic Setup</TabsTrigger>
                <TabsTrigger value="credentials" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">🔑 Credentials</TabsTrigger>
                <TabsTrigger value="tools" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">🔧 Tools</TabsTrigger>
                <TabsTrigger value="deployment" className="text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">🚀 Deployment</TabsTrigger>
              </TabsList>

              {/* Playground Tab - First tab for testing */}
              <TabsContent value="playground" className="space-y-6 mt-6">
                <div className="playground-container" data-playground="true">
                  <ChatPlayground chatbotId={chatbot?.id} chatbotConfig={watchedValues} />
                </div>
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
                      <Card className="p-6 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                        
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

                          {/* Connected Tools Section */}
                          <div className="mt-6 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                              <i className="fas fa-tools text-primary"></i>
                              Connected Tools & Data Sources
                            </h4>
                            <p className="text-sm text-gray-300 mb-3">
                              Drag and drop these tools into your system prompt to specify which data sources to use:
                            </p>
                            
                            <div className="space-y-2">
                              {/* Vector Store - Simple drag and drop */}
                              <VectorStoreDisplay chatbotId={chatbot?.id} onAddToPrompt={(toolText) => {
                                const currentPrompt = form.getValues('systemPrompt') || '';
                                const newPrompt = currentPrompt + (currentPrompt ? ' ' : '') + toolText;
                                form.setValue('systemPrompt', newPrompt);
                              }} />

                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* AI Model Configuration */}
                      <Card className="p-6 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">AI Model Configuration</h3>
                        
                        <div className="space-y-4">
                          {/* Show connection status */}
                          <div className="flex items-center gap-2 p-3 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                            <i className={`fas ${apiKeyValue && availableModels.length > 0 ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'}`}></i>
                            <span className="font-medium text-white">
                              {selectedProvider} API Status: 
                              <span className={apiKeyValue && availableModels.length > 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                                {apiKeyValue && availableModels.length > 0 ? 'Connected' : 'Not Connected'}
                              </span>
                            </span>
                          </div>

                          {/* Model Selection - Always show the field but conditionally populate */}
                          <FormField
                            control={form.control}
                            name="llmModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LLM Model</FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={
                                        connectionStatus[selectedProvider] === 'connected' && availableModels.length > 0 
                                          ? "Select model" 
                                          : "Connect API in Credentials tab first"
                                      } />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {connectionStatus[selectedProvider] === 'connected' && availableModels.length > 0 ? (
                                        availableModels.map((model: string) => (
                                          <SelectItem key={model} value={model}>
                                            {model}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="no-models" disabled>
                                          No models available - connect API first
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Show available models count */}
                          {connectionStatus[selectedProvider] === 'connected' && availableModels.length > 0 && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <div className="flex items-center text-sm text-green-400">
                                <i className="fas fa-check-circle text-green-400 mr-2"></i>
                                <span>{availableModels.length} models available from {selectedProvider}</span>
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
                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="voiceProvider"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Voice Provider</FormLabel>
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

                                {form.watch('voiceProvider') && (
                                  <div className="space-y-3">
                                    <FormField
                                      control={form.control}
                                      name="voiceApiKey"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>API Key for {form.watch('voiceProvider')}</FormLabel>
                                          <FormControl>
                                            <div className="flex gap-2">
                                              <Input
                                                type="password"
                                                placeholder="Enter API key"
                                                {...field}
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                  const provider = form.getValues('voiceProvider');
                                                  const apiKey = form.getValues('voiceApiKey') as string;
                                                  if (provider && apiKey) {
                                                    try {
                                                      const response = await fetch('/api/voice-providers/test', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ provider, apiKey })
                                                      });
                                                      const result = await response.json();
                                                      if (result.success) {
                                                        toast({ title: "Success", description: result.message });
                                                      } else {
                                                        toast({ title: "Error", description: result.message, variant: "destructive" });
                                                      }
                                                    } catch (error) {
                                                      toast({ title: "Error", description: "Failed to test connection", variant: "destructive" });
                                                    }
                                                  }
                                                }}
                                              >
                                                Test Connection
                                              </Button>
                                            </div>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                )}
                              </div>
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
                      <Card className="p-6 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
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
                                      <span className="text-xs text-gray-400">or paste URL above</span>
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
                      <Card className="p-6 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">Default Bot Messages</h3>
                        
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
                                <p className="text-xs text-gray-400">This message will appear when users first open the chat</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                            <p className="text-sm text-primary">
                              <strong>Note:</strong> All changes here will reflect instantly in the Playground tab for testing.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Info about saving */}
                  <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-info-circle text-primary mr-2"></i>
                      <span className="text-sm text-white">
                        <strong>Note:</strong> Changes are automatically reflected in the Playground. Use the main "Create Chatbot" button below to save your chatbot.
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="space-y-6 mt-6">
                <ToolsTab chatbotId={chatbot?.id || ""} />
              </TabsContent>

              <TabsContent value="credentials" className="space-y-6 mt-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-white mb-4">AI Provider Configuration</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                      <h4 className="font-medium mb-3 text-white">Large Language Model (LLM)</h4>
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
                              type="text"
                              placeholder={`Enter your ${selectedProvider} API key`}
                              value={apiKeyValue}
                              onChange={(e) => setApiKeyValue(e.target.value)}
                              className="pr-20"
                            />

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
                            <p className="text-sm text-gray-400">
                              This API key will be used only for this chatbot
                            </p>
                            {connectionStatus[selectedProvider] && (
                              <div className="flex items-center gap-1 text-sm">
                                {connectionStatus[selectedProvider] === 'connected' && (
                                  <>
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 font-medium">Connected</span>
                                  </>
                                )}
                                {connectionStatus[selectedProvider] === 'failed' && (
                                  <>
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-red-400 font-medium">Not Connected</span>
                                  </>
                                )}
                                {connectionStatus[selectedProvider] === 'testing' && (
                                  <>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-400 font-medium">Testing...</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                      <h4 className="font-medium mb-3 text-white">Voice Processing</h4>
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
                              type="text"
                              placeholder="Voice API key (required for voice functionality)"
                              className="pr-20"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute right-1 top-1 h-8 px-3"
                            >
                              Connect
                            </Button>
                          </div>
                          <p className="text-sm text-orange-400 mt-1">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Required: Voice API key must be provided for voice functionality to work
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">
                        <i className="fas fa-info-circle mr-2 text-primary"></i>
                        API Key Configuration Notes:
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• LLM API key is required for chatbot functionality</li>
                        <li>• Voice API key is required only if you enable voice features</li>
                        <li>• All credentials are encrypted and stored securely</li>
                        <li>• Each chatbot uses its own separate API keys</li>
                        <li>• Connection testing happens automatically when keys are provided</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>



              <TabsContent value="deployment" className="space-y-6 mt-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-white mb-6">Deployment Channels</h3>
                  
                  <div className="space-y-6">
                    {deploymentChannels.map((channel) => (
                      <Card key={channel.id} className="p-6 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <i className={`${channel.icon} ${channel.color} text-2xl`}></i>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg text-white">{channel.name}</h4>
                            <p className="text-sm text-gray-300">{channel.description}</p>
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
                          <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <i className="fas fa-info-circle text-primary mt-0.5"></i>
                              <div className="text-sm text-white">
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
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <i className="fas fa-clock"></i>
                              <span>This integration is coming soon in a future update</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-700/50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-300">
                        <i className="fas fa-info-circle mr-1 text-primary"></i>
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

