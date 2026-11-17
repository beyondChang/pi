// The artifacts plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to
// the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.artifacts", {
	en: {
		all: "All artifacts",
		unknown_kind: (kind: string) => `Unknown view kind "${kind}"`,
		panel_title: "Artifacts",
		empty: "No artifacts in this session.",
		open: (title: string) => `Open ${title}`,
		remove: "Remove",
		remove_aria: (title: string) => `Remove ${title}`,
		button_aria: (count: number) => `Artifacts (${count})`,
	},
	zh: {
		all: "全部产物",
		unknown_kind: (kind: string) => `未知的视图类型“${kind}”`,
		panel_title: "产物",
		empty: "本会话暂无产物。",
		open: (title: string) => `打开 ${title}`,
		remove: "移除",
		remove_aria: (title: string) => `移除 ${title}`,
		button_aria: (count: number) => `产物（${count}）`,
	},
});
