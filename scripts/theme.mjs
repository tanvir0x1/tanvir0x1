import { readFileSync } from "node:fs";

// Jost (SIL Open Font License), embedded because GitHub blocks web fonts inside SVG images.
const font = (w) =>
  readFileSync(new URL(`./fonts/jost-latin-${w}-normal.woff2`, import.meta.url)).toString("base64");

export const C = {
  ink: "#0B1220", line: "#22344F", text: "#EAF2FB", mute: "#93A9C4",
  ice: "#36BCF7", blue: "#0A66C2", amber: "#FFB454",
};

export const fontCss =
  [500, 700]
    .map((w) => `@font-face{font-family:J;font-weight:${w};src:url(data:font/woff2;base64,${font(w)}) format("woff2")}`)
    .join("") +
  `text{font-family:J,"Segoe UI",Helvetica,Arial,sans-serif;font-weight:500}.b{font-weight:700}`;
