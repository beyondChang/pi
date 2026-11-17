// The owner's Discord bots (Settings › Discord): the list with each bot's status, adding one by its token, and a bot's own
// sheet (identity, its servers, the invite link, its linked sessions read-only, a new token, removing it). Linking a
// session to a channel happens from the session (LinkSheet.tsx), not here.
import { BACKGROUND_CONTEXT } from "@p2/app/v1";
import {
	ChevronIcon,
	CopyButton,
	closeLayers,
	errorText,
	getNavigation,
	navigate,
	openLayer,
	Sheet,
	useMessages,
	useObject,
	useReadable,
} from "@p2/app/v1/web";
import { useState } from "react";
import { Sessions } from "../sessions/contract.ts";
import type { BotStatus, BotView } from "./contract.ts";
import { useDiscord } from "./held.ts";
import { messages } from "./messages.ts";

const NO_AUTOCORRECT = { autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const;

/** Back to the sheet below (the header's Back). */
export const back = () => void getNavigation().close((route) => ({ ...route, layers: route.layers.slice(0, -1) }));

/** A bot's name: its Discord user once connected. */
export function botName(bot: BotView): string {
	return bot.status.state === "connected" ? bot.status.user : "Discord bot";
}

/** What a bot's row says of its status. */
function statusText(status: BotStatus): string {
	if (status.state === "connecting") return "Connecting…";
	if (status.state === "error") return "Not connected";
	return `${status.guilds.length} server${status.guilds.length === 1 ? "" : "s"}`;
}

/** The bot's Discord avatar, when it has one (through p2's route: the page loads only its own images). */
function Avatar({ bot }: { bot: BotView }) {
	const [failed, setFailed] = useState<string>();
	const url = bot.status.state === "connected" ? bot.status.avatarUrl : undefined;
	if (!url || failed === url) return null;
	return (
		<img
			className="discord-avatar"
			// The avatar's URL in the query: a new avatar is a new image for the browser's cache.
			src={`/discord/avatar?bot=${encodeURIComponent(bot.id)}&v=${encodeURIComponent(url)}`}
			alt=""
			onError={() => setFailed(url)}
		/>
	);
}

/** Settings › Discord: the bots, and Add bot. */
export function BotsSheet() {
	const { t } = useMessages(messages);
	const bots = useReadable(useDiscord()?.bots);
	return (
		<Sheet title={t("title")} onClose={closeLayers} className="discord-sheet">
			<div className="list">
				<span className="label">{t("bots")}</span>
				{bots?.map((bot) => (
					<button
						type="button"
						key={bot.id}
						className="row-button"
						onClick={() => openLayer({ kind: "sheet", name: "discord-bot", locator: bot.id })}
					>
						<Avatar bot={bot} />
						<span>{botName(bot)}</span>
						<small className="row-value">{statusText(bot.status)}</small>
						<ChevronIcon />
					</button>
				))}
				{bots && !bots.length && <p className="empty-note">{t("no_bots")}</p>}
				<button
					type="button"
					className="row-button"
					onClick={() => openLayer({ kind: "sheet", name: "discord-add" })}
				>
					<span>{t("add_bot")}</span>
					<ChevronIcon />
				</button>
			</div>
			<p className="muted small discord-hint">{t("hint")}</p>
		</Sheet>
	);
}

/** Add bot: its token, Connect; once Discord accepts it, the bot's sheet replaces this one. */
export function AddBotSheet() {
	const { t } = useMessages(messages);
	const discord = useDiscord();
	const [token, setToken] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	return (
		<Sheet title={t("add_bot")} onClose={closeLayers} onBack={back} className="discord-sheet">
			<ol className="discord-steps muted small">
				<li>
					At{" "}
					<a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">
						discord.com/developers
					</a>{" "}
					{t("step_1")}
				</li>
				<li>{t("step_2")}</li>
				<li>{t("step_3")}</li>
			</ol>
			<form
				className="stack"
				onSubmit={(event) => {
					event.preventDefault();
					if (!discord || busy) return;
					setBusy(true);
					setError(undefined);
					discord.addBot({ token: token.trim() }, BACKGROUND_CONTEXT).then(
						({ id }) => {
							const nav = getNavigation();
							void nav.replace({
								...nav.route,
								layers: [...nav.route.layers.slice(0, -1), { kind: "sheet", name: "discord-bot", locator: id }],
							});
						},
						(reason: unknown) => {
							setError(errorText(reason));
							setBusy(false);
						},
					);
				}}
			>
				<input
					className="input mono"
					type="password"
					autoComplete="off"
					aria-label={t("bot_token")}
					placeholder={t("bot_token")}
					value={token}
					onChange={(event) => setToken(event.target.value)}
					{...NO_AUTOCORRECT}
				/>
				{error && <output className="notice error">{error}</output>}
				<button type="submit" className="button primary" disabled={busy || token.trim().length < 10}>
					{busy ? t("connecting") : t("connect")}
				</button>
			</form>
		</Sheet>
	);
}

/** A bot's sheet: who it is, its servers, the invite link, its linked sessions, a new token, removing it. */
export function BotSheet({ id }: { id: string }) {
	const { t } = useMessages(messages);
	const discord = useDiscord();
	const bots = useReadable(discord?.bots);
	const bindings = useReadable(discord?.bindings) ?? [];
	const sessions = useReadable(useObject(Sessions, {}, { variant: "owner" })?.sessions) ?? [];
	const [token, setToken] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const [removing, setRemoving] = useState(false);
	const bot = bots?.find((each) => each.id === id);
	if (!bot)
		return (
			<Sheet title={t("bot")} onClose={closeLayers} onBack={back} className="discord-sheet">
				<p className="empty-note">{bots ? t("bot_gone") : t("loading")}</p>
			</Sheet>
		);
	const status = bot.status;
	const links = bindings.filter((binding) => binding.botId === id);
	const run = (operation: () => Promise<unknown>, done?: () => void) => {
		setBusy(true);
		setError(undefined);
		operation()
			.then(done, (reason: unknown) => setError(errorText(reason)))
			.finally(() => setBusy(false));
	};
	return (
		<Sheet title={botName(bot)} onClose={closeLayers} onBack={back} className="discord-sheet">
			<div className="discord-identity">
				<Avatar bot={bot} />
				<p className="muted small">
					{status.state === "connected"
						? t("connected_as", status.user)
						: status.state === "connecting"
							? t("connecting")
							: status.error}
				</p>
			</div>
			<div className="list">
				<span className="label">{t("servers")}</span>
				{status.state === "connected" &&
					status.guilds.map((guild) => (
						<div key={guild.id} className="discord-row">
							{guild.name}
						</div>
					))}
				{status.state === "connected" && !status.guilds.length && <p className="empty-note">{t("no_servers")}</p>}
				{status.state !== "connected" && <p className="empty-note">{t("servers_soon")}</p>}
			</div>
			<div className="stack discord-invite">
				<span className="label">{t("invite_to_server")}</span>
				{status.state === "connected" ? (
					<>
						<input
							className="input mono"
							readOnly
							aria-label={t("invite_link")}
							value={status.inviteUrl}
							onFocus={(event) => event.target.select()}
						/>
						<div className="inline-form">
							<CopyButton key={status.inviteUrl} primary text={status.inviteUrl} label={t("copy_link")} />
							<a className="text-action" href={status.inviteUrl} target="_blank" rel="noreferrer">
								{t("open")}
							</a>
						</div>
					</>
				) : (
					<p className="muted small">{t("invite_soon")}</p>
				)}
			</div>
			<div className="list">
				<span className="label">{t("linked_sessions")}</span>
				{links.map((binding) => {
					const session = sessions.find((each) => each.id === binding.session);
					return (
						<button
							type="button"
							key={binding.channelId}
							className="row-button"
							onClick={() => navigate({ session: binding.session, conversation: session?.main ?? 1 })}
						>
							<span>
								{binding.guildName} › #{binding.channelName}
							</span>
							<small className="row-value">{session?.title ?? binding.session}</small>
							<ChevronIcon />
						</button>
					);
				})}
				{!links.length && <p className="empty-note">{t("none_linked")}</p>}
			</div>
			<form
				className="stack"
				onSubmit={(event) => {
					event.preventDefault();
					if (discord)
						run(
							() => discord.setBotToken({ bot: id, token: token.trim() }, BACKGROUND_CONTEXT),
							() => setToken(""),
						);
				}}
			>
				<span className="label">{t("replace_token")}</span>
				<div className="inline-form">
					<input
						className="input mono"
						type="password"
						autoComplete="off"
						aria-label={t("new_bot_token")}
						placeholder={t("new_bot_token")}
						value={token}
						onChange={(event) => setToken(event.target.value)}
						{...NO_AUTOCORRECT}
					/>
					<button type="submit" className="button" disabled={busy || token.trim().length < 10}>
						{t("replace")}
					</button>
				</div>
			</form>
			{error && <output className="notice error">{error}</output>}
			<div className="list">
				{removing ? (
					<div className="stack">
						<p className="muted small">
							{t("remove_question", botName(bot))}
							{links.length ? (links.length === 1 ? t("unlinked_one") : t("unlinked_many", links.length)) : ""}
						</p>
						<div className="inline-form">
							<button
								type="button"
								className="button danger"
								disabled={busy}
								onClick={() => discord && run(() => discord.removeBot({ bot: id }, BACKGROUND_CONTEXT), back)}
							>
								{t("remove")}
							</button>
							<button type="button" className="text-action" onClick={() => setRemoving(false)}>
								{t("cancel")}
							</button>
						</div>
					</div>
				) : (
					<button type="button" className="row-button danger" onClick={() => setRemoving(true)}>
						<span>{t("remove_bot")}</span>
					</button>
				)}
			</div>
		</Sheet>
	);
}
