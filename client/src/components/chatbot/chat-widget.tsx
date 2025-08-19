import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  chatbotId?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  showPoweredBy?: boolean;
}

export default function ChatWidget({ 
  chatbotId = 'demo', 
  position = 'bottom-right',
  primaryColor = 'hsl(207, 90%, 54%)',
  showPoweredBy = true
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help. What can I assist you with today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId: sessionId.current,
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process your request at the moment.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* Chat Button */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105",
          isOpen && "hidden"
        )}
        style={{ backgroundColor: primaryColor }}
        onClick={() => setIsOpen(true)}
      >
        <i className="fas fa-comments text-white text-xl"></i>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 h-96 shadow-xl border border-gray-200 flex flex-col">
          <CardHeader 
            className="p-4 rounded-t-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-sm"></i>
                </div>
                <div>
                  <h3 className="font-medium">Support Assistant</h3>
                  <p className="text-xs opacity-90">Online now</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <i 
                      className="fas fa-robot text-xs"
                      style={{ color: primaryColor }}
                    ></i>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg p-3 max-w-xs break-words",
                    message.role === 'user'
                      ? "bg-gray-900 text-white ml-auto"
                      : "bg-gray-100 text-gray-900"
                  )}
                  style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <i 
                    className="fas fa-robot text-xs"
                    style={{ color: primaryColor }}
                  ></i>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
                disabled={isTyping}
              />
              <Button 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-2"
                style={{ backgroundColor: primaryColor }}
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </Button>
            </div>
            
            {showPoweredBy && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-500">
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
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
