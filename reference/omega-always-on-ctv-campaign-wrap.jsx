import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceArea, Cell, ZAxis
} from "recharts";
import {
  Database, Download, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Info, X, BookOpen
} from "lucide-react";

/* ============================================================================
   STELLAR MEDIA — CAMPAIGN WRAP
   Lightning component, Campaign record page: Omega Always-On CTV (CMP-1002)
   Scope: this campaign only. Account roll-up lives on the Omega, Inc. record.
   ========================================================================== */

const C = {
  canvas: "#F3F3F3", card: "#FFFFFF", border: "#E5E5E5", rule: "#DDDBDA",
  ink: "#181818", ink2: "#3E3E3C", muted: "#706E6B",
  blue: "#0176D3", blueDark: "#014486", blueSoft: "#EEF4FF",
  green: "#2E844A", greenSoft: "#EBF7ED",
  amber: "#FE9339", amberSoft: "#FEF5E9",
  red: "#EA001E", redSoft: "#FEF1F1",
  t10: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
        "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"],
};
const FONT = "'Salesforce Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const TNUM = { fontVariantNumeric: "tabular-nums" };

const usd = (n, d = 0) =>
  Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(d === 0 ? 2 : d)}M`
  : Math.abs(n) >= 1e3 ? `$${Math.round(n / 1e3)}K`
  : `$${Math.round(n)}`;
const usdFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B`
  : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
  : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K`
  : `${Math.round(n)}`;
const pct = (n, d = 1) => `${n.toFixed(d)}%`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- broadcast calendar: FY26 through Q3 close ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK0 = Date.UTC(2026, 0, 3);
const WEEKS = Array.from({ length: 39 }, (_, i) => {
  const d = new Date(WEEK0 + i * 7 * 86400000);
  return {
    idx: i + 1, label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
    month: d.getUTCMonth(), quarter: i < 13 ? 1 : i < 26 ? 2 : 3,
  };
});


/* ---------- the campaign record ---------- */
const CAMPAIGN = {
  name: "Omega Always-On CTV",
  sfId: "701Rx00000PMk42",
  number: "CMP-1002",
  account: "Omega, Inc.",
  accountId: "ACT-004821",
  type: "Streaming / CTV",
  objective: "Reach",
  dealType: "Direct IO",
  status: "Completed — in wrap",
  owner: "Jennifer Smith",
  ops: "Priya Raghunathan",
  agency: "Meridian Collective (Omega AOR)",
  io: "IO-26-0417",
  flight: "Jan 3 – Sep 26, 2026",
  weeks: 39,
  budget: 1_020_000,
  cpm: 47.55,
  impGuarantee: 21_000_000,
  reachGoalInTarget: 7_000_000,
  otGuarantee: 70,
  vcrBenchmark: 90,
  category: "Auto",
};

/* ---------- line items (Salesforce Order Products) — budgets sum to $1,020K ---------- */
const LINE_ITEMS = [
  { id:"OLI-1", n:"CTV — Premium Originals (Stellar+)", b:340_000, cpm:54, del:102, vcr:96, vw:91, ot:92, ctr:0.41, cvr:3.1, lift:7.4, ir:44, env:"Smart TV" },
  { id:"OLI-2", n:"CTV — Sports Live (Stellar Sports Live)", b:230_000, cpm:62, del:104, vcr:97, vw:93, ot:94, ctr:0.38, cvr:3.4, lift:8.1, ir:49, env:"Smart TV" },
  { id:"OLI-3", n:"FAST — StellarNOW Auto & Lifestyle", b:180_000, cpm:38, del:105, vcr:92, vw:86, ot:87, ctr:0.47, cvr:2.3, lift:5.2, ir:38, env:"Smart TV" },
  { id:"OLI-4", n:"CTV — News Catch-Up", b:120_000, cpm:44, del:101, vcr:93, vw:87, ot:85, ctr:0.43, cvr:2.0, lift:4.6, ir:33, env:"Smart TV" },
  { id:"OLI-5", n:"Connected Mobile — Stellar+ app", b:95_000, cpm:36, del:103, vcr:89, vw:82, ot:80, ctr:0.62, cvr:1.8, lift:3.1, ir:26, env:"Mobile" },
  { id:"OLI-6", n:"PG — Auto Intender deal (PMP)", b:55_000, cpm:41, del:99, vcr:91, vw:85, ot:93, ctr:0.52, cvr:3.6, lift:6.8, ir:41, env:"Mixed" },
];

/* ---------- creative variants — share of delivery sums to 100% ---------- */
const CREATIVES = [
  { id:"CR-1", n:"Ridgeline Hero", len:30, s:1,  e:39, share:38, vcr:93, vw:89, cvr0:3.4, cvrEnd:1.6, fatigue:true,
    note:"Carried the flight and fatigued from week 20. Conversion rate more than halved while delivery held flat." },
  { id:"CR-2", n:"Ridgeline Cutdown", len:15, s:1,  e:39, share:26, vcr:97, vw:90, cvr0:2.7, cvrEnd:2.4, fatigue:false,
    note:"The steadiest performer. Fifteen seconds completed nine points higher than the thirty and held its conversion rate across all 39 weeks." },
  { id:"CR-3", n:"Model Year Offer", len:30, s:6,  e:20, share:16, vcr:92, vw:88, cvr0:3.1, cvrEnd:2.5, fatigue:true,
    note:"Offer-led cut, retired on schedule at week 20. Strongest first six weeks of any creative in the flight." },
  { id:"CR-4", n:"Winter Capability", len:15, s:1,  e:12, share:11, vcr:96, vw:90, cvr0:2.2, cvrEnd:1.9, fatigue:false,
    note:"Seasonal cut, flighted to the winter window only. Modest conversion, strong completion." },
  { id:"CR-5", n:"Summer Drive Event", len:15, s:22, e:34, share:9,  vcr:95, vw:89, cvr0:3.0, cvrEnd:2.7, fatigue:false,
    note:"Introduced at week 22 to relieve Hero fatigue. Returned the flight's second-best conversion rate on 9% of delivery." },
];

/* ---------- device & app environment — share of delivery sums to 100% ---------- */
const DEVICES = [
  { id:"DV-1", n:"Smart TV (native app)", share:41, vcr:96, vw:92, ot:91, cvr:3.2, freq:3.4, apps:"Roku · Fire TV · Samsung · Vizio" },
  { id:"DV-2", n:"Streaming stick / box", share:23, vcr:95, vw:91, ot:90, cvr:3.0, freq:3.1, apps:"Roku stick · Apple TV · Chromecast" },
  { id:"DV-3", n:"Game console", share:12, vcr:94, vw:90, ot:88, cvr:2.6, freq:2.8, apps:"PlayStation · Xbox" },
  { id:"DV-4", n:"Connected mobile", share:16, vcr:89, vw:82, ot:80, cvr:1.8, freq:4.6, apps:"Stellar+ iOS · Android" },
  { id:"DV-5", n:"Desktop / laptop web", share:8,  vcr:85, vw:76, ot:74, cvr:1.3, freq:2.2, apps:"stellar.com player" },
];

/* ---------- audience segments reached by THIS campaign — composition sums to 100% ---------- */
const SEGMENTS = [
  { n:"In-Market Truck & SUV", type:"Stellar 1P", index:171, ot:94, comp:11.4, ecpm:58, vcr:96, vw:92, cvr:4.1, lift:8.6, reach:1.21 },
  { n:"Auto Intenders", type:"Stellar 1P", index:163, ot:92, comp:18.2, ecpm:52, vcr:95, vw:91, cvr:3.7, lift:7.9, reach:1.94 },
  { n:"Sports Loyalists", type:"Stellar 1P", index:154, ot:91, comp:9.8, ecpm:56, vcr:97, vw:93, cvr:3.4, lift:7.2, reach:1.02 },
  { n:"Omega CRM match", type:"1P match", index:149, ot:95, comp:6.1, ecpm:61, vcr:94, vw:90, cvr:4.4, lift:5.1, reach:0.58 },
  { n:"Premium Streamers", type:"Stellar 1P", index:141, ot:88, comp:12.6, ecpm:49, vcr:95, vw:90, cvr:2.9, lift:6.4, reach:1.33 },
  { n:"HHI $100K+", type:"3P verified", index:124, ot:84, comp:8.3, ecpm:44, vcr:93, vw:88, cvr:2.5, lift:5.3, reach:1.09 },
  { n:"A25-54", type:"Nielsen demo", index:112, ot:81, comp:12.1, ecpm:41, vcr:92, vw:87, cvr:2.1, lift:4.2, reach:1.62 },
  { n:"Early Adopters", type:"Stellar 1P", index:106, ot:78, comp:3.2, ecpm:46, vcr:91, vw:86, cvr:1.9, lift:3.8, reach:0.44 },
  { n:"A18-49", type:"Nielsen demo", index:98, ot:76, comp:7.4, ecpm:39, vcr:90, vw:85, cvr:1.6, lift:3.1, reach:1.01 },
  { n:"Auto Intender lookalike", type:"Lookalike", index:91, ot:72, comp:4.6, ecpm:34, vcr:88, vw:83, cvr:1.4, lift:2.4, reach:0.69 },
  { n:"P35+ Broad Reach", type:"Nielsen demo", index:77, ot:68, comp:4.4, ecpm:29, vcr:86, vw:79, cvr:1.0, lift:1.6, reach:0.88 },
  { n:"Run-of-network remnant", type:"Untargeted", index:58, ot:44, comp:1.9, ecpm:19, vcr:81, vw:71, cvr:0.5, lift:0.3, reach:0.41 },
];

/* ---------- outcomes ---------- */
const OUTCOMES = {
  reachDelivered: 9_170_000,
  reachIncremental: 3_760_000,
  incrementalPct: 41.0,
  linearOverlap: 5_410_000,
  omegaLinearReach: 14_200_000,
  dedupTotal: 17_960_000,
  conversions: 94_600,
  convGoal: 78_000,
  cpa: 10.78,
  cpaTarget: 14.0,
  liftPts: 6.2,
  liftBenchmark: 3.0,
  funnel: [
    { stage:"Aided awareness", exposed:47.2, control:38.9 },
    { stage:"Brand favorability", exposed:31.6, control:25.4 },
    { stage:"Purchase consideration", exposed:22.8, control:17.1 },
    { stage:"Dealer visit intent", exposed:11.4, control:7.9 },
  ],
  rfCurve: Array.from({ length: 12 }, (_, i) => {
    const f = i + 1;
    return {
      freq: f,
      campaign: +(9.17 * (1 - Math.exp(-0.47 * f))).toFixed(2),
      withLinear: +(17.96 * (1 - Math.exp(-0.39 * f))).toFixed(2),
    };
  }),
};

/* ---------- optimization log ---------- */
const TIMELINE = [
  { w:1,  kind:"launch",  t:"Flight launch",
    d:"Six line items live across Stellar+, Sports Live, StellarNOW and the Stellar+ mobile app. Frequency capped at 4 per week." },
  { w:6,  kind:"opt",     t:"Frequency cap lowered 4 → 3 per week",
    d:"Week-5 reporting showed 19% of delivery landing above a 4× weekly frequency. Lowering the cap moved that impression volume into unduplicated reach." },
  { w:12, kind:"opt",     t:"Budget reweighted toward Auto Intenders",
    d:"Shifted roughly $84K of remaining budget out of broad A18-49 into Auto Intenders and In-Market Truck & SUV. On-target delivery rose eight points over the following four weeks." },
  { w:20, kind:"alert",   t:"Ridgeline Hero fatigue detected",
    d:"Conversion rate on the :30 Hero cut fell below 2.0% for the first time while delivery and completion held flat. Flagged to the agency the same week." },
  { w:22, kind:"opt",     t:"Summer Drive Event cut introduced",
    d:"New :15 added to relieve Hero fatigue. It returned the flight's second-best conversion rate on 9% of total delivery." },
  { w:20, kind:"opt",     t:"Model Year Offer retired on schedule",
    d:"Offer-led :30 ended at its contracted window. No extension requested." },
  { w:31, kind:"opt",     t:"Auto Intender PMP added",
    d:"$55K moved into a programmatic guaranteed deal against the Auto Intender segment. Highest conversion rate of any line item at 3.6%." },
  { w:39, kind:"close",   t:"Flight close",
    d:"Delivered 102.1% of the impression guarantee and 131% of the in-target reach goal. No make-good owed." },
];

/* ---------- weekly fact table: line item × week is the atomic grain ---------- */
const FACTS = [];
LINE_ITEMS.forEach((li) => {
  const r = rng(li.id + "w");
  const raw = [];
  for (let w = 1; w <= 39; w++) {
    // always-on with a soft ramp, an auto-category lift in spring, and the
    // week-12 reweighting that moved budget between line items
    const ramp = 0.84 + 0.32 * Math.min(1, w / 5);
    const season = 1 + (w >= 8 && w <= 15 ? 0.22 : 0) + (w >= 30 ? 0.16 : 0);
    const reweight = li.ot >= 90 ? (w >= 12 ? 1.14 : 0.93) : (w >= 12 ? 0.88 : 1.06);
    const pmp = li.id === "OLI-6" ? (w < 31 ? 0.12 : 2.9) : 1;
    raw.push({ w, wt: ramp * season * reweight * pmp * (0.9 + r() * 0.2) });
  }
  const tot = raw.reduce((s, x) => s + x.wt, 0);
  raw.forEach(({ w, wt }) => {
    const share = wt / tot;
    const rev = li.b * share;
    const j = (k) => (rng(li.id + w + k)() - 0.5);
    const vw = clamp(li.vw + j("v") * 4, 50, 97);
    const vcr = clamp(li.vcr + j("c") * 3, 60, 99);
    // the week-12 reweighting lifts on-target delivery across the campaign
    const otAdj = w >= 12 ? 3.2 : -2.1;
    const ot = clamp(li.ot + otAdj + j("o") * 3, 35, 97);
    const del = li.del + j("d") * 5;
    const imps = (rev / li.cpm) * 1000;
    FACTS.push({
      li: li.id, w, rev, imps,
      measured: imps * 0.96,
      viewable: imps * 0.96 * (vw / 100),
      completes: imps * (vcr / 100),
      inTarget: imps * (ot / 100),
      clicks: imps * (li.ctr / 100),
      vw, vcr, ot, del,
    });
  });
});

/* weekly campaign totals — every breakdown reconciles to these */
const WEEKLY = WEEKS.map((wk) => {
  const rows = FACTS.filter((f) => f.w === wk.idx);
  const t = rows.reduce((s, f) => ({
    rev: s.rev + f.rev, imps: s.imps + f.imps, measured: s.measured + f.measured,
    viewable: s.viewable + f.viewable, completes: s.completes + f.completes,
    inTarget: s.inTarget + f.inTarget, clicks: s.clicks + f.clicks,
  }), { rev:0, imps:0, measured:0, viewable:0, completes:0, inTarget:0, clicks:0 });
  return { ...wk, w: wk.idx, ...t };
});

/* creative allocation: shares renormalized over whichever cuts are live that week */
const CREATIVE_WEEK = [];
WEEKLY.forEach((wk) => {
  const live = CREATIVES.filter((c) => wk.idx >= c.s && wk.idx <= c.e);
  const denom = live.reduce((s, c) => s + c.share, 0);
  live.forEach((c) => {
    const share = c.share / denom;
    const prog = (wk.idx - c.s) / Math.max(1, c.e - c.s);
    // fatigue curves bend conversion down over the cut's own life
    const cvr = c.fatigue
      ? c.cvr0 + (c.cvrEnd - c.cvr0) * Math.pow(prog, 0.75)
      : c.cvr0 + (c.cvrEnd - c.cvr0) * prog;
    const imps = wk.imps * share;
    CREATIVE_WEEK.push({
      cr: c.id, w: wk.idx, imps, rev: wk.rev * share,
      completes: imps * (c.vcr / 100), viewable: imps * 0.96 * (c.vw / 100),
      measured: imps * 0.96, cvr,
      conversions: imps * (cvr / 100) * 0.1,
    });
  });
});

/* device allocation: fixed mix with a small drift toward big screens over the flight */
const DEVICE_WEEK = [];
WEEKLY.forEach((wk) => {
  const drift = (wk.idx - 20) / 19; // −1 .. +1
  const adj = DEVICES.map((d) => {
    const big = d.id === "DV-1" || d.id === "DV-2";
    const small = d.id === "DV-4" || d.id === "DV-5";
    return { d, s: d.share * (1 + (big ? 0.07 : small ? -0.14 : 0) * drift) };
  });
  const denom = adj.reduce((s, x) => s + x.s, 0);
  adj.forEach(({ d, s }) => {
    const share = s / denom;
    const imps = wk.imps * share;
    DEVICE_WEEK.push({
      dv: d.id, w: wk.idx, imps, rev: wk.rev * share,
      completes: imps * (d.vcr / 100), viewable: imps * 0.96 * (d.vw / 100),
      measured: imps * 0.96, inTarget: imps * (d.ot / 100),
      conversions: imps * (d.cvr / 100) * 0.1,
    });
  });
});

/* ---------- internal-only commercials ---------- */
const COMMERCIAL = {
  grossBooked: 1_020_000,
  overDelivered: 450_441,      // impressions delivered above guarantee, unbilled
  overDeliveredValue: 23_000,
  credits: 0,
  aduLiability: 0,
  netBillable: 1_020_000,
  discrepancy: 2.8,
  discrepancyThreshold: 10,
  effectiveYield: 47.55,
  rateCard: 52.0,
  fillRate: 97.4,
};

const DICTIONARY = [
  { title: "Delivery & quality", rows: [
    ["Impressions delivered", "Ad-server counted impressions on the server of record", "FreeWheel"],
    ["Delivery index", "Delivered ÷ contracted impressions × 100", "FreeWheel + Salesforce"],
    ["Pacing index", "Delivered-to-date ÷ expected-to-date × 100", "FreeWheel"],
    ["VCR", "Completed views ÷ video impressions started", "FreeWheel"],
    ["Viewability", "MRC-viewable ÷ measured impressions (2s, 50% pixels for video)", "IAS via ad server"],
    ["On-target %", "Verified in-target ÷ measured impressions", "Nielsen DAR + Stellar Data Cloud"],
    ["eCPM", "Net revenue ÷ (delivered impressions ÷ 1,000)", "Salesforce + FreeWheel"],
    ["Frequency", "Impressions ÷ unique reach, per device graph", "VideoAmp"],
    ["Discrepancy", "(Stellar count − third-party count) ÷ Stellar count", "FreeWheel vs. CM360"],
  ]},
  { title: "Reach & outcome", rows: [
    ["In-target reach", "Deduplicated individuals reached inside the contracted segment", "VideoAmp"],
    ["Incremental reach", "Campaign reach not also reached by Omega's linear buy", "VideoAmp cross-platform"],
    ["Attributed conversions", "Post-exposure dealer actions inside a 30-day window", "Stellar Data Cloud"],
    ["CPA", "Net revenue ÷ attributed conversions", "Salesforce + Data Cloud"],
    ["Brand lift", "Point change in a measured stage, exposed vs. control", "Study vendor"],
  ]},
  { title: "Commercial (internal)", rows: [
    ["Net billable", "Booked revenue less credits and make-good value", "Salesforce + Operative.One"],
    ["Over-delivery", "Impressions above guarantee, delivered but not billed", "FreeWheel + Salesforce"],
    ["Effective yield", "Realized CPM against the published rate card", "Salesforce"],
    ["Fill rate", "Impressions served ÷ impressions requested on reserved inventory", "FreeWheel"],
  ]},
];
function Card({ title, subtitle, right, children, sources, className = "", id }) {
  const [openSrc, setOpenSrc] = useState(false);
  return (
    <section id={id} className={className}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 px-4 pt-3 pb-2">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold leading-tight" style={{ color: C.ink }}>{title}</h3>}
            {subtitle && <p className="text-xs mt-0.5 leading-snug" style={{ color: C.muted, maxWidth: "70ch" }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {right}
            {sources && (
              <button onClick={() => setOpenSrc((v) => !v)} aria-expanded={openSrc}
                className="flex items-center gap-1 text-xs px-1.5 py-1 rounded"
                style={{ color: openSrc ? C.blue : C.muted, background: openSrc ? C.blueSoft : "transparent" }}>
                <Database size={12} /> Sources
              </button>
            )}
          </div>
        </header>
      )}
      {openSrc && sources && (
        <div className="mx-4 mb-2 px-3 py-2 text-xs rounded"
             style={{ background: C.blueSoft, color: C.ink2, borderLeft: `3px solid ${C.blue}` }}>
          <div className="font-semibold mb-1">Data sources</div>
          <ul className="space-y-0.5">{sources.systems.map((s) => <li key={s}>· {s}</li>)}</ul>
          <div className="mt-1.5" style={{ color: C.muted }}>Last refresh {sources.refresh}. {sources.caveat}</div>
        </div>
      )}
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function KpiTile({ label, value, sub, trend, tone = "neutral" }) {
  const col = tone === "good" ? C.green : tone === "warn" ? C.amber : tone === "bad" ? C.red : C.ink;
  return (
    <div className="px-3 py-3" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
      <div className="text-xs leading-tight" style={{ color: C.muted }}>{label}</div>
      <div className="mt-1 font-bold leading-none" style={{ ...TNUM, fontSize: 26, color: col }}>{value}</div>
      {sub && (
        <div className="mt-1.5 text-xs flex items-center gap-1" style={{ ...TNUM, color: C.muted }}>
          {trend != null && (
            <span style={{ color: trend >= 0 ? C.green : C.red, fontWeight: 600 }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

function Segmented({ options, value, onChange, size = "md" }) {
  return (
    <div className="inline-flex overflow-hidden" style={{ border: `1px solid ${C.rule}`, borderRadius: 4 }}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} aria-pressed={active}
            className={`${size === "sm" ? "text-xs px-2 py-1" : "text-xs px-3 py-1.5"} font-medium whitespace-nowrap`}
            style={{ background: active ? C.blue : C.card, color: active ? "#fff" : C.ink2,
                     borderLeft: i === 0 ? "none" : `1px solid ${C.rule}` }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({ children, onClear, tone = "blue" }) {
  const bg = tone === "blue" ? C.blueSoft : tone === "amber" ? C.amberSoft : C.greenSoft;
  const fg = tone === "blue" ? C.blueDark : tone === "amber" ? "#8C4B02" : "#194E31";
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1" style={{ background: bg, color: fg, borderRadius: 12 }}>
      {children}{onClear && <button onClick={onClear} aria-label="Clear filter"><X size={12} /></button>}
    </span>
  );
}

function StatusDot({ v, good = 100, warn = 95 }) {
  const c = v >= good ? C.green : v >= warn ? C.amber : C.red;
  return <span style={{ color: c, fontSize: 10 }} aria-hidden>{v >= good ? "●" : v >= warn ? "◆" : "▲"}</span>;
}

function SectionTitle({ n, title, blurb }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold" style={{ color: C.blue }}>{n}</span>
        <h2 className="font-semibold" style={{ fontSize: 18, color: C.ink }}>{title}</h2>
      </div>
      {blurb && <p className="text-xs mt-1" style={{ color: C.muted, maxWidth: "76ch" }}>{blurb}</p>}
    </div>
  );
}

function TT({ active, payload, label, fmt, title }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="text-xs px-3 py-2" style={{ background: "#fff", border: `1px solid ${C.rule}`, borderRadius: 3, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}>
      <div className="font-semibold mb-1" style={{ color: C.ink }}>{title ? title(payload[0].payload) : label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={TNUM}>
          <span style={{ width: 8, height: 8, background: p.color || p.fill, display: "inline-block", borderRadius: 1 }} />
          <span style={{ color: C.muted }}>{p.name}</span>
          <span className="ml-auto font-medium" style={{ color: C.ink }}>{fmt ? fmt(p.value, p.name, p.payload) : p.value}</span>
        </div>
      ))}
    </div>
  );
}
const axis = { tick: { fontSize: 11, fill: C.muted }, stroke: C.rule, tickLine: false };

function Bullet({ actual, target, max, threshold, thresholdLabel, targetLabel }) {
  const a = (actual / max) * 100, t = (target / max) * 100, th = (threshold / max) * 100;
  return (
    <div>
      <div className="relative h-11" style={{ background: "#F0F0F0", border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${t}%`, background: "#E3E3E3" }} />
        <div className="absolute top-3 bottom-3 left-0" style={{ width: `${a}%`, background: C.green, borderRadius: 2 }} />
        <div className="absolute inset-y-1 w-0.5" style={{ left: `${t}%`, background: C.ink }} />
        <div className="absolute inset-y-2 w-0.5" style={{ left: `${th}%`, background: C.amber }} />
      </div>
      <div className="relative h-5 mt-1 text-xs" style={{ ...TNUM, color: C.muted }}>
        <span className="absolute" style={{ left: `${t}%`, transform: "translateX(-50%)" }}>{targetLabel || `Plan ${usd(target)}`}</span>
        <span className="absolute" style={{ left: `${th}%`, transform: "translateX(-50%)", color: C.amber }}>{thresholdLabel}</span>
      </div>
    </div>
  );
}

function Heatmap({ grid, caption }) {
  const vals = grid.values.flat().filter((v) => v > 0);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const ramp = (v) => {
    if (!v) return "#F7F7F7";
    const t = (v - lo) / (hi - lo || 1);
    return `rgb(${Math.round(240 - 200 * t)},${Math.round(246 - 130 * t)},${Math.round(255 - 44 * t)})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 2, minWidth: 400 }}>
        <thead><tr><th />{grid.cols.map((c) => (
          <th key={c} className="text-xs font-medium pb-1 px-1" style={{ color: C.muted, textAlign: "center" }}>{c}</th>))}
        </tr></thead>
        <tbody>{grid.rows.map((r, ri) => (
          <tr key={r}>
            <td className="text-xs pr-2 whitespace-nowrap" style={{ color: C.ink2, width: 108 }}>{r}</td>
            {grid.cols.map((c, ci) => {
              const v = grid.values[ri][ci];
              return (
                <td key={c} title={`${r} · ${c}: ${v ? `index ${v}` : "no delivery"}`}
                    className="text-xs text-center py-1.5"
                    style={{ ...TNUM, background: ramp(v), color: v > 104 ? "#fff" : C.ink2, borderRadius: 2 }}>
                  {v || "—"}
                </td>
              );
            })}
          </tr>))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.muted }}>
        <span>{lo}</span>
        <span style={{ width: 76, height: 8, background: `linear-gradient(90deg, ${ramp(lo)}, ${ramp(hi)})`, display: "inline-block", borderRadius: 2 }} />
        <span>{hi}</span><span className="ml-2">Delivery index (100 = on plan). {caption}</span>
      </div>
    </div>
  );
}

function DotPlot({ items, lo, hi, band, target, valueFmt, labelWidth = 150, height = 300 }) {
  const x = (v) => ((clamp(v, lo, hi) - lo) / (hi - lo)) * 100;
  return (
    <div style={{ maxHeight: height, overflowY: "auto" }}>
      <div className="relative mb-1" style={{ height: 16 }}>
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <span key={t} className="absolute text-xs" style={{ ...TNUM, left: `${x(t)}%`, transform: "translateX(-50%)", color: C.muted }}>
            {valueFmt ? valueFmt(t) : t}
          </span>))}
      </div>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2 py-1">
          <div className="text-xs truncate shrink-0" style={{ width: labelWidth, color: C.ink2 }} title={it.label}>{it.label}</div>
          <div className="relative flex-1" style={{ height: 16 }}>
            <div className="absolute inset-y-1/2 left-0 right-0" style={{ height: 1, background: C.rule }} />
            {band && <div className="absolute inset-y-0" style={{ left: `${x(band[0])}%`, width: `${x(band[1]) - x(band[0])}%`, background: "#EDF3FA" }} />}
            {target != null && <div className="absolute inset-y-0 w-px" style={{ left: `${x(target)}%`, background: C.ink }} />}
            <div className="absolute rounded-full" title={`${it.label}: ${valueFmt ? valueFmt(it.value) : it.value}`}
                 style={{ left: `${x(it.value)}%`, top: 3, width: 10, height: 10, marginLeft: -5, background: it.color, border: "1px solid #fff" }} />
          </div>
          <div className="text-xs shrink-0 text-right" style={{ ...TNUM, width: 48, color: C.ink }}>
            {valueFmt ? valueFmt(it.value) : it.value}
          </div>
        </div>))}
    </div>
  );
}

function Sparkline({ values, color = C.t10[0], w = 88, h = 22 }) {
  const first = values.findIndex((v) => v > 0);
  if (first < 0) return null;
  const last = values.length - 1 - [...values].reverse().findIndex((v) => v > 0);
  const slice = values.slice(first, last + 1);
  const max = Math.max(...slice, 1);
  const step = slice.length > 1 ? w / (slice.length - 1) : w;
  const pts = slice.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 5)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={`Weekly revenue across ${slice.length} weeks`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={(slice.length - 1) * step} cy={h - 2 - (slice[slice.length - 1] / max) * (h - 5)} r="2" fill={color} />
    </svg>
  );
}

/* ============================ AGGREGATION ============================ */


/* ============================ AGGREGATION ============================ */

function bucketWeekly(rows, grain, key = (r) => r.w) {
  const k = (w) => grain === "weekly" ? w : grain === "monthly" ? WEEKS[w - 1].month : WEEKS[w - 1].quarter;
  const m = new Map();
  rows.forEach((r) => {
    const kk = k(key(r));
    if (!m.has(kk)) m.set(kk, { k: kk, rev:0, imps:0, measured:0, viewable:0, completes:0, inTarget:0, clicks:0, conversions:0 });
    const b = m.get(kk);
    ["rev","imps","measured","viewable","completes","inTarget","clicks","conversions"].forEach((f) => { b[f] += r[f] || 0; });
  });
  return [...m.values()].sort((a, b) => a.k - b.k).map((b) => ({
    ...b,
    label: grain === "weekly" ? `w/e ${WEEKS[b.k - 1].label}` : grain === "monthly" ? MONTHS[b.k] : `Q${b.k}`,
    vcr: b.imps ? (b.completes / b.imps) * 100 : 0,
    viewRate: b.measured ? (b.viewable / b.measured) * 100 : 0,
    otRate: b.imps ? (b.inTarget / b.imps) * 100 : 0,
    ecpm: b.imps ? b.rev / (b.imps / 1000) : 0,
  }));
}

function sumUp(rows, fields) {
  return rows.reduce((s, r) => {
    fields.forEach((f) => { s[f] = (s[f] || 0) + (r[f] || 0); });
    return s;
  }, {});
}

const F_ALL = ["rev","imps","measured","viewable","completes","inTarget","clicks","conversions"];

/* ============================ APP ============================ */

const SECTIONS = [
  { id:"sec-a", n:"A", label:"Campaign summary" },
  { id:"sec-b", n:"B", label:"Goal attainment" },
  { id:"sec-c", n:"C", label:"Breakdown" },
  { id:"sec-d", n:"D", label:"Delivery & pacing" },
  { id:"sec-e", n:"E", label:"Audience segments" },
  { id:"sec-f", n:"F", label:"Reach & incrementality" },
  { id:"sec-g", n:"G", label:"Outcomes & brand lift" },
  { id:"sec-h", n:"H", label:"Optimization log" },
];

export default function OmegaCampaignWrap() {
  const [grain, setGrain] = useState("monthly");
  const [dim, setDim] = useState("lineitem");
  const [internal, setInternal] = useState(true);
  const [dict, setDict] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [active, setActive] = useState("sec-a");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const tot = useMemo(() => {
    const t = sumUp(WEEKLY, F_ALL);
    return {
      ...t,
      vcr: (t.completes / t.imps) * 100,
      viewRate: (t.viewable / t.measured) * 100,
      otRate: (t.inTarget / t.imps) * 100,
      ecpm: t.rev / (t.imps / 1000),
      deliveryIdx: (t.imps / CAMPAIGN.impGuarantee) * 100,
    };
  }, []);

  const series = useMemo(() => bucketWeekly(WEEKLY, grain), [grain]);

  /* cumulative delivery against the even-pacing expectation */
  const pacing = useMemo(() => {
    let cum = 0;
    return WEEKLY.map((wk, i) => {
      cum += wk.imps;
      const expected = CAMPAIGN.impGuarantee * ((i + 1) / 39);
      return {
        label: `w/e ${wk.label}`, w: wk.idx,
        delivered: cum, expected,
        index: (cum / expected) * 100,
        weekly: wk.imps,
        ot: (wk.inTarget / wk.imps) * 100,
        vcr: (wk.completes / wk.imps) * 100,
      };
    });
  }, []);

  const pacingByGrain = useMemo(() => {
    if (grain === "weekly") return pacing;
    const step = grain === "monthly" ? 1 : 2;
    const m = new Map();
    pacing.forEach((p) => {
      const k = grain === "monthly" ? WEEKS[p.w - 1].month : WEEKS[p.w - 1].quarter;
      m.set(k, { ...p, label: grain === "monthly" ? MONTHS[k] : `Q${k}` });
    });
    return [...m.values()];
  }, [grain, pacing]);

  /* breakdown rows for the active dimension */
  const rowsLI = useMemo(() => LINE_ITEMS.map((li) => {
    const f = FACTS.filter((x) => x.li === li.id);
    const t = sumUp(f, ["rev","imps","measured","viewable","completes","inTarget","clicks"]);
    return {
      id: li.id, name: li.n, budget: li.b, cpm: li.cpm,
      imps: t.imps, rev: t.rev,
      del: li.del, vcr: (t.completes / t.imps) * 100,
      vw: (t.viewable / t.measured) * 100, ot: (t.inTarget / t.imps) * 100,
      cvr: li.cvr, lift: li.lift, ir: li.ir, env: li.env,
      conversions: t.imps * (li.cvr / 100) * 0.1,
      share: 0, weekly: WEEKS.map((w) => (f.find((x) => x.w === w.idx) || {}).imps || 0),
    };
  }), []);

  const rowsCR = useMemo(() => CREATIVES.map((c) => {
    const f = CREATIVE_WEEK.filter((x) => x.cr === c.id);
    const t = sumUp(f, ["rev","imps","measured","viewable","completes","conversions"]);
    return {
      id: c.id, name: `${c.n} :${c.len}`, len: c.len, s: c.s, e: c.e, note: c.note, fatigue: c.fatigue,
      imps: t.imps, rev: t.rev,
      vcr: (t.completes / t.imps) * 100, vw: (t.viewable / t.measured) * 100,
      cvr: t.imps ? (t.conversions / t.imps) * 1000 : 0,
      cvr0: c.cvr0, cvrEnd: c.cvrEnd,
      conversions: t.conversions,
      weekly: WEEKS.map((w) => (f.find((x) => x.w === w.idx) || {}).imps || 0),
      cvrSeries: f.map((x) => ({ w: x.w, label: `w${x.w}`, cvr: x.cvr })),
    };
  }), []);

  const rowsDV = useMemo(() => DEVICES.map((d) => {
    const f = DEVICE_WEEK.filter((x) => x.dv === d.id);
    const t = sumUp(f, ["rev","imps","measured","viewable","completes","inTarget","conversions"]);
    return {
      id: d.id, name: d.n, apps: d.apps, freq: d.freq,
      imps: t.imps, rev: t.rev,
      vcr: (t.completes / t.imps) * 100, vw: (t.viewable / t.measured) * 100,
      ot: (t.inTarget / t.imps) * 100, cvr: d.cvr, conversions: t.conversions,
      weekly: WEEKS.map((w) => (f.find((x) => x.w === w.idx) || {}).imps || 0),
    };
  }), []);

  // per-row conversions are allocations of one campaign total; scale them so they reconcile
  const convScale = useMemo(() => {
    const raw = rowsDV.reduce((s, r) => s + r.conversions, 0);
    return raw ? OUTCOMES.conversions / raw : 1;
  }, [rowsDV]);
  const convScaleCR = useMemo(() => {
    const raw = rowsCR.reduce((s, r) => s + r.conversions, 0);
    return raw ? OUTCOMES.conversions / raw : 1;
  }, [rowsCR]);
  const rowsDVs = useMemo(() => rowsDV.map((r) => ({ ...r, conversions: r.conversions * convScale })), [rowsDV, convScale]);
  const rowsCRs = useMemo(() => rowsCR.map((r) => ({ ...r, conversions: r.conversions * convScaleCR })), [rowsCR, convScaleCR]);
  const rowsLIs = useMemo(() => {
    const raw = rowsLI.reduce((s, r) => s + r.conversions, 0);
    const k = raw ? OUTCOMES.conversions / raw : 1;
    return rowsLI.map((r) => ({ ...r, conversions: r.conversions * k }));
  }, [rowsLI]);

  const rows = dim === "lineitem" ? rowsLIs : dim === "creative" ? rowsCRs : rowsDVs;
  const dimTotal = rows.reduce((s, r) => s + r.imps, 0);

  /* creative mix over the flight, for the stacked area */
  const creativeMix = useMemo(() => {
    const g = grain === "weekly" ? 1 : grain === "monthly" ? 2 : 3;
    const key = (w) => g === 1 ? w : g === 2 ? WEEKS[w - 1].month : WEEKS[w - 1].quarter;
    const m = new Map();
    CREATIVE_WEEK.forEach((x) => {
      const k = key(x.w);
      if (!m.has(k)) m.set(k, { k, label: g === 1 ? `w/e ${WEEKS[x.w - 1].label}` : g === 2 ? MONTHS[WEEKS[x.w - 1].month] : `Q${WEEKS[x.w - 1].quarter}` });
      const b = m.get(k);
      b[x.cr] = (b[x.cr] || 0) + x.imps;
    });
    return [...m.values()].sort((a, b) => a.k - b.k);
  }, [grain]);

  const narrative = useMemo(() => {
    const p1 = `${CAMPAIGN.name} closed its 39-week flight on ${CAMPAIGN.flight.split("–")[1].trim()} having delivered ${num(tot.imps)} impressions against a ${num(CAMPAIGN.impGuarantee)} guarantee — ${pct(tot.deliveryIdx)} of contract — and ${num(OUTCOMES.reachDelivered)} in-target individuals against a ${num(CAMPAIGN.reachGoalInTarget)} reach goal. That is ${pct((OUTCOMES.reachDelivered / CAMPAIGN.reachGoalInTarget) * 100, 0)} of the number the campaign was sold on, and it is the result Omega should be shown first.`;

    const p2 = `Quality held across the whole flight. Completion closed at ${pct(tot.vcr)} against a ${CAMPAIGN.vcrBenchmark}% benchmark, viewability at ${pct(tot.viewRate)}, and on-target delivery at ${pct(tot.otRate)} against a ${CAMPAIGN.otGuarantee}% contractual floor. The on-target figure is not flat across the flight: it ran roughly three points below plan through week 11, and the week-12 reweighting out of broad A18-49 into Auto Intenders and In-Market Truck & SUV moved it up about six points over the following month. Most of the campaign's audience performance was bought in that one decision.`;

    const p3 = `The flight's one real problem was creative, not inventory. The Ridgeline Hero :30 carried 38% of delivery and fatigued from week 20 — conversion rate fell from ${CREATIVES[0].cvr0}% to ${CREATIVES[0].cvrEnd}% while completion and viewability stayed flat. Nothing in the delivery report would have caught it. The Summer Drive Event :15, introduced at week 22 to relieve it, returned the second-best conversion rate in the campaign on 9% of delivery, and the Ridgeline Cutdown :15 held its rate across all 39 weeks at nine points higher completion than the :30. The read is straightforward: this audience completes and converts better on fifteen seconds than thirty.`;

    const p4 = `Against Omega's linear buy, the campaign added ${num(OUTCOMES.reachIncremental)} individuals linear never reached — ${pct(OUTCOMES.incrementalPct, 0)} of its own reach, incremental. Brand lift came in at ${OUTCOMES.liftPts} points of aided awareness against a ${OUTCOMES.liftBenchmark}-point category benchmark, and attributed dealer actions ran ${pct((OUTCOMES.conversions / OUTCOMES.convGoal) * 100, 0)} of goal at a ${usdFull(OUTCOMES.cpa)} CPA against a ${usdFull(OUTCOMES.cpaTarget)} target.`;

    const actions = [
      "Rebuild FY27 around :15 as the primary length. The Cutdown out-completed the Hero by nine points and held its conversion rate for the full flight; the :30 did neither.",
      "Write creative rotation into the IO. A 20-week unchanged :30 is what produced the only genuine underperformance in this campaign, and it is a contractual fix, not a media one.",
      "Move the week-12 audience reweighting to week one. Auto Intenders and In-Market Truck & SUV indexed 163 and 171 and carried 29.6% of delivery; A18-49 and P35+ carried 11.8% at an index under 100.",
      `Take the PMP line item up. The Auto Intender programmatic deal was added at week 31 on $55K and returned the highest conversion rate of any line item at 3.6%.`,
      `Lead the renewal with incremental reach. ${num(OUTCOMES.reachIncremental)} unduplicated individuals on top of linear is the number that justifies the CTV line in Omega's FY27 plan.`,
    ];
    if (internal) actions.push(`Do not bill the over-delivery. ${num(tot.imps - CAMPAIGN.impGuarantee)} impressions above guarantee is roughly ${usdFull(COMMERCIAL.overDeliveredValue)} of unbilled value — worth naming in the renewal conversation rather than quietly absorbing.`);
    return { paras: [p1, p2, p3, p4], actions };
  }, [tot, internal]);

  const src = (systems, caveat) => ({ systems, refresh: "Sep 28, 2026 06:14 PT", caveat });
  const reachAttain = (OUTCOMES.reachDelivered / CAMPAIGN.reachGoalInTarget) * 100;

  const dimLabel = dim === "lineitem" ? "line item" : dim === "creative" ? "creative" : "device";

  return (
    <div style={{ background: C.canvas, fontFamily: FONT, color: C.ink, minHeight: "100vh" }}>
      <style>{`
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
        button:focus-visible,a:focus-visible{outline:2px solid ${C.blue};outline-offset:2px}
      `}</style>

      {/* ---------- controls ---------- */}
      <div className="sticky top-0 z-30" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-2">
          <Segmented value={dim} onChange={setDim} options={[
            { value:"lineitem", label:"Line items" },
            { value:"creative", label:"Creative" },
            { value:"device", label:"Device & app" },
          ]} />
          <Segmented value={grain} onChange={setGrain} options={[
            { value:"weekly", label:"Weekly" },
            { value:"monthly", label:"Monthly" },
            { value:"quarterly", label:"Quarterly" },
          ]} />
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs" style={{ color: C.muted }}>View</span>
            <Segmented size="sm" value={internal ? "int" : "cli"} onChange={(v) => setInternal(v === "int")} options={[
              { value:"int", label:"Internal" },
              { value:"cli", label:"Client-facing" },
            ]} />
            <button onClick={() => setDict(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded" style={{ color: C.blue, border: `1px solid ${C.rule}` }}>
              <BookOpen size={13} /> Metrics
            </button>
            <button onClick={() => setExportOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded" style={{ color: C.blue, border: `1px solid ${C.rule}` }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        <div className="px-4 pb-2 text-xs" style={{ color: C.muted }}>
          {internal
            ? "Internal view. Commercial exposure, third-party discrepancy and yield are visible and should not be shared with the agency."
            : "Client-facing view. Commercial exposure, discrepancy and yield cards are hidden. Safe to present to Omega and Meridian Collective."}
        </div>
      </div>

      <div className="flex">
        {/* ---------- left rail ---------- */}
        <nav className="hidden lg:block shrink-0 sticky self-start" style={{ width: 208, top: 76, background: C.card, borderRight: `1px solid ${C.border}`, height: "calc(100vh - 76px)" }}>
          <div className="py-3">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block px-4 py-2 text-xs"
                 style={{
                   color: active === s.id ? C.blue : C.ink2,
                   background: active === s.id ? C.blueSoft : "transparent",
                   borderLeft: `3px solid ${active === s.id ? C.blue : "transparent"}`,
                   fontWeight: active === s.id ? 600 : 400,
                 }}>
                <span style={{ color: C.muted, marginRight: 6 }}>{s.n}</span>{s.label}
              </a>
            ))}
          </div>
          <div className="px-4 pt-3 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
            <div className="font-semibold" style={{ color: C.ink2 }}>In-target reach</div>
            <div className="mt-1 font-bold" style={{ ...TNUM, fontSize: 22, color: C.green }}>{pct(reachAttain, 0)}</div>
            <div>of a {num(CAMPAIGN.reachGoalInTarget)} goal</div>
            <div className="mt-2 flex items-center gap-1" style={{ color: C.green }}>
              <CheckCircle2 size={12} /> No make-good owed
            </div>
          </div>
        </nav>

        <main className="flex-1 min-w-0 px-4 lg:px-6 py-5 space-y-8" style={{ maxWidth: 1360 }}>

          {/* ===== A · SUMMARY ===== */}
          <div id="sec-a">
            <SectionTitle n="A" title="Campaign summary"
              blurb="Written for the wrap conversation with Omega and Meridian Collective. Everything below is this campaign only." />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2" title="How the flight went"
                    sources={src(["Salesforce CRM — Campaign, Order Product", "FreeWheel — delivery, completion, frequency", "IAS via ad server — viewability", "Nielsen DAR + VideoAmp — on-target and reach", "Stellar Data Cloud — attribution and brand lift"],
                      "Narrative is generated from the same aggregates that feed the charts below.")}>
                <div className="space-y-3" style={{ maxWidth: "76ch" }}>
                  {narrative.paras.map((p, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: C.ink2 }}>{p}</p>)}
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="text-xs font-semibold mb-2">Recommended for the FY27 plan</div>
                  <ol className="space-y-1.5">
                    {narrative.actions.map((a, i) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: C.ink2 }}>
                        <span style={{ color: C.blue, fontWeight: 600, ...TNUM }}>{i + 1}.</span>
                        <span style={{ maxWidth: "72ch" }}>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Card>

              <div className="space-y-4">
                <Card title="Headline numbers">
                  <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="In-target reach" value={num(OUTCOMES.reachDelivered)} sub={`${pct(reachAttain,0)} of goal`} tone="good" />
                    <KpiTile label="Impressions delivered" value={num(tot.imps)} sub={`${pct(tot.deliveryIdx)} of guarantee`} tone="good" />
                    <KpiTile label="On-target" value={pct(tot.otRate,0)} sub="70% floor" tone="good" />
                    <KpiTile label="Completion rate" value={pct(tot.vcr,0)} sub="90% benchmark" tone="good" />
                    <KpiTile label="Incremental reach" value={pct(OUTCOMES.incrementalPct,0)} sub="over Omega linear" tone="good" />
                    <KpiTile label="Brand lift" value={`+${OUTCOMES.liftPts} pts`} sub="3.0 pt benchmark" tone="good" />
                  </div>
                </Card>
                {internal && (
                  <Card title="Commercial position" sources={src(["Salesforce CRM", "Operative.One", "FreeWheel vs. Campaign Manager 360"], "Internal only — not in the client-facing export.")}>
                    <ul className="text-xs space-y-2">
                      {[
                        [CheckCircle2, C.green, "Net billable", usdFull(COMMERCIAL.netBillable)],
                        [CheckCircle2, C.green, "Credits / ADU owed", "$0"],
                        [AlertTriangle, C.amber, "Over-delivery, unbilled", `${num(COMMERCIAL.overDelivered)} imps`],
                        [Info, C.muted, "Third-party discrepancy", pct(COMMERCIAL.discrepancy)],
                        [Info, C.muted, "Effective yield vs. rate card", `$${COMMERCIAL.effectiveYield.toFixed(2)} / $${COMMERCIAL.rateCard.toFixed(2)}`],
                      ].map(([Icon, col, k, v]) => (
                        <li key={k} className="flex items-center gap-2">
                          <Icon size={13} style={{ color: col }} />
                          <span style={{ color: C.ink2 }}>{k}</span>
                          <span className="ml-auto font-semibold" style={TNUM}>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* ===== B · GOAL ATTAINMENT ===== */}
          <div id="sec-b">
            <SectionTitle n="B" title="Goal attainment"
              blurb="The campaign was sold on in-target reach. Delivery against the impression guarantee is the contractual check underneath it." />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2" title="In-target reach against goal"
                    subtitle="Deduplicated individuals inside the contracted segment. The amber marker is the 110% threshold at which the renewal team flags an over-performing buy."
                    sources={src(["VideoAmp — deduplicated cross-platform reach", "Nielsen DAR — in-target verification"], "Reach is modeled at the individual level with a 3.8% margin of error at this sample size.")}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-bold" style={{ ...TNUM, fontSize: 40, color: C.green }}>{pct(reachAttain, 0)}</span>
                  <span className="text-sm" style={{ color: C.ink2 }}>
                    of goal · <strong>{num(OUTCOMES.reachDelivered)}</strong> in-target against {num(CAMPAIGN.reachGoalInTarget)}
                  </span>
                </div>
                <Bullet actual={OUTCOMES.reachDelivered} target={CAMPAIGN.reachGoalInTarget}
                        max={10_500_000} threshold={CAMPAIGN.reachGoalInTarget * 1.1}
                        targetLabel={`Goal ${num(CAMPAIGN.reachGoalInTarget)}`} thresholdLabel="110%" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  <KpiTile label="Impressions vs. guarantee" value={pct(tot.deliveryIdx)} sub={`${num(tot.imps)} delivered`} tone="good" />
                  <KpiTile label="Attributed conversions" value={num(OUTCOMES.conversions)} sub={`${pct((OUTCOMES.conversions/OUTCOMES.convGoal)*100,0)} of goal`} tone="good" />
                  <KpiTile label="CPA" value={usdFull(OUTCOMES.cpa)} sub={`${usdFull(OUTCOMES.cpaTarget)} target`} tone="good" />
                  <KpiTile label="Average frequency" value="3.4×" sub="capped at 3/wk from wk 6" />
                </div>
              </Card>

              <Card title="Delivery pacing across the flight"
                    subtitle="Cumulative delivered impressions against an even-pacing expectation."
                    sources={src(["FreeWheel — delivery", "Salesforce — flight dates and guarantee"], "Expected-to-date assumes even pacing; the IO specified no weighting.")}>
                <ResponsiveContainer width="100%" height={232}>
                  <ComposedChart data={pacingByGrain} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} interval={grain === "weekly" ? 5 : 0} />
                    <YAxis {...axis} width={42} tickFormatter={(v) => num(v)} />
                    <Tooltip content={<TT fmt={(v) => `${num(v)} imps`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Line type="monotone" dataKey="expected" name="Expected" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <Line type="monotone" dataKey="delivered" name="Delivered" stroke={C.green} strokeWidth={2.5} dot={false} />
                    <ReferenceLine y={CAMPAIGN.impGuarantee} stroke={C.ink} strokeDasharray="2 2"
                      label={{ value: `Guarantee ${num(CAMPAIGN.impGuarantee)}`, position: "insideTopLeft", fontSize: 10, fill: C.ink }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs mt-1" style={{ color: C.muted }}>
                  Never left the 95–105% corridor. Closed at {pct(tot.deliveryIdx)}.
                </div>
              </Card>
            </div>
          </div>

          {/* ===== C · BREAKDOWN ===== */}
          <div id="sec-c">
            <SectionTitle n="C" title={`Breakdown by ${dimLabel}`}
              blurb={dim === "lineitem"
                ? "Salesforce Order Products — the six rows ad ops managed. Budgets sum to the campaign total; impressions sum to campaign delivery."
                : dim === "creative"
                  ? "Each cut and length. Shares are renormalized weekly across whichever creatives were live, so the mix always reconciles to campaign delivery."
                  : "Where impressions actually landed. Device shares drift toward the big screen across the flight as the mobile line item was reweighted down."} />

            <Card title={`${rows.length} ${dimLabel}s`}
                  subtitle="Click a row to expand. Sparklines show impressions delivered week by week."
                  sources={src(dim === "lineitem"
                    ? ["Salesforce CRM — Order Product", "FreeWheel — delivery by placement"]
                    : dim === "creative"
                      ? ["FreeWheel — delivery by creative", "Stellar Data Cloud — conversion by creative"]
                      : ["FreeWheel — delivery by device and app", "VideoAmp — frequency by device"],
                    "All three breakdowns reconcile to the same weekly campaign totals.")}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 700 }}>
                  <thead>
                    <tr style={{ color: C.muted }}>
                      <th className="text-left font-medium pb-1.5 pl-1">{dim === "lineitem" ? "Line item" : dim === "creative" ? "Creative" : "Environment"}</th>
                      <th className="text-right font-medium pb-1.5">Impressions</th>
                      <th className="text-right font-medium pb-1.5">Share</th>
                      <th className="text-right font-medium pb-1.5">VCR</th>
                      <th className="text-right font-medium pb-1.5">Viewable</th>
                      <th className="text-right font-medium pb-1.5">{dim === "creative" ? "Conv. rate" : "On-target"}</th>
                      <th className="text-right font-medium pb-1.5">{dim === "lineitem" ? "eCPM" : "Conversions"}</th>
                      <th className="text-left font-medium pb-1.5 pl-3">Flight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const open = expanded === r.id;
                      const share = (r.imps / dimTotal) * 100;
                      return (
                        <React.Fragment key={r.id}>
                          <tr onClick={() => setExpanded(open ? null : r.id)}
                              style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer", background: open ? C.blueSoft : "transparent" }}>
                            <td className="py-2 pl-1">
                              <div className="flex items-center gap-1">
                                {open ? <ChevronDown size={12} style={{ color: C.blue }} /> : <ChevronRight size={12} style={{ color: C.muted }} />}
                                <span className="font-medium" style={{ color: C.ink }}>{r.name}</span>
                                {r.fatigue && <span className="px-1.5 rounded" style={{ background: C.amberSoft, color: "#8C4B02", fontSize: 10 }}>fatigued</span>}
                              </div>
                            </td>
                            <td className="text-right" style={{ ...TNUM, color: C.ink }}>{num(r.imps)}</td>
                            <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>{pct(share)}</td>
                            <td className="text-right" style={TNUM}><StatusDot v={r.vcr} good={92} warn={88} /> {pct(r.vcr,0)}</td>
                            <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>{pct(r.vw,0)}</td>
                            <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>
                              {dim === "creative" ? pct(r.cvr,1) : pct(r.ot,0)}
                            </td>
                            <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>
                              {dim === "lineitem" ? `$${(r.rev / (r.imps/1000)).toFixed(2)}` : num(r.conversions)}
                            </td>
                            <td className="pl-3"><Sparkline values={r.weekly} color={C.t10[3]} /></td>
                          </tr>
                          {open && (
                            <tr style={{ background: C.blueSoft }}>
                              <td colSpan={8} className="px-4 pb-3 pt-1">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mb-2">
                                  {(dim === "lineitem" ? [
                                    ["Order Product ID", r.id], ["Net budget", usdFull(r.budget)],
                                    ["Rate", `$${r.cpm.toFixed(2)} CPM`], ["Delivery index", pct(r.del,0)],
                                    ["Conversion rate", pct(r.cvr)], ["Brand lift", `+${r.lift} pts`],
                                    ["Incremental reach", pct(r.ir,0)], ["Environment", r.env],
                                  ] : dim === "creative" ? [
                                    ["Creative ID", r.id], ["Length", `:${r.len}`],
                                    ["Live weeks", `${r.s}–${r.e}`], ["Share of delivery", pct(share)],
                                    ["Conv. rate at start", pct(r.cvr0)], ["Conv. rate at end", pct(r.cvrEnd)],
                                    ["Completion", pct(r.vcr,0)], ["Conversions", num(r.conversions)],
                                  ] : [
                                    ["Device ID", r.id], ["Apps", r.apps],
                                    ["Share of delivery", pct(share)], ["Avg. frequency", `${r.freq}×`],
                                    ["Completion", pct(r.vcr,0)], ["Viewability", pct(r.vw,0)],
                                    ["On-target", pct(r.ot,0)], ["Conversions", num(r.conversions)],
                                  ]).map(([k, v]) => (
                                    <div key={k}>
                                      <div style={{ color: C.muted }}>{k}</div>
                                      <div className="font-medium" style={{ ...TNUM, color: C.ink }}>{v}</div>
                                    </div>
                                  ))}
                                </div>
                                {r.note && <div style={{ color: C.ink2, maxWidth: "76ch" }}>{r.note}</div>}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <Card title={`Share of delivery by ${dimLabel}`}
                    subtitle="Sorted descending. Colour marks quality tier, not identity."
                    sources={src(["FreeWheel"], "Shares reconcile to campaign impressions in every breakdown.")}>
                <ResponsiveContainer width="100%" height={Math.max(190, rows.length * 34)}>
                  <BarChart data={[...rows].sort((a,b)=>b.imps-a.imps)} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} tickFormatter={(v) => num(v)} />
                    <YAxis type="category" dataKey="name" {...axis} width={168} tick={{ fontSize: 10, fill: C.ink2 }} />
                    <Tooltip content={<TT fmt={(v, n, p) => `${num(v)} imps · ${pct((v/dimTotal)*100)} of delivery · ${pct(p.vcr,0)} VCR`} />} />
                    <Bar dataKey="imps" name="Impressions" maxBarSize={18}>
                      {[...rows].sort((a,b)=>b.imps-a.imps).map((r,i) => (
                        <Cell key={i} fill={r.vcr >= 94 ? C.t10[0] : r.vcr >= 90 ? C.t10[3] : C.t10[1]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {dim === "creative" ? (
                <Card title="Creative fatigue — conversion rate over each cut's own life"
                      subtitle="Delivery and completion stayed flat for all five. Only conversion moved, and only for two of them."
                      sources={src(["Stellar Data Cloud — attributed conversions by creative"], "Indexed to each creative's own first live week, not to the campaign calendar.")}>
                  <ResponsiveContainer width="100%" height={248}>
                    <LineChart margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid vertical={false} stroke={C.rule} />
                      <XAxis type="number" dataKey="w" domain={[1, 39]} {...axis}
                             label={{ value: "Flight week", position: "insideBottom", offset: -4, fontSize: 10, fill: C.muted }} />
                      <YAxis {...axis} domain={[1, 4]} width={34} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<TT fmt={(v) => pct(v)} />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} align="right" verticalAlign="top" />
                      <ReferenceArea x1={20} x2={39} fill={C.amber} fillOpacity={0.06} />
                      {rowsCRs.map((c, i) => (
                        <Line key={c.id} data={c.cvrSeries} dataKey="cvr" name={c.name}
                              stroke={C.t10[i]} strokeWidth={c.fatigue ? 2.5 : 1.8}
                              strokeDasharray={c.fatigue ? undefined : "4 3"} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-xs px-3 py-2 rounded" style={{ background: C.amberSoft, color: "#8C4B02" }}>
                    Shaded from week 20, where Ridgeline Hero crossed below 2.0%. The two :15 cuts held their rate to the end of the flight.
                  </div>
                </Card>
              ) : (
                <Card title="Creative mix across the flight"
                      subtitle="Impressions by creative, stacked. Shows the week-22 introduction that relieved Hero fatigue."
                      sources={src(["FreeWheel — delivery by creative"], "Renormalized weekly over whichever cuts were live.")}>
                  <ResponsiveContainer width="100%" height={248}>
                    <ComposedChart data={creativeMix} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid vertical={false} stroke={C.rule} />
                      <XAxis dataKey="label" {...axis} interval={grain === "weekly" ? 5 : 0} />
                      <YAxis {...axis} width={42} tickFormatter={(v) => num(v)} />
                      <Tooltip content={<TT fmt={(v) => `${num(v)} imps`} />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} align="right" verticalAlign="top" />
                      {CREATIVES.map((c, i) => (
                        <Area key={c.id} type="monotone" dataKey={c.id} stackId="c" name={`${c.n} :${c.len}`}
                              stroke={C.t10[i]} fill={C.t10[i]} fillOpacity={0.55} strokeWidth={1} />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </div>

          {/* ===== D · DELIVERY & PACING ===== */}
          <div id="sec-d">
            <SectionTitle n="D" title="Delivery and pacing"
              blurb="Weekly delivery, quality and the two moments in the flight where the numbers moved." />
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 mb-4">
              <KpiTile label="Impressions delivered" value={num(tot.imps)} sub={`${pct(tot.deliveryIdx)} of guarantee`} tone="good" />
              <KpiTile label="Delivery index" value={pct(tot.deliveryIdx,0)} sub="95–105% corridor" tone="good" />
              <KpiTile label="Completion rate" value={pct(tot.vcr,0)} sub="90% benchmark" tone="good" />
              <KpiTile label="Viewability (MRC)" value={pct(tot.viewRate,0)} sub="of measured" tone="good" />
              <KpiTile label="On-target %" value={pct(tot.otRate,0)} sub="70% floor" tone="good" />
              <KpiTile label="eCPM" value={`$${tot.ecpm.toFixed(2)}`} sub="net revenue basis" />
              <KpiTile label="Clicks" value={num(tot.clicks)} sub={`${pct((tot.clicks/tot.imps)*100,2)} CTR`} />
              <KpiTile label="Fill rate" value={pct(COMMERCIAL.fillRate)} sub="reserved inventory" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card title="Weekly delivery and on-target rate"
                    subtitle="The week-12 audience reweighting is visible as a step change in on-target, with delivery volume unaffected."
                    sources={src(["FreeWheel — weekly delivery", "Nielsen DAR — on-target verification"], "On-target is measured against the contracted auto segment, not against a demo.")}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={pacing} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} interval={4} />
                    <YAxis yAxisId="l" {...axis} width={44} tickFormatter={(v) => num(v)} />
                    <YAxis yAxisId="r" orientation="right" {...axis} width={38} domain={[70, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<TT fmt={(v, n) => n === "On-target rate" ? pct(v) : `${num(v)} imps`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <ReferenceArea yAxisId="l" x1="w/e 3/21" x2="w/e 4/11" fill={C.blue} fillOpacity={0.07} />
                    <Bar yAxisId="l" dataKey="weekly" name="Impressions" fill={C.t10[9]} maxBarSize={12} />
                    <Line yAxisId="r" type="monotone" dataKey="ot" name="On-target rate" stroke={C.t10[0]} strokeWidth={2.5} dot={false} />
                    <ReferenceLine yAxisId="r" y={CAMPAIGN.otGuarantee} stroke={C.red} strokeDasharray="3 3"
                      label={{ value: "70% floor", position: "insideBottomRight", fontSize: 10, fill: C.red }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs px-3 py-2 rounded" style={{ background: C.blueSoft, color: C.blueDark }}>
                  Shaded band is the week-12 reweighting. On-target moved from roughly 86% to 92% within four weeks on identical delivery volume.
                </div>
              </Card>

              <Card title="Quality by line item"
                    subtitle="Completion against on-target. The 70% floor is contractual; the 90% completion line is the category benchmark."
                    sources={src(["FreeWheel", "IAS", "Nielsen DAR"], "Bubble size is impressions delivered.")}>
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 22 }}>
                    <CartesianGrid stroke={C.rule} />
                    <XAxis type="number" dataKey="ot" name="On-target" domain={[70, 100]} {...axis} tickFormatter={(v) => `${v}%`}
                           label={{ value: "On-target %", position: "insideBottom", offset: -12, fontSize: 10, fill: C.muted }} />
                    <YAxis type="number" dataKey="vcr" name="Completion" domain={[85, 100]} {...axis} width={38} tickFormatter={(v) => `${v}%`} />
                    <ZAxis type="number" dataKey="imps" range={[60, 420]} />
                    <ReferenceLine y={90} stroke={C.ink} strokeDasharray="3 3" />
                    <ReferenceLine x={85} stroke={C.ink} strokeDasharray="3 3" />
                    <Tooltip content={<TT title={(p) => p.name} fmt={(v, n) => n === "Completion" || n === "On-target" ? pct(v) : num(v)} />} />
                    <Scatter data={rowsLIs}>
                      {rowsLIs.map((r, i) => <Cell key={i} fill={C.t10[i]} fillOpacity={0.78} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="text-xs" style={{ color: C.muted }}>
                  Sports Live sits top-right on both measures and carried the campaign's best conversion rate outside the PMP. Connected mobile is the only line item below the 85% on-target line.
                </div>
              </Card>
            </div>

            {internal && (
              <Card className="mt-4" title="Third-party count reconciliation"
                    subtitle="Stellar's server of record against Meridian Collective's CM360 tags. The 10% line is where the IO permits a billing dispute."
                    sources={src(["FreeWheel (server of record)", "Campaign Manager 360 — agency-side tags"], "Internal only. 2–5% is normal and attributable to latency and tag-fire loss.")}>
                <DotPlot
                  items={rowsLIs.map((r, i) => ({
                    label: r.name,
                    value: +(1.6 + (i * 0.7) % 3.4).toFixed(1),
                    color: C.t10[0],
                  }))}
                  lo={0} hi={12} target={10} valueFmt={(v) => `${v.toFixed(1)}%`} labelWidth={180} height={200} />
                <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: C.green }}>
                  <CheckCircle2 size={12} /> Campaign-weighted discrepancy {pct(COMMERCIAL.discrepancy)}. Nothing in dispute; no line item near the threshold.
                </div>
              </Card>
            )}
          </div>

          {/* ===== E · AUDIENCE ===== */}
          <div id="sec-e">
            <SectionTitle n="E" title="Audience segments"
              blurb="Segments reached by this campaign only. On-target percentage anchors the view because it is what the guarantee is written against." />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3" title="Segment index against general population"
                    subtitle="100 = parity. Sorted best to worst."
                    sources={src(["Nielsen DAR / VideoAmp — demo verification", "Stellar Data Cloud — 1P segment membership", "LiveRamp — CRM and 3P match"], "Index is calculated on verified in-target impressions for this campaign.")}>
                <ResponsiveContainer width="100%" height={Math.max(280, SEGMENTS.length * 25)}>
                  <BarChart data={SEGMENTS.map((s) => ({ ...s, delta: s.index - 100 }))} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} domain={[-50, 80]} tickFormatter={(v) => `${100 + v}`} />
                    <YAxis type="category" dataKey="n" {...axis} width={158} tick={{ fontSize: 11, fill: C.ink2 }} />
                    <Tooltip content={<TT title={(p) => `${p.n} · ${p.type}`}
                      fmt={(v, n, p) => `Index ${p.index} · ${p.ot}% on-target · ${p.comp}% of delivery · ${p.cvr}% conv.`} />} />
                    <ReferenceLine x={0} stroke={C.ink} />
                    <Bar dataKey="delta" name="Index" maxBarSize={14}>
                      {SEGMENTS.map((s, i) => <Cell key={i} fill={s.index >= 100 ? C.t10[0] : C.t10[1]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="xl:col-span-2" title="On-target delivery by segment"
                    subtitle="The line is the 70% contractual floor."
                    sources={src(["Nielsen DAR", "VideoAmp", "Stellar Data Cloud"], "Segments below the floor trigger a bonus-weight obligation on guaranteed-audience deals.")}>
                <DotPlot
                  items={[...SEGMENTS].sort((a,b)=>b.ot-a.ot).map((s) => ({
                    label: s.n, value: s.ot,
                    color: s.ot >= 85 ? C.green : s.ot >= 70 ? C.t10[0] : C.red,
                  }))}
                  lo={35} hi={100} target={70} valueFmt={(v) => `${Math.round(v)}%`} labelWidth={142} height={300} />
                <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: C.amber }}>
                  <AlertTriangle size={12} /> One segment below the floor: run-of-network remnant at 44%, on 1.9% of delivery.
                </div>
              </Card>
            </div>

            <Card className="mt-4" title="What the segment data says">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.green }}>Best performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    In-Market Truck &amp; SUV indexed 171 at 94% on-target and a 4.1% conversion rate — the strongest segment on every measure. Auto Intenders carried the most volume at 18.2% of delivery and indexed 163. The Omega CRM match converted highest of all at 4.4% but ran on only 6.1% of delivery.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.red }}>Worst performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Run-of-network remnant delivered at 44% on-target and converted at 0.5% on 1.9% of delivery. P35+ Broad Reach indexed 77 across 4.4% of delivery. Together with A18-49 and the lookalike extension, 18.3% of impressions went to segments indexing under 100.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.blue }}>The one to act on</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    The Omega CRM match is the underweighted segment. Highest conversion rate in the campaign, 95% on-target, and only 6.1% of delivery. Scaling it in FY27 depends on match-rate volume from Omega, which makes it a conversation for the renewal rather than a media optimization.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ===== F · REACH ===== */}
          <div id="sec-f">
            <SectionTitle n="F" title="Reach and incrementality"
              blurb="How much of this campaign's reach Omega's linear buy did not already have. This is the argument for the CTV line in the FY27 plan." />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card title="Overlap with Omega's linear buy"
                    subtitle="Unique individuals in millions, deduplicated across platform."
                    sources={src(["VideoAmp — cross-platform dedupe", "Nielsen — linear panel"], "Dedupe is modeled at the individual level with a 3.8% margin of error.")}>
                <div className="flex justify-center py-2">
                  <svg viewBox="0 0 340 210" style={{ width: "100%", maxWidth: 380 }} role="img"
                       aria-label="Omega linear reached 14.2 million, this CTV campaign reached 9.17 million, 5.41 million overlap, 3.76 million incremental, 17.96 million deduplicated total">
                    <circle cx="132" cy="105" r="88" fill={C.t10[9]} fillOpacity="0.42" />
                    <circle cx="222" cy="105" r="66" fill={C.t10[3]} fillOpacity="0.46" />
                    <text x="62" y="60" fontSize="11" fill={C.ink} fontWeight="600">Omega linear</text>
                    <text x="62" y="76" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>14.2M</text>
                    <text x="236" y="60" fontSize="11" fill={C.ink} fontWeight="600">This campaign</text>
                    <text x="236" y="76" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>9.17M</text>
                    <text x="177" y="108" fontSize="10" fill={C.ink2} textAnchor="middle" style={TNUM}>5.41M</text>
                    <text x="177" y="122" fontSize="10" fill={C.muted} textAnchor="middle">overlap</text>
                    <text x="258" y="150" fontSize="10" fill={C.green} textAnchor="middle" fontWeight="700" style={TNUM}>3.76M</text>
                    <text x="258" y="163" fontSize="10" fill={C.green} textAnchor="middle">incremental</text>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <KpiTile label="Campaign reach" value="9.17M" sub="in-target individuals" />
                  <KpiTile label="Incremental" value="+3.76M" sub="unreached by linear" tone="good" />
                  <KpiTile label="Deduplicated total" value="17.96M" sub="linear + this campaign" />
                </div>
              </Card>

              <Card title="Reach and frequency curve"
                    subtitle="Cumulative reach at each frequency level. The gap between the lines is what this buy added."
                    sources={src(["VideoAmp — cross-platform R/F"], "Modeled at the campaign's realized CPM mix.")}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={OUTCOMES.rfCurve} margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="freq" {...axis}
                           label={{ value: "Average frequency", position: "insideBottom", offset: -8, fontSize: 10, fill: C.muted }} />
                    <YAxis {...axis} width={40} tickFormatter={(v) => `${v}M`} />
                    <Tooltip content={<TT fmt={(v) => `${v}M individuals`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Area type="monotone" dataKey="withLinear" name="Linear + this campaign" stroke={C.t10[0]} fill={C.t10[0]} fillOpacity={0.14} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="campaign" name="This campaign alone" stroke={C.t10[3]} strokeWidth={2} dot={false} />
                    <ReferenceLine x={3} stroke={C.ink} strokeDasharray="3 3"
                      label={{ value: "Capped at 3/wk", position: "top", fontSize: 10, fill: C.muted }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs" style={{ color: C.muted }}>
                  Lowering the weekly cap from 4 to 3 at week 6 is what bought the incremental reach. The impressions that would have been a fourth exposure became first exposures instead.
                </div>
              </Card>
            </div>
          </div>

          {/* ===== G · OUTCOMES ===== */}
          <div id="sec-g">
            <SectionTitle n="G" title="Outcomes and brand lift"
              blurb="Measured against the goals written on the IO at signature, not against a portfolio average." />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3" title="Brand lift study — exposed against control"
                    subtitle="Percentage answering affirmatively at each stage. The gap is the lift."
                    sources={src(["Study vendor — exposed/control panel, n=4,180", "Stellar Data Cloud — exposure matching"], "Fielded weeks 14–18 and 32–36; figures are the pooled result.")}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={OUTCOMES.funnel} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="stage" {...axis} tick={{ fontSize: 10, fill: C.muted }} interval={0} />
                    <YAxis {...axis} width={36} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<TT fmt={(v, n, p) => `${v}% · lift +${(p.exposed - p.control).toFixed(1)} pts`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Bar dataKey="control" name="Control" fill={C.t10[9]} maxBarSize={38} />
                    <Bar dataKey="exposed" name="Exposed" fill={C.t10[0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs" style={{ color: C.muted }}>
                  Aided awareness lifted {OUTCOMES.liftPts} points against a 3.0-point category benchmark. Dealer visit intent lifted 3.5 points, which is the stage Omega's FY27 brief names as the priority.
                </div>
              </Card>

              <Card className="xl:col-span-2" title="Attributed dealer actions"
                    subtitle="30-day post-exposure window, deduplicated across device."
                    sources={src(["Stellar Data Cloud — attribution", "Omega CRM via LiveRamp — action matching"], "Attribution is last-touch within the exposure window; no multi-touch model applied.")}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <KpiTile label="Attributed actions" value={num(OUTCOMES.conversions)} sub={`goal ${num(OUTCOMES.convGoal)}`} tone="good" />
                  <KpiTile label="Against goal" value={pct((OUTCOMES.conversions/OUTCOMES.convGoal)*100,0)} sub="131% on reach" tone="good" />
                  <KpiTile label="CPA" value={usdFull(OUTCOMES.cpa)} sub={`target ${usdFull(OUTCOMES.cpaTarget)}`} tone="good" />
                  <KpiTile label="Best line item" value="3.6%" sub="Auto Intender PMP" />
                </div>
                <div className="text-xs leading-relaxed" style={{ color: C.ink2 }}>
                  Conversion concentrated where targeting was tightest. The three segments indexing above 150 carried 39.4% of delivery and produced a disproportionate share of attributed actions, while the 18.3% of impressions in sub-100 segments contributed very little. That ratio, not the headline CPA, is the number worth planning against next year.
                </div>
              </Card>
            </div>
          </div>

          {/* ===== H · OPTIMIZATION LOG ===== */}
          <div id="sec-h">
            <SectionTitle n="H" title="Optimization log and renewal position"
              blurb="Every change made in flight, when it happened, and what it moved." />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3" title="In-flight changes"
                    sources={src(["Operative.One — change log", "FreeWheel — trafficking history", "Salesforce — Chatter and activity history"], "Entries are the ad ops record, not a reconstruction.")}>
                <ol className="space-y-3">
                  {[...TIMELINE].sort((a,b)=>a.w-b.w).map((t, i) => {
                    const col = t.kind === "alert" ? C.red : t.kind === "launch" || t.kind === "close" ? C.muted : C.blue;
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="shrink-0 text-center" style={{ width: 44 }}>
                          <div className="text-xs font-semibold" style={{ ...TNUM, color: col }}>wk {t.w}</div>
                          <div className="mx-auto mt-1 rounded-full" style={{ width: 8, height: 8, background: col }} />
                        </div>
                        <div className="pb-1" style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 12, marginLeft: -6 }}>
                          <div className="text-sm font-medium" style={{ color: C.ink }}>{t.t}</div>
                          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: C.ink2, maxWidth: "68ch" }}>{t.d}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>

              <div className="xl:col-span-2 space-y-4">
                <Card title="Renewal position">
                  <div className="p-3 rounded mb-3" style={{ background: C.greenSoft }}>
                    <div className="text-xs font-semibold flex items-center gap-1" style={{ color: "#194E31" }}>
                      <CheckCircle2 size={13} /> Recommend renewal and increase
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.ink2 }}>
                      The campaign beat its reach goal by 31 points, cleared every quality guarantee, and added 3.76M individuals Omega's linear buy never reached. There is no delivery or billing issue outstanding and no make-good owed.
                    </p>
                  </div>
                  <ul className="text-xs space-y-2">
                    {[
                      ["Reach goal", "131% of goal", C.green],
                      ["Impression guarantee", "102.1% delivered", C.green],
                      ["On-target floor", "91% vs. 70% floor", C.green],
                      ["Open credits or ADU", "None", C.green],
                      ["Creative rotation", "Unresolved — fix in IO", C.amber],
                      ["CRM match volume", "Dependent on Omega", C.amber],
                    ].map(([k, v, col]) => (
                      <li key={k} className="flex items-center gap-2">
                        <span style={{ color: C.ink2 }}>{k}</span>
                        <span className="ml-auto font-semibold" style={{ ...TNUM, color: col }}>{v}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                {internal && (
                  <Card title="Internal notes">
                    <p className="text-xs leading-relaxed" style={{ color: C.ink2 }}>
                      Over-delivery of {num(tot.imps - CAMPAIGN.impGuarantee)} impressions is worth roughly {usdFull(COMMERCIAL.overDeliveredValue)} at rate card and was not billed. Raise it as goodwill in the renewal rather than writing it off silently. Effective yield closed at ${COMMERCIAL.effectiveYield.toFixed(2)} against a ${COMMERCIAL.rateCard.toFixed(2)} card, an 8.6% discount consistent with the rest of the Omega book — hold the line there in FY27 given the result.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <footer className="pt-4 pb-8 text-xs" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>Stellar Media Ad Sales Analytics · Campaign wrap · {CAMPAIGN.name} ({CAMPAIGN.number})</span>
              <span>Server of record for billing: FreeWheel</span>
              <span>Scope: this campaign only. Account roll-up lives on the {CAMPAIGN.account} record.</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ---------- metric dictionary ---------- */}
      {dict && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setDict(false)}>
          <div className="h-full overflow-y-auto" style={{ width: "min(560px,100%)", background: C.card }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center gap-2 px-4 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              <BookOpen size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Metric dictionary</h3>
              <button className="ml-auto" onClick={() => setDict(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs mb-3" style={{ color: C.muted }}>
                Every metric on this page, with its formula and source system.
                {!internal && " The commercial group is hidden in the client-facing view."}
              </p>
              {DICTIONARY.filter((g) => internal || !g.title.includes("internal")).map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="text-xs font-semibold mb-2">{g.title}</div>
                  <table className="w-full text-xs">
                    <thead><tr style={{ color: C.muted }}>
                      <th className="text-left font-medium pb-1" style={{ width: "30%" }}>Metric</th>
                      <th className="text-left font-medium pb-1">Definition</th>
                      <th className="text-left font-medium pb-1" style={{ width: "24%" }}>Source</th>
                    </tr></thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r[0]} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td className="py-1.5 pr-2 font-medium" style={{ color: C.ink2 }}>{r[0]}</td>
                          <td className="py-1.5 pr-2" style={{ color: C.ink2 }}>{r[1]}</td>
                          <td className="py-1.5" style={{ color: C.muted }}>{r[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- export ---------- */}
      {exportOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center px-4" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setExportOpen(false)}>
          <div className="rounded p-4" style={{ background: C.card, width: "min(440px,100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Export campaign wrap</h3>
              <button className="ml-auto" onClick={() => setExportOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Exports carry the current view: <strong>{internal ? "internal" : "client-facing"}</strong>, broken down by {dimLabel}, at {grain} grain.
            </p>
            <div className="space-y-2">
              {[
                ["Client-ready PDF", "Narrative, delivery, audience, reach and outcomes. Commercial cards omitted regardless of view."],
                ["Internal PDF", "Everything, including yield, over-delivery and discrepancy."],
                ["Attach to Campaign record", "Saves to Files on this Campaign and posts to Chatter."],
                ["Underlying CSV", "Line item × week fact table, 234 rows, with source-system columns."],
              ].map(([t, d]) => (
                <button key={t} className="w-full text-left px-3 py-2 rounded" style={{ border: `1px solid ${C.rule}` }}>
                  <div className="text-xs font-semibold" style={{ color: C.blue }}>{t}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{d}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
