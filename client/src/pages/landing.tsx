import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! How can I help you today?' },
    { role: 'user', content: 'What services do you offer?' },
    { role: 'assistant', content: 'We offer AI chatbot creation, multi-channel deployment, and tool integrations. Would you like to know more about any of these?' }
  ]);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setMessages(prev => {
        const newMessage = { role: 'assistant', content: 'Try our chatbot builder today!' };
        return prev.length > 5 ? [prev[0], newMessage] : [...prev, newMessage];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <span className="text-3xl font-bold text-white">Haxxcel Chatbot</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Build Powerful AI Chatbots
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-primary to-blue-500 bg-clip-text text-transparent animate-pulse">Without Any Code</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create intelligent chatbots powered by the latest AI models. Deploy across multiple channels, 
            integrate with your favorite tools, and scale your customer interactions effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="group relative px-8 py-4 text-lg bg-gradient-to-r from-primary via-primary-600 to-cyan-500 hover:from-primary-600 hover:via-primary-700 hover:to-cyan-600 text-white shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-2xl overflow-hidden"
              onClick={() => window.location.href = '/register'}
            >
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-primary-700 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="group relative px-8 py-4 text-lg border-2 border-primary/50 text-primary hover:text-white transition-all duration-500 backdrop-blur-sm bg-white/5 hover:bg-white/10 overflow-hidden"
            >
              <span className="relative z-10">Watch Demo</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-cyan-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </Button>
          </div>
        </div>

        {/* Chatbot UI Preview Section */}
        <div className={`max-w-6xl mx-auto mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">See It In Action</h2>
            <p className="text-gray-300 text-lg">Experience how your chatbot will look and feel</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Chatbot Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-robot text-white text-sm"></i>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">AI Assistant</h3>
                      <p className="text-green-400 text-sm">Online</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4 h-80 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-primary to-cyan-500 text-white' 
                          : 'bg-gray-700/50 text-gray-200 border border-gray-600/50'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                      readOnly
                    />
                    <button className="bg-gradient-to-r from-primary to-cyan-500 p-2 rounded-xl hover:from-primary-600 hover:to-cyan-600 transition-all duration-300">
                      <i className="fas fa-paper-plane text-white"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-palette text-primary"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Fully Customizable</h3>
                  <p className="text-gray-400">Customize colors, branding, and conversation flow to match your brand perfectly.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-bolt text-green-400"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-gray-400">Powered by the latest AI models for instant, intelligent responses.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-mobile-alt text-purple-400"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Mobile Ready</h3>
                  <p className="text-gray-400">Responsive design that works perfectly on all devices and platforms.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-xl backdrop-blur-sm hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-cyan-500/30 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-brain text-primary text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Multi-LLM Support</h3>
              <p className="text-gray-300">
                Choose from Google Gemini, OpenAI GPT, Anthropic Claude, xAI Grok, 
                and many more AI models to power your chatbots.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-xl backdrop-blur-sm hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-plug text-green-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Tool Integrations</h3>
              <p className="text-gray-300">
                Connect with Google Suite, Notion, HubSpot, Shopify, and hundreds 
                of other tools to enhance your chatbot's capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-xl backdrop-blur-sm hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-violet-600/30 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-share-alt text-purple-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Multi-Channel Deploy</h3>
              <p className="text-gray-300">
                Deploy your chatbots across websites, WhatsApp, Facebook Messenger, 
                Shopify stores, and more platforms instantly.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Trusted by thousands of businesses worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-500">TechCorp</div>
            <div className="text-2xl font-bold text-gray-500">StartupXYZ</div>
            <div className="text-2xl font-bold text-gray-500">Enterprise Inc</div>
            <div className="text-2xl font-bold text-gray-500">Agency Co</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700/50 py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-gray-300 mb-2">
            Built with ❤️ by{' '}
            <a 
              href="https://haxxcelsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent hover:from-primary-600 hover:to-cyan-600 font-medium transition-all duration-300"
            >
              Haxxcel Solutions
            </a>
          </p>
          <p className="text-sm text-gray-400">
            © 2025 Haxxcel Chatbot Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
