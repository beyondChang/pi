// The scope-prompt plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs
// to the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.scope-prompt", {
	en: {
		tap_hint: "Tap to see the scope, tap it again to ask",
		click_hint: "Click what to ask about",
		esc_to_stop: "Esc to stop",
		stop: "Stop",
		steps_aria: "Scope",
		close: "Close",
		placeholder: (label: string) => `Ask about ${label}…`,
		placeholder_fallback: "this",
		destination_aria: "Send to",
		destination_to: "To",
		chat: "Chat",
		sending: "Sending…",
		send: "Send",
		sent_to: (target: string) => `Sent to ${target}`,
		open: "Open",
		button_aria: "Prompt anywhere",
		button_title_stop: "Stop prompting anywhere",
		button_title_start: "Prompt anywhere (Cmd+.)",
	},
	zh: {
		tap_hint: "点按查看作用域，再点一次即可提问",
		click_hint: "点击要询问的对象",
		esc_to_stop: "Esc 退出",
		stop: "停止",
		steps_aria: "作用域",
		close: "关闭",
		placeholder: (label: string) => `询问关于 ${label}…`,
		placeholder_fallback: "此处",
		destination_aria: "发送到",
		destination_to: "发送到",
		chat: "会话",
		sending: "正在发送…",
		send: "发送",
		sent_to: (target: string) => `已发送到 ${target}`,
		open: "打开",
		button_aria: "随处提问",
		button_title_stop: "停止随处提问",
		button_title_start: "随处提问（Cmd+.）",
	},
});
