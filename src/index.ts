#!/usr/bin/env node
import { AgentBrowserMCPServer } from './server.js';

async function main() {
  const mcpServer = new AgentBrowserMCPServer();

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.error('\nShutting down MCP server...');
    await mcpServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\nShutting down MCP server...');
    await mcpServer.stop();
    process.exit(0);
  });

  // Start the server
  await mcpServer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
