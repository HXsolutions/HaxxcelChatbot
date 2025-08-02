import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <span className="text-3xl font-bold text-gray-900">Haxxcel Chatbot</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build Powerful AI Chatbots
            <br />
            <span className="text-primary-600">Without Any Code</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create intelligent chatbots powered by the latest AI models. Deploy across multiple channels, 
            integrate with your favorite tools, and scale your customer interactions effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => window.location.href = '/register'}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-LLM Support</h3>
              <p className="text-gray-600">
                Choose from Google Gemini, OpenAI GPT, Anthropic Claude, xAI Grok, 
                and many more AI models to power your chatbots.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-plug text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Tool Integrations</h3>
              <p className="text-gray-600">
                Connect with Google Suite, Notion, HubSpot, Shopify, and hundreds 
                of other tools to enhance your chatbot's capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-share-alt text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Channel Deploy</h3>
              <p className="text-gray-600">
                Deploy your chatbots across websites, WhatsApp, Facebook Messenger, 
                Shopify stores, and more platforms instantly.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">Trusted by thousands of businesses worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">TechCorp</div>
            <div className="text-2xl font-bold text-gray-400">StartupXYZ</div>
            <div className="text-2xl font-bold text-gray-400">Enterprise Inc</div>
            <div className="text-2xl font-bold text-gray-400">Agency Co</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            Built with ❤️ by{' '}
            <a 
              href="https://haxxcelsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Haxxcel Solutions
            </a>
          </p>
          <p className="text-sm text-gray-500">
            © 2025 Haxxcel Chatbot Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
