import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { buildCorpus, WARNING, FONTS } from "./lib/corpus.js";

const root = resolve("test/fixtures/generated");
mkdirSync(root, { recursive: true });
const corpus = buildCorpus();
// This directory is generated-only. Remove obsolete PNGs so a renamed fixture
// cannot leave a mixed corpus; current images are overwritten by this run.
const expectedFiles = new Set(
  [...corpus.labels, ...corpus.typography].map((item) => `${item.id}.png`),
);
for (const file of readdirSync(root)) {
  if (file.endsWith(".png") && !expectedFiles.has(file))
    unlinkSync(resolve(root, file));
}
// Font aliases vary across hosts. Record the exact glyph/metric artifacts and face
// indices before rendering; a different hash means a different corpus environment.
const catalog = execFileSync("magick", ["-list", "font"], { encoding: "utf8" });
const fontRecords = new Map(
  catalog
    .split(/^\s*Font: /m)
    .slice(1)
    .map((section) => {
      const name = section.split("\n")[0].trim();
      const field = (key) =>
        section.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"))?.[1].trim();
      const artifact = (path) =>
        path && path !== "not defined"
          ? {
              path,
              sha256: createHash("sha256")
                .update(readFileSync(path))
                .digest("hex"),
            }
          : null;
      // Only inspect artifacts actually used by this corpus.
      return [
        name,
        () => ({
          name,
          faceIndex: field("index"),
          glyphs: artifact(field("glyphs")),
          metrics: artifact(field("metrics")),
        }),
      ];
    }),
);
const fontArtifacts = [
  ...new Set(FONTS.flatMap((font) => [font.regular, font.bold])),
].map((name) => {
  const record = fontRecords.get(name)?.();
  if (!record?.glyphs)
    throw new Error(`Missing reproducible font artifact: ${name}`);
  return record;
});
const argsForText = (
  text,
  x,
  y,
  size = 32,
  font = "Helvetica",
  fill = "#151515",
) => [
  "-font",
  font,
  "-pointsize",
  String(size),
  "-fill",
  fill,
  "-annotate",
  `+${x}+${y}`,
  text,
];
const wrap = (text, max = 66) => {
  const lines = [""];
  for (const word of text.split(" ")) {
    const last = lines.length - 1;
    if (lines[last] && lines[last].length + word.length + 1 > max)
      lines.push(word);
    else lines[last] += (lines[last] ? " " : "") + word;
  }
  return lines;
};
function render(id, args) {
  const file = `${id}.png`;
  execFileSync("magick", [...args, "-strip", resolve(root, file)]);
  const bytes = readFileSync(resolve(root, file));
  return {
    file,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
for (const item of corpus.typography) {
  const args = ["-size", "1500x440", "xc:white"];
  args.push(
    ...argsForText("GOVERNMENT WARNING:", 50, 90, item.size, item.font),
  );
  wrap(WARNING.split(": ")[1], 80).forEach((line, i) =>
    args.push(...argsForText(line, 50, 150 + i * 48, 28, item.bodyFont)),
  );
  Object.assign(item, render(item.id, args));
}
for (const item of corpus.labels) {
  const { observed: a, layout } = item;
  const palette = ["#ffffff", "#f4efe2", "#eaf0f4"][layout];
  const font = FONTS[(Number(item.design.slice(-2)) - 1) % FONTS.length];
  const args = ["-size", "1600x1200", `xc:${palette}`];
  const left = [70, 150, 100][layout];
  args.push(
    "-fill",
    "none",
    "-stroke",
    ["#33534b", "#75552d", "#304b71"][layout],
    "-strokewidth",
    "4",
    "-draw",
    "rectangle 30,30 1570,1170",
    "-stroke",
    "none",
  );
  const brand = item.multilineBrand
    ? a.brand.replace(/ (?!.* )/, "\n")
    : a.brand;
  args.push(...argsForText(brand, left, 140, 60, font.bold));
  args.push(...argsForText(a.type, left, 310, 40, font.regular));
  const alcohol =
    item.alcoholStyle === 0
      ? `${a.abv}% Alc./Vol.${item.beverage === "spirits" ? ` (${Number(a.abv) * 2} Proof)` : ""}`
      : item.alcoholStyle === 1
        ? `ABV: ${a.abv}%`
        : `${a.abv}% ABV`;
  args.push(...argsForText(alcohol, left, 390, 38, font.regular));
  args.push(...argsForText(a.volume, left, 460, 38, font.regular));
  args.push(
    ...argsForText(`Produced by ${a.producer}`, left, 550, 28, font.regular),
  );
  if (a.imported)
    args.push(
      ...argsForText(`Product of ${a.country}`, left, 610, 30, font.regular),
    );
  if (item.warning) {
    const split = item.warning.indexOf(":");
    args.push(
      ...argsForText(
        item.warning.slice(0, split + 1),
        80,
        735,
        34,
        item.headingBold ? font.bold : font.regular,
      ),
    );
    wrap(item.warning.slice(split + 2), 75).forEach((line, i) =>
      args.push(...argsForText(line, 80, 790 + i * 48, 29, font.regular)),
    );
  }
  args.push(
    ...argsForText(
      "SYNTHETIC TEST ARTWORK. NOT A COMMERCIAL PRODUCT.",
      80,
      1110,
      22,
    ),
  );
  if (item.variant === "blur") args.push("-blur", "0x9");
  if (item.variant === "glare")
    args.push("-fill", "white", "-draw", "rectangle 500,40 1200,1070");
  Object.assign(item, render(item.id, args));
}
writeFileSync(
  resolve(root, "manifest.json"),
  JSON.stringify(corpus, null, 2) + "\n",
);
const versions = {
  node: process.version,
  imagemagick: execFileSync("magick", ["-version"], { encoding: "utf8" }).split(
    "\n",
  )[0],
  fontArtifacts,
};
writeFileSync(
  resolve(root, "renderer.json"),
  JSON.stringify(versions, null, 2) + "\n",
);
console.log(
  `Generated ${corpus.labels.length} labels and ${corpus.typography.length} typography crops. No OCR or model verdicts generated.`,
);
