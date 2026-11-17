// The owner's Settings window, opened from the gear beside the sidebar's theme switch: a list of sections beside a
// pane (on phones the list, then a section). Its own sections edit settings.json (General also the server's name, which
// the server keeps beside it: src/runtime/server-name-file.ts); the plugins' sections (Providers,
// Envs, ...) are their sheets, shown as pages of the window (`SettingsSections`, src/web/SettingsNav.tsx). Each
// change of settings.json is saved at once (text and number fields when they lose focus or on Enter) and shown before
// the save returns. The command menu opens it at a section (commands.tsx).
import {
	BACKGROUND_CONTEXT,
	contribute,
	defineFacet,
	type Held,
	MAX_SERVER_NAME_LENGTH,
	ServerNameSettings,
	Translations,
} from "@p2/app/v1";
import {
	CommandPages,
	CommandSearches,
	Commands,
	closeLayers,
	ModalSheet,
	openSettings,
	SettingsIcon,
	SettingsNavItem,
	SettingsPane,
	Sheet,
	Slots,
	Switch,
	showSettingsSection,
	useMessages,
	useObject,
	useOptimisticCall,
	useOwner,
	useReadable,
	useSettingsSection,
	useSettingsSections,
	useWide,
} from "@p2/app/v1/web";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import { Models } from "../models/contract.ts";
import { SETTINGS_COMMANDS, SETTINGS_PAGES, SETTINGS_SEARCH } from "./commands.tsx";
import { type MobileSettings, Settings } from "./contract.ts";
import { messages } from "./messages.ts";
import { OWN_SECTIONS, type OwnSection } from "./sections.ts";
import "./settings.css";

/** A change of top-level settings: each one's new value, `undefined` back to its default (removed from the file). */
type Change = Partial<MobileSettings>;
type Stream = NonNullable<MobileSettings["stream"]>;
type Retry = NonNullable<MobileSettings["retry"]>;
type Compaction = NonNullable<MobileSettings["compaction"]>;

const DETAILS = [1, 2, 3, 4] as const;
const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
const QUEUE_MODES = ["one-at-a-time", "all"] as const;
const NO_AUTOCORRECT = { autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const;

/**
 * One setting group (`stream`, `retry`, `compaction`: every field optional) with the fields in `change` replaced;
 * `undefined` when no field is left (the group is removed).
 */
function patched<T extends object>(group: T | undefined, change: T): T | undefined {
	const next = { ...group, ...change };
	return Object.values(next).some((value) => value !== undefined) ? next : undefined;
}

/** A number setting as its field shows it, and the field's text as the setting (empty: the default). */
const numberText = (value: number | undefined) => (value === undefined ? "" : String(value));
const textNumber = (text: string) => (text === "" ? undefined : Number(text));

/**
 * The objects the window's own sections show, held by the gear (mounted from the page's start, for owners) so General
 * and the others open without a round trip: settings.json's values and the server's name, a few hundred bytes.
 */
const HeldSettings = createContext<{
	readonly settings: Held<typeof Settings> | undefined;
	readonly serverName: Held<typeof ServerNameSettings> | undefined;
}>({ settings: undefined, serverName: undefined });

/** Opens Settings on p2-mac's Pi > Settings… (Cmd+,): its bridge sends "pi-host-menu" (HostBridge.swift). */
function listenForMenuSettings(): () => void {
	const chosen = (event: Event) => {
		// Trust boundary: any script of the page can dispatch the event; only the item's name is read.
		if ((event as CustomEvent<{ item?: unknown } | null>).detail?.item === "settings") openSettings();
	};
	window.addEventListener("pi-host-menu", chosen);
	return () => window.removeEventListener("pi-host-menu", chosen);
}

function GearButton() {
	const owner = useOwner();
	const { t } = useMessages(messages);
	const open = useSettingsSection() !== undefined;
	const settings = useObject(Settings, owner ? {} : undefined);
	const serverName = useObject(ServerNameSettings, owner ? {} : undefined);
	const held = useMemo(() => ({ settings, serverName }), [settings, serverName]);
	useEffect(() => (owner ? listenForMenuSettings() : undefined), [owner]);
	if (!owner) return null;
	return (
		<HeldSettings.Provider value={held}>
			<button
				type="button"
				className="icon-button settings-open"
				onClick={() => openSettings()}
				aria-label={t("window_title")}
				title={t("window_title")}
			>
				<SettingsIcon />
			</button>
			{open && <SettingsWindow />}
		</HeldSettings.Provider>
	);
}

/**
 * The window: the list of sections and the pane. Wide screens show both (General when no section is chosen); phones
 * show the list until a section is chosen, then the section with a Back to the list.
 */
function SettingsWindow() {
	const { t } = useMessages(messages);
	const section = useSettingsSection();
	const sections = useSettingsSections();
	const wide = useWide();
	const own: OwnSection | undefined =
		section?.kind === "own"
			? (OWN_SECTIONS.find((entry) => entry.id === section.locator)?.id ?? (wide ? "general" : undefined))
			: undefined;
	const list = section?.kind === "own" && own === undefined;
	return (
		<ModalSheet
			title={t("window_title")}
			onClose={closeLayers}
			className={`settings-window ${list ? "shows-list" : ""}`}
		>
			<nav className="settings-nav" aria-label={t("sections_label")}>
				{OWN_SECTIONS.map((entry) => (
					<button
						key={entry.id}
						type="button"
						className="settings-nav-item"
						aria-current={own === entry.id ? "page" : undefined}
						onClick={() => showSettingsSection({ locator: entry.id }, wide)}
					>
						{t(entry.label)}
					</button>
				))}
				<hr className="settings-nav-break" />
				{sections.map(([name, { label, title, Shown }]) => {
					const item = <SettingsNavItem key={name} name={name} label={label} title={title} />;
					return Shown ? <Shown key={name}>{item}</Shown> : item;
				})}
			</nav>
			<SettingsPane />
			{own && <SettingsSection id={own} />}
		</ModalSheet>
	);
}

/** One of the window's own sections: its settings.json fields, as a page of the window. */
function SettingsSection({ id }: { id: OwnSection }) {
	const { t } = useMessages(messages);
	const service = useContext(HeldSettings).settings;
	const models = useReadable(useObject(Models, {})?.models);
	const loaded = useReadable(service?.settings);
	const fileError = useReadable(service?.error);
	const [error, setError] = useState<string>();
	const onError = useCallback(
		(reason: unknown) => setError(reason instanceof Error ? reason.message : t("save_failed")),
		[t],
	);
	const [settings, guess] = useOptimisticCall<MobileSettings | undefined, Change>(
		loaded,
		(value, change) => value && { ...value, ...change },
		onError,
	);
	const save = (change: Change) => {
		if (!service) return;
		setError(undefined);
		const entries = Object.entries(change);
		const set = Object.fromEntries(entries.filter(([, value]) => value !== undefined));
		const unset = entries.filter(([, value]) => value === undefined).map(([key]) => key);
		guess(change, () => service.update({ set, unset }, BACKGROUND_CONTEXT));
	};
	const queueOptions = QUEUE_MODES.map((mode) => ({
		value: mode,
		label: mode === "all" ? t("queue_all") : t("queue_one"),
	}));
	const title = t(OWN_SECTIONS.find((entry) => entry.id === id)?.label ?? "window_title");
	if (!settings)
		return (
			<Sheet title={title} onClose={closeLayers}>
				<output className="muted">{t("loading_settings")}</output>
			</Sheet>
		);
	const stream = (change: Stream) => save({ stream: patched(settings.stream, change) });
	const retry = (change: Retry) => save({ retry: patched(settings.retry, change) });
	const compaction = (change: Compaction) => save({ compaction: patched(settings.compaction, change) });
	const defaultModel = settings.defaultModel && `${settings.defaultModel.provider}/${settings.defaultModel.modelId}`;
	const modelOptions = (models ?? []).map((model) => ({
		value: `${model.provider}/${model.modelId}`,
		label: `${model.name} (${model.provider})`,
	}));
	// A default that is not among the signed-in models still shows as chosen.
	if (defaultModel && !modelOptions.some((option) => option.value === defaultModel))
		modelOptions.unshift({ value: defaultModel, label: defaultModel });
	const fields: Record<OwnSection, ReactNode> = {
		general: (
			<>
				<p className="muted small">{t("general_description")}</p>

				<ServerNameSetting onError={onError} />
				<TextSetting
					label={t("owner_name_label")}
					value={settings.ownerName ?? ""}
					placeholder={t("owner_name_placeholder")}
					maxLength={40}
					onSave={(text) => save({ ownerName: text.trim() ? text : undefined })}
				/>
				<Choice
					label={t("detail_label")}
					value={settings.detail === undefined ? undefined : String(settings.detail)}
					fallback={t("detail_fallback")}
					options={[
						{ value: "1", label: t("detail_1") },
						{ value: "2", label: t("detail_2") },
						{ value: "3", label: t("detail_3") },
						{ value: "4", label: t("detail_4") },
					]}
					onChange={(value) => save({ detail: DETAILS.find((detail) => String(detail) === value) })}
				/>
			</>
		),
		models: (
			<>
				<p className="muted small">{t("models_description")}</p>

				<Choice
					label={t("default_model_label")}
					value={defaultModel}
					fallback={t("default_model_fallback")}
					options={modelOptions}
					onChange={(value) => {
						const slash = value?.indexOf("/") ?? -1;
						save({
							defaultModel:
								value === undefined || slash < 0
									? undefined
									: { provider: value.slice(0, slash), modelId: value.slice(slash + 1) },
						});
					}}
				/>
				<Choice
					label={t("thinking_level_label")}
					value={settings.thinkingLevel}
					fallback={t("thinking_level_fallback")}
					options={THINKING_LEVELS.map((level) => ({ value: level, label: level }))}
					onChange={(value) => save({ thinkingLevel: THINKING_LEVELS.find((level) => level === value) })}
				/>
				<TextSetting
					label={t("enabled_models_label")}
					value={(settings.enabledModels ?? []).join("\n")}
					placeholder={t("enabled_models_placeholder")}
					rows={3}
					mono
					onSave={(text) => {
						const patterns = text
							.split("\n")
							.map((line) => line.trim())
							.filter(Boolean);
						save({ enabledModels: patterns.length ? patterns : undefined });
					}}
				/>
			</>
		),
		agent: (
			<>
				<Switch
					label={t("codemode_label")}
					checked={settings.codemode ?? true}
					onChange={(checked) => save({ codemode: checked ? undefined : false })}
				/>
				<Choice
					label={t("tool_calls_label")}
					value={settings.toolExecution}
					fallback={t("tool_calls_fallback")}
					options={[
						{ value: "parallel", label: t("tool_parallel") },
						{ value: "sequential", label: t("tool_sequential") },
					]}
					onChange={(value) =>
						save({ toolExecution: value === "parallel" || value === "sequential" ? value : undefined })
					}
				/>
				<Choice
					label={t("steering_label")}
					value={settings.steeringMode}
					fallback={t("queue_fallback")}
					options={queueOptions}
					onChange={(value) => save({ steeringMode: QUEUE_MODES.find((mode) => mode === value) })}
				/>
				<Choice
					label={t("follow_up_label")}
					value={settings.followUpMode}
					fallback={t("queue_fallback")}
					options={queueOptions}
					onChange={(value) => save({ followUpMode: QUEUE_MODES.find((mode) => mode === value) })}
				/>
				<Choice
					label={t("cache_warming_label")}
					value={settings.cacheWarming}
					fallback={t("cache_warming_fallback")}
					options={[
						{ value: "idle", label: t("cache_idle") },
						{ value: "streaming", label: t("cache_streaming") },
						{ value: "off", label: t("cache_off") },
					]}
					onChange={(value) =>
						save({
							cacheWarming: value === "idle" || value === "streaming" || value === "off" ? value : undefined,
						})
					}
				/>
			</>
		),
		requests: (
			<>
				<Choice
					label={t("transport_label")}
					value={settings.stream?.transport}
					fallback={t("transport_fallback")}
					options={[
						{ value: "auto", label: t("transport_auto") },
						{ value: "sse", label: t("transport_sse") },
						{ value: "websocket", label: t("transport_websocket") },
					]}
					onChange={(value) =>
						stream({
							transport: value === "auto" || value === "sse" || value === "websocket" ? value : undefined,
						})
					}
				/>
				<Choice
					label={t("cache_retention_label")}
					value={settings.stream?.cacheRetention}
					fallback={t("cache_retention_fallback")}
					options={[
						{ value: "short", label: t("cache_short") },
						{ value: "long", label: t("cache_long") },
						{ value: "none", label: t("cache_none") },
					]}
					onChange={(value) =>
						stream({
							cacheRetention: value === "none" || value === "short" || value === "long" ? value : undefined,
						})
					}
				/>
				<NumberSetting
					label={t("request_timeout_label")}
					value={settings.stream?.timeoutMs}
					placeholder={t("provider_default")}
					min={1}
					onSave={(timeoutMs) => stream({ timeoutMs })}
				/>
				<NumberSetting
					label={t("provider_retries_label")}
					value={settings.stream?.maxRetries}
					placeholder={t("provider_default")}
					onSave={(maxRetries) => stream({ maxRetries })}
				/>
				<NumberSetting
					label={t("retry_delay_label")}
					value={settings.stream?.maxRetryDelayMs}
					placeholder="60000"
					onSave={(maxRetryDelayMs) => stream({ maxRetryDelayMs })}
				/>

				<Group title={t("retry_group_title")}>
					<Switch
						label={t("retry_enabled_label")}
						checked={settings.retry?.enabled ?? true}
						onChange={(checked) => retry({ enabled: checked ? undefined : false })}
					/>
					<NumberSetting
						label={t("retry_count_label")}
						value={settings.retry?.maxRetries}
						placeholder="3"
						onSave={(maxRetries) => retry({ maxRetries })}
					/>
					<NumberSetting
						label={t("retry_first_delay_label")}
						value={settings.retry?.baseDelayMs}
						placeholder="2000"
						onSave={(baseDelayMs) => retry({ baseDelayMs })}
					/>
					<NumberSetting
						label={t("retry_max_delay_label")}
						value={settings.retry?.maxAgentDelayMs}
						placeholder="60000"
						onSave={(maxAgentDelayMs) => retry({ maxAgentDelayMs })}
					/>
				</Group>
			</>
		),
		compaction: (
			<>
				<Switch
					label={t("compaction_enabled_label")}
					checked={settings.compaction?.enabled ?? true}
					onChange={(checked) => compaction({ enabled: checked ? undefined : false })}
				/>
				<NumberSetting
					label={t("reserve_tokens_label")}
					value={settings.compaction?.reserveTokens}
					placeholder="16384"
					min={1}
					onSave={(reserveTokens) => compaction({ reserveTokens })}
				/>
				<NumberSetting
					label={t("keep_recent_tokens_label")}
					value={settings.compaction?.keepRecentTokens}
					placeholder="20000"
					min={1}
					onSave={(keepRecentTokens) => compaction({ keepRecentTokens })}
				/>
				<NumberSetting
					label={t("background_tokens_label")}
					value={settings.compaction?.backgroundTokens}
					placeholder="32768"
					onSave={(backgroundTokens) => compaction({ backgroundTokens })}
				/>
			</>
		),
	};
	return (
		<Sheet title={title} onClose={closeLayers}>
			<div className="stack settings-fields">
				{fileError && (
					<p className="error" role="alert">
						{t("settings_load_error")}
					</p>
				)}
				{error && (
					<p className="error" role="alert">
						{error}
					</p>
				)}
				{fields[id]}
			</div>
		</Sheet>
	);
}

/**
 * The server's name, as Radius and the other places that show this server name it. Empty is the device's name (the
 * placeholder, as of the server's start).
 */
function ServerNameSetting({ onError }: { onError: (reason: unknown) => void }) {
	const { t } = useMessages(messages);
	const service = useContext(HeldSettings).serverName;
	const loaded = useReadable(service?.chosen);
	const device = useReadable(service?.device);
	const [chosen, guess] = useOptimisticCall<string | null | undefined, string | null>(
		loaded,
		(_value, next) => next,
		onError,
	);
	if (!service || chosen === undefined) return null;
	return (
		<TextSetting
			label={t("server_name_label")}
			value={chosen ?? ""}
			placeholder={device ?? t("server_name_device")}
			maxLength={MAX_SERVER_NAME_LENGTH}
			onSave={(text) => {
				const name = text.trim() ? text.trim() : null;
				guess(name, () => service.rename({ name }, BACKGROUND_CONTEXT));
			}}
		/>
	);
}

function Group({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="settings-group">
			<h3>{title}</h3>
			{children}
		</section>
	);
}

/** A select over `options`; its first option, `fallback`, is the default (the setting removed). */
function Choice({
	label,
	value,
	fallback,
	options,
	onChange,
}: {
	label: string;
	value: string | undefined;
	fallback: string;
	options: readonly { value: string; label: string }[];
	onChange: (value: string | undefined) => void;
}) {
	const { t } = useMessages(messages);
	return (
		<label className="field">
			<span className="label">{label}</span>
			<select
				className="input"
				value={value ?? ""}
				onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
			>
				<option value="">{t("default_option", fallback)}</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

/** A text field holding its own text while edited, saved when it loses focus or on Enter (not in a textarea). */
function TextSetting({
	label,
	value,
	placeholder,
	maxLength,
	rows,
	mono = false,
	numeric = false,
	onSave,
}: {
	label: string;
	value: string;
	placeholder: string;
	maxLength?: number;
	rows?: number;
	mono?: boolean;
	numeric?: boolean;
	onSave: (text: string) => void;
}) {
	// undefined: not being edited, the field shows the setting.
	const [text, setText] = useState<string>();
	const commit = () => {
		if (text !== undefined && text !== value) onSave(text);
		setText(undefined);
	};
	const className = `input ${mono ? "mono" : ""}`;
	const id = useId();
	return (
		<div className="field">
			<label className="label" htmlFor={id}>
				{label}
			</label>
			{rows ? (
				<textarea
					id={id}
					className={className}
					value={text ?? value}
					placeholder={placeholder}
					rows={rows}
					onChange={(event) => setText(event.target.value)}
					onBlur={commit}
					{...NO_AUTOCORRECT}
				/>
			) : (
				<input
					id={id}
					className={className}
					value={text ?? value}
					placeholder={placeholder}
					maxLength={maxLength}
					inputMode={numeric ? "numeric" : undefined}
					onChange={(event) => setText(numeric ? event.target.value.replace(/\D/g, "") : event.target.value)}
					onBlur={commit}
					onKeyDown={(event) => {
						if (event.key === "Enter") event.currentTarget.blur();
					}}
					{...NO_AUTOCORRECT}
				/>
			)}
		</div>
	);
}

/** A whole-number setting; an empty field is the default, a number below `min` is not saved. */
function NumberSetting({
	label,
	value,
	placeholder,
	min = 0,
	onSave,
}: {
	label: string;
	value: number | undefined;
	placeholder: string;
	min?: number;
	onSave: (value: number | undefined) => void;
}) {
	return (
		<TextSetting
			label={label}
			value={numberText(value)}
			placeholder={placeholder}
			maxLength={12}
			numeric
			onSave={(text) => {
				const number = textNumber(text);
				if (number === undefined || number >= min) onSave(number);
			}}
		/>
	);
}

export default defineFacet((host) => {
	contribute(host, "p2.web-settings", (self) => {
		self.contribute(Translations, messages.translations);
		self.contribute(Slots, { "sidebar-actions:settings": GearButton });
		self.contribute(Commands, SETTINGS_COMMANDS);
		self.contribute(CommandPages, SETTINGS_PAGES);
		self.contribute(CommandSearches, { settings: SETTINGS_SEARCH });
	});
});
