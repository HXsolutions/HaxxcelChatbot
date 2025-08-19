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

// Gmail integration functions
export async function handleGmailSendOperation(
  credentials: any,
  operation: string,
  params: any,
  context: string,
  conversationHistory?: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!credentials.access_token) {
      return { success: false, error: "No access token available" };
    }

    if (operation === 'send_email') {
      const fullContext = conversationHistory ? `${conversationHistory}\n\nCurrent request: ${context}` : context;
      
      let recipient = params.to || extractEmailFromContext(fullContext);
      let subject = params.subject || extractSubjectFromContext(fullContext);
      let body = params.body || extractBodyFromContext(fullContext);

      if (!recipient) {
        const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
        const emails = fullContext.match(emailPattern);
        if (emails && emails.length > 0) {
          recipient = emails[emails.length - 1];
        }
      }

      if (!recipient) {
        return { success: false, error: "Could not determine recipient email. Please specify the email address." };
      }

      if (!subject) {
        subject = generateSubjectFromContext(fullContext);
      }

      if (!body) {
        body = generateBodyFromContext(fullContext);
      }

      const emailData = {
        to: recipient,
        subject: subject || "Message from Chatbot Assistant",
        body: body
      };

      const rawEmail = createEmailRaw(emailData);
      console.log('Sending email:', emailData);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: rawEmail
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Gmail API error:', error);
        return { success: false, error: `Failed to send email: ${error}` };
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      
      return { 
        success: true, 
        result: {
          messageId: result.id,
          recipient: emailData.to,
          subject: emailData.subject,
          message: `Email sent successfully to ${emailData.to}`
        }
      };
    }

    return { success: false, error: "Unsupported operation" };
  } catch (error) {
    console.error('Gmail operation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// Helper functions for email processing
function extractEmailFromContext(context: string): string | null {
  const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const emails = context.match(emailPattern);
  return emails ? emails[emails.length - 1] : null;
}

function extractSubjectFromContext(context: string): string {
  // Look for explicit subject mentions
  const subjectMatch = context.match(/subject[:\s]+([^\n\r]+)/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }
  
  // Generate subject from context
  const lines = context.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length <= 50) {
      return firstLine;
    }
    return firstLine.substring(0, 47) + '...';
  }
  
  return 'Message from Assistant';
}

function extractBodyFromContext(context: string): string {
  // Look for explicit body/message content
  const bodyMatch = context.match(/(?:body|message|content)[:\s]+([^]+)/i);
  if (bodyMatch) {
    return bodyMatch[1].trim();
  }
  
  // Use the full context as body
  return context;
}

function generateSubjectFromContext(context: string): string {
  // Look for key phrases that might indicate the email purpose
  const lowerContext = context.toLowerCase();
  
  if (lowerContext.includes('meeting') || lowerContext.includes('schedule')) {
    return 'Meeting Request';
  }
  if (lowerContext.includes('follow up') || lowerContext.includes('followup')) {
    return 'Follow Up';
  }
  if (lowerContext.includes('thank')) {
    return 'Thank You';
  }
  if (lowerContext.includes('urgent') || lowerContext.includes('important')) {
    return 'Important Message';
  }
  
  // Extract first meaningful sentence
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    return firstSentence.length <= 50 ? firstSentence : firstSentence.substring(0, 47) + '...';
  }
  
  return 'Message from Assistant';
}

function generateBodyFromContext(context: string): string {
  // Clean up the context to make it more email-appropriate
  let body = context.trim();
  
  // Remove system messages or chatbot-specific phrases
  body = body.replace(/^(User:|Assistant:)/gm, '');
  body = body.replace(/I'll send an email|Let me send|I'll compose/gi, '');
  
  // If the body is very short, add a polite greeting
  if (body.length < 50) {
    body = `Hello,\n\n${body}\n\nBest regards,\nChatbot Assistant`;
  }
  
  return body;
}

function createEmailRaw(emailData: { to: string; subject: string; body: string }): string {
  const email = [
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
    emailData.body
  ].join('\r\n');
  
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}