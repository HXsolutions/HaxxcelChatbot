import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  FileText, 
  Mail, 
  Database, 
  Zap, 
  Settings, 
  CheckCircle,
  XCircle,
  Copy,
  BookOpen
} from "lucide-react";

export default function AgentToolsDemo() {
  const [selectedNodeType, setSelectedNodeType] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const { toast } = useToast();

  const { data: nodeDefinitions = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/agent/node-definitions'],
  });

  const { data: selectedInstructions, refetch: fetchInstructions } = useQuery<{ toolType: string; instructions: string }>({
    queryKey: ['/api/agent/instructions', selectedNodeType],
    enabled: !!selectedNodeType,
  });

  const TOOL_ICONS: Record<string, any> = {
    gmail: Mail,
    google_drive: Database,
    google_docs: FileText,
    google_sheets: FileText,
    zapier: Zap,
    n8n: Zap,
    hubspot: Settings,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Agent instructions copied successfully",
    });
  };

  const selectNode = (toolType: string) => {
    setSelectedNodeType(toolType);
    setSelectedAction(null);
    fetchInstructions();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading node definitions...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Agent Node System Demo</h1>
        <p className="text-muted-foreground">
          This demo shows how AI agents can understand and use connected tools. Each tool has specific actions, 
          parameters, and usage instructions that agents can follow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Node Types */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Tool Nodes</CardTitle>
              <CardDescription>
                Click on a tool to see its available actions and agent instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {nodeDefinitions.map((node: any) => {
                const Icon = TOOL_ICONS[node.toolType] || Settings;
                const isSelected = selectedNodeType === node.toolType;
                
                return (
                  <Button
                    key={node.toolType}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => selectNode(node.toolType)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{node.toolName}</div>
                      <div className="text-xs opacity-70">{node.category}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {node.actions.length} actions
                    </Badge>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Node Details */}
        <div className="lg:col-span-2">
          {selectedNodeType ? (
            <div className="space-y-6">
              {/* Selected Node Overview */}
              {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {TOOL_ICONS[selectedNodeType] && 
                        TOOL_ICONS[selectedNodeType]({ className: "h-6 w-6" })
                      }
                      <div>
                        <CardTitle>
                          {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.toolName}
                        </CardTitle>
                        <CardDescription>
                          {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.category} • 
                          {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.connectionMethod} authentication
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              <Tabs defaultValue="actions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="instructions">Agent Instructions</TabsTrigger>
                  <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
                </TabsList>

                <TabsContent value="actions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available Actions</CardTitle>
                      <CardDescription>
                        These are the specific operations the agent can perform with this tool
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.actions.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.actions.map((action: any, index: number) => (
                            <AccordionItem key={action.id} value={`action-${index}`}>
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  <Play className="h-4 w-4" />
                                  <span className="font-medium">{action.name}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Usage</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{action.usage}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Parameters</Label>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs font-mono mt-1">
                                    {Object.entries(action.parameters).map(([key, value]) => (
                                      <div key={key} className="mb-1">
                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{key}:</span> {value as string}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Examples</Label>
                                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
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
                        <div className="text-center text-muted-foreground py-8">
                          No actions available for this tool.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="instructions" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Agent Instructions</CardTitle>
                        <CardDescription>
                          Complete instructions for AI agents on how to use this tool
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedInstructions?.instructions || '')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                        <pre className="whitespace-pre-wrap text-xs font-mono">
                          {selectedInstructions?.instructions || 'Loading instructions...'}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="troubleshooting" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Troubleshooting Guide</CardTitle>
                      <CardDescription>
                        Common issues and solutions for this tool
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.troubleshooting?.length > 0 ? (
                        <div className="space-y-3">
                          {nodeDefinitions.find((n: any) => n.toolType === selectedNodeType)?.troubleshooting.map((tip: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
                              <XCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-sm">{tip}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          No troubleshooting information available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Tool</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a tool from the left panel to see its actions and agent instructions
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}