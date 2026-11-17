import { join } from "node:path";
import { getDocsPath } from "../config.ts";
import { t } from "../i18n/messages-ui.ts";

const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	return [
		t("auth_login_help"),
		`  ${join(getDocsPath(), "providers.md")}`,
		`  ${join(getDocsPath(), "models.md")}`,
	].join("\n");
}

export function formatNoModelsAvailableMessage(): string {
	return `${t("no_models_available")} ${getProviderLoginHelp()}`;
}

export function formatNoModelSelectedMessage(): string {
	return `${t("no_model_selected")}\n\n${getProviderLoginHelp()}\n\n${t("then_select_model")}`;
}

export function formatNoApiKeyFoundMessage(provider: string): string {
	const providerDisplay = provider === UNKNOWN_PROVIDER ? t("no_api_key_provider_display") : provider;
	return `${t("no_api_key_for", { provider: providerDisplay })}\n\n${getProviderLoginHelp()}`;
}
