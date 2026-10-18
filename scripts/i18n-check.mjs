#!/usr/bin/env node
/**
 * Validates message files against English (the schema source of truth).
 * Exits 1 on any error, so it can gate CI.
 *
 * Errors
 *   - missing / extra namespace files or keys per locale
 *   - {placeholder} sets that differ from English
 *   - empty strings
 *   - strings identical to English in another locale, unless allow-listed in
 *     scripts/i18n-allowlist.json (TODO: placeholders are reported, not failed)
 *   - src/proxy.ts matcher out of sync with the locales in src/i18n/config.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const messagesDir = path.join(root, "src/messages");
const SOURCE = "en";

const errors = [];
const notes = [];

function readLocales() {
  const config = fs.readFileSync(path.join(root, "src/i18n/config.ts"), "utf8");
  const match = config.match(/export const locales = \[([^\]]+)\]/);
  if (!match) throw new Error("Could not find `locales` in src/i18n/config.ts");
  return [...match[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
}

function flatten(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => {
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") return flatten(value, id);
    return [[id, value]];
  });
}

function loadLocale(locale) {
  const dir = path.join(messagesDir, locale);
  if (!fs.existsSync(dir)) return null;
  const namespaces = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""));
  const entries = new Map();
  for (const ns of namespaces) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, `${ns}.json`), "utf8"));
    for (const [key, value] of flatten(json, ns)) entries.set(key, value);
  }
  return { namespaces: new Set(namespaces), entries };
}

const placeholders = (value) => new Set([...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

const locales = readLocales();
const allowlist = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/i18n-allowlist.json"), "utf8"),
);
const allowed = (key, locale) => {
  const rule = allowlist[key];
  return rule === "*" || (Array.isArray(rule) && rule.includes(locale));
};

const source = loadLocale(SOURCE);
if (!source) {
  process.stderr.write(`No ${SOURCE} messages found in src/messages/${SOURCE}\n`);
  process.exit(1);
}

for (const [key, value] of source.entries) {
  if (typeof value !== "string") errors.push(`${SOURCE}: ${key} is not a string`);
  else if (value.trim() === "") errors.push(`${SOURCE}: ${key} is empty`);
}

for (const locale of locales.filter((l) => l !== SOURCE)) {
  const target = loadLocale(locale);
  if (!target) {
    errors.push(`${locale}: missing folder src/messages/${locale}`);
    continue;
  }
  for (const ns of source.namespaces) {
    if (!target.namespaces.has(ns)) errors.push(`${locale}: missing namespace file ${ns}.json`);
  }
  for (const ns of target.namespaces) {
    if (!source.namespaces.has(ns)) errors.push(`${locale}: extra namespace file ${ns}.json`);
  }

  let todo = 0;
  for (const [key, english] of source.entries) {
    if (!target.entries.has(key)) {
      errors.push(`${locale}: missing key ${key}`);
      continue;
    }
    const value = target.entries.get(key);
    if (typeof value !== "string") {
      errors.push(`${locale}: ${key} is not a string`);
      continue;
    }
    if (value.trim() === "") errors.push(`${locale}: ${key} is empty`);
    if (!sameSet(placeholders(english), placeholders(value))) {
      errors.push(
        `${locale}: ${key} placeholders {${[...placeholders(value)].join(", ")}} differ from ${SOURCE} {${[...placeholders(english)].join(", ")}}`,
      );
    }
    if (value === english) {
      if (value.startsWith("TODO:")) todo++;
      else if (!allowed(key, locale)) {
        errors.push(
          `${locale}: ${key} is identical to ${SOURCE} ("${value}"); translate it or allow-list it`,
        );
      }
    }
  }
  for (const key of target.entries.keys()) {
    if (!source.entries.has(key)) errors.push(`${locale}: extra key ${key}`);
  }
  if (todo > 0) notes.push(`${locale}: ${todo} TODO: placeholder(s) awaiting real copy`);
}

for (const key of Object.keys(allowlist)) {
  if (!source.entries.has(key)) errors.push(`allowlist: unknown key ${key}`);
}

// The proxy matcher must be a literal, so it repeats the locale list.
const proxy = fs.readFileSync(path.join(root, "src/proxy.ts"), "utf8");
const group = proxy.match(/\(\?:([a-z|]+)\)\(\?:\/\|\$\)/);
if (!group) errors.push("src/proxy.ts: could not find the locale group in the matcher");
else if (!sameSet(new Set(group[1].split("|")), new Set(locales))) {
  errors.push(
    `src/proxy.ts: matcher locales (${group[1]}) differ from config (${locales.join("|")})`,
  );
}

for (const note of notes) process.stdout.write(`note  ${note}\n`);
if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`error ${error}\n`);
  process.stderr.write(`\ni18n:check failed with ${errors.length} error(s).\n`);
  process.exit(1);
}
process.stdout.write(
  `i18n:check passed: ${locales.length} locales, ${source.entries.size} keys each.\n`,
);
