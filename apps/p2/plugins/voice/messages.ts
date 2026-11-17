// The voice plugin's messages, English (the source of truth) and Chinese: the web facet contributes the catalogs to the
// page's Translations.

import { defineMessages } from "@p2/app/v1";

export const messages = defineMessages("p2.voice", {
	en: {
		sheet_title: "Voice",
		// Voice phases
		phase_off: "Voice mode",
		phase_connecting: "Connecting",
		phase_listening: "Listening",
		phase_hearing: "Hearing you",
		phase_thinking: "Working",
		phase_talking: "Someone is talking",
		phase_preparing: "Preparing speech",
		phase_speaking: "Playing",
		phase_error: "Voice error",
		// Chip state and actions
		waiting_reconnect: (n: number) => `Waiting to reconnect (${n} ${n === 1 ? "message" : "messages"})`,
		others_talking: (names: string) => `${names} talking`,
		muted_suffix: " (microphone muted)",
		error_prefix: (error: string) => `Voice error: ${error}. Turn voice mode on`,
		turn_on: "Turn voice mode on",
		stop_speaking: ". Stop speaking",
		turn_off: ". Turn voice mode off",
		mute: "Mute microphone",
		muted_unmute: "Microphone muted. Unmute",
		muted_title: "Microphone muted",
		// Sheet state
		off: "Voice mode off",
		last_error: (time: string, message: string) => ` · Last error ${time}: ${message}`,
		apply_new: " · Choices apply to new conversations",
		pause_label: "Pause before sending",
		pause_aria: "Pause before sending",
		speed_label: "Speed",
		speed_aria: "Speed",
		language_aria: "Language",
		voice_shared: (voice: string, language: string | null) =>
			`Voice: ${voice}${language ? ` · ${language}` : ""} (the owner's)`,
		pause_hint: "How long you can pause before what you said is sent.",
		other_languages: (engines: string) => ` (other languages: a ${engines} voice)`,
		voice_hint: "Tap a voice, or choose a language, to hear it.",
	},
	zh: {
		sheet_title: "语音",
		// 语音相位
		phase_off: "语音模式",
		phase_connecting: "正在连接",
		phase_listening: "正在聆听",
		phase_hearing: "听到你说话",
		phase_thinking: "正在工作",
		phase_talking: "有人在说话",
		phase_preparing: "正在准备语音",
		phase_speaking: "正在播放",
		phase_error: "语音错误",
		// 按钮状态与操作
		waiting_reconnect: (n: number) => `等待重连（${n} 条消息）`,
		others_talking: (names: string) => `${names} 正在说话`,
		muted_suffix: "（麦克风已静音）",
		error_prefix: (error: string) => `语音错误：${error}。开启语音模式`,
		turn_on: "开启语音模式",
		stop_speaking: "。停止朗读",
		turn_off: "。关闭语音模式",
		mute: "静音麦克风",
		muted_unmute: "麦克风已静音。取消静音",
		muted_title: "麦克风已静音",
		// 设置页状态
		off: "语音模式已关闭",
		last_error: (time: string, message: string) => ` · 上次错误 ${time}：${message}`,
		apply_new: " · 选择将应用于新会话",
		pause_label: "发送前停顿",
		pause_aria: "发送前停顿",
		speed_label: "语速",
		speed_aria: "语速",
		language_aria: "语言",
		voice_shared: (voice: string, language: string | null) =>
			`语音：${voice}${language ? ` · ${language}` : ""}（所有者的）`,
		pause_hint: "说出内容后，停顿多久再发送。",
		other_languages: (engines: string) => `（其他语言：${engines} 语音）`,
		voice_hint: "点选语音，或选择语言，即可试听。",
	},
});
