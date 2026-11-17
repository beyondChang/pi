// The history plugin's messages, English (the source of truth) and Chinese.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.history", {
	en: {
		more_matches: "More matches",
		cut_budget: "Cut at the output budget",
	},
	zh: {
		more_matches: "更多匹配结果",
		cut_budget: "输出达到上限，已截断",
	},
});
