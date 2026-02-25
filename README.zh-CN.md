# Agent-Browser MCP 服务器

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

> [agent-browser](https://github.com/vercel-labs/agent-browser) 的模型上下文协议 (MCP) 服务器 - 为 AI 智能体提供完整的浏览器自动化能力。

本项目是一个独立的 MCP 服务器实现，封装了优秀的 [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI 工具，通过 [模型上下文协议](https://modelcontextprotocol.io/) 提供强大的浏览器自动化功能。

## 功能特性

- 🔧 **44 个工具** - 完整覆盖 agent-browser 的所有功能
- 🎯 **高效的 @ref 引用系统** - 通过缓存元素引用减少 token 消耗
- 🌐 **完整的 Playwright API** - 利用完整的浏览器自动化能力
- 🔄 **自动启动** - 按需自动启动浏览器
- 💾 **状态持久化** - 跨会话保存和恢复浏览器状态
- 🎬 **视频录制** - 录制浏览器会话用于调试
- 🌐 **网络拦截** - 监控和修改网络请求
- 📊 **会话管理** - 管理多个标签页和窗口

## 安装

### 使用 npm

```bash
npm install mcp-server-agent-browser
```

### 从源码安装

```bash
git clone https://github.com/your-org/agent-browser-mcp.git
cd agent-browser-mcp
npm install
npm run build
```

## 快速开始

### 用于 Claude Desktop

1. 安装包
2. 在 Claude Desktop 设置中配置 (`~/.claude/settings.json`)：

```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "npx",
      "args": ["mcp-server-agent-browser"],
      "env": {
        "HEADED": "false"
      }
    }
  }
}
```

### 独立运行

```bash
mcp-server-agent-browser
```

## 可用工具

### 核心工具
- `browser_navigate` - 导航到 URL
- `browser_snapshot` - 使用 @ref 系统捕获页面结构
- `browser_screenshot` - 截取屏幕截图
- `browser_close` - 关闭浏览器/页面

### 导航与历史
- `browser_back` - 后退
- `browser_forward` - 前进
- `browser_reload` - 重新加载当前页面

### 元素交互
- `browser_click` - 点击元素
- `browser_fill` - 填写输入框
- `browser_type` - 输入文本（不清除现有内容）
- `browser_select` - 选择下拉选项
- `browser_check` / `browser_uncheck` - 勾选/取消勾选复选框
- `browser_drag` - 拖放操作
- `browser_upload` - 上传文件
- `browser_dblclick` - 双击
- `browser_focus` - 聚焦元素
- `browser_hover` - 鼠标悬停
- `browser_scroll` - 滚动页面
- `browser_press` - 按下键盘按键

### 元素发现
- `browser_find` - 语义化元素搜索（role、text、label、placeholder 等）
- `browser_get` - 获取元素信息
- `browser_is` - 检查元素状态

### 标签页与窗口
- `browser_tab` - 管理标签页
- `browser_window` - 管理窗口
- `browser_frame` - 切换到 iframe

### 高级功能
- `browser_record` - 录制浏览器会话
- `browser_network` - 监控网络请求
- `browser_console` - 访问控制台
- `browser_errors` - 跟踪 JavaScript 错误
- `browser_trace` - 性能追踪
- `browser_profiler` - Chrome DevTools 性能分析
- `browser_evaluate` - 执行 JavaScript
- `browser_pdf` - 导出为 PDF
- `browser_dialog` - 处理 JavaScript 对话框
- `browser_download` - 管理下载

### 状态与存储
- `browser_state` - 保存/加载浏览器状态
- `browser_cookies` - 管理 cookies
- `browser_storage` - 访问 localStorage/sessionStorage

### 实用工具
- `browser_wait` - 等待条件满足
- `browser_set` - 设置元素属性
- `browser_mouse` - 鼠标控制
- `browser_diff` - 比较页面
- `browser_highlight` - 调试高亮

## 配置

环境变量：

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `HEADED` | 以有头模式运行（可见浏览器） | `false` |
| `BROWSER` | 使用的浏览器 (chromium/firefox/webkit) | `chromium` |

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式运行（自动重新构建）
npm run dev

# 运行测试
npm test

# 监视模式
npm run test:watch

# 启动服务器
npm start
```

## 文档

- **[CLAUDE.md](./CLAUDE.md)** - Claude Code 开发指南
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - 测试说明
- **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - 快速参考

## 相关项目

- **[agent-browser](https://github.com/vercel-labs/agent-browser)** - 本项目封装的原 CLI 工具
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - 本服务器实现的协议

## 许可证

Apache-2.0

---

**注意**: 本项目是独立实现，与 Vercel 或原始 agent-browser 项目没有官方关联。
