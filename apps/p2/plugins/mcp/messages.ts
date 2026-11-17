// The MCP plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to the
// page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.mcp", {
	en: {
		sheet_title: "MCP servers",
		intro: "Servers of mcp.json run while sessions use them. Sign-in credentials are stored on the server.",
		empty: "No MCP server is running.",
		status_starting: "Starting",
		status_connected: "Connected",
		status_sign_in: "Sign-in needed",
		status_failed: "Failed",
		tool_count: (n: number) => `${n} tool${n === 1 ? "" : "s"}`,
		restart: "Restart",
		sign_in_failed: "The sign-in failed.",
		dismiss: "Dismiss",
		sign_in_again: "Sign in again",
		sign_in: "Sign in",
		sign_out: "Sign out",
		waiting_hint:
			"Waiting for the sign-in in the browser. If it ends on a page that does not load, copy that page's full address from the address bar and paste it here.",
		redirect_placeholder: "Final redirect URL",
		redirect_aria: "Final redirect URL",
		continue: "Continue",
		cancel: "Cancel",
	},
	zh: {
		sheet_title: "MCP 服务器",
		intro: "mcp.json 中的服务器在会话使用时运行。登录凭据保存在服务器上。",
		empty: "当前没有运行中的 MCP 服务器。",
		status_starting: "启动中",
		status_connected: "已连接",
		status_sign_in: "需要登录",
		status_failed: "失败",
		tool_count: (n: number) => `${n} 个工具`,
		restart: "重启",
		sign_in_failed: "登录失败。",
		dismiss: "忽略",
		sign_in_again: "重新登录",
		sign_in: "登录",
		sign_out: "退出登录",
		waiting_hint: "正在浏览器中等待登录。若结束后停留在无法加载的页面，请从地址栏复制该页面的完整地址并粘贴到此处。",
		redirect_placeholder: "最终跳转地址",
		redirect_aria: "最终跳转地址",
		continue: "继续",
		cancel: "取消",
	},
});
