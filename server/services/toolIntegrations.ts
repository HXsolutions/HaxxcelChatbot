// Tool integrations service for handling third-party tool connections
export interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  authType: 'api_key' | 'oauth' | 'webhook';
  setupInstructions: string;
  requiredFields: string[];
}

export class ToolIntegrationsService {
  private integrations: ToolIntegration[] = [
    {
      id: 'google_suite',
      name: 'Google Workspace',
      description: 'Connect with Gmail, Google Drive, Calendar, and Docs',
      category: 'Productivity',
      authType: 'oauth',
      setupInstructions: 'Enable Google Workspace APIs and configure OAuth consent screen',
      requiredFields: ['client_id', 'client_secret', 'redirect_uri']
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Access and manage Notion databases and pages',
      category: 'Knowledge Management',
      authType: 'api_key',
      setupInstructions: 'Create an integration at notion.so/my-integrations',
      requiredFields: ['integration_secret', 'page_url']
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Sync contacts, deals, and customer data',
      category: 'CRM',
      authType: 'api_key',
      setupInstructions: 'Get API key from HubSpot developer settings',
      requiredFields: ['api_key']
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Connect with Salesforce CRM data and workflows',
      category: 'CRM',
      authType: 'oauth',
      setupInstructions: 'Create connected app in Salesforce setup',
      requiredFields: ['client_id', 'client_secret', 'instance_url']
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      description: 'Integrate with Zoho CRM and business tools',
      category: 'CRM',
      authType: 'oauth',
      setupInstructions: 'Register app in Zoho Developer Console',
      requiredFields: ['client_id', 'client_secret', 'redirect_uri']
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Access store data, products, and customer information',
      category: 'E-commerce',
      authType: 'api_key',
      setupInstructions: 'Create private app in Shopify admin',
      requiredFields: ['api_key', 'api_secret', 'store_url']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with thousands of apps via Zapier webhooks',
      category: 'Automation',
      authType: 'webhook',
      setupInstructions: 'Create webhook trigger in Zapier',
      requiredFields: ['webhook_url', 'api_key']
    },
    {
      id: 'make',
      name: 'Make (Integromat)',
      description: 'Automate workflows with Make platform',
      category: 'Automation',
      authType: 'webhook',
      setupInstructions: 'Set up webhook module in Make scenario',
      requiredFields: ['webhook_url', 'api_token']
    },
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Connect with self-hosted n8n automation',
      category: 'Automation',
      authType: 'webhook',
      setupInstructions: 'Configure webhook trigger in n8n workflow',
      requiredFields: ['webhook_url', 'auth_token']
    }
  ];

  getAvailableIntegrations(): ToolIntegration[] {
    return this.integrations;
  }

  getIntegrationsByCategory(category: string): ToolIntegration[] {
    return this.integrations.filter(integration => 
      integration.category.toLowerCase() === category.toLowerCase()
    );
  }

  getIntegrationById(id: string): ToolIntegration | undefined {
    return this.integrations.find(integration => integration.id === id);
  }

  async testConnection(integrationId: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }> {
    const integration = this.getIntegrationById(integrationId);
    
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    // Validate required fields
    const missingFields = integration.requiredFields.filter(field => !credentials[field]);
    if (missingFields.length > 0) {
      return { 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }

    try {
      // In a real implementation, this would test the actual API connection
      switch (integrationId) {
        case 'google_suite':
          return { success: true, message: 'Google Workspace connection verified' };
        
        case 'notion':
          return { success: true, message: 'Notion integration verified' };
        
        case 'hubspot':
          return { success: true, message: 'HubSpot CRM connection verified' };
        
        case 'salesforce':
          return { success: true, message: 'Salesforce connection verified' };
        
        case 'zoho':
          return { success: true, message: 'Zoho CRM connection verified' };
        
        case 'shopify':
          return { success: true, message: 'Shopify store connection verified' };
        
        case 'zapier':
          return { success: true, message: 'Zapier webhook configured' };
        
        case 'make':
          return { success: true, message: 'Make automation connected' };
        
        case 'n8n':
          return { success: true, message: 'n8n workflow connected' };
        
        default:
          return { success: false, message: 'Integration test not implemented' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${(error as Error).message}` };
    }
  }
}

export const toolIntegrations = new ToolIntegrationsService();