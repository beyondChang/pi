/**
 * Shared types for the pi CLI internationalization layer.
 *
 * Messages are typed catalogs written in code (not message files): the English catalog is the source of
 * truth and every other locale must declare the same keys with the same shape, so a missing translation, a
 * typo in a key or a wrong argument is a compile error rather than a blank shown in production.
 */

/** Parameters a message function receives, or the placeholders a plain string substitutes. */
export type MessageParams = Record<string, string | number>;

/** A message that needs plurals, parameter word order, or computed text builds it from params. */
export type MessageFn = (params: MessageParams) => string;

/** A message is either a plain string (with optional `{{placeholder}}` substitution) or a function of params. */
export type MessageValue = string | MessageFn;

/** One locale's worth of messages, keyed by message name. */
export type Catalog = Record<string, MessageValue>;

/** The languages pi ships built-in catalogs for, in display order. */
export const AVAILABLE_LOCALES = ["en", "zh"] as const;

export type Locale = (typeof AVAILABLE_LOCALES)[number];

/** Whether a string is one of the built-in locales. */
export function isLocale(value: string): value is Locale {
	return (AVAILABLE_LOCALES as readonly string[]).includes(value);
}
