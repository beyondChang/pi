// The Settings window's own sections, over settings.json, in the order its list shows them: shared by the window and
// the command menu's settings page. Each entry carries its message key; the renderer looks up the catalog.

/** The own sections; their ids are the window layer's locators. */
export const OWN_SECTIONS = [
	{ id: "general", label: "section_general" },
	{ id: "models", label: "section_models" },
	{ id: "agent", label: "section_agent" },
	{ id: "requests", label: "section_requests" },
	{ id: "compaction", label: "section_compaction" },
] as const;

export type OwnSection = (typeof OWN_SECTIONS)[number]["id"];
