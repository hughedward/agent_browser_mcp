import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Handle JavaScript dialogs (alert, confirm, prompt)
 */
export async function dialogTool(
  browserManager: BrowserManager,
  args: {
    action: 'accept' | 'dismiss';
    promptText?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    if (args.action === 'accept') {
      // Set up dialog handler to accept with optional prompt text
      browserManager.setDialogHandler('accept', args.promptText);

      return {
        content: [
          {
            type: 'text',
            text: args.promptText
              ? `Dialog handler set: Will accept next dialog with prompt text "${args.promptText}"`
              : 'Dialog handler set: Will accept next dialog',
          },
        ],
      };
    } else if (args.action === 'dismiss') {
      // Set up dialog handler to dismiss
      browserManager.setDialogHandler('dismiss');

      return {
        content: [
          {
            type: 'text',
            text: 'Dialog handler set: Will dismiss next dialog',
          },
        ],
      };
    } else {
      throw new Error(`Invalid dialog action: ${args.action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to set dialog handler: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Dialog tool definition
 */
export const dialogToolDefinition: Tool = {
  name: 'browser_dialog',
  description: `
Handle JavaScript dialogs (alert, confirm, prompt) that appear during page interactions.

ACTIONS:
1. accept: Accept/click OK on the dialog
   - For prompt dialogs, optionally provide text to enter

2. dismiss: Dismiss/cancel the dialog

USAGE:
1. Accept alert or confirm:
   { action: "accept" }

2. Accept prompt with text:
   { action: "accept", promptText: "Hello World" }

3. Dismiss any dialog:
   { action: "dismiss" }

WORKFLOW:
1. Set up dialog handler BEFORE the action that triggers it
2. Perform the action that triggers the dialog (click, navigate, etc.)
3. The handler will automatically accept/dismiss when dialog appears

DIALOG TYPES:
- alert(): Shows message, user clicks OK
- confirm(): Shows message with OK/Cancel buttons
- prompt(): Shows message with text input field

EXAMPLE:
1. Set dialog handler: { action: "accept", promptText: "John Doe" }
2. Click button that triggers prompt dialog
3. Dialog is automatically accepted with "John Doe" as input

NOTE: The handler is one-time use for the next dialog that appears.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['accept', 'dismiss'],
        description: 'Action to perform on the dialog',
      },
      promptText: {
        type: 'string',
        description: 'Text to enter in a prompt dialog (only used with accept action)',
      },
    },
    required: ['action'],
  },
};
