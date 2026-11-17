// A session's Discord link (its Session sheet → Discord). Linked: the bot, channel and sandbox (fixed), who may wake
// Pi and what the session may use (editable, saved in place and applied at once), and Unlink. Not linked: the form that
// links it: the bot, its server, a channel no other session has, who may wake Pi, the sandbox the session moves into,
// and what it may use there; Link stays disabled, saying what is missing, until every choice is made.
import { BACKGROUND_CONTEXT, LOCK_CAPABILITIES, type LockCapability, type SessionLock } from "@p2/app/v1";
import { closeLayers, errorText, openLayer, Sheet, useMessages, useObject, useReadable } from "@p2/app/v1/web";
import { useEffect, useState } from "react";
import { Envs } from "../envs/contract.ts";
import { SessionLock as SessionLockView, Sessions } from "../sessions/contract.ts";
import { back, botName } from "./BotsSheet.tsx";
import type { Binding, ServerDetails, Wake } from "./contract.ts";
import { useDiscord } from "./held.ts";
import { messages } from "./messages.ts";

const NO_AUTOCORRECT = { autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const;

const CAPABILITY_LABELS: Record<LockCapability, string> = {
	ports: "Forward ports",
	conversations: "Message other sessions",
};

/** Who may wake Pi and what the session may use, as the form edits them. */
type Access = {
	who: "anyone" | "roles";
	roles: string[];
	users: string;
	mcp: string[];
	projectMcp: boolean;
	instructions: boolean;
	capabilities: LockCapability[];
};

const NO_ACCESS: Access = {
	who: "roles",
	roles: [],
	users: "",
	mcp: [],
	projectMcp: false,
	instructions: false,
	capabilities: [],
};

/** Discord user IDs, one per line or comma-separated. */
const ids = (text: string): string[] =>
	text
		.split(/[\s,]+/)
		.map((id) => id.trim())
		.filter((id) => /^\d{5,30}$/.test(id));

/** A link's wake and lock as the form edits them. */
function accessOf(wake: Wake, lock: SessionLock | undefined): Access {
	return {
		who: wake.anyone ? "anyone" : "roles",
		roles: [...wake.roles],
		users: wake.users.join("\n"),
		mcp: [...(lock?.mcp ?? [])],
		projectMcp: lock?.projectMcp ?? false,
		instructions: lock?.instructions ?? false,
		capabilities: [...(lock?.capabilities ?? [])],
	};
}

function wakeOf(access: Access): Wake {
	return access.who === "anyone"
		? { anyone: true, users: [], roles: [] }
		: { anyone: false, users: ids(access.users), roles: access.roles };
}

function lockOf(access: Access): SessionLock {
	return {
		mcp: access.mcp,
		projectMcp: access.projectMcp,
		instructions: access.instructions,
		capabilities: access.capabilities,
	};
}

/** What is missing for `access` to be saved: someone who may wake Pi. */
const nobody = (access: Access) => access.who === "roles" && !access.roles.length && !ids(access.users).length;

const toggle = <T,>(list: readonly T[], value: T, on: boolean): T[] =>
	on ? [...list.filter((entry) => entry !== value), value] : list.filter((entry) => entry !== value);

/** Session `session`'s Discord sheet. */
export function LinkSheet({ session }: { session: string }) {
	const { t } = useMessages(messages);
	const discord = useDiscord();
	const bindings = useReadable(discord?.bindings);
	const linked = bindings?.find((binding) => binding.session === session);
	return (
		<Sheet title={t("title")} onClose={closeLayers} onBack={back} className="discord-sheet">
			{!bindings ? (
				<p className="empty-note">{t("loading")}</p>
			) : linked ? (
				<Linked binding={linked} />
			) : (
				<LinkForm session={session} bindings={bindings} />
			)}
		</Sheet>
	);
}

/** A server's channels and roles as `bot` sees them (undefined until loaded), and why they could not be read. */
function useServer(bot: string | undefined, guild: string | undefined) {
	const discord = useDiscord();
	const [details, setDetails] = useState<{ key: string; value: ServerDetails }>();
	const [error, setError] = useState<string>();
	useEffect(() => {
		if (!discord || !bot || !guild) return;
		let current = true;
		discord.server({ bot, guild }, BACKGROUND_CONTEXT).then(
			(value) => {
				if (current) setDetails({ key: `${bot}/${guild}`, value });
			},
			(reason: unknown) => {
				if (current) setError(errorText(reason));
			},
		);
		return () => {
			current = false;
		};
	}, [discord, bot, guild]);
	return { server: details?.key === `${bot}/${guild}` ? details.value : undefined, error };
}

/** The MCP servers of mcp.json, for the lock's picks. */
function useMcpServers(): string[] {
	const discord = useDiscord();
	const [servers, setServers] = useState<string[]>([]);
	useEffect(() => {
		if (discord) discord.mcpServers(BACKGROUND_CONTEXT).then(setServers, () => {});
	}, [discord]);
	return servers;
}

/** Who may wake Pi: anyone, or the server's roles picked and user IDs. */
function WakeFields({
	access,
	update,
	server,
	hint,
}: {
	access: Access;
	update: (patch: Partial<Access>) => void;
	server: ServerDetails | undefined;
	/** Shown instead of the roles while there are none to show. */
	hint: string;
}) {
	const { t } = useMessages(messages);
	// Picked roles the server no longer lists (or before it is read) stay visible, so they can be unpicked.
	const unknown = access.roles.filter((role) => !server?.roles.some((each) => each.id === role));
	return (
		<>
			<span className="label">{t("who_wake")}</span>
			<label className="check">
				<input type="radio" checked={access.who === "anyone"} onChange={() => update({ who: "anyone" })} />
				{t("anyone_channel")}
			</label>
			<label className="check">
				<input type="radio" checked={access.who === "roles"} onChange={() => update({ who: "roles" })} />
				{t("roles_users")}
			</label>
			{access.who === "roles" && (
				<div className="discord-indent stack">
					{!server && <span className="muted small">{hint}</span>}
					{[
						...(server?.roles ?? []),
						...unknown.map((id) => ({ id, name: server ? `role ${id} (gone)` : `role ${id}` })),
					].map((role) => (
						<label key={role.id} className="check">
							<input
								type="checkbox"
								checked={access.roles.includes(role.id)}
								onChange={(event) => update({ roles: toggle(access.roles, role.id, event.target.checked) })}
							/>
							@{role.name}
						</label>
					))}
					{server && !server.roles.length && <span className="muted small">{t("no_roles")}</span>}
					<label className="field">
						<span className="label">{t("user_ids")}</span>
						<textarea
							className="input mono"
							rows={2}
							placeholder={t("one_per_line")}
							value={access.users}
							onChange={(event) => update({ users: event.target.value })}
							{...NO_AUTOCORRECT}
						/>
						<span className="muted small">{t("copy_user_id")}</span>
					</label>
				</div>
			)}
		</>
	);
}

/** What the session may use: MCP servers, the project's, the global instructions, capabilities. */
function ResourceFields({
	access,
	update,
	servers,
}: {
	access: Access;
	update: (patch: Partial<Access>) => void;
	/** The MCP servers of mcp.json. */
	servers: readonly string[];
}) {
	const { t } = useMessages(messages);
	return (
		<>
			<span className="label">{t("what_session_may_use")}</span>
			{servers.map((name) => (
				<label key={name} className="check">
					<input
						type="checkbox"
						checked={access.mcp.includes(name)}
						onChange={(event) => update({ mcp: toggle(access.mcp, name, event.target.checked) })}
					/>
					{t("mcp_server")} <span className="mono">{name}</span>
				</label>
			))}
			<label className="check">
				<input
					type="checkbox"
					checked={access.projectMcp}
					onChange={(event) => update({ projectMcp: event.target.checked })}
				/>
				{t("project_mcp")}
			</label>
			<label className="check">
				<input
					type="checkbox"
					checked={access.instructions}
					onChange={(event) => update({ instructions: event.target.checked })}
				/>
				{t("global_agents")}
			</label>
			{LOCK_CAPABILITIES.map((capability) => (
				<label key={capability} className="check">
					<input
						type="checkbox"
						checked={access.capabilities.includes(capability)}
						onChange={(event) =>
							update({ capabilities: toggle(access.capabilities, capability, event.target.checked) })
						}
					/>
					{CAPABILITY_LABELS[capability]}
				</label>
			))}
		</>
	);
}

/** A linked session's sheet, its data read from the owner's objects (`LinkedView` shows it). */
function Linked({ binding }: { binding: Binding }) {
	const { t } = useMessages(messages);
	const discord = useDiscord();
	const bot = useReadable(discord?.bots)?.find((each) => each.id === binding.botId);
	const row = useReadable(useObject(Sessions, {}, { variant: "owner" })?.sessions)?.find(
		(each) => each.id === binding.session,
	);
	const locks = useReadable(useObject(SessionLockView, {}, { variant: "owner" })?.locks);
	const connected = bot?.status.state === "connected";
	const { server } = useServer(connected ? bot.id : undefined, binding.guildId);
	const servers = useMcpServers();
	return (
		<LinkedView
			binding={binding}
			botName={bot ? botName(bot) : t("removed")}
			connected={connected}
			sandbox={row?.env ?? undefined}
			lock={locks === undefined ? undefined : (locks[binding.session] ?? null)}
			server={server}
			servers={servers}
			onSave={
				discord &&
				((wake, lock) => discord.updateLink({ session: binding.session, wake, lock }, BACKGROUND_CONTEXT))
			}
			onUnlink={discord && (() => discord.unlink({ session: binding.session }, BACKGROUND_CONTEXT))}
		/>
	);
}

/**
 * A linked session: the bot, channel and sandbox (fixed), who may wake Pi and what the session may use (edited, saved
 * in place by `onSave`, applied at once), and Unlink. `lock` undefined: not read yet.
 */
export function LinkedView({
	binding,
	botName: name,
	connected,
	sandbox,
	lock,
	server,
	servers,
	onSave,
	onUnlink,
}: {
	binding: Binding;
	botName: string;
	connected: boolean;
	sandbox: string | undefined;
	lock: SessionLock | null | undefined;
	server: ServerDetails | undefined;
	servers: readonly string[];
	onSave: ((wake: Wake, lock: SessionLock) => Promise<unknown>) | undefined;
	onUnlink: (() => Promise<unknown>) | undefined;
}) {
	const { t } = useMessages(messages);
	const saved = lock === undefined ? undefined : accessOf(binding.wake, lock ?? undefined);
	// The edits since the last save; none: the saved access shows.
	const [edited, setEdited] = useState<Access>();
	const access = edited ?? saved ?? NO_ACCESS;
	const changed = edited !== undefined && JSON.stringify(edited) !== JSON.stringify(saved);
	const [busy, setBusy] = useState<"saving" | "unlinking">();
	const [error, setError] = useState<string>();
	const [note, setNote] = useState<string>();
	const run = (kind: "saving" | "unlinking", operation: () => Promise<unknown>, done?: () => void) => {
		setBusy(kind);
		setError(undefined);
		setNote(undefined);
		operation()
			.then(done, (reason: unknown) => setError(errorText(reason)))
			.finally(() => setBusy(undefined));
	};
	const update = (patch: Partial<Access>) => setEdited({ ...access, ...patch });
	return (
		<form
			className="stack discord-form"
			onSubmit={(event) => {
				event.preventDefault();
				if (!onSave || !changed || nobody(access)) return;
				run(
					"saving",
					() => onSave(wakeOf(access), lockOf(access)),
					() => {
						setEdited(undefined);
						setNote(t("saved_now"));
					},
				);
			}}
		>
			<p className="muted small">{t("link_note")}</p>
			<div className="list">
				<div className="discord-row">
					<span>{t("bot")}</span>
					<small className="row-value">{name}</small>
				</div>
				<div className="discord-row">
					<span>{t("channel")}</span>
					<small className="row-value">
						{binding.guildName} › #{binding.channelName}
					</small>
				</div>
				<div className="discord-row">
					<span>{t("sandbox")}</span>
					<small className="row-value">{sandbox ?? "–"}</small>
				</div>
			</div>
			<WakeFields
				access={access}
				update={update}
				server={server}
				hint={connected ? t("loading_roles") : t("roles_by_id")}
			/>
			<ResourceFields access={access} update={update} servers={servers} />
			{error && <output className="notice error">{error}</output>}
			{note && <output className="notice">{note}</output>}
			<div className="inline-form">
				<button
					type="submit"
					className="button primary"
					disabled={busy !== undefined || !changed || nobody(access) || !onSave}
				>
					{busy === "saving" ? t("saving") : t("save")}
				</button>
				{changed && (
					<button type="button" className="text-action" onClick={() => setEdited(undefined)}>
						{t("undo_changes")}
					</button>
				)}
			</div>
			{changed && nobody(access) && <p className="muted small">{t("pick_who_wake")}</p>}
			<div className="list">
				<button
					type="button"
					className="row-button danger"
					disabled={busy !== undefined || !onUnlink}
					onClick={() => onUnlink && run("unlinking", onUnlink)}
				>
					<span>{busy === "unlinking" ? t("unlinking") : t("unlink")}</span>
				</button>
			</div>
		</form>
	);
}

type Choice = { bot: string; guild: string; channel: string; sandbox: string };

function LinkForm({ session, bindings }: { session: string; bindings: readonly Binding[] }) {
	const { t } = useMessages(messages);
	const discord = useDiscord();
	const bots = (useReadable(discord?.bots) ?? []).filter((bot) => bot.status.state === "connected");
	const sessions = useReadable(useObject(Sessions, {}, { variant: "owner" })?.sessions) ?? [];
	const sandboxes = (useReadable(useObject(Envs, {})?.envs) ?? []).filter((env) => env.config.type === "gondolin");
	const [choice, setChoice] = useState<Choice>({ bot: "", guild: "", channel: "", sandbox: "" });
	const [access, setAccess] = useState<Access>(NO_ACCESS);
	const [linkError, setError] = useState<string>();
	const [busy, setBusy] = useState(false);
	const choose = (patch: Partial<Choice>) => setChoice((current) => ({ ...current, ...patch }));
	const update = (patch: Partial<Access>) => setAccess((current) => ({ ...current, ...patch }));
	// One bot or sandbox: chosen already.
	const onlyBot = bots.length === 1 ? bots[0]?.id : undefined;
	const onlySandbox = sandboxes.length === 1 ? sandboxes[0]?.name : undefined;
	const bot = bots.find((each) => each.id === (choice.bot || onlyBot));
	const guilds = bot?.status.state === "connected" ? bot.status.guilds : [];
	const guild = guilds.find((each) => each.id === (choice.guild || (guilds.length === 1 ? guilds[0]?.id : "")));
	const sandbox = choice.sandbox || onlySandbox || "";
	const { server, error: serverError } = useServer(bot?.id, guild?.id);
	const servers = useMcpServers();
	const error = linkError ?? serverError;
	const takenBy = (channel: string) => {
		const owner = bindings.find((binding) => binding.channelId === channel);
		return owner && (sessions.find((each) => each.id === owner.session)?.title ?? t("another_session"));
	};
	const missing = [
		!bot && "a bot",
		bot && !guild && "a server",
		guild && (!choice.channel || takenBy(choice.channel)) && "a channel",
		nobody(access) && "who may wake Pi",
		!sandbox && "a sandbox",
	].filter((entry): entry is string => Boolean(entry));
	return (
		<form
			className="stack discord-form"
			onSubmit={(event) => {
				event.preventDefault();
				if (!discord || !bot || !guild || missing.length) return;
				setBusy(true);
				setError(undefined);
				discord
					.link(
						{
							session,
							bot: bot.id,
							guild: guild.id,
							channel: choice.channel,
							wake: wakeOf(access),
							sandbox,
							lock: lockOf(access),
						},
						BACKGROUND_CONTEXT,
					)
					.catch((reason: unknown) => setError(errorText(reason)))
					.finally(() => setBusy(false));
			}}
		>
			<p className="muted small">{t("link_form_note")}</p>
			<div className="field">
				<span className="label">{t("bot")}</span>
				{bots.length ? (
					<select
						className="input"
						aria-label={t("bot")}
						value={bot?.id ?? ""}
						onChange={(event) => {
							choose({ bot: event.target.value, guild: "", channel: "" });
							update({ roles: [] });
						}}
					>
						{!onlyBot && <option value="">{t("pick_bot")}</option>}
						{bots.map((each) => (
							<option key={each.id} value={each.id}>
								{botName(each)}
							</option>
						))}
					</select>
				) : (
					<span className="muted small">
						{t("no_connected_bot")}{" "}
						<button
							type="button"
							className="text-action"
							onClick={() => openLayer({ kind: "sheet", name: "discord" }, { fromDrawer: true })}
						>
							{t("add_one_under")}
						</button>
					</span>
				)}
			</div>
			{bot && (
				<div className="field">
					<span className="label">{t("server")}</span>
					{guilds.length ? (
						<select
							className="input"
							aria-label={t("server")}
							value={guild?.id ?? ""}
							onChange={(event) => {
								choose({ guild: event.target.value, channel: "" });
								update({ roles: [] });
							}}
						>
							{guilds.length > 1 && <option value="">{t("pick_server")}</option>}
							{guilds.map((each) => (
								<option key={each.id} value={each.id}>
									{each.name}
								</option>
							))}
						</select>
					) : (
						<span className="muted small">{t("no_server")}</span>
					)}
				</div>
			)}
			{guild && (
				<label className="field">
					<span className="label">{t("channel")}</span>
					<select
						className="input"
						value={choice.channel}
						onChange={(event) => choose({ channel: event.target.value })}
					>
						<option value="">{server ? t("pick_channel") : t("loading_channels")}</option>
						{server?.channels.map((channel) => {
							const taken = takenBy(channel.id);
							return (
								<option key={channel.id} value={channel.id} disabled={Boolean(taken)}>
									#{channel.name}
									{taken ? ` (taken: ${taken})` : ""}
								</option>
							);
						})}
					</select>
				</label>
			)}
			<WakeFields
				access={access}
				update={update}
				server={server}
				hint={guild ? t("loading_roles") : t("pick_server_for_roles")}
			/>
			<div className="field">
				<span className="label">{t("sandbox")}</span>
				{sandboxes.length ? (
					<select
						className="input"
						aria-label={t("sandbox")}
						value={sandbox}
						onChange={(event) => choose({ sandbox: event.target.value })}
					>
						{!onlySandbox && <option value="">{t("pick_sandbox")}</option>}
						{sandboxes.map((env) => (
							<option key={env.name} value={env.name}>
								{env.name}
							</option>
						))}
					</select>
				) : (
					<span className="muted small">{t("no_sandbox")}</span>
				)}
			</div>
			<ResourceFields access={access} update={update} servers={servers} />
			{error && <output className="notice error">{error}</output>}
			<button type="submit" className="button primary" disabled={busy || missing.length > 0 || !discord}>
				{busy ? t("linking") : t("link")}
			</button>
			{missing.length > 0 && <p className="muted small">{t("still_to_pick", missing.join(", "))}</p>}
		</form>
	);
}
