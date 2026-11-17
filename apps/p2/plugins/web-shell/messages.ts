// The web-shell plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to
// the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.web-shell", {
	en: {
		theme_group: "Theme",
		theme_system: "System",
		theme_light: "Light",
		theme_dark: "Dark",
		theme_button: (label: string) => `Theme: ${label}`,
		theme_button_switch: (label: string, next: string) => `Theme: ${label}. Switch to ${next}`,
	},
	zh: {
		theme_group: "主题",
		theme_system: "跟随系统",
		theme_light: "浅色",
		theme_dark: "深色",
		theme_button: (label: string) => `主题：${label}`,
		theme_button_switch: (label: string, next: string) => `主题：${label}。切换到 ${next}`,
	},
});
