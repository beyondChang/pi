// The conversations plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs
// to the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.conversations", {
	en: {
		source_unavailable: "The source conversation is unavailable",
	},
	zh: {
		source_unavailable: "源会话不可用",
	},
});
