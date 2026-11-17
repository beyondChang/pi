// A rollup's options sheet: how long the sidebar shows a session nothing else keeps in view, and the rollup's place;
// for a rollup made from code, when it refreshes, when it was last checked, why its last run failed, and Refresh now.
import { CheckIcon, Sheet, useMessages } from "@p2/app/v1/web";
import type { Refresh } from "../../rollups/contract.ts";
import type { SidebarWindow } from "../contract.ts";
import { messages } from "../messages.ts";
import { type Section, WINDOWS } from "./model.ts";
import { ago } from "./Row.tsx";

/** A rollup made from code as its options show it, and refreshing it (absent while offline). */
export type CodeSource = {
	readonly refresh: Refresh;
	readonly checkedAt: number | null;
	readonly error: string | null;
	readonly refreshing: boolean;
	readonly onRefresh?: () => void;
};

/** The options of rollup `section`: its window (not for a rollup shown only as a link) and moving it up or down. */
export function RollupSheet({
	section,
	code,
	now,
	onWindow,
	onMove,
	onClose,
}: {
	section: Section;
	/** Present for a rollup made from code. */
	code?: CodeSource;
	now: number;
	onWindow: (window: SidebarWindow) => void;
	/** Moves the rollup up or down; absent: it cannot move that way. */
	onMove: { up?: () => void; down?: () => void };
	onClose: () => void;
}) {
	const { t } = useMessages(messages);
	return (
		<Sheet title={section.name} onClose={onClose}>
			<div className="list">
				{code && <CodeOptions code={code} now={now} />}
				{section.layout !== "link" && section.window !== "none" && (
					<>
						<h3 className="label">{t("active_within")}</h3>
						{WINDOWS.map(({ window, label }) => (
							<button
								type="button"
								key={window}
								className="row-button"
								aria-pressed={section.window === window}
								onClick={() => onWindow(window)}
							>
								<span>{label}</span>
								{section.window === window && <CheckIcon />}
							</button>
						))}
						<p className="muted small">{t("pinned_always")}</p>
					</>
				)}
				{onMove.up && (
					<button type="button" className="row-button" onClick={onMove.up}>
						<span>{t("move_up")}</span>
					</button>
				)}
				{onMove.down && (
					<button type="button" className="row-button" onClick={onMove.down}>
						<span>{t("move_down")}</span>
					</button>
				)}
			</div>
		</Sheet>
	);
}

/** When a rollup made from code refreshes, its last check or failure, and Refresh now unless it refreshes itself. */
function CodeOptions({ code, now }: { code: CodeSource; now: number }) {
	const { t } = useMessages(messages);
	const when =
		code.refresh.kind === "auto"
			? t("refresh_auto")
			: code.refresh.kind === "every"
				? t("refresh_every", code.refresh.minutes)
				: t("refresh_manual");
	const since = code.checkedAt === null ? undefined : ago(code.checkedAt, now);
	// `ago` says "now", "5m" or "3h" up to a week, then a date.
	const checked =
		since === undefined
			? t("not_run_yet")
			: since === "now"
				? t("checked_now")
				: /^\d/.test(since)
					? t("checked_ago", since)
					: t("checked_on", since);
	return (
		<>
			<h3 className="label">{t("code_source")}</h3>
			<p className="muted small">
				{when}. {checked}.
			</p>
			{code.error && <p className="small rollup-error">{code.error}</p>}
			{code.refresh.kind !== "auto" && (
				<button
					type="button"
					className="row-button"
					disabled={!code.onRefresh || code.refreshing}
					onClick={code.onRefresh}
				>
					<span>{code.refreshing ? t("refreshing") : t("refresh_now")}</span>
				</button>
			)}
		</>
	);
}
