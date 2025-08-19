import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Settings, Play, FileText, Mail, Database, Zap } from "lucide-react";
import type { ToolConnection } from "@shared/schema";

interface EnhancedToolConnection extends ToolConnection {
  nodeDefinition: any;
  agentInstructions: string;
  availableActions: any[];
}

interface ConnectedToolsPanelProps {
  chatbotId: string;
}

const TOOL_ICONS: Record<string, any> = {
  gmail: Mail,
  google_drive: Database,
  google_docs: FileText,
  google_sheets: FileText,
  zapier: Zap,
  n8n: Zap,
  hubspot: Settings,
};

export function ConnectedToolsPanel({ chatbotId }: ConnectedToolsPanelProps) {
  const [selectedTool, setSelectedTool] = useState<EnhancedToolConnection | null>(null);

  const { data: enhancedConnections = [], isLoading } = useQuery<EnhancedToolConnection[]>({
    queryKey: [`/api/chatbots/${chatbotId}/tools/enhanced`],
    enabled: !!chatbotId,
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading connected tools...</div>;
  }

  if (enhancedConnections.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Connected Tools</h3>
          <p className="text-sm">Connect tools from the Tools tab to see them here with their available actions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Connected Tools & Available Actions</h3>
        <p className="text-sm text-muted-foreground">
          These tools are connected and ready to be used by your chatbot. Each tool shows available actions the agent can perform.
        </p>
      </div>

      <div className="grid gap-4">
        {enhancedConnections.map((connection) => {
          const Icon = TOOL_ICONS[connection.toolType] || Settings;
          
          return (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-base">{connection.toolName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(connection.connectionStatus || 'disconnected')}
                        <span className="text-xs text-muted-foreground">
                          {connection.connectionStatus || 'disconnected'}
                        </span>
                        {connection.nodeDefinition?.category && (
                          <Badge variant="secondary" className="text-xs">
                            {connection.nodeDefinition.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTool(selectedTool?.id === connection.id ? null : connection)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    View Actions ({connection.availableActions.length})
                  </Button>
                </div>
              </CardHeader>
              
              {selectedTool?.id === connection.id && (
                <CardContent className="pt-0">
                  <Tabs defaultValue="actions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="actions">Available Actions</TabsTrigger>
                      <TabsTrigger value="instructions">Agent Instructions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="actions" className="space-y-4">
                      {connection.availableActions.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {connection.availableActions.map((action: any, index: number) => (
                            <AccordionItem key={action.id || index} value={`action-${index}`}>
                              <AccordionTrigger className="text-sm">
                                <div className="flex items-center gap-2">
                                  <Play className="h-3 w-3" />
                                  {action.name}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-xs space-y-3">
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Description:</p>
                                  <p className="text-muted-foreground">{action.description}</p>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Usage:</p>
                                  <p className="text-muted-foreground">{action.usage}</p>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Parameters:</p>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                                    {Object.entries(action.parameters).map(([key, value]) => (
                                      <div key={key} className="mb-1">
                                        <span className="text-blue-600 dark:text-blue-400">{key}:</span> {value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Examples:</p>
                                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    {action.examples.map((example: string, idx: number) => (
                                      <li key={idx}>{example}</li>
                                    ))}
                                  </ul>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          No actions available for this tool.
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="instructions" className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs">
                        <pre className="whitespace-pre-wrap font-mono">
                          {connection.agentInstructions || 'No agent instructions available.'}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}