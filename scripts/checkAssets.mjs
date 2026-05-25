import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const MOD_ROOT = path.join(PROJECT_ROOT, "mod");
const CONTENT_ROOT = path.join(MOD_ROOT, "content");
const RESOURCES_ROOT = path.join(MOD_ROOT, "resources");

function readContentXML(fileName) {
  return fs.readFileSync(path.join(CONTENT_ROOT, fileName), "utf8");
}

function getAttribute(tag, attributeName) {
  const match = tag.match(new RegExp(`\\b${attributeName}="([^"]*)"`));
  return match?.[1];
}

function getRootAttribute(xml, attributeName, fallback) {
  const rootTag = xml.match(/<\w+\b[^>]*>/u)?.[0];
  if (rootTag === undefined) {
    return fallback;
  }

  return getAttribute(rootTag, attributeName) ?? fallback;
}

function getTags(xml, tagNames) {
  const tagPattern = tagNames.join("|");
  const matches = xml.matchAll(new RegExp(`<(?:${tagPattern})\\b[^>]*>`, "gu"));

  return [...matches].map((match) => match[0]);
}

function toExpectedPath(...pathParts) {
  return path.normalize(path.join(...pathParts));
}

function collectItemIconReferences() {
  const source = "mod/content/items.xml";
  const xml = readContentXML("items.xml");
  const tags = getTags(xml, ["active", "familiar", "passive"]);
  const emptyReferences = [];
  const references = [];

  for (const tag of tags) {
    const label = getAttribute(tag, "name") ?? "(unnamed item)";
    const gfx = getAttribute(tag, "gfx");

    if (gfx === undefined || gfx === "") {
      emptyReferences.push({ label, source });
      continue;
    }

    references.push({
      label,
      source,
      expectedPath: toExpectedPath(
        RESOURCES_ROOT,
        "gfx",
        "items",
        "collectibles",
        gfx,
      ),
    });
  }

  return { emptyReferences, references };
}

function collectAnm2References(fileName, tagName, labelAttribute) {
  const source = `mod/content/${fileName}`;
  const xml = readContentXML(fileName);
  const anm2Root = getRootAttribute(xml, "anm2root", "");
  const tags = getTags(xml, [tagName]);

  return tags.flatMap((tag) => {
    const anm2Path = getAttribute(tag, "anm2path");
    if (anm2Path === undefined || anm2Path === "") {
      return [];
    }

    return [
      {
        source,
        label: getAttribute(tag, labelAttribute) ?? `(${tagName})`,
        expectedPath: toExpectedPath(RESOURCES_ROOT, anm2Root, anm2Path),
      },
    ];
  });
}

function collectSoundReferences() {
  const source = "mod/content/sounds.xml";
  const xml = readContentXML("sounds.xml");
  const soundRoot = getRootAttribute(xml, "root", "");
  const tags = getTags(xml, ["sample"]);

  return tags.flatMap((tag) => {
    const samplePath = getAttribute(tag, "path");
    if (samplePath === undefined || samplePath === "") {
      return [];
    }

    return [
      {
        source,
        label: samplePath,
        expectedPath: toExpectedPath(RESOURCES_ROOT, soundRoot, samplePath),
      },
    ];
  });
}

function formatRelative(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replaceAll(path.sep, "/");
}

const itemIcons = collectItemIconReferences();
const references = [
  ...itemIcons.references,
  ...collectAnm2References("costumes2.xml", "costume", "id"),
  ...collectAnm2References("entities2.xml", "entity", "name"),
  ...collectSoundReferences(),
];
const missingReferences = references.filter(
  (reference) => !fs.existsSync(reference.expectedPath),
);

console.log(`Checked ${references.length} referenced asset(s).`);

if (missingReferences.length === 0) {
  console.log("All referenced assets exist.");
} else {
  console.log(`Missing ${missingReferences.length} referenced asset(s):`);
  for (const reference of missingReferences) {
    console.log(
      `- ${reference.source}: ${reference.label} -> ${formatRelative(
        reference.expectedPath,
      )}`,
    );
  }
}

if (itemIcons.emptyReferences.length > 0) {
  console.log("Empty item gfx reference(s):");
  for (const reference of itemIcons.emptyReferences) {
    console.log(`- ${reference.source}: ${reference.label}`);
  }
}

console.log("Asset check is informational and does not fail the build.");
