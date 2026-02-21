import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser/manager.js';
import { registerAllTools } from './tools/index.js';

export class AgentBrowserMCPServer {
  private server: Server;
  private browserManager: BrowserManager;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-server-agent-browser',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browserManager = new BrowserManager();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Navigation tools
          {
            name: 'browser_navigate',
            description: 'Navigate to a URL in the browser',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to navigate to',
                },
              },
              required: ['url'],
            },
          },
          // Tools registered by registerAllTools
          ...((this.server as any).__toolDefinitions || []),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const handlers = (this.server as any).__toolHandlers || {};
        const handler = handlers[name];

        if (handler) {
          return await handler(args);
        }

        // Default response for unhandled tools
        return {
          content: [
            {
              type: 'text',
              text: `Tool ${name} executed with args: ${JSON.stringify(args)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Register all tools
    await registerAllTools(this.server, this.browserManager);

    console.error('MCP Server for Agent-Browser started');
  }

  async stop(): Promise<void> {
    await this.browserManager.close();
    await this.server.close();
  }
}
