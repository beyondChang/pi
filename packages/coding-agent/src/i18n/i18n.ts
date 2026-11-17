/**
 * The pi CLI's current language, held on `globalThis` like the active theme so every module instance
 * (Node and the dev jiti loader) reads the same value, and switched live without a restart.
 *
 * The language is a user preference read from settings (see `SettingsManager.getLanguage()`); when no
 * preference is set it is detected from the environment (`LC_ALL`/`LANG`/`LC_MESSAGES`) so a system in
 * Chinese starts in Chinese. An undetectable or unsupported environment falls back to English.
 */
import { AVAILABLE_LOCALES, isLocale, type Locale } from "./types.ts";

const LOCALE_KEY = Symbol.for("@earendil-works/pi-coding-agent:locale");

/** Notified when the active locale changes through {@link setLocale}, so the interface can re-render. */
let localeChangeCallback: (() => void) | undefined;

/** Register a listener fired after the active locale changes; returns the previous listener. */
export function onLocaleChange(callback: (() => void) | undefined): (() => void) | undefined {
	const previous = localeChangeCallback;
	localeChangeCallback = callback;
	return previous;
}

/**
 * Detect the initial locale from the process environment. Matches the system locale against the locales
 * built-in catalogs offer, preferring an exact tag and then the base language of a region tag
 * (`zh-CN` -> `zh`). Returns English when nothing matches.
 */
export function detectLocale(env: NodeJS.ProcessEnv = process.env): Locale {
	const raw = env.LC_ALL || env.LC_MESSAGES || env.LANG;
	if (raw) {
		const tag = raw.split(".")[0].split("@")[0].trim().toLowerCase();
		if (isLocale(tag)) return tag;
		const base = tag.split("-")[0];
		if (isLocale(base)) return base;
	}
	return "en";
}

/** The locale every `t()` renders in. Falls back to English before `initLocale()` runs. */
export function getLocale(): Locale {
	const stored = (globalThis as Record<symbol, Locale | undefined>)[LOCALE_KEY];
	return stored ?? "en";
}

/**
 * Set the active locale. An unknown or empty value is ignored (keeps the current locale) rather than
 * throwing, so a bad settings value cannot break startup. Notifies the registered locale-change
 * listeners so a live switch re-renders the interface without a restart.
 */
export function setLocale(locale: string): Locale {
	if (!isLocale(locale)) return getLocale();
	const previous = (globalThis as Record<symbol, Locale | undefined>)[LOCALE_KEY];
	(globalThis as Record<symbol, Locale>)[LOCALE_KEY] = locale;
	if (previous !== locale && localeChangeCallback) {
		localeChangeCallback();
	}
	return locale;
}

/**
 * Initialize the active locale. Called once at startup before any interface text is rendered; a
 * detected locale is applied unless the user has an explicit preference.
 */
export function initLocale(preference: string | undefined): Locale {
	return setLocale(preference && isLocale(preference) ? preference : detectLocale());
}

/** The built-in locales, for building a language selector. */
export function getAvailableLocales(): readonly Locale[] {
	return AVAILABLE_LOCALES;
}

/** A short, native label for each locale, shown in the language selector (these labels are not translated). */
export function getLocaleLabel(locale: Locale): string {
	return locale === "zh" ? "中文" : "English";
}
