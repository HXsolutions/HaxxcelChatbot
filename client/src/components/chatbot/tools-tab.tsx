import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Mail,
  FileText,
  Calendar,
  Database,
  Zap,
  ShoppingCart,
  Users,
  Webhook,
  TestTube
} from "lucide-react";
import type { ToolConnection, ToolNode } from "@shared/schema";
import { ConnectedToolsPanel } from "./connected-tools-panel";

// TypeScript interface for tool definitions
interface ToolField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface ToolDefinition {
  name: string;
  icon: any;
  category: string;
  description: string;
  authType?: string;
  oauthProvider?: string;
  credentialsFields: ToolField[];
  operations: Record<string, {
    name: string;
    fields: ToolField[];
  }>;
}

// Tool definitions with icons and configuration
const AVAILABLE_TOOLS: Record<string, ToolDefinition> = {
  // Google Workspace Tools
  gmail: {
    name: "Gmail",
    icon: Mail,
    category: "Google Workspace",
    description: "Access and manage emails",
    authType: "oauth2",
    oauthProvider: "google",
    credentialsFields: [], // OAuth2 tools don't need manual credential fields
    operations: {
      send_email: {
        name: "Send Email",
        fields: [
          { 
            name: "auto_mode", 
            label: "Auto Mode", 
            type: "select", 
            placeholder: "Select auto configuration",
            options: ["enabled"]
          }
        ]
      },
      read_inbox: {
        name: "Read Inbox",
        fields: [
          { name: "query", label: "Search Query", type: "text", placeholder: "is:unread" },
          { name: "maxResults", label: "Max Results", type: "number", placeholder: "10" }
        ]
      }
    }
  },
  google_drive: {
    name: "Google Drive",
    icon: Database,
    category: "Google Workspace",
    description: "File storage and sharing",
    authType: "oauth2",
    oauthProvider: "google",
    credentialsFields: [], // OAuth2 tools don't need manual credential fields
    operations: {
      list_files: {
        name: "List Files",
        fields: [
          { name: "query", label: "Search Query", type: "text", placeholder: "name contains 'document'" },
          { name: "limit", label: "Max Results", type: "number", placeholder: "10" }
        ]
      },
      upload_file: {
        name: "Upload File",
        fields: [
          { name: "fileName", label: "File Name", type: "text", placeholder: "{{fileName}}" },
          { name: "content", label: "File Content", type: "textarea", placeholder: "{{fileContent}}" },
          { name: "folderId", label: "Folder ID (Optional)", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" }
        ]
      }
    }
  },
  google_docs: {
    name: "Google Docs",
    icon: FileText,
    category: "Google Workspace",
    description: "Document creation and editing",
    authType: "oauth2",
    oauthProvider: "google",
    credentialsFields: [], // OAuth2 tools don't need manual credential fields
    operations: {
      create_document: {
        name: "Create Document",
        fields: [
          { name: "title", label: "Document Title", type: "text", placeholder: "{{title}}" },
          { name: "content", label: "Content", type: "textarea", placeholder: "{{content}}" }
        ]
      },
      get_document: {
        name: "Get Document",
        fields: [
          { name: "documentId", label: "Document ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" }
        ]
      }
    }
  },
  google_sheets: {
    name: "Google Sheets",
    icon: FileText,
    category: "Google Workspace",
    description: "Spreadsheet management",
    credentialsFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      read_data: {
        name: "Read Data",
        fields: [
          { name: "sheetId", label: "Sheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
          { name: "range", label: "Range", type: "text", placeholder: "Sheet1!A1:C10" }
        ]
      },
      append_row: {
        name: "Append Row",
        fields: [
          { name: "sheetId", label: "Sheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
          { name: "range", label: "Range", type: "text", placeholder: "Sheet1!A:C" },
          { name: "values", label: "Values Template", type: "textarea", placeholder: "{{name}}, {{email}}, {{message}}" }
        ]
      },
      write_data: {
        name: "Write Data",
        fields: [
          { name: "sheetId", label: "Sheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
          { name: "range", label: "Range", type: "text", placeholder: "Sheet1!A1:C1" },
          { name: "values", label: "Values Template", type: "textarea", placeholder: "{{data}}" }
        ]
      }
    }
  },
  google_slides: {
    name: "Google Slides",
    icon: FileText,
    category: "Google Workspace",
    description: "Presentation creation",
    credentialsFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_presentation: {
        name: "Create Presentation",
        fields: [
          { name: "title", label: "Presentation Title", type: "text", placeholder: "{{title}}" }
        ]
      },
      add_slide: {
        name: "Add Slide",
        fields: [
          { name: "presentationId", label: "Presentation ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
          { name: "content", label: "Slide Content", type: "textarea", placeholder: "{{content}}" }
        ]
      }
    }
  },
  google_calendar: {
    name: "Google Calendar",
    icon: Calendar,
    category: "Google Workspace",
    description: "Calendar and event management",
    credentialsFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_event: {
        name: "Create Event",
        fields: [
          { name: "summary", label: "Event Title", type: "text", placeholder: "{{title}}" },
          { name: "startTime", label: "Start Time", type: "text", placeholder: "{{startTime}}" },
          { name: "endTime", label: "End Time", type: "text", placeholder: "{{endTime}}" },
          { name: "description", label: "Description", type: "textarea", placeholder: "{{description}}" }
        ]
      },
      list_events: {
        name: "List Events",
        fields: [
          { name: "timeMin", label: "Start Date", type: "text", placeholder: "2024-01-01T00:00:00Z" },
          { name: "timeMax", label: "End Date", type: "text", placeholder: "2024-12-31T23:59:59Z" },
          { name: "maxResults", label: "Max Results", type: "number", placeholder: "10" }
        ]
      }
    }
  },
  google_meet: {
    name: "Google Meet",
    icon: FileText,
    category: "Google Workspace",
    description: "Video conferencing",
    credentialsFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_meeting: {
        name: "Create Meeting",
        fields: [
          { name: "title", label: "Meeting Title", type: "text", placeholder: "{{title}}" },
          { name: "startTime", label: "Start Time", type: "text", placeholder: "{{startTime}}" },
          { name: "duration", label: "Duration (minutes)", type: "number", placeholder: "60" }
        ]
      }
    }
  },
  google_forms: {
    name: "Google Forms",
    icon: FileText,
    category: "Google Workspace",
    description: "Form creation and responses",
    credentialsFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_form: {
        name: "Create Form",
        fields: [
          { name: "title", label: "Form Title", type: "text", placeholder: "{{title}}" },
          { name: "description", label: "Description", type: "textarea", placeholder: "{{description}}" }
        ]
      },
      get_responses: {
        name: "Get Responses",
        fields: [
          { name: "formId", label: "Form ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" }
        ]
      }
    }
  },

  // CRM & Business Tools
  notion: {
    name: "Notion",
    icon: FileText,
    category: "Productivity",
    description: "Knowledge management and collaboration",
    credentialsFields: [
      { name: "integrationToken", label: "Integration Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_page: {
        name: "Create Page",
        fields: [
          { name: "databaseId", label: "Database ID", type: "text", placeholder: "{{databaseId}}" },
          { name: "title", label: "Page Title", type: "text", placeholder: "{{title}}" },
          { name: "content", label: "Content", type: "textarea", placeholder: "{{content}}" }
        ]
      },
      query_database: {
        name: "Query Database",
        fields: [
          { name: "databaseId", label: "Database ID", type: "text", placeholder: "{{databaseId}}" },
          { name: "filter", label: "Filter (JSON)", type: "textarea", placeholder: '{"property": "Status", "select": {"equals": "Done"}}' }
        ]
      }
    }
  },
  hubspot: {
    name: "HubSpot",
    icon: Users,
    category: "CRM",
    description: "CRM and marketing automation",
    credentialsFields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_contact: {
        name: "Create Contact",
        fields: [
          { name: "email", label: "Email", type: "text", placeholder: "{{email}}" },
          { name: "firstName", label: "First Name", type: "text", placeholder: "{{firstName}}" },
          { name: "lastName", label: "Last Name", type: "text", placeholder: "{{lastName}}" },
          { name: "company", label: "Company", type: "text", placeholder: "{{company}}" }
        ]
      },
      get_contact: {
        name: "Get Contact",
        fields: [
          { name: "email", label: "Email", type: "text", placeholder: "{{email}}" }
        ]
      },
      create_deal: {
        name: "Create Deal",
        fields: [
          { name: "dealName", label: "Deal Name", type: "text", placeholder: "{{dealName}}" },
          { name: "amount", label: "Amount", type: "number", placeholder: "{{amount}}" },
          { name: "stage", label: "Stage", type: "text", placeholder: "{{stage}}" }
        ]
      }
    }
  },
  salesforce: {
    name: "Salesforce",
    icon: Users,
    category: "CRM",
    description: "Customer relationship management",
    credentialsFields: [
      { name: "instanceUrl", label: "Instance URL", type: "text", required: true, placeholder: "https://your-domain.salesforce.com" },
      { name: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_lead: {
        name: "Create Lead",
        fields: [
          { name: "firstName", label: "First Name", type: "text", placeholder: "{{firstName}}" },
          { name: "lastName", label: "Last Name", type: "text", placeholder: "{{lastName}}" },
          { name: "email", label: "Email", type: "text", placeholder: "{{email}}" },
          { name: "company", label: "Company", type: "text", placeholder: "{{company}}" }
        ]
      },
      create_opportunity: {
        name: "Create Opportunity",
        fields: [
          { name: "name", label: "Opportunity Name", type: "text", placeholder: "{{name}}" },
          { name: "amount", label: "Amount", type: "number", placeholder: "{{amount}}" },
          { name: "closeDate", label: "Close Date", type: "text", placeholder: "{{closeDate}}" },
          { name: "stageName", label: "Stage", type: "text", placeholder: "{{stage}}" }
        ]
      }
    }
  },
  zoho: {
    name: "Zoho",
    icon: Users,
    category: "Business Suite",
    description: "Business applications suite",
    credentialsFields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "" },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      create_record: {
        name: "Create Record",
        fields: [
          { name: "module", label: "Module", type: "select", options: ["Leads", "Contacts", "Accounts", "Deals"] },
          { name: "data", label: "Record Data (JSON)", type: "textarea", placeholder: '{"Last_Name": "{{lastName}}", "Email": "{{email}}"}' }
        ]
      },
      get_records: {
        name: "Get Records",
        fields: [
          { name: "module", label: "Module", type: "select", options: ["Leads", "Contacts", "Accounts", "Deals"] },
          { name: "criteria", label: "Search Criteria", type: "text", placeholder: "Email:equals:{{email}}" }
        ]
      }
    }
  },
  
  // E-commerce Tools
  shopify: {
    name: "Shopify",
    icon: ShoppingCart,
    category: "E-commerce",
    description: "E-commerce platform",
    credentialsFields: [
      { name: "shopUrl", label: "Shop URL", type: "text", required: true, placeholder: "myshop.myshopify.com" },
      { name: "accessToken", label: "Admin API Access Token", type: "password", required: true, placeholder: "" }
    ],
    operations: {
      fetch_orders: {
        name: "Fetch Orders",
        fields: [
          { name: "status", label: "Order Status", type: "select", options: ["any", "open", "closed", "cancelled"] },
          { name: "limit", label: "Limit", type: "number", placeholder: "50" }
        ]
      },
      fetch_products: {
        name: "Fetch Products",
        fields: [
          { name: "limit", label: "Limit", type: "number", placeholder: "50" },
          { name: "status", label: "Product Status", type: "select", options: ["active", "archived", "draft"] }
        ]
      },
      track_order: {
        name: "Track Order",
        fields: [
          { name: "orderId", label: "Order ID", type: "text", placeholder: "{{order_id}}" }
        ]
      }
    }
  },

  // Automation Tools
  zapier: {
    name: "Zapier",
    icon: Zap,
    category: "Automation",
    description: "Workflow automation",
    credentialsFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "text", required: true, placeholder: "https://hooks.zapier.com/hooks/catch/..." }
    ],
    operations: {
      trigger_zap: {
        name: "Trigger Zap",
        fields: [
          { name: "data", label: "Data Template", type: "textarea", placeholder: '{"name": "{{name}}", "email": "{{email}}"}' }
        ]
      }
    }
  },
  make: {
    name: "Make",
    icon: Zap,
    category: "Automation",
    description: "Visual automation platform",
    credentialsFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "text", required: true, placeholder: "https://hook.integromat.com/..." }
    ],
    operations: {
      trigger_scenario: {
        name: "Trigger Scenario",
        fields: [
          { name: "data", label: "Data Template", type: "textarea", placeholder: '{"trigger": "{{action}}", "payload": "{{data}}"}' }
        ]
      }
    }
  },
  n8n: {
    name: "n8n",
    icon: Zap,
    category: "Automation",
    description: "Open-source automation",
    credentialsFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "text", required: true, placeholder: "http://your-n8n-instance.com/webhook/..." }
    ],
    operations: {
      trigger_workflow: {
        name: "Trigger Workflow",
        fields: [
          { name: "workflowData", label: "Workflow Data", type: "textarea", placeholder: '{"event": "{{event}}", "data": "{{data}}"}' }
        ]
      }
    }
  },
  webhook: {
    name: "Custom Webhook",
    icon: Webhook,
    category: "Custom",
    description: "Call custom REST APIs",
    credentialsFields: [
      { name: "apiKey", label: "API Key (Optional)", type: "password", required: false },
      { name: "authHeader", label: "Auth Header Name", type: "text", placeholder: "Authorization", required: false }
    ],
    operations: {
      post_request: {
        name: "POST Request",
        fields: [
          { name: "url", label: "URL", type: "text", placeholder: "https://api.example.com/endpoint" },
          { name: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Content-Type": "application/json"}' },
          { name: "body", label: "Body Template", type: "textarea", placeholder: '{"data": "{{data}}"}' }
        ]
      },
      get_request: {
        name: "GET Request",
        fields: [
          { name: "url", label: "URL", type: "text", placeholder: "https://api.example.com/data?id={{id}}" },
          { name: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Content-Type": "application/json"}' }
        ]
      }
    }
  }
};

interface ToolsTabProps {
  chatbotId: string;
}

export function ToolsTab({ chatbotId }: ToolsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [currentConnection, setCurrentConnection] = useState<ToolConnection | null>(null);

  // Check if chatbot exists
  const hasChatbot = Boolean(chatbotId && chatbotId.trim() !== '');

  // Fetch tool connections for this chatbot with optimized caching
  const { data: connections = [], isLoading } = useQuery<ToolConnection[]>({
    queryKey: [`/api/chatbots/${chatbotId}/tools`],
    enabled: hasChatbot,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false // Prevent automatic refetch on window focus
  });

  // Fetch nodes for a specific connection
  const { data: nodes = [] } = useQuery<ToolNode[]>({
    queryKey: [`/api/tools/${currentConnection?.id}/nodes`],
    enabled: !!currentConnection?.id
  });

  // Connect tool mutation
  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/chatbots/${chatbotId}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to connect tool');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/tools`] });
      setConnectDialogOpen(false);
      toast({
        title: "Tool Connected",
        description: "Successfully connected to the tool",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect tool",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/tools/${connectionId}/test`, {
        method: "POST"
      });
      if (!response.ok) throw new Error('Test failed');
      return response.json();
    },
    onSuccess: (data: { success: boolean }, connectionId: string) => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/tools`] });
      toast({
        title: "Connection Test",
        description: data.success ? "Connection successful!" : "Connection failed",
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  // Disconnect tool mutation
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/tools/${connectionId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to disconnect tool');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/tools`] });
      toast({
        title: "Tool Disconnected",
        description: "Successfully removed tool connection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect tool",
        variant: "destructive",
      });
    },
  });

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tools/${currentConnection?.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create node');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tools/${currentConnection?.id}/nodes`] });
      toast({
        title: "Node Created",
        description: "Successfully created tool node",
      });
    }
  });

  const handleConnect = (toolType: string) => {
    setSelectedTool(toolType);
    setConnectDialogOpen(true);
  };

  const handleConfigure = (connection: ToolConnection) => {
    setCurrentConnection(connection);
    setConfigureDialogOpen(true);
  };

  const handleDisconnect = (connectionId: string) => {
    if (confirm('Are you sure you want to remove this tool connection? This will also delete all associated nodes.')) {
      disconnectMutation.mutate(connectionId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!hasChatbot) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <i className="fas fa-save text-4xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">Save Chatbot First</h3>
            <p className="text-sm">
              Please save your chatbot using the "Create Chatbot" button below before configuring tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading tools...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">External Tool Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external tools to give your chatbot powerful capabilities like sending emails, updating spreadsheets, and more.
        </p>
      </div>

      {/* Enhanced Connected Tools Panel */}
      {connections.length > 0 && (
        <ConnectedToolsPanel chatbotId={chatbotId} />
      )}

      {/* Legacy Connected Tools - Hidden when using enhanced panel */}
      {connections.length > 0 && false && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Connected Tools ({connections.length})</h4>
          <div className="grid gap-4">
            {connections.map((connection) => {
              const tool = AVAILABLE_TOOLS[connection.toolType as keyof typeof AVAILABLE_TOOLS];
              const Icon = tool?.icon || Webhook;
              
              return (
                <Card key={connection.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      <div>
                        <div className="font-medium">{connection.toolName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {getStatusIcon(connection.connectionStatus || 'disconnected')}
                          {connection.connectionStatus || 'disconnected'}
                          {connection.lastTested && (
                            <span>• Last tested {new Date(connection.lastTested.toString()).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(connection.id)}
                        disabled={testMutation.isPending}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigure(connection)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(connection.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tools - Organized by Category */}
      <div className="space-y-6">
        <h4 className="text-md font-medium">Available Tools</h4>
        
        {/* Group tools by category */}
        {Object.entries(
          Object.entries(AVAILABLE_TOOLS).reduce((acc, [key, tool]) => {
            if (!acc[tool.category]) acc[tool.category] = [];
            acc[tool.category].push([key, tool]);
            return acc;
          }, {} as Record<string, [string, any][]>)
        ).map(([category, tools]) => (
          <div key={category} className="space-y-3">
            <h5 className="text-sm font-medium text-gray-600 border-b pb-1">{category}</h5>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tools.map(([key, tool]) => {
                const Icon = tool.icon;
                const isConnected = connections.some((c) => c.toolType === key);
                
                return (
                  <Card key={key} className={isConnected ? "opacity-50 bg-green-50 border-green-200" : "hover:shadow-md transition-shadow"}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-sm">{tool.name}</CardTitle>
                        {isConnected && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant={isConnected ? "secondary" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleConnect(key)}
                        disabled={isConnected}
                      >
                        {isConnected ? "✓ Connected" : "Connect"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Connect Tool Dialog */}
      <ConnectToolDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        toolType={selectedTool}
        chatbotId={chatbotId}
        onConnect={connectMutation.mutate}
        isConnecting={connectMutation.isPending}
      />

      {/* Configure Tool Dialog */}
      <ConfigureToolDialog
        open={configureDialogOpen}
        onOpenChange={setConfigureDialogOpen}
        connection={currentConnection}
        nodes={nodes}
        onCreateNode={createNodeMutation.mutate}
        isCreating={createNodeMutation.isPending}
      />
    </div>
  );
}

// Connect Tool Dialog Component
function ConnectToolDialog({
  open,
  onOpenChange,
  toolType,
  chatbotId,
  onConnect,
  isConnecting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolType: string | null;
  chatbotId: string;
  onConnect: (data: any) => void;
  isConnecting: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const tool = toolType ? AVAILABLE_TOOLS[toolType as keyof typeof AVAILABLE_TOOLS] : null;

  const handleOAuth2Connect = async () => {
    if (!tool || !toolType) return;

    // Debug: Check if chatbotId is valid
    console.log('OAuth2 Connect - chatbotId:', chatbotId);
    
    if (!chatbotId || chatbotId.trim() === '') {
      alert('No chatbot selected. Please create a chatbot first.');
      return;
    }

    try {
      // Get the OAuth2 authorization URL from the backend
      const url = `/api/tools/google/auth-url?chatbotId=${encodeURIComponent(chatbotId)}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
      console.log('Requesting OAuth URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('OAuth response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get authorization URL');
      }
      
      if (data.authUrl) {
        // Open OAuth2 consent screen in a centered popup window
        const popup = window.open(
          data.authUrl,
          'google-oauth',
          'width=500,height=600,left=' + 
          (window.screen.width / 2 - 250) + 
          ',top=' + 
          (window.screen.height / 2 - 300) + 
          ',resizable=yes,scrollbars=yes'
        );

        // Listen for messages from the popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            popup?.close();
            window.removeEventListener('message', messageListener);
            alert('Google Workspace connected successfully!');
            // Refresh only the tools data without full page reload
            queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/tools`] });
            onOpenChange(false); // Close the dialog
          } else if (event.data.type === 'OAUTH_ERROR') {
            popup?.close();
            window.removeEventListener('message', messageListener);
            alert(event.data.message || 'Failed to connect Google Workspace');
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Monitor popup for completion (fallback)
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
          }
        }, 1000);
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('OAuth2 connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to initiate OAuth2 connection: ${errorMessage}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool || !toolType) return;

    onConnect({
      toolType,
      toolName: tool.name,
      credentials: formData,
      chatbotId
    });
  };

  if (!tool) return null;

  // Handle OAuth2 tools (Google Workspace) - Show both OAuth2 and manual credential options
  if (tool.authType === 'oauth2' && tool.oauthProvider === 'google') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect {tool.name}</DialogTitle>
            <DialogDescription>
              Choose how to connect your Google account for {tool.name} integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* OAuth2 Connection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Quick Connect</span>
                <Button 
                  size="sm"
                  onClick={handleOAuth2Connect}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>

            {/* Manual Credentials Section */}
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-sm mb-2">Need help filling out these fields?</h4>
                <a href="#" className="text-sm text-amber-700 dark:text-amber-300 underline">Open docs</a>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="oauth_redirect_url" className="text-sm font-medium text-muted-foreground">
                      OAuth Redirect URL
                    </Label>
                    <Input
                      id="oauth_redirect_url"
                      type="url"
                      value={`${window.location.origin}/api/tools/google/callback`}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      In Gmail, use the URL above when prompted to enter an OAuth callback or redirect URL
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="client_id" className="text-sm font-medium">
                      Client ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client_id"
                      type="text"
                      placeholder="Enter your Google OAuth Client ID"
                      value={formData.client_id || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_secret" className="text-sm font-medium">
                      Client Secret <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client_secret"
                      type="password"
                      placeholder="Enter your Google OAuth Client Secret"
                      value={formData.client_secret || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_secret: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isConnecting}>
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle regular credential-based tools
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {tool.name}</DialogTitle>
          <DialogDescription>
            Enter your credentials to connect {tool.name} to your chatbot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tool.credentialsFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                required={field.required}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Configure Tool Dialog Component
function ConfigureToolDialog({
  open,
  onOpenChange,
  connection,
  nodes,
  onCreateNode,
  isCreating
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: ToolConnection | null;
  nodes: ToolNode[];
  onCreateNode: (data: any) => void;
  isCreating: boolean;
}) {
  const [newNodeData, setNewNodeData] = useState<{
    nodeName: string;
    operation: string;
    config: Record<string, string>;
  }>({
    nodeName: "",
    operation: "",
    config: {}
  });

  const tool = connection ? AVAILABLE_TOOLS[connection.toolType as keyof typeof AVAILABLE_TOOLS] : null;

  const handleCreateNode = () => {
    if (!connection || !newNodeData.nodeName || !newNodeData.operation) return;

    onCreateNode({
      toolConnectionId: connection.id,
      nodeName: newNodeData.nodeName,
      operation: newNodeData.operation,
      config: newNodeData.config
    });

    setNewNodeData({ nodeName: "", operation: "", config: {} });
  };

  if (!tool || !connection) return null;

  const selectedOperation = newNodeData.operation ? tool.operations[newNodeData.operation as keyof typeof tool.operations] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {connection.toolName}</DialogTitle>
          <DialogDescription>
            Manage action nodes for this tool connection.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="nodes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nodes">Nodes ({nodes.length})</TabsTrigger>
            <TabsTrigger value="add">Add Node</TabsTrigger>
          </TabsList>

          <TabsContent value="nodes" className="space-y-4">
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No nodes configured yet. Add your first node to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {nodes.map((node) => (
                  <Card key={node.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{node.nodeName}</div>
                          <div className="text-sm text-muted-foreground">
                            Operation: {node.operation}
                          </div>
                        </div>
                        <Badge variant={node.isActive ? "default" : "secondary"}>
                          {node.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nodeName">Node Name</Label>
                <Input
                  id="nodeName"
                  placeholder="e.g., Send Welcome Email"
                  value={newNodeData.nodeName}
                  onChange={(e) => setNewNodeData(prev => ({ ...prev, nodeName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Select 
                  value={newNodeData.operation} 
                  onValueChange={(value) => setNewNodeData(prev => ({ ...prev, operation: value, config: {} }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tool.operations).map(([key, op]) => (
                      <SelectItem key={key} value={key}>
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOperation && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Configuration</h4>
                    {(() => {
                      try {
                        if (!selectedOperation || !selectedOperation.fields || !Array.isArray(selectedOperation.fields)) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              No configuration fields available for this operation.
                            </div>
                          );
                        }

                        return selectedOperation.fields.map((field: ToolField, index: number) => {
                          if (!field || typeof field !== 'object' || !field.name) {
                            console.warn('Invalid field configuration:', field);
                            return null;
                          }

                          const fieldId = `${field.name}-${index}`;
                          const fieldValue = newNodeData.config[field.name] || "";

                          return (
                            <div key={fieldId} className="space-y-2">
                              <Label htmlFor={fieldId}>{field.label || field.name}</Label>
                              {field.name === "auto_mode" && index === 0 && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Agent will automatically determine recipient, subject, and body based on conversation context
                                </p>
                              )}
                              {field.type === "textarea" ? (
                                <Textarea
                                  id={fieldId}
                                  placeholder={field.placeholder || ""}
                                  value={fieldValue}
                                  onChange={(e) => setNewNodeData(prev => ({
                                    ...prev,
                                    config: { ...prev.config, [field.name]: e.target.value }
                                  }))}
                                />
                              ) : field.type === "select" ? (
                                <Select
                                  value={fieldValue}
                                  onValueChange={(value) => setNewNodeData(prev => ({
                                    ...prev,
                                    config: { ...prev.config, [field.name]: value }
                                  }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={field.placeholder || "Select option"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options && Array.isArray(field.options) && field.options.map((option: string, optIndex: number) => (
                                      <SelectItem key={`${option}-${optIndex}`} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id={fieldId}
                                  type={field.type || "text"}
                                  placeholder={field.placeholder || ""}
                                  value={fieldValue}
                                  onChange={(e) => setNewNodeData(prev => ({
                                    ...prev,
                                    config: { ...prev.config, [field.name]: e.target.value }
                                  }))}
                                />
                              )}
                            </div>
                          );
                        }).filter(Boolean);
                      } catch (error) {
                        console.error('Error rendering configuration fields:', error);
                        return (
                          <div className="text-sm text-red-500">
                            Error loading configuration fields. Please try again.
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCreateNode}
                disabled={!newNodeData.nodeName || !newNodeData.operation || isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Node"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}