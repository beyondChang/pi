import { APP_NAME } from "../config.ts";
import { t } from "../i18n/messages-ui.ts";
import type { SourceInfo } from "./source-info.ts";

export type SlashCommandSource = "extension" | "prompt" | "skill";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	sourceInfo: SourceInfo;
}

export interface BuiltinSlashCommand {
	name: string;
	/** Resolved on call, so the description follows the locale chosen at startup instead of the import order. */
	description: () => string;
	argumentHint?: string;
}

export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{ name: "settings", description: () => t("slash_settings") },
	{ name: "model", description: () => t("slash_model"), argumentHint: "<provider/model>" },
	{ name: "tree", description: () => t("slash_tree") },
	{ name: "thinking", description: () => t("slash_thinking"), argumentHint: "<level>" },
	{ name: "scoped-models", description: () => t("slash_scoped_models") },
	{ name: "export", description: () => t("slash_export") },
	{ name: "import", description: () => t("slash_import") },
	{ name: "share", description: () => t("slash_share") },
	{ name: "bug", description: () => t("slash_bug"), argumentHint: "<description>" },
	{ name: "copy", description: () => t("slash_copy") },
	{ name: "name", description: () => t("slash_name") },
	{ name: "session", description: () => t("slash_session") },
	{ name: "changelog", description: () => t("slash_changelog") },
	{ name: "hotkeys", description: () => t("slash_hotkeys") },
	{ name: "fork", description: () => t("slash_fork") },
	{ name: "clone", description: () => t("slash_clone") },
	{ name: "trust", description: () => t("slash_trust") },
	{ name: "login", description: () => t("slash_login"), argumentHint: "<provider>" },
	{ name: "logout", description: () => t("slash_logout") },
	{ name: "new", description: () => t("slash_new") },
	{ name: "compact", description: () => t("slash_compact") },
	{ name: "resume", description: () => t("slash_resume") },
	{ name: "reload", description: () => t("slash_reload") },
	{ name: "quit", description: () => t("slash_quit", { app: APP_NAME }) },
];
