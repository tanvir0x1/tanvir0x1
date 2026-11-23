// Builds the static animated graphics in assets/.  Run: node scripts/build-assets.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { C, fontCss } from "./theme.mjs";

const out = new URL("../assets/", import.meta.url);
mkdirSync(out, { recursive: true });
const save = (name, svg) => writeFileSync(new URL(name, out), svg);

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const f = (n) => n.toFixed(1).replace(/\.0$/, "");
const FIFTH = (2 * Math.PI) / 5;

/* ---------- hero: a rotating geodesic sphere ---------- */
function geodesic() {
  const a = Math.atan(0.5);
  const v = [[0, 1, 0]];
  for (let i = 0; i < 5; i++) v.push([Math.cos(a) * Math.cos(i * FIFTH), Math.sin(a), Math.cos(a) * Math.sin(i * FIFTH)]);
  for (let i = 0; i < 5; i++) v.push([Math.cos(a) * Math.cos((i + 0.5) * FIFTH), -Math.sin(a), Math.cos(a) * Math.sin((i + 0.5) * FIFTH)]);
  v.push([0, -1, 0]);
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const verts = [...v];
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++)
      if (dist(v[i], v[j]) < 1.1) {
        const m = [0, 1, 2].map((k) => (v[i][k] + v[j][k]) / 2);
        const l = Math.hypot(...m);
        verts.push(m.map((x) => x / l));
      }
  const edges = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) if (dist(verts[i], verts[j]) < 0.64) edges.push([i, j]);
  return { verts, edges };
}

function sphere(cx, cy, R, dur) {
  const { verts, edges } = geodesic();
  const N = 12; // frames over 72 degrees; the solid repeats every 72 degrees, so the loop is seamless
  const tilt = 0.42;
  const frames = [];
  for (let k = 0; k <= N; k++) {
    const t = (k / N) * FIFTH;
    frames.push(
      verts.map(([x, y, z]) => {
        const X = x * Math.cos(t) + z * Math.sin(t);
        const Z = -x * Math.sin(t) + z * Math.cos(t);
        return [cx + X * R, cy - (y * Math.cos(tilt) - Z * Math.sin(tilt)) * R, y * Math.sin(tilt) + Z * Math.cos(tilt)];
      })
    );
  }
  const path = (p) => edges.map(([i, j]) => `M${f(p[i][0])} ${f(p[i][1])}L${f(p[j][0])} ${f(p[j][1])}`).join("");
  const anim = (attr, vals) =>
    `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" values="${vals.join(";")}"/>`;
  let s = `<path d="${path(frames[0])}" fill="none" stroke="${C.ice}" stroke-opacity=".34">${anim("d", frames.map(path))}</path>`;
  verts.forEach((_, i) => {
    const r = (z) => f(1.6 + (z + 1) * 1.5);
    const o = (z) => (0.2 + (z + 1) * 0.4).toFixed(2);
    const g = frames.map((p) => p[i]);
    s +=
      `<circle cx="${f(g[0][0])}" cy="${f(g[0][1])}" r="${r(g[0][2])}" fill="${C.text}" opacity="${o(g[0][2])}">` +
      anim("cx", g.map((p) => f(p[0]))) + anim("cy", g.map((p) => f(p[1]))) +
      anim("r", g.map((p) => r(p[2]))) + anim("opacity", g.map((p) => o(p[2]))) + `</circle>`;
  });
  return s;
}

const roles = ["LLM and RAG researcher", "Godot 4 game developer", "Full-stack web builder", "Android app developer"];
const slot = 3;
const stars = Array.from({ length: 60 }, () => {
  const b = rnd() > 0.7;
  return `<circle cx="${f(rnd() * 900)}" cy="${f(rnd() * 340)}" r="${b ? 1.4 : 0.8}" fill="#fff" opacity="${b ? 0.7 : 0.35}"${b ? ` class="tw" style="animation-delay:-${f(rnd() * 5)}s"` : ""}/>`;
}).join("");
const orbit = `<animateMotion dur="7s" repeatCount="indefinite" path="M542 168a166 44 0 1 1 332 0a166 44 0 1 1 -332 0"/>`;

save("hero.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 340" role="img" aria-label="Md. Obaidul Amin: ${roles.join(", ")}">
<style>${fontCss}
.tw{animation:tw 5s ease-in-out infinite}@keyframes tw{50%{opacity:.1}}
.role{opacity:0;animation:role ${roles.length * slot}s infinite}
@keyframes role{0%{opacity:0;transform:translateY(14px)}2.5%,21%{opacity:1;transform:none}24%,100%{opacity:0;transform:translateY(-14px)}}
.in{animation:in .9s cubic-bezier(.2,.8,.2,1) both}@keyframes in{from{opacity:0;transform:translateY(18px)}}
.bar{transform-origin:56px 0;animation:bar 1.1s .5s cubic-bezier(.2,.8,.2,1) both}@keyframes bar{from{transform:scaleX(0)}}
.orb{animation:pulse 4s ease-in-out infinite}@keyframes pulse{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.r0{opacity:1}}
</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${C.ink}"/><stop offset=".6" stop-color="#0C2138"/><stop offset="1" stop-color="#0A3B66"/></linearGradient>
<radialGradient id="glow"><stop stop-color="${C.ice}" stop-opacity=".42"/><stop offset=".55" stop-color="${C.blue}" stop-opacity=".2"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/></radialGradient>
<clipPath id="r"><rect width="900" height="340" rx="18"/></clipPath>
</defs>
<g clip-path="url(#r)">
<rect width="900" height="340" fill="url(#bg)"/>${stars}
<circle class="orb" cx="708" cy="168" r="210" fill="url(#glow)"/>
${sphere(708, 168, 112, 9)}
<g transform="rotate(-18 708 168)" fill="none">
<ellipse cx="708" cy="168" rx="166" ry="44" stroke="${C.amber}" stroke-opacity=".45" stroke-dasharray="2 7"/>
<circle r="6" fill="${C.amber}">${orbit}</circle><circle r="13" fill="${C.amber}" opacity=".22">${orbit}</circle>
</g>
<text class="in" x="54" y="112" font-size="28" fill="${C.mute}">Hi, I'm</text>
<text class="in b" style="animation-delay:.12s" x="52" y="172" font-size="56" fill="${C.text}" letter-spacing="-1">Md. Obaidul Amin</text>
<rect class="bar" x="56" y="194" width="84" height="4" rx="2" fill="${C.amber}"/>
${roles.map((r, i) => `<text class="role r${i}" style="animation-delay:${i * slot}s" x="54" y="244" font-size="30" fill="${C.ice}">${r}</text>`).join("\n")}
<text class="in" style="animation-delay:.3s" x="54" y="286" font-size="20" fill="${C.mute}">Turning curious questions into working software.</text>
</g></svg>`);

/* ---------- Aether Clash banner ---------- */
const ridge = (base, amp, step, n) => {
  let d = "M-60 260";
  for (let i = 0; i <= n; i++) d += `L${f(-60 + i * step)} ${f(base - (i % 2 ? amp * (0.55 + rnd() * 0.45) : amp * rnd() * 0.3))}`;
  return d + "L1000 260Z";
};
const powers = [
  ["Fire", "#FF6B14", "M0-17C3-9 11-6 11 4A11 12 0 0 1-11 4C-11-2-6-3-5-9C-2-7-1-4-1-2C2-6 2-11 0-17Z", 0],
  ["Lightning", "#FFDB40", "M3-17L-11 3H-2L-5 17L11-5H2Z", 0],
  ["Ice", "#59CCFF", "M0-17L13 0L0 17L-13 0ZM0-17V17M-13 0H13", 1],
  ["Wind", "#4DFF80", "M-15-5H5A5 5 0 1 0 0-11M-15 2H10A5 5 0 1 1 5 8M-11 9H-1A4 4 0 1 1-5 14", 1],
  ["Shadow", "#AD4DFF", "M5-16A16 16 0 1 0 15 8A13 13 0 0 1 5-16Z", 0],
];
const embers = Array.from({ length: 16 }, () =>
  `<circle class="em" style="animation-delay:-${f(rnd() * 6)}s" cx="${f(380 + rnd() * 500)}" cy="${f(190 + rnd() * 50)}" r="${f(1 + rnd() * 1.4)}" fill="#FFD9A0"/>`).join("");

save("aether-clash.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" role="img" aria-label="Aether Clash, an online 3D arena for up to 8 players, built in Godot 4">
<style>${fontCss}
.fl{animation:fl 4s ease-in-out infinite}@keyframes fl{50%{transform:translateY(-9px)}}
.gl{animation:gl 2.6s ease-in-out infinite}@keyframes gl{50%{opacity:.15}}
.m1{animation:m 26s ease-in-out infinite alternate}.m2{animation:m 16s ease-in-out infinite alternate-reverse}@keyframes m{from{transform:translateX(-22px)}to{transform:translateX(22px)}}
.em{animation:em 6s linear infinite}@keyframes em{0%{opacity:0;transform:none}15%{opacity:.9}100%{opacity:0;transform:translate(26px,-150px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1A1533"/><stop offset=".5" stop-color="#6B2E4E"/><stop offset="1" stop-color="#F08A4B"/></linearGradient>
<linearGradient id="shade"><stop stop-color="#120D22" stop-opacity=".88"/><stop offset=".62" stop-color="#120D22" stop-opacity=".25"/><stop offset="1" stop-color="#120D22" stop-opacity="0"/></linearGradient>
<radialGradient id="sun"><stop stop-color="#FFE2A8"/><stop offset=".35" stop-color="#FFC06B" stop-opacity=".75"/><stop offset="1" stop-color="#FFC06B" stop-opacity="0"/></radialGradient>
<clipPath id="r"><rect width="900" height="240" rx="18"/></clipPath>
</defs>
<g clip-path="url(#r)"><rect width="900" height="240" fill="url(#sky)"/>
<circle cx="640" cy="176" r="130" fill="url(#sun)"/>
<path class="m1" d="${ridge(190, 78, 46, 23)}" fill="#4A2445"/><path class="m2" d="${ridge(226, 66, 38, 28)}" fill="#24152F"/>
<rect width="900" height="240" fill="url(#shade)"/>${embers}
<text x="44" y="92" class="b" font-size="54" fill="#fff" letter-spacing="-1">Aether Clash</text>
<text x="46" y="132" font-size="24" fill="#FFE3C2">Online 3D arena for up to 8 players</text>
<text x="46" y="166" font-size="20" fill="#F3B98B">Godot 4.7, GDScript, ENet multiplayer</text>
${powers.map(([n, c, d, line], i) => `<g transform="translate(${478 + i * 91} ${[116, 98, 90, 98, 116][i]})"><g class="fl" style="animation-delay:-${f(i * 0.8)}s"><circle class="gl" style="animation-delay:-${f(i * 0.5)}s" r="40" fill="${c}" opacity=".42"/><circle r="30" fill="#150F26" stroke="${c}" stroke-width="2"/><path d="${d}" ${line ? `fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"` : `fill="${c}"`}/><text y="60" font-size="17" text-anchor="middle" fill="#fff">${n}</text></g></g>`).join("\n")}
</g></svg>`);

/* ---------- divider and footer ---------- */
save("divider.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 14" aria-hidden="true">
<defs><linearGradient id="l"><stop stop-color="${C.ice}" stop-opacity="0"/><stop offset=".5" stop-color="${C.ice}"/><stop offset="1" stop-color="${C.ice}" stop-opacity="0"/></linearGradient></defs>
<style>.s{animation:s 5s ease-in-out infinite}@keyframes s{0%{transform:translateX(-240px)}100%{transform:translateX(900px)}}@media (prefers-reduced-motion:reduce){.s{animation:none;transform:translateX(330px)}}</style>
<rect y="6.5" width="900" height="1" fill="#7D8FA8" opacity=".3"/><rect class="s" y="6" width="240" height="2" rx="1" fill="url(#l)"/></svg>`);

// Wave period is 450 units, so sliding by 450 loops without a jump.
const wave = (y, a) => `M-900 ${y}q112.5 ${-a} 225 0${"t225 0".repeat(8)}V130H-900Z`;
save("footer.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 120" aria-hidden="true">
<style>.w1{animation:w 11s linear infinite}.w2{animation:w 17s linear infinite reverse}.w3{animation:w 8s linear infinite}@keyframes w{to{transform:translateX(450px)}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<clipPath id="r"><path d="M0 0H900V102A18 18 0 0 1 882 120H18A18 18 0 0 1 0 102Z"/></clipPath>
<g clip-path="url(#r)"><path class="w2" d="${wave(52, 34)}" fill="${C.ice}" opacity=".25"/><path class="w1" d="${wave(66, 30)}" fill="${C.blue}" opacity=".6"/><path class="w3" d="${wave(84, 22)}" fill="#0A3B66"/></g></svg>`);
