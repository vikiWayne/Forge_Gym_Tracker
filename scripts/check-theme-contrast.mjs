import { readFile } from "node:fs/promises";

const css = await readFile(
  new URL("../frontend/src/styles/tokens.css", import.meta.url),
  "utf8",
);
const blocks = css.split(':root[data-theme="dark"]');
const parse = (source) =>
  Object.fromEntries(
    [...source.matchAll(/--([\w-]+):\s*(#[\da-f]{6}|#[\da-f]{3});/gi)].map(
      (match) => [match[1], match[2]],
    ),
  );
const light = parse(blocks[0]);
const dark = { ...light, ...parse(blocks[1]) };
function luminance(color) {
  const hex = color.slice(1);
  const full =
    hex.length === 3 ? [...hex].map((part) => part + part).join("") : hex;
  const values = full
    .match(/../g)
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const pairs = [
  ["text", "background"],
  ["text", "surface"],
  ["text", "surface-soft"],
  ["text-muted", "background"],
  ["text-muted", "surface"],
  ["text-muted", "surface-soft"],
  ["text-muted", "surface-hover"],
  ["text-faint", "surface"],
  ["text-faint", "surface-soft"],
  ["primary-text", "primary"],
  ["primary-text", "primary-hover"],
  ["accent", "background"],
  ["accent", "surface"],
  ["accent-soft-text", "accent-soft"],
  ["accent-soft-text", "surface"],
  ["accent-soft-text", "surface-soft"],
  ["peach-text", "peach"],
  ["mint-text", "mint"],
  ["pink-text", "pink"],
  ["text", "accent-soft"],
  ["text", "mint"],
  ["text", "peach"],
  ["danger-text", "danger"],
  ["error-text", "error-bg"],
  ["success-text", "success-bg"],
  ["ready-text", "ready-bg"],
  ["story-text", "story-bg"],
  ["story-muted", "story-bg"],
  ["story-accent", "story-bg"],
  ["story-label-text", "story-label-bg"],
];
const graphics = [
  ["chart-primary", "surface"],
  ["chart-secondary", "surface"],
  ["chart-third", "surface"],
  ["control-border", "surface"],
  ["control-border", "surface-soft"],
  ["ready-border", "ready-bg"],
];
let failed = false;
for (const [name, palette] of Object.entries({ light, dark })) {
  const results = [
    ...pairs.map((pair) => ({ pair, minimum: 4.5 })),
    ...graphics.map((pair) => ({ pair, minimum: 3 })),
  ].map(({ pair, minimum }) => ({
    label: pair.join(" / "),
    ratio: contrast(palette[pair[0]], palette[pair[1]]),
    minimum,
  }));
  for (const result of results.filter((item) => item.ratio < item.minimum)) {
    console.error(
      `${name}: ${result.label}: ${result.ratio.toFixed(2)}:1, needs ${result.minimum}:1`,
    );
    failed = true;
  }
  const lowestText = Math.min(
    ...results.filter((item) => item.minimum === 4.5).map((item) => item.ratio),
  );
  const lowestGraphic = Math.min(
    ...results.filter((item) => item.minimum === 3).map((item) => item.ratio),
  );
  console.log(
    `${name}: ${results.length} pairs checked; lowest text ${lowestText.toFixed(2)}:1, lowest graphic ${lowestGraphic.toFixed(2)}:1.`,
  );
}
if (failed) process.exitCode = 1;
