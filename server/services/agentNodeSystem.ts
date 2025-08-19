// Agent Node System - Comprehensive tool location and usage mapping for AI agents

export interface NodeAction {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  examples: string[];
  usage: string;
}

export interface ToolNodeDefinition {
  toolType: string;
  toolName: string;
  category: string;
  connectionMethod: 'oauth' | 'api_key' | 'webhook';
  endpoint?: string;
  actions: NodeAction[];
  agentInstructions: string;
  troubleshooting: string[];
}

export class AgentNodeSystem {
  private nodeDefinitions: Map<string, ToolNodeDefinition> = new Map();

  constructor() {
    this.initializeNodeDefinitions();
  }

  private initializeNodeDefinitions() {
    // Google Workspace Tools
    this.nodeDefinitions.set('gmail', {
      toolType: 'gmail',
      toolName: 'Gmail',
      category: 'Google Workspace',
      connectionMethod: 'oauth',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'send_email',
          name: 'Send Email',
          description: 'Send an email through Gmail',
          parameters: {
            to: 'string - recipient email address',
            subject: 'string - email subject',
            body: 'string - email content',
            cc: 'string[] - optional CC recipients',
            bcc: 'string[] - optional BCC recipients'
          },
          examples: [
            'Send welcome email to new customer',
            'Send order confirmation to customer@example.com',
            'Send newsletter to mailing list'
          ],
          usage: 'Use this action when user wants to send emails automatically. The agent can compose professional emails based on context.'
        },
        {
          id: 'read_inbox',
          name: 'Read Inbox',
          description: 'Retrieve and search emails from Gmail',
          parameters: {
            query: 'string - Gmail search query (e.g., "is:unread", "from:sender@example.com")',
            maxResults: 'number - maximum emails to retrieve (default: 10)'
          },
          examples: [
            'Check for unread emails from customers',
            'Find emails about specific order ID',
            'Search for support tickets in last 24 hours'
          ],
          usage: 'Use this action to retrieve emails for analysis, finding specific messages, or getting inbox status.'
        }
      ],
      agentInstructions: `
GMAIL NODE USAGE FOR AI AGENTS:

Location: Connected via OAuth2, access through /api/tools/{connectionId}/execute
Authentication: Automatically handled through stored OAuth tokens

WHEN TO USE:
- User asks to send emails
- User wants to check emails
- User needs email automation
- Customer support workflows
- Order confirmations and notifications

HOW TO USE:
1. Get connection ID from user's connected tools
2. Use send_email action for outgoing emails
3. Use read_inbox action for retrieving emails
4. Always ask for user confirmation before sending emails

EXAMPLES:
- "Send order confirmation to customer" → use send_email with order details
- "Check if we have any support requests" → use read_inbox with query "is:unread subject:support"
- "Find emails about order #12345" → use read_inbox with query "order #12345"
      `,
      troubleshooting: [
        'If OAuth token expired: User needs to reconnect Gmail in Tools tab',
        'If emails not sending: Check spam folder and Gmail API quotas',
        'If search not working: Verify Gmail search query syntax',
        'If authentication errors: Refresh OAuth connection'
      ]
    });

    this.nodeDefinitions.set('google_sheets', {
      toolType: 'google_sheets',
      toolName: 'Google Sheets',
      category: 'Google Workspace',
      connectionMethod: 'oauth',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'read_data',
          name: 'Read Sheet Data',
          description: 'Read data from Google Sheets',
          parameters: {
            sheetId: 'string - Google Sheets ID from URL',
            range: 'string - A1 notation range (e.g., "Sheet1!A1:C10")'
          },
          examples: [
            'Get customer data from CRM sheet',
            'Read product inventory from Sheet1!A:D',
            'Fetch sales data for analysis'
          ],
          usage: 'Use this to retrieve data from spreadsheets for analysis, customer lookup, or data processing.'
        },
        {
          id: 'append_row',
          name: 'Add Row to Sheet',
          description: 'Append new row to Google Sheets',
          parameters: {
            sheetId: 'string - Google Sheets ID',
            range: 'string - Range to append to (e.g., "Sheet1!A:D")',
            values: 'array - Values to add as new row'
          },
          examples: [
            'Add new customer to CRM',
            'Log support ticket details',
            'Record new order information'
          ],
          usage: 'Use this to add new records, log data, or update spreadsheets with new information.'
        },
        {
          id: 'update_cells',
          name: 'Update Cells',
          description: 'Update specific cells in Google Sheets',
          parameters: {
            sheetId: 'string - Google Sheets ID',
            range: 'string - Specific range to update',
            values: 'array - New values for the range'
          },
          examples: [
            'Update customer status to "Active"',
            'Modify inventory count',
            'Update order fulfillment status'
          ],
          usage: 'Use this to modify existing data, update statuses, or correct information in spreadsheets.'
        }
      ],
      agentInstructions: `
GOOGLE SHEETS NODE USAGE FOR AI AGENTS:

Location: Connected via OAuth2, access through /api/tools/{connectionId}/execute
Authentication: Automatically handled through stored OAuth tokens

WHEN TO USE:
- User wants to read/write spreadsheet data
- CRM operations (customer lookup, updates)
- Inventory management
- Data logging and tracking
- Report generation from sheet data

HOW TO USE:
1. Get Sheet ID from Google Sheets URL (after /spreadsheets/d/)
2. Use A1 notation for ranges (e.g., "Sheet1!A1:C10")
3. Use read_data for retrieving information
4. Use append_row for adding new records
5. Use update_cells for modifying existing data

SHEET ID EXTRACTION:
From URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
Sheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

EXAMPLES:
- "Find customer John Doe" → read_data with query in customer name column
- "Add new customer" → append_row with customer details
- "Update order status to shipped" → update_cells with new status
      `,
      troubleshooting: [
        'If "Sheet not found": Verify Sheet ID is correct',
        'If "Range invalid": Check A1 notation syntax (e.g., "Sheet1!A1:C10")',
        'If "Permission denied": Ensure sheet is shared with service account',
        'If OAuth errors: Reconnect Google Sheets in Tools tab'
      ]
    });

    this.nodeDefinitions.set('google_docs', {
      toolType: 'google_docs',
      toolName: 'Google Docs',
      category: 'Google Workspace',
      connectionMethod: 'oauth',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'create_document',
          name: 'Create Document',
          description: 'Create a new Google Docs document',
          parameters: {
            title: 'string - document title',
            content: 'string - document content'
          },
          examples: [
            'Create customer proposal document',
            'Generate report based on data analysis',
            'Create meeting notes document'
          ],
          usage: 'Use this to create new documents for reports, proposals, or documentation.'
        },
        {
          id: 'get_document',
          name: 'Read Document',
          description: 'Retrieve content from existing Google Docs',
          parameters: {
            documentId: 'string - Google Docs document ID'
          },
          examples: [
            'Read template document for customization',
            'Extract content for analysis',
            'Get document for modification'
          ],
          usage: 'Use this to read existing documents for reference or modification.'
        }
      ],
      agentInstructions: `
GOOGLE DOCS NODE USAGE FOR AI AGENTS:

Location: Connected via OAuth2, access through /api/tools/{connectionId}/execute
Authentication: Automatically handled through stored OAuth tokens

WHEN TO USE:
- Create reports and documents
- Generate proposals or contracts
- Document customer interactions
- Create meeting notes
- Generate content from data

HOW TO USE:
1. Use create_document for new documents
2. Use get_document to read existing content
3. Document ID found in Google Docs URL
4. Content can include formatting instructions

DOCUMENT ID EXTRACTION:
From URL: https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
Document ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

EXAMPLES:
- "Create a customer proposal" → create_document with professional proposal content
- "Generate monthly report" → create_document with data analysis and insights
- "Read contract template" → get_document for template customization
      `,
      troubleshooting: [
        'If document creation fails: Check Google Docs API quotas',
        'If document not readable: Verify sharing permissions',
        'If formatting issues: Use plain text with basic formatting',
        'If OAuth errors: Reconnect Google Docs in Tools tab'
      ]
    });

    this.nodeDefinitions.set('google_drive', {
      toolType: 'google_drive',
      toolName: 'Google Drive',
      category: 'Google Workspace',
      connectionMethod: 'oauth',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'list_files',
          name: 'List Files',
          description: 'List files in Google Drive',
          parameters: {
            query: 'string - search query (e.g., "name contains \'report\'")',
            limit: 'number - maximum files to return'
          },
          examples: [
            'Find all PDF reports',
            'List files modified this week',
            'Search for customer documents'
          ],
          usage: 'Use this to find files, search documents, or list directory contents.'
        },
        {
          id: 'upload_file',
          name: 'Upload File',
          description: 'Upload file to Google Drive',
          parameters: {
            fileName: 'string - name for the uploaded file',
            content: 'string - file content',
            folderId: 'string - optional folder ID to upload to'
          },
          examples: [
            'Save generated report to Drive',
            'Upload customer data file',
            'Store backup document'
          ],
          usage: 'Use this to save documents, store generated content, or backup files.'
        }
      ],
      agentInstructions: `
GOOGLE DRIVE NODE USAGE FOR AI AGENTS:

Location: Connected via OAuth2, access through /api/tools/{connectionId}/execute
Authentication: Automatically handled through stored OAuth tokens

WHEN TO USE:
- File management and organization
- Document storage and retrieval
- Search for specific files
- Upload generated content
- Backup important data

HOW TO USE:
1. Use list_files to search and find files
2. Use upload_file to store new documents
3. Use Google Drive search syntax for queries
4. Folder ID can be found in Drive URL

SEARCH EXAMPLES:
- Find PDFs: "mimeType='application/pdf'"
- Files with name: "name contains 'report'"
- Modified recently: "modifiedTime > '2025-01-01'"
- In specific folder: "parents in 'folderId'"

EXAMPLES:
- "Find all customer contracts" → list_files with name query
- "Save this report to Drive" → upload_file with report content
- "Search for files modified today" → list_files with date query
      `,
      troubleshooting: [
        'If files not found: Check search query syntax',
        'If upload fails: Verify file size and format',
        'If permission denied: Check Drive sharing settings',
        'If quota exceeded: Review Google Drive storage limits'
      ]
    });

    // Automation Tools
    this.nodeDefinitions.set('zapier', {
      toolType: 'zapier',
      toolName: 'Zapier',
      category: 'Automation',
      connectionMethod: 'webhook',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'trigger_zap',
          name: 'Trigger Zapier Workflow',
          description: 'Trigger a Zapier automation workflow',
          parameters: {
            webhookUrl: 'string - Zapier webhook URL',
            data: 'object - data to send to the workflow'
          },
          examples: [
            'Trigger email marketing workflow',
            'Start customer onboarding process',
            'Sync data across platforms'
          ],
          usage: 'Use this to start automated workflows that connect multiple apps and services.'
        }
      ],
      agentInstructions: `
ZAPIER NODE USAGE FOR AI AGENTS:

Location: Connected via webhook, access through /api/tools/{connectionId}/execute
Authentication: Webhook URL contains authentication

WHEN TO USE:
- Automate multi-app workflows
- Connect different platforms
- Trigger marketing campaigns
- Sync data between systems
- Start business processes

HOW TO USE:
1. Get webhook URL from Zapier when creating Zap
2. Send relevant data as JSON object
3. Zapier will handle the rest of the workflow
4. Can trigger any connected app in Zapier

WEBHOOK SETUP:
1. Create new Zap in Zapier
2. Use "Webhooks by Zapier" as trigger
3. Copy webhook URL to tool configuration
4. Set up desired actions in Zapier

EXAMPLES:
- "Add new customer to CRM and email list" → trigger_zap with customer data
- "Create task in project management tool" → trigger_zap with task details
- "Send notification to Slack" → trigger_zap with message content
      `,
      troubleshooting: [
        'If webhook not triggering: Check URL and test in Zapier',
        'If data not passing: Verify JSON format',
        'If Zap not running: Check Zapier task history',
        'If authentication error: Verify webhook URL is correct'
      ]
    });

    this.nodeDefinitions.set('n8n', {
      toolType: 'n8n',
      toolName: 'n8n',
      category: 'Automation',
      connectionMethod: 'webhook',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'trigger_workflow',
          name: 'Trigger n8n Workflow',
          description: 'Trigger an n8n automation workflow',
          parameters: {
            webhookUrl: 'string - n8n webhook URL',
            data: 'object - data to send to the workflow',
            authToken: 'string - optional authentication token'
          },
          examples: [
            'Start data processing workflow',
            'Trigger customer notification sequence',
            'Execute complex automation logic'
          ],
          usage: 'Use this to trigger sophisticated automation workflows in n8n.'
        }
      ],
      agentInstructions: `
N8N NODE USAGE FOR AI AGENTS:

Location: Connected via webhook, access through /api/tools/{connectionId}/execute
Authentication: Optional auth token or webhook-based auth

WHEN TO USE:
- Complex automation workflows
- Data processing and transformation
- Advanced business logic
- Custom integrations
- Scheduled operations

HOW TO USE:
1. Create workflow in n8n with webhook trigger
2. Copy webhook URL from n8n
3. Send JSON data to trigger workflow
4. n8n will execute the defined workflow

N8N WEBHOOK SETUP:
1. Create new workflow in n8n
2. Add "Webhook" node as trigger
3. Configure HTTP method (usually POST)
4. Copy webhook URL to tool configuration
5. Build workflow logic after webhook

EXAMPLES:
- "Process customer order data" → trigger_workflow with order details
- "Run data validation workflow" → trigger_workflow with data to validate
- "Execute backup routine" → trigger_workflow with backup parameters
      `,
      troubleshooting: [
        'If workflow not triggering: Test webhook URL directly',
        'If data not processing: Check n8n workflow logs',
        'If authentication error: Verify auth token setup',
        'If timeout: Check n8n workflow execution time'
      ]
    });

    // CRM Tools
    this.nodeDefinitions.set('hubspot', {
      toolType: 'hubspot',
      toolName: 'HubSpot CRM',
      category: 'CRM',
      connectionMethod: 'api_key',
      endpoint: '/api/tools/{connectionId}/execute',
      actions: [
        {
          id: 'create_contact',
          name: 'Create Contact',
          description: 'Create a new contact in HubSpot CRM',
          parameters: {
            email: 'string - contact email address',
            firstName: 'string - contact first name',
            lastName: 'string - contact last name',
            company: 'string - company name',
            phone: 'string - phone number'
          },
          examples: [
            'Add new lead to CRM',
            'Create contact from website form',
            'Import customer data to HubSpot'
          ],
          usage: 'Use this to add new contacts to CRM when collecting leads or customer information.'
        },
        {
          id: 'update_contact',
          name: 'Update Contact',
          description: 'Update existing contact information',
          parameters: {
            contactId: 'string - HubSpot contact ID',
            properties: 'object - properties to update'
          },
          examples: [
            'Update customer status',
            'Add notes to contact record',
            'Modify contact information'
          ],
          usage: 'Use this to update customer information, add notes, or change contact status.'
        },
        {
          id: 'get_contact',
          name: 'Get Contact',
          description: 'Retrieve contact information from HubSpot',
          parameters: {
            email: 'string - contact email to search for'
          },
          examples: [
            'Look up customer information',
            'Check if contact exists',
            'Get contact details for personalization'
          ],
          usage: 'Use this to find customer information for support or sales purposes.'
        }
      ],
      agentInstructions: `
HUBSPOT CRM NODE USAGE FOR AI AGENTS:

Location: Connected via API key, access through /api/tools/{connectionId}/execute
Authentication: API key stored securely

WHEN TO USE:
- Customer relationship management
- Lead capture and management
- Contact information updates
- Sales process automation
- Customer data lookup

HOW TO USE:
1. Use create_contact for new leads
2. Use update_contact to modify existing records
3. Use get_contact to lookup customer information
4. Always use email as primary identifier

API KEY SETUP:
1. Go to HubSpot Settings → Integrations → API key
2. Create new API key
3. Copy key to tool configuration
4. Test connection

EXAMPLES:
- "Add this lead to CRM" → create_contact with lead details
- "Update customer status to 'Qualified'" → update_contact with new status
- "Look up customer John Doe" → get_contact with email address
      `,
      troubleshooting: [
        'If API key error: Verify key is active in HubSpot settings',
        'If contact not found: Check email address accuracy',
        'If rate limit exceeded: Implement delays between calls',
        'If property error: Verify custom properties exist in HubSpot'
      ]
    });
  }

  getNodeDefinition(toolType: string): ToolNodeDefinition | undefined {
    return this.nodeDefinitions.get(toolType);
  }

  getAllNodeDefinitions(): ToolNodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  getNodesByCategory(category: string): ToolNodeDefinition[] {
    return Array.from(this.nodeDefinitions.values())
      .filter(node => node.category === category);
  }

  generateAgentInstructions(toolType: string): string {
    const node = this.nodeDefinitions.get(toolType);
    if (!node) return '';

    return `
TOOL: ${node.toolName} (${node.category})
${node.agentInstructions}

AVAILABLE ACTIONS:
${node.actions.map(action => `
- ${action.name}: ${action.description}
  Parameters: ${JSON.stringify(action.parameters, null, 2)}
  Usage: ${action.usage}
  Examples: ${action.examples.join(', ')}
`).join('')}

TROUBLESHOOTING:
${node.troubleshooting.map(tip => `- ${tip}`).join('\n')}
    `;
  }
}

export const agentNodeSystem = new AgentNodeSystem();