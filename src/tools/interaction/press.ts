import type { BrowserManager } from '../../browser/manager.js';

export const pressTool = {
  name: 'browser_press',
  description: `
Press keyboard keys on the page.

SPECIAL KEYS:
- Modifier keys: Shift, Control, Alt, Meta (Cmd)
- Navigation: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End, PageUp, PageDown
- Editing: Backspace, Delete, Enter, Tab, Escape
- Function: F1-F12

MODIFIER COMBOS:
Press with modifiers: { key: "a", modifiers: ["Shift", "Control"] }

Common combos:
- Ctrl+C: { key: "c", modifiers: ["Control"] }
- Ctrl+V: { key: "v", modifiers: ["Control"] }
- Cmd+A (Mac): { key: "a", modifiers: ["Meta"] }

DIFFERENCES FROM browser_type:
- browser_type: Enters text into focused input
- browser_press: Presses keys (Enter, Tab, arrows, shortcuts)

USE CASES:
- Submit forms with Enter
- Navigate with arrows/Tab
- Trigger shortcuts (Ctrl+F, Cmd+C, etc.)
- Test keyboard interactions
  `.trim(),

  inputSchema: {
    type: 'object' as const,
    properties: {
      key: {
        type: 'string' as const,
        description: 'Key to press (character or special key name)',
      },
      modifiers: {
        type: 'array' as const,
        items: { type: 'string' as const, enum: ['Shift', 'Control', 'Alt', 'Meta'] as const },
        description: 'Modifier keys to hold while pressing (e.g., ["Shift", "Control"])',
      },
      delay: {
        type: 'number' as const,
        description: 'Delay in ms after pressing (default: 0)',
      },
    },
    required: ['key'],
  },

  async handler(params: any, browserManager: BrowserManager) {
    const page = browserManager.getPage();

    // Build modifier keys array
    const modifiers = params.modifiers || [];

    // Press the key with modifiers
    await page.keyboard.press(params.key, {
      delay: params.delay || 0,
    });

    // Note: Playwright handles modifier keys via keyboard.press()
    // For multiple keys with modifiers, we use the format like "Control+a"
    if (modifiers.length > 0) {
      const modifierPrefix = modifiers
        .map((m: string) => {
          // Normalize modifier names
          if (m === 'Meta') return process.platform === 'darwin' ? 'Meta' : 'Control';
          return m;
        })
        .join('+');

      await page.keyboard.press(`${modifierPrefix}+${params.key}`, {
        delay: params.delay || 0,
      });
    }

    const modifierStr = modifiers.length > 0 ? ` with ${modifiers.join('+')}` : '';

    return {
      content: [
        {
          type: 'text',
          text: `Pressed key: ${params.key}${modifierStr}`,
        },
      ],
    };
  },
};
