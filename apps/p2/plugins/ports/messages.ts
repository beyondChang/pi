// The ports plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to the
// page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.ports", {
	en: {
		button_title: "Ports",
		button_subtitle: "Open dev servers through Radius",
		sheet_title: "Ports",
		intro: "Open web servers running on this device, such as a dev server, from your other devices. Each port gets its own address through Radius, which signs you in to it. A public port has a second address that anyone can open without signing in.",
		pending_note:
			"Links appear once this server has been opened through Radius (npm run radius:login, then Pi in Radius).",
		port_label: (port: number) => `Port ${port}`,
		by_session: (title: string) => ` · by ${title}`,
		by_another: "another session",
		remove: "Remove",
		cancel: "Cancel",
		open: "Open",
		public_note: (port: number) => `Anyone with the link can open localhost:${port} without signing in.`,
		make_public: "Make public",
		public_switch: "Public: no sign-in",
		empty: "No ports forwarded.",
		port_aria: "Port",
		port_placeholder: "5173",
		name_aria: "Name",
		name_placeholder: "Name (optional)",
		add: "Add",
	},
	zh: {
		button_title: "端口",
		button_subtitle: "通过 Radius 打开开发服务器",
		sheet_title: "端口",
		intro: "从其他设备打开本机运行的 Web 服务器（例如开发服务器）。每个端口都会通过 Radius 获得独立地址，并自动为你登录。公开端口还有一个无需登录即可访问的地址。",
		pending_note: "服务器通过 Radius 打开后，链接才会出现（先 npm run radius:login，再在 Radius 中打开 Pi）。",
		port_label: (port: number) => `端口 ${port}`,
		by_session: (title: string) => ` · 来自 ${title}`,
		by_another: "其他会话",
		remove: "移除",
		cancel: "取消",
		open: "打开",
		public_note: (port: number) => `任何拿到链接的人都可以无需登录打开 localhost:${port}。`,
		make_public: "设为公开",
		public_switch: "公开：无需登录",
		empty: "暂无转发端口。",
		port_aria: "端口",
		port_placeholder: "5173",
		name_aria: "名称",
		name_placeholder: "名称（可选）",
		add: "添加",
	},
});
