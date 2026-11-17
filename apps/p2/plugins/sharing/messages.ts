// The sharing plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to
// the page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.sharing", {
	en: {
		sheet_title: "Share",
		intro_remote: (env: string) =>
			`Anyone with a link can join this session and its subagents under a name they choose. Read/write lets them make the agent run commands and change files on the remote environment "${env}".`,
		intro_host:
			"Anyone with a link can join this session and its subagents under a name they choose. Read/write lets them make the agent run commands and change files on this host.",
		mode_view: "Read-only",
		mode_full: "Read/write",
		remove: "Remove",
		cancel: "Cancel",
		remote_create: (env: string) => `Guests can run commands on "${env}". Create the link?`,
		create: "Create",
		reset_confirm: "New link, disconnect its guests?",
		reset: "Reset",
		copied: "Copied",
		copy_link: "Copy link",
		people_label: "People",
		people_hint: "Share with someone's email; they open this session in Radius, signed in with that address.",
		email_aria: "Email",
		email_placeholder: "Email",
		access_aria: "Access",
		share: "Share",
		share_full_confirm: (address: string, env: string) =>
			`${address} can run commands on "${env}". Share read/write?`,
		address_hint: "Send them this session's address in Radius.",
		copy_address: "Copy address",
		connected_label: "Connected",
		empty_guests: "No guests connected.",
		mode_read_write: "read/write",
		mode_read_only: "read-only",
	},
	zh: {
		sheet_title: "分享",
		intro_remote: (env: string) =>
			`持有链接的人可以用自己选的名字加入本会话及其子代理。读写权限允许他们让代理运行命令并修改远程环境“${env}”上的文件。`,
		intro_host:
			"持有链接的人可以用自己选的名字加入本会话及其子代理。读写权限允许他们让代理运行命令并修改本机上的文件。",
		mode_view: "只读",
		mode_full: "读写",
		remove: "移除",
		cancel: "取消",
		remote_create: (env: string) => `访客可以在“${env}”上运行命令。创建该链接？`,
		create: "创建",
		reset_confirm: "生成新链接会断开原有访客？",
		reset: "重置",
		copied: "已复制",
		copy_link: "复制链接",
		people_label: "人员",
		people_hint: "通过邮箱分享；对方用该邮箱登录 Radius 后即可打开本会话。",
		email_aria: "邮箱",
		email_placeholder: "邮箱",
		access_aria: "访问权限",
		share: "分享",
		share_full_confirm: (address: string, env: string) => `${address} 可以在“${env}”上运行命令。确认以读写方式分享？`,
		address_hint: "把本会话在 Radius 中的地址发给对方。",
		copy_address: "复制地址",
		connected_label: "已连接",
		empty_guests: "暂无已连接的访客。",
		mode_read_write: "读写",
		mode_read_only: "只读",
	},
});
