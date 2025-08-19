import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Type, Trash2, Plus } from "lucide-react";

interface DataSource {
  id: string;
  type: 'file' | 'url' | 'text';
  name: string;
  content?: string;
  status: 'pending' | 'processed' | 'error';
}

interface DataSourcesTabProps {
  chatbotId?: string;
}

export default function DataSourcesTab({ chatbotId }: DataSourcesTabProps) {
  const queryClient = useQueryClient();
  const [localDataSources, setLocalDataSources] = useState<DataSource[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");

  // Fetch existing data sources if chatbot exists
  const { data: existingDataSources } = useQuery({
    queryKey: [`/api/chatbots/${chatbotId}/data-sources`],
    enabled: !!chatbotId,
  });

  // Initialize with existing data sources when chatbot is loaded
  useEffect(() => {
    if (existingDataSources && Array.isArray(existingDataSources) && existingDataSources.length > 0) {
      const mappedSources = existingDataSources.map((source: any) => ({
        id: source.id,
        type: source.type as 'file' | 'url' | 'text',
        name: source.fileName || source.content || source.type,
        content: source.content,
        status: (source.processed ? 'processed' : 'pending') as 'pending' | 'processed' | 'error',
      }));
      setLocalDataSources(mappedSources);
    }
  }, [existingDataSources]);

  const addDataSource = (source: Omit<DataSource, 'id'>) => {
    setLocalDataSources(prev => [...prev, {
      ...source,
      id: Date.now().toString()
    }]);
  };

  const removeDataSource = (id: string) => {
    setLocalDataSources(prev => prev.filter(source => source.id !== id));
  };

  const processDataSource = async (source: Omit<DataSource, 'id'>) => {
    try {
      // Update status to processing
      setLocalDataSources(prev => prev.map(ds => 
        ds.name === source.name ? { ...ds, status: 'pending' as const } : ds
      ));

      let apiUrl = '/api/data-sources/process';
      let body: any = {
        type: source.type,
        name: source.name,
        content: source.content,
      };

      // If chatbot exists, pass chatbotId for auto-vectorization
      if (chatbotId) {
        body.chatbotId = chatbotId;
        body = {
          type: source.type,
          fileName: source.name,
          content: source.content,
          processed: true,
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to process data source');
      }

      const result = await response.json();

      // Update status to processed and update the query cache
      setLocalDataSources(prev => prev.map(ds => 
        ds.name === source.name ? { ...ds, status: 'processed' as const, id: result.id } : ds
      ));

      // Invalidate the query cache to refresh data sources list
      if (chatbotId) {
        queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/data-sources`] });
      }

      // If chatbot exists and result has id, automatically vectorize the content
      if (chatbotId && result.id && source.content) {
        try {
          const vectorizeResponse = await fetch(`/api/data-sources/${result.id}/vectorize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (vectorizeResponse.ok) {
            console.log(`✅ Data source vectorized: ${source.name}`);
          } else {
            console.warn(`⚠️ Vectorization failed for: ${source.name}`);
          }
        } catch (vectorError) {
          console.warn('Vectorization error:', vectorError);
        }
      }

      console.log(`✅ Data source processed: ${source.name}`, result);
    } catch (error) {
      console.error('❌ Error processing data source:', error);
      setLocalDataSources(prev => prev.map(ds => 
        ds.name === source.name ? { ...ds, status: 'error' as const } : ds
      ));
    }
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newSource = {
          type: 'file' as const,
          name: file.name,
          status: 'pending' as const
        };
        addDataSource(newSource);
        
        // Process file immediately
        processDataSource(newSource);
      });
    }
    // Reset input
    event.target.value = '';
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleUrlAdd = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (urlInput.trim()) {
      if (!isValidUrl(urlInput.trim())) {
        console.error('Invalid URL format');
        return;
      }
      
      const newSource = {
        type: 'url' as const,
        name: urlInput,
        content: urlInput,
        status: 'pending' as const
      };
      addDataSource(newSource);
      
      // Process URL immediately
      processDataSource(newSource);
      setUrlInput("");
    }
  };

  const handleTextAdd = () => {
    if (textInput.trim()) {
      const newSource = {
        type: 'text' as const,
        name: `Text content (${textInput.slice(0, 30)}...)`,
        content: textInput,
        status: 'pending' as const
      };
      addDataSource(newSource);
      
      // Process text immediately
      processDataSource(newSource);
      setTextInput("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return <Upload className="w-4 h-4" />;
      case 'url': return <Link className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Data Sources</h3>
        <p className="text-sm text-gray-300 mb-6">
          Add content to train your chatbot. The AI will use this information to answer questions accurately.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="urls">Website URLs</TabsTrigger>
          <TabsTrigger value="text">Plain Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="w-5 h-5 text-primary" />
                Upload Documents
              </CardTitle>
              <p className="text-sm text-gray-300 mt-2">
                Upload PDF, DOCX, or TXT files to expand your chatbot's knowledge
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-300 mb-4">
                  Supports PDF, DOCX, TXT files up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="cursor-pointer"
                >
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Link className="w-5 h-5 text-primary" />
                Website URLs
              </CardTitle>
              <p className="text-sm text-gray-300 mt-2">
                Add website URLs to automatically extract and train on web content
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url-input">Website URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="url-input"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUrlAdd();
                      }
                    }}
                    placeholder="https://example.com/page"
                    className={`flex-1 ${!isValidUrl(urlInput) && urlInput.trim() ? 'border-red-500' : ''}`}
                  />
                  <Button 
                    type="button" 
                    onClick={handleUrlAdd}
                    disabled={!urlInput.trim() || !isValidUrl(urlInput.trim())}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add URL
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                The system will crawl the webpage and extract text content for training.
              </p>
              {urlInput.trim() && !isValidUrl(urlInput.trim()) && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Please enter a valid URL (e.g., https://example.com)
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Type className="w-5 h-5 text-primary" />
                Plain Text Content
              </CardTitle>
              <p className="text-sm text-gray-300 mt-2">
                Add custom text content directly to your chatbot's knowledge base
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="text-input" className="text-gray-300 font-medium">Knowledge Base Content</Label>
                <p className="text-xs text-gray-400 mb-2">
                  Add FAQ answers, product information, company policies, or any relevant text
                </p>
                <Textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Example: Our company was founded in 2020 and specializes in AI-powered customer support solutions. We offer 24/7 support and have served over 1000+ businesses worldwide..."
                  className="min-h-[200px] mt-2 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-primary-500"
                />
              </div>
              <Button 
                type="button" 
                onClick={handleTextAdd}
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={!textInput.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Data Sources List */}
      {localDataSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Added Data Sources ({localDataSources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localDataSources.map((source, index) => (
                <div
                  key={source.id || `source-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(source.type)}
                    <div>
                      <p className="font-medium text-sm">{source.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(source.status)}`}>
                        {source.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDataSource(source.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H14V8H21Z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">AI-Powered Knowledge Base</h4>
            <p className="text-sm text-gray-300 mb-2">
              Your uploaded content is automatically processed and converted into semantic embeddings for RAG (Retrieval-Augmented Generation).
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Vector Database:</strong> Content stored in Supabase with pgvector extension</li>
              <li>• <strong>Semantic Search:</strong> AI finds relevant context based on meaning, not just keywords</li>
              <li>• <strong>Auto-Processing:</strong> Text is chunked and vectorized immediately upon upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}