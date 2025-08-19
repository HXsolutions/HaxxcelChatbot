import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, Settings, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatPlaygroundProps {
  chatbotId?: string;
  chatbotConfig: {
    name?: string;
    avatar?: string;
    headerColor?: string;
    title?: string;
    subtitle?: string;
    theme?: 'light' | 'dark';
    bubbleColor?: string;
    logo?: string;
    defaultMessages?: string[];
    systemPrompt?: string;
  };
}

export default function ChatPlayground({ chatbotId, chatbotConfig }: ChatPlaygroundProps) {
  // Persist messages using chatbot ID as key
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined' && chatbotId) {
      const saved = localStorage.getItem(`playground-messages-${chatbotId}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (chatbotId && messages.length > 0) {
      localStorage.setItem(`playground-messages-${chatbotId}`, JSON.stringify(messages));
    }
  }, [messages, chatbotId]);

  const {
    name = "AI Assistant",
    avatar,
    headerColor = "#3B82F6",
    title = "Chat with us",
    subtitle = "We're here to help!",
    theme = "light",
    bubbleColor = "#3B82F6",
    logo,
    defaultMessages = ["Hello! How can I help you today?"],
    systemPrompt = "You are a helpful AI assistant."
  } = chatbotConfig;

  // Initialize with default message
  useEffect(() => {
    if (messages.length === 0 && defaultMessages.length > 0) {
      const welcomeMessage = {
        id: "welcome-" + Date.now(),
        content: defaultMessages[0],
        role: "assistant" as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [defaultMessages, messages.length]);

  // Refresh function to clear chat and restart
  const handleRefresh = () => {
    if (chatbotId) {
      localStorage.removeItem(`playground-messages-${chatbotId}`);
    }
    setMessages([]);
    setInputMessage("");
    // Re-initialize with welcome message
    if (defaultMessages.length > 0) {
      const welcomeMessage = {
        id: "welcome-" + Date.now(),
        content: defaultMessages[0],
        role: "assistant" as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      if (chatbotId) {
        // Use real API for existing chatbots
        const response = await fetch(`/api/chat/${chatbotId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}` // Add auth token
          },
          body: JSON.stringify({ 
            message: inputMessage,
            sessionId: `playground-${chatbotId}-${Date.now()}` // Generate unique session ID for playground
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            role: "assistant",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
        } else {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: data.message || "Sorry, I encountered an error processing your request.",
            role: "assistant",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        }
      } else {
        // Fallback for preview mode when no chatbot is created yet
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "This is a preview response. Create your chatbot and configure API keys to enable real AI responses.",
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm experiencing technical difficulties. Please try again later.",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice functionality would be implemented here
  };

  return (
    <div className="h-full flex flex-col playground-container">
      {/* Preview Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <Settings className="w-4 h-4 text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-800">
            <strong>Live Preview:</strong> This shows how your chatbot will appear to users. Changes from Basic Setup will reflect here instantly.
          </span>
        </div>
      </div>

      {/* Chat Widget */}
      <div 
        className={`flex-1 rounded-lg border shadow-lg overflow-hidden ${
          theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        style={{ maxWidth: '400px', height: '600px', margin: '0 auto' }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center space-x-3"
          style={{ backgroundColor: headerColor }}
        >
          {logo ? (
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" />
          ) : avatar ? (
            <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-white font-medium text-sm">{title}</h3>
            <p className="text-white/80 text-xs">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            onClick={handleRefresh}
            title="Refresh chat"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" style={{ height: '400px' }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? `text-white`
                      : theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  style={{
                    backgroundColor: message.role === 'user' ? bubbleColor : undefined
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`px-3 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={`flex-1 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-500 text-gray-100 placeholder-gray-300 focus:bg-gray-700 focus:border-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
              }`}
              style={{
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={toggleVoice}
              className={`${isListening ? 'bg-red-100 border-red-300' : ''}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              style={{ backgroundColor: bubbleColor }}
              className="text-white hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-2 text-center ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        } border-t`}>
          <span className={`text-xs ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Powered by{' '}
            <a 
              href="https://haxxcelsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
            >
              Haxxcel Solutions
            </a>
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Testing Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Type messages to test chat functionality</li>
          <li>• All customizations from Basic Setup will appear here</li>
          <li>• Voice button simulates voice input (requires configuration)</li>
          <li>• This preview shows exactly how users will see your chatbot</li>
        </ul>
      </div>
    </div>
  );
}