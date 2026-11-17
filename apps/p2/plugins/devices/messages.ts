// The devices plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to the
// page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.devices", {
	en: {
		sheet_title: "Devices",
		warning: "This token grants full owner access. Give it only to your own device, not to collaborators.",
		how_to:
			"Open Pi's domain on the other device, paste this token into the sign-in page, and tap Sign in. It expires after ten minutes and works once.",
		cannot_mint:
			"Generate owner links on the host with npm run owner-link. Associated devices cannot mint more tokens.",
		token_label: "One-time sign-in token",
		copy_token: "Copy token",
		new_token: "Generate a new token",
		generating: "Generating token…",
		sign_out_device: "Sign out on this device",
		sign_out_all_note:
			"This signs out every device and every browser on the host, including this one, and invalidates outstanding owner links. TUIs on the host sign in again by themselves. Already-running agent work is not stopped.",
		confirm_sign_out_all: "Confirm sign out all devices",
		cancel: "Cancel",
		sign_out_all: "Sign out all devices",
		sign_out_failed: "Could not sign out. Try again.",
		token_failed: "Could not generate a sign-in token.",
	},
	zh: {
		sheet_title: "设备",
		warning: "此令牌授予完整所有者权限。只可给你自己的设备，不要给协作者。",
		how_to: "在另一台设备上打开 Pi 的域名，把此令牌粘贴到登录页面，然后点击登录。令牌十分钟后过期，仅可使用一次。",
		cannot_mint: "在主机上用 npm run owner-link 生成所有者链接。已关联的设备无法再生成令牌。",
		token_label: "一次性登录令牌",
		copy_token: "复制令牌",
		new_token: "生成新令牌",
		generating: "正在生成令牌…",
		sign_out_device: "在此设备上退出登录",
		sign_out_all_note:
			"这会退出主机上所有设备和所有浏览器（包括本机），并使尚未使用的所有者链接失效。主机上的 TUI 会自行重新登录；正在运行的代理工作不会停止。",
		confirm_sign_out_all: "确认退出所有设备",
		cancel: "取消",
		sign_out_all: "退出所有设备",
		sign_out_failed: "无法退出登录，请重试。",
		token_failed: "无法生成登录令牌。",
	},
});
