// Builds dist/stats.svg from the public contribution calendar.  Run: node scripts/stats.mjs <user>
// It counts exactly what a visitor sees, so private work is included once
// "Private contributions" is switched on in the profile's Contribution settings.
import { writeFileSync, mkdirSync } from "node:fs";
import { C, fontCss } from "./theme.mjs";

const user = process.argv[2] || process.env.GITHUB_REPOSITORY_OWNER;
const tz = process.env.STATS_TZ || "Asia/Dhaka";
if (!user) throw new Error("Pass a GitHub username.");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

async function get(url) {
  for (let i = 0; ; i++) {
    const headers = { "user-agent": "profile-stats", "accept-language": "en" };
    // The token only lifts the API rate limit on shared runners.
    if (url.startsWith("https://api.github.com/") && process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(url, { headers }).catch((e) => ({ status: e.message }));
    if (r.ok) return r.text();
    if (i === 3) throw new Error(`${url} failed: ${r.status}`);
    await new Promise((s) => setTimeout(s, 2000 * 2 ** i));
  }
}

async function year(y) {
  const html = await get(`https://github.com/users/${user}/contributions?from=${y}-01-01&to=${y}-12-31`);
  const tips = new Map(
    [...html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>\s*([\d,]+|No) contributions?/g)].map((m) => [
      m[1], m[2] === "No" ? 0 : Number(m[2].replace(/,/g, "")),
    ])
  );
  const cells = [...html.matchAll(/<td[^>]*\bdata-date="[^"]+"[^>]*>/g)].map(([td]) => ({
    date: td.match(/data-date="([^"]+)"/)[1],
    id: td.match(/\sid="([^"]+)"/)?.[1],
  }));
  // Stop rather than publish wrong numbers if GitHub ever changes this page.
  if (!cells.length || cells.some((c) => c.date <= today && !tips.has(c.id))) throw new Error(`Could not read the ${y} calendar.`);
  return cells.map((c) => ({ date: c.date, n: tips.get(c.id) ?? 0 }));
}

const profile = JSON.parse(await get(`https://api.github.com/users/${user}`));
const first = Number(profile.created_at.slice(0, 4));
const thisYear = Number(today.slice(0, 4));
const byDate = new Map();
for (let y = first; y <= thisYear; y++)
  for (const d of await year(y)) if (d.date <= today && d.date.startsWith(String(y))) byDate.set(d.date, d.n);
const days = [...byDate].map(([date, n]) => ({ date, n })).sort((a, b) => (a.date < b.date ? -1 : 1));

const sum = (a) => a.reduce((s, d) => s + d.n, 0);
const total = sum(days);
const perYear = [];
for (let y = first; y <= thisYear; y++) perYear.push([y, sum(days.filter((d) => d.date.startsWith(String(y))))]);
let longest = 0;
let run = 0;
for (const d of days) {
  run = d.n ? run + 1 : 0;
  longest = Math.max(longest, run);
}
// An empty today does not break the streak until the day is over.
let current = 0;
for (let i = days.length - 1 - (days.at(-1).n ? 0 : 1); i >= 0 && days[i].n; i--) current++;

const lastYear = sum(days.slice(-365));
const recent = days.slice(-371);
const weeks = [];
for (let i = recent.length; i > 0; i -= 7) weeks.unshift(recent.slice(Math.max(0, i - 7), i));
const peak = Math.max(1, ...weeks.map(sum));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const x0 = 40, bw = 820 / weeks.length, base = 292, h = 86;
let bars = "", labels = "", prev = "", lastX = -99;
weeks.forEach((w, i) => {
  const n = sum(w);
  const bh = n ? Math.max(5, (n / peak) * h) : 2;
  const x = x0 + i * bw;
  const fill = !n ? C.line : n === peak ? C.amber : "url(#v)";
  bars += `<rect class="bar" style="animation-delay:${(i * 0.018).toFixed(2)}s" x="${(x + 1.5).toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${fill}"/>`;
  const m = w.at(-1).date.slice(5, 7);
  if (m !== prev && x - lastX > 46 && x < 840) {
    labels += `<text x="${x.toFixed(1)}" y="316" font-size="14" fill="${C.mute}">${MON[m - 1]}</text>`;
    lastX = x;
  }
  prev = m;
});

const num = (n) => n.toLocaleString("en-US");
const plural = (n, w) => `${num(n)} ${w}${n === 1 ? "" : "s"}`;
const start = days.find((d) => d.n)?.date;
const since = start ? ` since ${MON[start.slice(5, 7) - 1]} ${start.slice(0, 4)}` : "";
const tile = (x, v, l, c) =>
  `<g class="in" style="animation-delay:.2s"><text x="${x}" y="84" font-size="38" class="b" fill="${c}">${v}</text><text x="${x}" y="112" font-size="17" fill="${C.mute}">${l}</text></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 340" role="img" aria-label="${plural(total, "total contribution")}, ${num(lastYear)} in the last 365 days, current streak ${plural(current, "day")}, longest streak ${plural(longest, "day")}">
<style>${fontCss}
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:g .9s cubic-bezier(.2,.8,.2,1) both}@keyframes g{from{transform:scaleY(0)}}
.in{animation:i .8s cubic-bezier(.2,.8,.2,1) both}@keyframes i{from{opacity:0;transform:translateY(12px)}}
.sw{animation:s 7s ease-in-out infinite}@keyframes s{0%,20%{transform:translateX(-300px)}80%,100%{transform:translateX(1000px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.sw{display:none}}
</style>
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${C.ink}"/><stop offset="1" stop-color="#0C2138"/></linearGradient>
<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.ice}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>
<linearGradient id="sh"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="r"><rect width="900" height="340" rx="18"/></clipPath></defs>
<g clip-path="url(#r)"><rect width="900" height="340" fill="url(#bg)"/><rect class="sw" width="260" height="340" fill="url(#sh)"/></g>
<rect x=".5" y=".5" width="899" height="339" rx="17.5" fill="none" stroke="${C.line}"/>
<g class="in"><text x="40" y="96" font-size="68" class="b" fill="${C.text}" letter-spacing="-2">${num(total)}</text><text x="42" y="128" font-size="18" fill="${C.mute}">total contributions${since}</text></g>
<path d="M352 40V132" stroke="${C.line}"/>
${tile(384, num(lastYear), "last 365 days", C.ice)}${tile(552, plural(current, "day"), "current streak", C.amber)}${tile(722, plural(longest, "day"), "longest streak", C.ice)}
<text x="42" y="178" font-size="16" fill="${C.mute}">${perYear.slice(-5).map(([y, n]) => `${y}: <tspan class="b" fill="${C.text}">${num(n)}</tspan>`).join("&#160;&#160;&#160;&#160;&#160;")}</text>
${bars}${labels}
</svg>`;
mkdirSync("dist", { recursive: true });
writeFileSync("dist/stats.svg", svg);
console.log(JSON.stringify({ today, total, perYear, lastYear, current, longest }));
