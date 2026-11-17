// The chat-mode plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to
// the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.chat-mode", {
	en: {
		hint: (name: string, token: string) =>
			`Chat mode: messages go to the people in this session, not to ${name}. Mention ${token} (or say "${name}") to ask ${name}; it then reads the chat since its last answer.`,
		sheet_title: "Agent name",
		name_label: "Name in this conversation",
		name_hint: (token: string) =>
			`People mention it as ${token}, and in voice mode its name anywhere in what they say counts. One word: letters, digits, - and _.`,
		save: "Save",
		reset_to: (name: string) => `Reset to ${name}`,
		chip_chat: "Chat",
		chip_count: (n: number) => `Chat · ${n}`,
		rename_title: (token: string) => `Mentioned as ${token}: rename`,
		rename_aria: (name: string) => `Agent name ${name}. Rename`,
	},
	zh: {
		hint: (name: string, token: string) =>
			`聊天模式：消息发给本会话中的人，而不是 ${name}。提及 ${token}（或直接说“${name}”）来呼叫 ${name}；它随后会读取上次回答以来的聊天内容。`,
		sheet_title: "代理名称",
		name_label: "本会话中的名称",
		name_hint: (token: string) =>
			`大家以 ${token} 提及它；语音模式下，话语中任意位置出现该名称都会计入。一个词：字母、数字、- 和 _。`,
		save: "保存",
		reset_to: (name: string) => `重置为 ${name}`,
		chip_chat: "聊天",
		chip_count: (n: number) => `聊天 · ${n}`,
		rename_title: (token: string) => `以 ${token} 提及：重命名`,
		rename_aria: (name: string) => `代理名称 ${name}。重命名`,
	},
});
