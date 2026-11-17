// Sharing in the browser: the share sheet (owner), the guest's presence while its page is open, and the sharing
// commands of the command menu (commands.tsx).

import { BACKGROUND_CONTEXT, contribute, defineFacet, Translations } from "@p2/app/v1";
import {
	CommandPages,
	Commands,
	closeLayers,
	copyText,
	errorText,
	Sheet,
	Slots,
	useMessages,
	useObject,
	useOwner,
	useReadable,
	useRoute,
	useSheet,
} from "@p2/app/v1/web";
import { useEffect, useState } from "react";
import { SHARING_COMMANDS, SHARING_PAGES } from "./commands.tsx";
import { GuestPresence, type ShareMode, Sharing } from "./contract.ts";
import { confirmsFirst, linkUrl, resetLink } from "./links.ts";
import { messages } from "./messages.ts";

/**
 * Two links per session (read-only; read/write: send and Stop), the people it is shared with by email, and the guests
 * connected now. People are offered only while the brain is connected to Radius (`peopleUrl`): they open the session
 * there, signed in with that email, in any organization.
 */
function ShareSheet({ session, onClose }: { session: string; onClose: () => void }) {
	const { t } = useMessages(messages);
	const sharing = useObject(Sharing, { session });
	const links = useReadable(sharing?.links);
	const guests = useReadable(sharing?.guests);
	const people = useReadable(sharing?.people);
	const peopleUrl = useReadable(sharing?.peopleUrl);
	const remoteEnv = useReadable(sharing?.env);
	const [copied, setCopied] = useState<ShareMode | "address">();
	const [email, setEmail] = useState("");
	const [personMode, setPersonMode] = useState<ShareMode>("view");
	const [confirming, setConfirming] = useState<
		{ reset: ShareMode } | { remove: string } | { remote: true } | { share: string }
	>();
	const [error, setError] = useState<string>();
	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(undefined), 1500);
		return () => clearTimeout(timer);
	}, [copied]);
	const copy = async (mode: ShareMode, remoteConfirmed = false) => {
		if (!sharing) return;
		setError(undefined);
		if (!remoteConfirmed && confirmsFirst(mode, links, remoteEnv)) {
			setConfirming({ remote: true });
			return;
		}
		try {
			const url = await linkUrl(sharing, mode, remoteConfirmed);
			if (url !== undefined && (await copyText(url))) setCopied(mode);
		} catch (reason) {
			setError(errorText(reason));
		}
	};
	/** Shares with the typed email; read/write on a remote environment is confirmed first. */
	const share = async (address: string, remoteConfirmed = false) => {
		if (!sharing) return;
		setError(undefined);
		if (personMode === "full" && remoteEnv && !remoteConfirmed) {
			setConfirming({ share: address });
			return;
		}
		try {
			await sharing.share(
				{ email: address, mode: personMode, ...(remoteConfirmed ? { remoteConfirmed } : {}) },
				BACKGROUND_CONTEXT,
			);
			setEmail("");
		} catch (reason) {
			setError(errorText(reason));
		}
	};
	const copyAddress = async () => {
		if (peopleUrl && (await copyText(peopleUrl))) setCopied("address");
	};
	const confirm = () => {
		if (!sharing || !confirming) return;
		setConfirming(undefined);
		if ("remote" in confirming) {
			void copy("full", true);
			return;
		}
		if ("share" in confirming) {
			void share(confirming.share, true);
			return;
		}
		const action =
			"reset" in confirming
				? resetLink(sharing, confirming.reset)
				: sharing.remove({ guestId: confirming.remove }, BACKGROUND_CONTEXT);
		action.catch((reason: unknown) => setError(errorText(reason)));
	};
	const cancel = (
		<button type="button" className="text-action" onClick={() => setConfirming(undefined)}>
			{t("cancel")}
		</button>
	);
	/** Remove, confirmed in place: for a link guest (blocked from the session) or a person (shared no more). */
	const removal = (id: string) =>
		confirming && "remove" in confirming && confirming.remove === id ? (
			<span className="inline-form">
				<button type="button" className="text-action danger" onClick={confirm}>
					{t("remove")}
				</button>
				{cancel}
			</span>
		) : (
			<button type="button" className="text-action" onClick={() => setConfirming({ remove: id })}>
				{t("remove")}
			</button>
		);
	return (
		<Sheet title={t("sheet_title")} onClose={onClose}>
			<p className="muted small">{remoteEnv ? t("intro_remote", remoteEnv ?? "") : t("intro_host")}</p>
			<div className="list">
				{(["view", "full"] as const).map((mode) => {
					const exists = links?.some((link) => link.mode === mode) ?? false;
					return (
						<div className="share-row" key={mode}>
							<span>{t(mode === "full" ? "mode_full" : "mode_view")}</span>
							{mode === "full" && confirming && "remote" in confirming ? (
								<>
									<span className="muted small">{t("remote_create", remoteEnv ?? "")}</span>
									<button type="button" className="text-action danger" onClick={confirm}>
										{t("create")}
									</button>
									{cancel}
								</>
							) : confirming && "reset" in confirming && confirming.reset === mode ? (
								<>
									<span className="muted small">{t("reset_confirm")}</span>
									<button type="button" className="text-action danger" onClick={confirm}>
										{t("reset")}
									</button>
									{cancel}
								</>
							) : (
								<>
									{exists && (
										<button
											type="button"
											className="text-action"
											onClick={() => setConfirming({ reset: mode })}
										>
											{t("reset")}
										</button>
									)}
									<button
										type="button"
										className={`button ${copied === mode ? "done" : ""}`}
										disabled={links === undefined}
										onClick={() => void copy(mode)}
									>
										{copied === mode ? t("copied") : t("copy_link")}
									</button>
								</>
							)}
						</div>
					);
				})}
			</div>
			{peopleUrl && (
				<div className="list">
					<span className="label">{t("people_label")}</span>
					<p className="muted small">{t("people_hint")}</p>
					<form
						className="inline-form"
						onSubmit={(event) => {
							event.preventDefault();
							if (email.trim()) void share(email.trim());
						}}
					>
						<input
							className="input"
							type="email"
							aria-label={t("email_aria")}
							placeholder={t("email_placeholder")}
							autoComplete="off"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
						<select
							className="input"
							aria-label={t("access_aria")}
							value={personMode}
							onChange={(event) => setPersonMode(event.target.value as ShareMode)}
						>
							<option value="view">{t("mode_view")}</option>
							<option value="full">{t("mode_full")}</option>
						</select>
						<button type="submit" className="button" disabled={!email.trim()}>
							Share
						</button>
					</form>
					{confirming && "share" in confirming && (
						<div className="share-row">
							<span className="muted small">{t("share_full_confirm", confirming.share, remoteEnv ?? "")}</span>
							<button type="button" className="text-action danger" onClick={confirm}>
								{t("share")}
							</button>
							{cancel}
						</div>
					)}
					{people?.map((person) => (
						<div className="guest-row" key={person.id}>
							<span>
								{person.name}{" "}
								<small className="muted">
									· {person.mode === "full" ? t("mode_read_write") : t("mode_read_only")}
								</small>
							</span>
							{removal(person.id)}
						</div>
					))}
					{people && people.length > 0 && (
						<div className="share-row">
							<span className="muted small">{t("address_hint")}</span>
							<button
								type="button"
								className={`button ${copied === "address" ? "done" : ""}`}
								onClick={() => void copyAddress()}
							>
								{copied === "address" ? t("copied") : t("copy_address")}
							</button>
						</div>
					)}
				</div>
			)}
			<div className="list">
				<span className="label">{t("connected_label")}</span>
				{guests && !guests.length && <p className="empty-note">{t("empty_guests")}</p>}
				{guests?.map((guest) => (
					<div className="guest-row" key={guest.id}>
						<span>
							{guest.name}{" "}
							<small className="muted">
								· {guest.mode === "full" ? t("mode_read_write") : t("mode_read_only")}
							</small>
						</span>
						{removal(guest.id)}
					</div>
				))}
			</div>
			{error && (
				<p className="notice error" role="alert">
					{error}
				</p>
			)}
		</Sheet>
	);
}

/**
 * The open session's share sheet while it is the top layer (owner only); the Session sheet, the stats' guest count and
 * the command menu open it.
 */
function ShareButton() {
	const { session } = useRoute();
	const owner = useOwner();
	const open = useSheet("share") !== undefined;
	if (session === undefined || !owner) return null;
	return open ? <ShareSheet session={session} onClose={closeLayers} /> : null;
}

export default defineFacet((host) => {
	contribute(host, "p2.sharing-web", (self) => {
		self.contribute(Translations, messages.translations);
		// A guest counts as connected while its page holds this (the owner's variant does nothing).
		self.get(GuestPresence, {});
		self.contribute(Slots, { "session-actions": ShareButton });
		self.contribute(Commands, SHARING_COMMANDS);
		self.contribute(CommandPages, SHARING_PAGES);
	});
});
