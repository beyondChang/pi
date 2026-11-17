import { contribute, defineFacet, Translations } from "@p2/app/v1";
import {
	ChevronIcon,
	closeLayers,
	openLayer,
	SettingsSections,
	Slots,
	ToolActivities,
	useMessages,
	useOwner,
	useSheet,
} from "@p2/app/v1/web";
import { portsActivity } from "./activity.tsx";
import { messages } from "./messages.ts";
import { PortsPanel } from "./PortsPanel.tsx";

function PortsButton() {
	const { t } = useMessages(messages);
	return (
		<button className="row-button" type="button" onClick={() => openLayer({ kind: "sheet", name: "ports" })}>
			<span>{t("button_title")}</span>
			<small className="row-value">{t("button_subtitle")}</small>
			<ChevronIcon />
		</button>
	);
}
function PortsSheet() {
	const sheet = useSheet("ports");
	return useOwner() && sheet ? <PortsPanel onClose={closeLayers} /> : null;
}
export default defineFacet((host) => {
	contribute(host, "p2.web-ports", (self) => {
		self.contribute(Translations, messages.translations);
		self.contribute(SettingsSections, {
			ports: { label: "Ports", title: "Open dev servers through Radius", order: 40, Sheet: PortsSheet },
		});
		self.contribute(Slots, {
			"envs-actions:ports": PortsButton,
		});
		self.contribute(ToolActivities, { ports: portsActivity });
	});
});
