import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, MicOff, X, MessageCircle, Volume2, VolumeX } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'image' | 'audio';
  attachments?: string[];
}

interface ChatWidgetProps {
  chatbotId: string;
  isWhiteLabel?: boolean;
  customBranding?: {
    primaryColor?: string;
    logo?: string;
    companyName?: string;
  };
  position?: 'bottom-right' | 'bottom-left' | 'center';
  enableVoice?: boolean;
  theme?: 'light' | 'dark';
}

export default function ChatWidget({ 
  chatbotId, 
  isWhiteLabel = false, 
  customBranding,
  position = 'bottom-right',
  enableVoice = false,
  theme = 'light'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const primaryColor = customBranding?.primaryColor || '#3B82F6';
  const logo = customBranding?.logo;
  const companyName = customBranding?.companyName || 'Chatbot';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (content: string, type: 'text' | 'audio' = 'text') => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate API call to chatbot
      const response = await fetch(`/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, type })
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        isUser: false,
        timestamp: new Date(),
        type: data.type || 'text'
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Auto-speak response if voice is enabled
      if (enableVoice && data.audioUrl) {
        playAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m experiencing technical difficulties. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      const audioChunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          const response = await fetch(`/api/chatbots/${chatbotId}/transcribe`, {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          if (data.transcription) {
            sendMessage(data.transcription, 'audio');
          }
        } catch (error) {
          console.error('Transcription error:', error);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const widgetStyle = {
    '--primary-color': primaryColor,
  } as React.CSSProperties;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  if (!isOpen) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50`}
        style={widgetStyle}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 w-96 h-[600px]`}
      style={widgetStyle}
    >
      <Card className={`w-full h-full flex flex-col shadow-2xl ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'}`}>
        {/* Header */}
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0" style={{ borderBottomColor: primaryColor + '20' }}>
          <div className="flex items-center space-x-3">
            {logo && (
              <img 
                src={logo} 
                alt={`${companyName} logo`} 
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{companyName}</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {enableVoice && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsSpeaking(!isSpeaking)}
                className="p-2"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? 'text-white'
                    : theme === 'dark' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-900'
                }`}
                style={message.isUser ? { backgroundColor: primaryColor } : {}}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.type === 'audio' && (
                    <Badge variant="secondary" className="text-xs">
                      🎤 Voice
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
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

        {/* Input */}
        <div className="p-4 border-t" style={{ borderTopColor: primaryColor + '20' }}>
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
              className="flex-1"
              disabled={isTyping}
            />
            
            {enableVoice && (
              <Button
                variant="outline"
                size="icon"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={`transition-colors ${isRecording ? 'bg-red-500 text-white' : ''}`}
                disabled={isTyping}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            
            <Button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Powered by Footer - Required for non-white-label */}
          {!isWhiteLabel && (
            <div className="mt-3 text-center">
              <div
                className="inline-flex items-center space-x-1 text-xs text-gray-500"
                style={{ 
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
                  border: `1px solid ${primaryColor}20`
                }}
              >
                <span>Powered by</span>
                <a
                  href="https://haxxcelsolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:opacity-80 transition-colors"
                  style={{ color: primaryColor }}
                >
                  Haxxcel Solutions
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}