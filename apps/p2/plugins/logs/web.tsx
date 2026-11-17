import { contribute, defineFacet, type MessagesOf, Translations, type Translator, whenLive } from "@p2/app/v1";
import {
	closeLayers,
	errorText,
	SettingsSections,
	Sheet,
	Switch,
	useMessages,
	useNavigation,
	useObject,
	useOwner,
	useReadable,
	useSheet,
	useStatus,
} from "@p2/app/v1/web";
import { useEffect, useRef, useState } from "react";
import { Logs } from "./contract.ts";
import { messages } from "./messages.ts";
import "./style.css";

function sourceLabel(
	t: Translator<(typeof messages)["namespace"], MessagesOf<typeof messages>>,
	source: string,
): string {
	if (source.startsWith("session:")) return t("source_worker", source.slice(8));
	return source === "dev" ? t("source_dev") : source === "terminals" ? t("source_terminals") : t("source_server");
}

function LogsSheet({ source }: { source: string }) {
	const { t } = useMessages(messages);
	const logs = useObject(Logs, { source });
	const status = useStatus(logs);
	const sources = useReadable(logs?.sources) ?? [];
	const lines = useReadable(logs?.lines) ?? [];
	const [filter, setFilter] = useState("");
	const [follow, setFollow] = useState(true);
	const [message, setMessage] = useState<string>();
	const area = useRef<HTMLPreElement>(null);
	const nav = useNavigation();
	const query = filter.toLowerCase();
	const shown = lines.filter((line) => line.text.toLowerCase().includes(query));
	const text = shown.map((line) => `${new Date(line.time).toISOString()} [${line.level}] ${line.text}`).join("\n");
	// biome-ignore lint/correctness/useExhaustiveDependencies: New rendered lines must trigger tail-following after the DOM updates.
	useEffect(() => {
		if (follow && area.current) area.current.scrollTop = area.current.scrollHeight;
	}, [follow, text]);
	useEffect(() => {
		let current = true;
		void (logs ? whenLive(logs) : Promise.resolve()).catch((error: unknown) => {
			if (current) setMessage(errorText(error));
		});
		return () => {
			current = false;
		};
	}, [logs]);
	const choices = [...new Set(["server", "terminals", "dev", source, ...sources.map((entry) => entry.id)])];
	return (
		<Sheet title={t("sheet_title")} onClose={closeLayers} className="logs-sheet">
			<div className="logs-controls">
				<label className="label" htmlFor="logs-source">
					{t("source_label")}
				</label>
				<select
					id="logs-source"
					className="input"
					value={source}
					onChange={(event) => {
						const value = event.target.value;
						void nav.replace({
							...nav.route,
							layers: nav.route.layers.map((layer, index) =>
								index === nav.route.layers.length - 1 ? { kind: "sheet", name: "logs", locator: value } : layer,
							),
						});
					}}
				>
					{choices.map((id) => (
						<option key={id} value={id}>
							{sourceLabel(t, id)}
						</option>
					))}
				</select>
				<input
					className="input"
					aria-label={t("filter_aria")}
					placeholder={t("filter_placeholder")}
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
				/>
				<div className="logs-actions">
					<Switch label={t("follow_tail")} checked={follow} onChange={setFollow} />
					<button
						type="button"
						className="text-action"
						onClick={() => {
							void (
								navigator.clipboard?.writeText(text) ?? Promise.reject(new Error("Clipboard unavailable"))
							).then(
								() => setMessage(t("copied")),
								() => setMessage(t("copy_failed")),
							);
						}}
					>
						{t("copy")}
					</button>
				</div>
			</div>
			{message && <output className="notice">{message}</output>}
			<pre ref={area} className="logs-output" title={t("output_title")}>
				{text ||
					(status === "live"
						? t("no_lines")
						: status === "failed" || status === "ended"
							? t("unavailable")
							: t("loading"))}
			</pre>
		</Sheet>
	);
}

/** The Logs sheet while it is open (the owner): on its own (a session's logs), or as a page of Settings. */
function LogsSheetSlot() {
	const sheet = useSheet("logs");
	return useOwner() && sheet ? <LogsSheet source={sheet.locator ?? "server"} /> : null;
}

export default defineFacet((host) => {
	contribute(host, "p2.web-logs", (self) => {
		self.contribute(Translations, messages.translations);
		self.contribute(SettingsSections, { logs: { label: "Logs", order: 80, Sheet: LogsSheetSlot } });
	});
});
