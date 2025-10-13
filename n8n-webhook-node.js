/**
 * n8n Custom Node for Dhivehinoos.net Comment Webhooks
 * 
 * This node receives webhook data from your Dhivehinoos.net site when comments are approved.
 * It processes the webhook payload and provides structured data for your n8n workflows.
 * 
 * Installation:
 * 1. Copy this file to your n8n custom nodes directory
 * 2. Restart n8n
 * 3. Use "Dhivehinoos Comment Webhook" node in your workflows
 */

const {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} = require('n8n-workflow');

class DhivehinoosCommentWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Dhivehinoos Comment Webhook',
    name: 'dhivehinoosCommentWebhook',
    icon: 'file:dhivehinoos.svg',
    group: ['input'],
    version: 1,
    description: 'Receives and processes comment webhooks from Dhivehinoos.net',
    defaults: {
      name: 'Dhivehinoos Comment Webhook',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'responseNode',
        path: 'dhivehinoos-comment',
      },
    ],
    properties: [
      {
        displayName: 'Webhook Secret',
        name: 'webhookSecret',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        description: 'Optional secret key for webhook authentication (must match site settings)',
      },
      {
        displayName: 'Process Comment Data',
        name: 'processCommentData',
        type: 'boolean',
        default: true,
        description: 'Whether to process and structure the comment data',
      },
      {
        displayName: 'Extract Article Info',
        name: 'extractArticleInfo',
        type: 'boolean',
        default: true,
        description: 'Whether to extract article information from the webhook',
      },
      {
        displayName: 'Extract Category Info',
        name: 'extractCategoryInfo',
        type: 'boolean',
        default: true,
        description: 'Whether to extract category information from the webhook',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const webhookData = this.getInputData();
    const webhookSecret = this.getNodeParameter('webhookSecret', 0) as string;
    const processCommentData = this.getNodeParameter('processCommentData', 0) as boolean;
    const extractArticleInfo = this.getNodeParameter('extractArticleInfo', 0) as boolean;
    const extractCategoryInfo = this.getNodeParameter('extractCategoryInfo', 0) as boolean;

    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < webhookData.length; i++) {
      const item = webhookData[i];
      const webhookBody = item.json;

      try {
        // Validate webhook secret if provided
        if (webhookSecret) {
          const receivedSecret = item.headers?.['x-webhook-secret'] || item.headers?.['X-Webhook-Secret'];
          if (receivedSecret !== webhookSecret) {
            throw new NodeOperationError(this.getNode(), 'Invalid webhook secret');
          }
        }

        // Validate webhook payload structure
        if (!webhookBody.event_type || !webhookBody.comment) {
          throw new NodeOperationError(this.getNode(), 'Invalid webhook payload structure');
        }

        // Process the webhook data
        const processedData: any = {
          // Basic webhook info
          event_type: webhookBody.event_type,
          timestamp: webhookBody.timestamp,
          site: webhookBody.site,
        };

        if (processCommentData) {
          // Extract comment information
          const comment = webhookBody.comment;
          processedData.comment = {
            id: comment.id,
            content: comment.content,
            author_name: comment.author_name,
            ip_address: comment.ip_address,
            is_approved: comment.is_approved,
            created_at: comment.created_at,
          };

          // Extract article information if requested
          if (extractArticleInfo && comment.article) {
            processedData.article = {
              id: comment.article.id,
              title: comment.article.title,
              slug: comment.article.slug,
              url: comment.article.url,
              status: comment.article.status,
              created_at: comment.article.created_at,
            };
          }

          // Extract category information if requested
          if (extractCategoryInfo && comment.category) {
            processedData.category = {
              id: comment.category.id,
              name: comment.category.name,
              slug: comment.category.slug,
            };
          }
        } else {
          // Return raw webhook data
          processedData.raw_webhook = webhookBody;
        }

        // Add metadata
        processedData.metadata = {
          processed_at: new Date().toISOString(),
          webhook_source: 'dhivehinoos.net',
          node_version: '1.0.0',
        };

        returnData.push({
          json: processedData,
          binary: item.binary,
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              webhook_data: webhookBody,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}

module.exports = {
  DhivehinoosCommentWebhook,
};
