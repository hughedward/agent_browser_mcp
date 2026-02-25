# Agent-Browser MCP

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

> Model Context Protocol (MCP) server for [agent-browser](https://github.com/vercel-labs/agent-browser) - providing complete browser automation capabilities for AI agents.

This project is an independent MCP server implementation that wraps the excellent [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI tool, making its powerful browser automation features available through the [Model Context Protocol](https://modelcontextprotocol.io/).

## Features

- 🔧 **44 Tools** - Complete coverage of agent-browser's functionality
- 🎯 **Token-Efficient @ref System** - Reduces token usage by caching element references
- 🌐 **Full Playwright API** - Leverage the complete browser automation capabilities
- 🔄 **Auto-Launch** - Browser starts automatically when needed
- 💾 **State Persistence** - Save and restore browser state across sessions
- 🎬 **Video Recording** - Record browser sessions for debugging
- 🌐 **Network Interception** - Monitor and modify network requests
- 📊 **Session Management** - Manage multiple tabs and windows

## Installation

### Using npm

```bash
npm install agent-browser-mcp-server
```

### From Source

```bash
git clone https://github.com/hughedward/agent_browser_mcp.git
cd agent_browser_mcp
npm install
npm run build
```

## Quick Start

### For Claude Desktop

1. Install the package
2. Configure in Claude Desktop settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "npx",
      "args": ["agent-browser-mcp-server"],
      "env": {
        "HEADED": "false"
      }
    }
  }
}
```

### Standalone

```bash
agent-browser-mcp-server
```

## Available Tools

### Core Tools
- `browser_navigate` - Navigate to a URL
- `browser_snapshot` - Capture page structure with @ref system
- `browser_screenshot` - Take screenshots
- `browser_close` - Close browser/page

### Navigation & History
- `browser_back` - Go back in history
- `browser_forward` - Go forward in history
- `browser_reload` - Reload the current page

### Element Interaction
- `browser_click` - Click an element
- `browser_fill` - Fill input fields
- `browser_type` - Type without clearing
- `browser_select` - Select dropdown options
- `browser_check` / `browser_uncheck` - Check/uncheck checkboxes
- `browser_drag` - Drag and drop
- `browser_upload` - Upload files
- `browser_dblclick` - Double click
- `browser_focus` - Focus elements
- `browser_hover` - Hover over elements
- `browser_scroll` - Scroll page
- `browser_press` - Press keyboard keys

### Element Discovery
- `browser_find` - Semantic element search (role, text, label, placeholder, etc.)
- `browser_get` - Get element information
- `browser_is` - Check element state

### Tabs & Windows
- `browser_tab` - Manage tabs
- `browser_window` - Manage windows
- `browser_frame` - Switch to iframes

### Advanced Features
- `browser_record` - Record browser sessions
- `browser_network` - Monitor network requests
- `browser_console` - Access console
- `browser_errors` - Track JavaScript errors
- `browser_trace` - Performance tracing
- `browser_profiler` - Chrome DevTools profiling
- `browser_evaluate` - Execute JavaScript
- `browser_pdf` - Export to PDF
- `browser_dialog` - Handle JavaScript dialogs
- `browser_download` - Manage downloads

### State & Storage
- `browser_state` - Save/load browser state
- `browser_cookies` - Manage cookies
- `browser_storage` - Access localStorage/sessionStorage

### Utilities
- `browser_wait` - Wait for conditions
- `browser_set` - Set element attributes
- `browser_mouse` - Mouse control
- `browser_diff` - Compare pages
- `browser_highlight` - Debug highlighting

## Configuration

Environment Variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `HEADED` | Run in headed mode (visible browser) | `false` |
| `BROWSER` | Browser to use (chromium/firefox/webkit) | `chromium` |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode (auto-rebuild)
npm run dev

# Run tests
npm test

# Watch mode
npm run test:watch

# Start server
npm start
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for Claude Code
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing instructions
- **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - Quick reference

## Related Projects

- **[agent-browser](https://github.com/vercel-labs/agent-browser)** - Original CLI tool this project wraps
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - The protocol this server implements

## License

Apache-2.0

---

**Note**: This project is an independent implementation and is not officially affiliated with Vercel or the original agent-browser project.
