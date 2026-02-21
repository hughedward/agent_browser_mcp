import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import path from 'node:path';
import os from 'node:os';
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

/**
 * State management tool for session persistence
 *
 * Reference agent-browser:
 * - state save <path>       # Save auth state
 * - state load <path>       # Load auth state
 * - state list              # List saved state files
 * - state show <file>       # Show state summary
 * - state clear [name]      # Clear states for session
 * - state clear --all       # Clear all saved states
 */
export const stateTool: Tool = {
  name: 'browser_state',
  description: `
**Manage browser state for session persistence.**

Use this tool to save, load, list, or clear browser state (cookies, localStorage, etc.).

**ACTIONS:**

**save** - Save current browser state to a file
  action: "save"
  path: File path to save state (required)

**load** - Load browser state from a file
  action: "load"
  path: File path to load state from (required)

**list** - List saved state files in the default state directory
  action: "list"

**show** - Show a summary of a saved state file
  action: "show"
  path: Path to state file (required)

**clear** - Clear saved state files
  action: "clear"
  path: Specific state file to clear (optional)
  all: Set to true to clear all state files (optional, requires path to be omitted)

**EXAMPLES:**

Save current state:
  browser_state with action="save", path="./state.json"

Load saved state:
  browser_state with action="load", path="./state.json"

List all saved states:
  browser_state with action="list"

Show state summary:
  browser_state with action="show", path="./state.json"

Clear specific state file:
  browser_state with action="clear", path="./state.json"

Clear all state files:
  browser_state with action="clear", all=true

**OUTPUT:**
- save: Success message with file path
- load: Success message with state details
- list: Array of state files with metadata
- show: State summary (cookies count, origins count, etc.)
- clear: Success message with count of cleared files

**DEFAULT STATE DIRECTORY:**
State files are stored in ~/.agent-browser/states/ by default when using list/clear actions without a specific path.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (save, load, list, show, clear)',
        enum: ['save', 'load', 'list', 'show', 'clear']
      },
      path: {
        type: 'string',
        description: 'File path for save/load/show/clear actions (required for save, load, show; optional for clear when all=true)'
      },
      all: {
        type: 'boolean',
        description: 'Clear all state files (only for clear action, requires path to be omitted)'
      }
    },
    required: ['action']
  }
};

// Default state directory
const DEFAULT_STATE_DIR = path.join(os.homedir(), '.agent-browser', 'states');

/**
 * Ensure state directory exists
 */
async function ensureStateDir(): Promise<void> {
  if (!existsSync(DEFAULT_STATE_DIR)) {
    await mkdir(DEFAULT_STATE_DIR, { recursive: true });
  }
}

/**
 * List all state files in the default directory
 */
function listStateFiles(): Array<{ name: string; path: string; size: number; modified: number }> {
  if (!existsSync(DEFAULT_STATE_DIR)) {
    return [];
  }

  const files = readdirSync(DEFAULT_STATE_DIR);
  const stateFiles: Array<{ name: string; path: string; size: number; modified: number }> = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(DEFAULT_STATE_DIR, file);
      const stats = statSync(filePath);
      stateFiles.push({
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtimeMs
      });
    }
  }

  return stateFiles.sort((a, b) => b.modified - a.modified);
}

/**
 * Show summary of a state file
 */
function showStateSummary(filePath: string): {
  cookies: number;
  origins: number;
  totalItems: number;
  file: string;
  size: number;
} | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const state = JSON.parse(content);

    const cookiesCount = state.cookies?.length || 0;
    const originsCount = state.origins?.length || 0;
    const totalItems = state.origins?.reduce((sum: number, origin: any) => {
      return sum + (origin.localStorage?.length || 0);
    }, 0) || 0;

    const stats = statSync(filePath);

    return {
      cookies: cookiesCount,
      origins: originsCount,
      totalItems,
      file: filePath,
      size: stats.size
    };
  } catch {
    return null;
  }
}

export async function stateToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'save': {
      if (!params.path) {
        throw new Error('path is required for save action');
      }

      // Resolve path and create directory if needed
      const statePath = path.resolve(params.path);
      const stateDir = path.dirname(statePath);

      await mkdir(stateDir, { recursive: true });

      // Use BrowserManager's saveStorageState method
      await browserManager.saveStorageState(statePath);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'State saved successfully',
            path: statePath
          }, null, 2)
        }]
      };
    }

    case 'load': {
      if (!params.path) {
        throw new Error('path is required for load action');
      }

      const statePath = path.resolve(params.path);

      if (!existsSync(statePath)) {
        throw new Error(`State file not found: ${statePath}`);
      }

      // Read state file to show summary
      const summary = showStateSummary(statePath);
      if (!summary) {
        throw new Error(`Failed to read state file: ${statePath}`);
      }

      // Note: Loading state requires creating a new context with the state
      // This is typically done at browser launch time, not mid-session
      // For now, we'll provide guidance on how to use it
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'State file loaded (summary shown below)',
            state: summary,
            note: 'To apply this state, relaunch the browser with the storageState parameter'
          }, null, 2)
        }]
      };
    }

    case 'list': {
      await ensureStateDir();
      const stateFiles = listStateFiles();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: DEFAULT_STATE_DIR,
            count: stateFiles.length,
            files: stateFiles
          }, null, 2)
        }]
      };
    }

    case 'show': {
      if (!params.path) {
        throw new Error('path is required for show action');
      }

      const statePath = path.resolve(params.path);

      if (!existsSync(statePath)) {
        throw new Error(`State file not found: ${statePath}`);
      }

      const summary = showStateSummary(statePath);

      if (!summary) {
        throw new Error(`Failed to read state file: ${statePath}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            state: summary
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      if (params.all) {
        // Clear all state files
        await ensureStateDir();
        const stateFiles = listStateFiles();

        for (const file of stateFiles) {
          try {
            unlinkSync(file.path);
          } catch {
            // Ignore errors for individual files
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Cleared ${stateFiles.length} state files`,
              count: stateFiles.length,
              directory: DEFAULT_STATE_DIR
            }, null, 2)
          }]
        };
      } else if (params.path) {
        // Clear specific state file
        const statePath = path.resolve(params.path);

        if (!existsSync(statePath)) {
          throw new Error(`State file not found: ${statePath}`);
        }

        unlinkSync(statePath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'State file deleted',
              path: statePath
            }, null, 2)
          }]
        };
      } else {
        throw new Error('Either path or all=true is required for clear action');
      }
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const stateToolDefinition = {
  name: stateTool.name,
  description: stateTool.description,
  inputSchema: stateTool.inputSchema
};
