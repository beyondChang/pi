// The logs plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to the
// page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.logs", {
	en: {
		sheet_title: "Logs",
		source_label: "Source",
		source_server: "Server",
		source_dev: "Dev supervisor",
		source_terminals: "Terminal host",
		source_worker: (id: string) => `Worker ${id}`,
		filter_aria: "Filter logs",
		filter_placeholder: "Filter logs",
		follow_tail: "Follow tail",
		copy: "Copy",
		copied: "Copied",
		copy_failed: "Could not copy logs",
		output_title: "Log lines",
		no_lines: "No log lines",
		unavailable: "Logs unavailable",
		loading: "Loading logs…",
	},
	zh: {
		sheet_title: "日志",
		source_label: "来源",
		source_server: "服务器",
		source_dev: "开发监督器",
		source_terminals: "终端主机",
		source_worker: (id: string) => `工作进程 ${id}`,
		filter_aria: "筛选日志",
		filter_placeholder: "筛选日志",
		follow_tail: "跟随末尾",
		copy: "复制",
		copied: "已复制",
		copy_failed: "无法复制日志",
		output_title: "日志行",
		no_lines: "暂无日志行",
		unavailable: "日志不可用",
		loading: "正在加载日志…",
	},
});
