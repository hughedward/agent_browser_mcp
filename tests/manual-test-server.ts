#!/usr/bin/env node
/**
 * Manual Test Script for MCP Server
 *
 * This script allows you to manually test MCP server tools via console commands.
 * It's useful for debugging and development.
 *
 * Usage:
 *   node tests/manual-test-server.ts
 *
 * Available commands (type in console):
 *   launch [headless|false]          - Launch browser (default: headless)
 *   nav <url>                        - Navigate to URL
 *   snapshot [interactive|compact]   - Take snapshot with optional filters
 *   click <ref>                      - Click element by ref
 *   fill <ref> <value>               - Fill element by ref
 *   type <ref> <text>                - Type text into element
 *   screenshot                       - Take screenshot
 *   wait <ms>                        - Wait for milliseconds
 *   refs                             - List all cached refs
 *   url                              - Show current URL
 *   help                             - Show available commands
 *   quit                             - Exit
 *
 * Example session:
 *   > launch false
 *   > nav https://example.com
 *   > snapshot
 *   > click @e1
 *   > screenshot
 *   > quit
 */

import { createInterface } from 'readline';
import { BrowserManager } from '../src/browser/manager.js';
import { navigateTool } from '../src/tools/navigation/navigate.js';
import { handleSnapshot } from '../src/tools/discovery/snapshot.js';
import { clickTool } from '../src/tools/interaction/click.js';
import { fillTool } from '../src/tools/interaction/fill.js';
import { typeTool } from '../src/tools/interaction/type.js';
import { screenshotTool } from '../src/tools/discovery/screenshot.js';
import { waitTool } from '../src/tools/wait/wait.js';
import { closeTool } from '../src/tools/navigation/close.js';

class ManualTestServer {
  private browserManager: BrowserManager;
  private rl: ReturnType<typeof createInterface>;

  constructor() {
    this.browserManager = new BrowserManager();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start() {
    console.log('\n=================================');
    console.log('  MCP Server Manual Test Console');
    console.log('=================================\n');
    console.log('Type "help" for available commands\n');

    this.prompt();
  }

  private prompt() {
    this.rl.question('> ', async (input) => {
      await this.handleCommand(input.trim());
      this.prompt();
    });
  }

  private async handleCommand(input: string) {
    if (!input) return;

    const [cmd, ...args] = input.split(/\s+/);
    const fullArgs = args.join(' '); // Preserve spaces in values

    try {
      switch (cmd.toLowerCase()) {
        case 'launch': {
          const headless = args[0] !== 'false';
          console.log(`Launching browser (headless: ${headless})...`);
          await this.browserManager.launch({
            headless,
            browser: 'chromium',
          });
          console.log('✓ Browser launched successfully');
          break;
        }

        case 'nav': {
          if (!args[0]) {
            console.log('Error: URL required');
            break;
          }
          console.log(`Navigating to: ${args[0]}`);
          const result = await navigateTool(this.browserManager, { url: args[0] });
          console.log(`✓ ${result.content[0].text}`);
          break;
        }

        case 'snapshot': {
          const options: any = {};
          if (args.includes('interactive')) {
            options.interactive = true;
          }
          if (args.includes('compact')) {
            options.compact = true;
          }
          if (args.includes('cursor')) {
            options.cursor = true;
          }

          console.log('Taking snapshot...');
          const result = await handleSnapshot(this.browserManager, options);

          console.log('\n--- Snapshot Results ---');
          console.log(`URL: ${result.url}`);
          console.log(`Title: ${result.title}`);
          console.log(`Ref Count: ${result.refCount}`);
          console.log('\n--- Accessibility Tree ---');
          console.log(result.tree);
          console.log('\n--- End of Snapshot ---\n');
          break;
        }

        case 'click': {
          if (!args[0]) {
            console.log('Error: ref required (e.g., click e1 or click @e1)');
            break;
          }
          console.log(`Clicking: ${args[0]}`);
          const result = await clickTool.handler(
            { ref: args[0], button: 'left', clickCount: 1 },
            this.browserManager
          );
          console.log(`✓ ${result.content[0].text}`);
          break;
        }

        case 'fill': {
          if (args.length < 2) {
            console.log('Error: ref and value required (e.g., fill e1 "hello")');
            break;
          }
          const ref = args[0];
          const value = fullArgs.substring(ref.length + 1);
          console.log(`Filling ${ref} with: "${value}"`);
          const result = await fillTool(this.browserManager, { ref, value });
          console.log(`✓ ${result.content[0].text}`);
          break;
        }

        case 'type': {
          if (args.length < 2) {
            console.log('Error: ref and text required (e.g., type e1 "hello")');
            break;
          }
          const ref = args[0];
          const text = fullArgs.substring(ref.length + 1);
          console.log(`Typing into ${ref}: "${text}"`);
          const result = await typeTool(this.browserManager, { ref, text });
          console.log(`✓ ${result.content[0].text}`);
          break;
        }

        case 'screenshot': {
          console.log('Taking screenshot...');
          const result = await screenshotTool(this.browserManager, {});

          if (result.isError) {
            console.log(`✗ Error: ${result.content[0].text}`);
          } else {
            const imageContent = result.content[0];
            const textContent = result.content[1];

            console.log(`✓ ${textContent.text}`);
            console.log(`  Data URL: data:${imageContent.mimeType};base64,${imageContent.data.substring(0, 50)}...`);
            console.log(`  Size: ${imageContent.data.length} bytes (base64)`);
          }
          break;
        }

        case 'wait': {
          const ms = parseInt(args[0]) || 1000;
          console.log(`Waiting ${ms}ms...`);
          const startTime = Date.now();
          const result = await waitTool(this.browserManager, {
            mode: 'timeout',
            timeout: ms,
          });
          const elapsed = Date.now() - startTime;
          console.log(`✓ ${result.content[0].text} (actual: ${elapsed}ms)`);
          break;
        }

        case 'refs': {
          const refMap = this.browserManager.getRefMap();
          const refKeys = Object.keys(refMap);

          if (refKeys.length === 0) {
            console.log('No refs cached. Take a snapshot first.');
            break;
          }

          console.log(`\nCached Refs (${refKeys.length} total):\n`);
          refKeys.forEach((key) => {
            const refData = refMap[key];
            console.log(`  ${key}: ${JSON.stringify(refData)}`);
          });
          console.log('');
          break;
        }

        case 'url': {
          if (!this.browserManager.isLaunched()) {
            console.log('Browser not launched');
            break;
          }
          const page = this.browserManager.getPage();
          console.log(`Current URL: ${page.url()}`);
          break;
        }

        case 'close': {
          if (!this.browserManager.isLaunched()) {
            console.log('Browser not launched');
            break;
          }
          const result = await closeTool(this.browserManager);
          console.log(`✓ ${result.content[0].text}`);
          break;
        }

        case 'help': {
          this.showHelp();
          break;
        }

        case 'quit':
        case 'exit': {
          await this.shutdown();
          process.exit(0);
        }

        default: {
          console.log(`Unknown command: ${cmd}`);
          console.log('Type "help" for available commands');
        }
      }
    } catch (error) {
      console.log(`✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private showHelp() {
    console.log('\nAvailable Commands:\n');
    console.log('  launch [headless|false]          Launch browser (default: headless)');
    console.log('  nav <url>                        Navigate to URL');
    console.log('  snapshot [options]               Take snapshot');
    console.log('    Options: interactive, compact, cursor');
    console.log('  click <ref>                      Click element by ref (e.g., e1 or @e1)');
    console.log('  fill <ref> <value>               Fill element by ref');
    console.log('  type <ref> <text>                Type text into element');
    console.log('  screenshot                       Take screenshot');
    console.log('  wait <ms>                        Wait for milliseconds');
    console.log('  refs                             List all cached refs');
    console.log('  url                              Show current URL');
    console.log('  close                            Close current page');
    console.log('  help                             Show this help');
    console.log('  quit                             Exit\n');
    console.log('Examples:\n');
    console.log('  > launch false                   Launch visible browser');
    console.log('  > nav https://example.com        Navigate to example.com');
    console.log('  > snapshot                       Take snapshot');
    console.log('  > snapshot interactive           Snapshot with interactive elements only');
    console.log('  > refs                           Show available refs');
    console.log('  > click @e1                      Click element with ref e1');
    console.log('  > fill e3 "hello world"          Fill element with text');
    console.log('  > type e3 "test"                 Type into element');
    console.log('  > screenshot                     Take screenshot');
    console.log('  > wait 2000                      Wait 2 seconds');
    console.log('  > quit                           Exit\n');
  }

  private async shutdown() {
    console.log('\nShutting down...');
    if (this.browserManager.isLaunched()) {
      await this.browserManager.close();
      console.log('✓ Browser closed');
    }
    this.rl.close();
    console.log('Goodbye!\n');
  }
}

// Start the manual test server
const server = new ManualTestServer();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n\nReceived SIGINT, shutting down...');
  await server['shutdown']();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived SIGTERM, shutting down...');
  await server['shutdown']();
  process.exit(0);
});

server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
