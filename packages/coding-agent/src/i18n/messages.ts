/**
 * Typed message catalogs and the translator they produce.
 *
 * The English catalog is the source of truth: its keys and shapes define the translator's signature, so
 * `t("no_such_key")` and calling a function message without its params are compile errors. Every other
 * locale must declare at least the English keys (`Record<keyof En, MessageValue>`), so a translation that
 * drops a key is a compile error rather than a blank shown in production.
 */

import { getLocale } from "./i18n.ts";
import type { Catalog, Locale, MessageFn, MessageParams, MessageValue } from "./types.ts";

/** Keys whose message is a plain string. */
type StringKeys<En extends Catalog> = { [K in keyof En]: En[K] extends string ? K : never }[keyof En];

/** Keys whose message is a function of params. */
type FnKeys<En extends Catalog> = { [K in keyof En]: En[K] extends MessageFn ? K : never }[keyof En];

/** The translator a catalog produces: string keys read as-is, function keys read through their params. */
export interface Translator<En extends Catalog> {
	(key: StringKeys<En>, params?: MessageParams): string;
	(key: FnKeys<En>, params: MessageParams): string;
}

/** Substitute `{{name}}` placeholders in a plain message with their params. */
function interpolate(template: string, params: MessageParams): string {
	return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, name: string) => {
		const value = params[name];
		return value === undefined ? `{{${name}}}` : String(value);
	});
}

/**
 * Build a translator from one catalog per locale. The English catalog is the source of truth: it is inferred
 * as `En`, and every other locale must declare at least the English keys (`Record<keyof En, MessageValue>`),
 * so a dropped or mistyped translation is a compile error rather than a blank shown in production. Returns a
 * `t` that renders in the locale selected at runtime, falling back to English, then to the key, when missing.
 */
export function defineMessages<En extends Catalog>(
	catalogs: { en: En } & { [L in Exclude<Locale, "en">]: Record<keyof En, MessageValue> },
): Translator<En> {
	const resolved: Record<Locale, Catalog> = {} as Record<Locale, Catalog>;
	for (const locale of ["en", "zh"] as Locale[]) {
		resolved[locale] = catalogs[locale];
	}

	const translate = (key: string, params?: MessageParams): string => {
		const locale = getLocale();
		const catalog = resolved[locale];
		const value: MessageValue | undefined = catalog?.[key];
		const fallback: MessageValue | undefined = resolved.en[key];
		const chosen = value ?? fallback;
		if (chosen === undefined) return key;
		const finalParams = params ?? {};
		return typeof chosen === "function" ? chosen(finalParams) : interpolate(chosen, finalParams);
	};

	// The runtime resolves any key (missing or mistyped) by falling back to English, then to the key
	// itself, so it is safe to widen the signature to `string`; the cast restores the narrowed,
	// type-checked key set for callers.
	return translate as unknown as Translator<En>;
}
