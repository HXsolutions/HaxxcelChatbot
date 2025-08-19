import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2, Star, CreditCard, Download } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    chatbots: number;
    conversations: number;
    integrations: number;
    apiCalls: number;
    storage: string;
  };
  recommended?: boolean;
}

interface UsageStats {
  chatbots: { current: number; limit: number };
  conversations: { current: number; limit: number };
  integrations: { current: number; limit: number };
  apiCalls: { current: number; limit: number };
  storage: { current: string; limit: string };
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: [
      '1 chatbot',
      'Basic AI models (Google Gemini)',
      'Website embed widget',
      'Basic integrations (2 tools)',
      'Standard voice processing',
      'Community support'
    ],
    limits: {
      chatbots: 1,
      conversations: 1000,
      integrations: 2,
      apiCalls: 10000,
      storage: '1 GB'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    interval: 'monthly',
    recommended: true,
    features: [
      '5 chatbots',
      'All AI models (Google, OpenAI, Anthropic, etc.)',
      'Multi-channel deployment',
      'Advanced integrations (5 tools)',
      'Premium voice processing',
      'Real-time analytics',
      'Priority support'
    ],
    limits: {
      chatbots: 5,
      conversations: 10000,
      integrations: 5,
      apiCalls: 100000,
      storage: '10 GB'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'monthly',
    features: [
      'Unlimited chatbots',
      'All AI models + custom integrations',
      'White-label solution',
      'Unlimited integrations',
      'Custom voice models',
      'Advanced analytics & reporting',
      'Dedicated account manager',
      'Custom domain & branding',
      'API access',
      'SLA guarantee'
    ],
    limits: {
      chatbots: -1, // Unlimited
      conversations: -1,
      integrations: -1,
      apiCalls: -1,
      storage: 'Unlimited'
    }
  }
];

export default function Billing() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['/api/billing/subscription'],
  });

  const { data: usage } = useQuery<UsageStats>({
    queryKey: ['/api/billing/usage'],
  });

  const { data: invoices } = useQuery({
    queryKey: ['/api/billing/invoices'],
  });

  const upgradeSubscription = useMutation({
    mutationFn: async ({ planId, interval }: { planId: string; interval: string }) => {
      const response = await apiRequest('POST', '/api/billing/upgrade', { planId, interval });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been successfully updated.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      }
    },
    onError: () => {
      toast({
        title: "Upgrade Failed",
        description: "There was an error upgrading your subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/cancel');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling your subscription. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const currentPlan = (subscription as any)?.plan || 'starter';
  const isCurrentPlan = (planId: string) => currentPlan === planId;

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Zap className="w-5 h-5" />;
      case 'pro': return <Star className="w-5 h-5" />;
      case 'enterprise': return <Crown className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-auto lg:ml-0">
        <Header 
          title="Billing & Subscription" 
          subtitle="Manage your subscription and usage"
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />
        
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Current Usage */}
      {usage && (usage as any).chatbots && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Chatbots</span>
                  <span className="text-sm text-gray-600">
                    {usage.chatbots.current}/{usage.chatbots.limit === -1 ? '∞' : usage.chatbots.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(usage.chatbots.current, usage.chatbots.limit)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Conversations</span>
                  <span className="text-sm text-gray-600">
                    {usage.conversations.current.toLocaleString()}/{usage.conversations.limit === -1 ? '∞' : usage.conversations.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(usage.conversations.current, usage.conversations.limit)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Integrations</span>
                  <span className="text-sm text-gray-600">
                    {usage.integrations.current}/{usage.integrations.limit === -1 ? '∞' : usage.integrations.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(usage.integrations.current, usage.integrations.limit)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">API Calls</span>
                  <span className="text-sm text-gray-600">
                    {usage.apiCalls.current.toLocaleString()}/{usage.apiCalls.limit === -1 ? '∞' : usage.apiCalls.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(usage.apiCalls.current, usage.apiCalls.limit)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm text-gray-600">
                    {usage.storage.current}/{usage.storage.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${usage.storage.limit === 'Unlimited' ? 0 : 50}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      {subscription && (subscription as any).plan && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  {getPlanIcon((subscription as any).plan)}
                  <h3 className="text-lg font-semibold capitalize">{(subscription as any).plan}</h3>
                  <Badge variant={(subscription as any).status === 'active' ? 'default' : 'secondary'}>
                    {(subscription as any).status}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-1">
                  ${(subscription as any).amount}/month • Next billing: {new Date((subscription as any).nextBilling).toLocaleDateString()}
                </p>
              </div>
              
              {(subscription as any).plan !== 'enterprise' && (
                <Button
                  variant="outline"
                  onClick={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setSelectedInterval('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedInterval('yearly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedInterval === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-1">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const price = selectedInterval === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price;
          const isUpgrade = plans.findIndex(p => p.id === currentPlan) < plans.findIndex(p => p.id === plan.id);
          
          return (
            <Card key={plan.id} className={`relative ${plan.recommended ? 'ring-2 ring-primary-500' : ''}`}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center items-center space-x-2 mb-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  ${price}
                  <span className="text-base font-normal text-gray-600">/{selectedInterval}</span>
                </div>
                {selectedInterval === 'yearly' && (
                  <p className="text-sm text-green-600">Save ${plan.price * 12 - price * 12}/year</p>
                )}
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2 mb-6">
                  <h4 className="font-medium text-sm">Usage Limits:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• {plan.limits.chatbots === -1 ? 'Unlimited' : plan.limits.chatbots} chatbots</li>
                    <li>• {plan.limits.conversations === -1 ? 'Unlimited' : plan.limits.conversations.toLocaleString()} conversations/month</li>
                    <li>• {plan.limits.integrations === -1 ? 'Unlimited' : plan.limits.integrations} tool integrations</li>
                    <li>• {plan.limits.apiCalls === -1 ? 'Unlimited' : plan.limits.apiCalls.toLocaleString()} API calls/month</li>
                    <li>• {plan.limits.storage} storage</li>
                  </ul>
                </div>
                
                <Button
                  className="w-full"
                  variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                  disabled={isCurrentPlan(plan.id) || upgradeSubscription.isPending}
                  onClick={() => {
                    if (!isCurrentPlan(plan.id)) {
                      upgradeSubscription.mutate({ planId: plan.id, interval: selectedInterval });
                    }
                  }}
                >
                  {isCurrentPlan(plan.id) 
                    ? 'Current Plan' 
                    : upgradeSubscription.isPending 
                      ? 'Processing...'
                      : isUpgrade 
                        ? `Upgrade to ${plan.name}` 
                        : `Switch to ${plan.name}`
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Invoices */}
      {invoices && (invoices as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(invoices as any[]).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">${invoice.amount}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.date).toLocaleDateString()} • {invoice.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.pdf} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  );
}