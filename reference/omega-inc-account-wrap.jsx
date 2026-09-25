import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceArea, Cell, ZAxis
} from "recharts";
import {
  Database, Download, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Info, X, Radio, MonitorPlay, BookOpen, Star, Building2, Globe, Phone, Mail,
  Calendar, Briefcase, PanelsTopLeft
} from "lucide-react";

/* ============================================================================
   STELLAR MEDIA — ACCOUNT CAMPAIGN WRAP
   Lightning component, Account record page: Omega, Inc. (ACT-004821)
   Scope: this account only. No book-level quota, no seller benchmarking.
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

/* ---------- the account record ---------- */
const ACCOUNT = {
  name: "Omega, Inc.",
  number: "ACT-004821",
  sfId: "001Rx00000Kd41Q",
  type: "Customer — Direct",
  industry: "Automotive",
  segment: "Enterprise / National",
  owner: "Jennifer Smith",
  team: "West Region · Auto",
  agency: "Meridian West Media",
  agencyContact: "Priya Raman, Group Investment Director",
  billing: "3400 Del Amo Blvd, Torrance, CA 90503",
  website: "omega.com",
  phone: "(310) 555-0142",
  since: "FY19",
  lastActivity: "Sep 22, 2026 — Q4 changeover planning call",
};

/* ---------- account plan (replaces seller quota on a record page) ---------- */
const PLAN_ANNUAL = 4_200_000;
const PLAN_QUARTER = [1_660_000, 810_000, 680_000, 1_050_000];
const PLAN_YTD = PLAN_QUARTER[0] + PLAN_QUARTER[1] + PLAN_QUARTER[2]; // 3.15M
const ACTUAL_QUARTER = [1_900_000, 920_000, 780_000];                 // 3.60M
const ACTUAL_YTD = ACTUAL_QUARTER.reduce((a, b) => a + b, 0);
const FY_PROJECTION = 4_750_000;
const PRIOR_YTD = 3_120_000;
const NET_BILLABLE = 3_527_000;
const WALLET_SHARE = 31.4;   // Omega measured media spend captured by Stellar
const WALLET_PRIOR = 27.8;

/* ---------- the five Omega campaigns ---------- */
const SEED = [
  { n:"Q1 Model Year Clearance", g:"linear", p:"Primetime", s:1, e:13, b:980, o:"Awareness",
    cpp:9400, post:103, c3:114, pre:1.4, oc:112 },
  { n:"Ridgeline Launch — Sports", g:"linear", p:"Sports", s:5, e:14, b:760, o:"Awareness",
    cpp:13800, post:101, c3:121, pre:2.1, oc:118 },
  { n:"Always-On CTV", g:"streaming", p:"CTV/Streaming", s:1, e:39, b:1020, o:"Reach",
    cpm:47, del:103, vcr:94, vw:88, ot:89, ctr:0.44, cvr:2.6, lift:6.2, ir:41, disc:2.4, oc:131 },
  { n:"Intender Retargeting", g:"digital", p:"Display", s:1, e:39, b:340, o:"Performance",
    cpm:11, del:104, vcr:0, vw:79, ot:83, ctr:0.62, cvr:3.4, lift:1.8, ir:6, disc:3.8, oc:121 },
  { n:"Summer Drive Event", g:"digital", p:"Online video", s:22, e:32, b:500, o:"Consideration",
    cpm:29, del:99, vcr:81, vw:74, ot:76, ctr:0.38, cvr:1.7, lift:3.1, ir:12, disc:6.2, oc:96 },
];

/* composite score: 30% delivery accuracy + 30% quality + 40% outcome vs. goal */
function scoreOf(c) {
  const delIdx = c.g === "linear" ? c.post : c.del;
  const dScore = 100 - Math.min(45, Math.abs(delIdx - 100) * 2.2);
  const qual = c.g === "linear"
    ? ((c.c3 - 80) / 45) * 70 + ((4 - c.pre) / 4) * 30
    : c.vcr > 0 && c.vw > 0
      ? ((c.vw - 55) / 40) * 50 + ((c.vcr - 55) / 40) * 50
      : (((c.vw || c.vcr) - 55) / 40) * 100;
  const qScore = clamp(qual, 0, 100);
  const oScore = clamp(c.oc, 0, 100);
  return { delivery: dScore, quality: qScore, outcome: oScore,
           raw: 0.3 * dScore + 0.3 * qScore + 0.4 * oScore };
}

const UE_A2554 = 1_280_000;
const CAMPAIGNS = SEED.map((c, i) => {
  const sc = scoreOf(c);
  const budget = c.b * 1000;
  const delIdx = c.g === "linear" ? c.post : c.del;
  const grps = c.g === "linear" ? budget / c.cpp : 0;
  const imps = c.g === "linear" ? grps * UE_A2554 : (budget / c.cpm) * 1000;
  return {
    id: `CMP-${2000 + i}`,
    sfId: `006Rx${String(510000 + i * 211)}`,
    name: c.n, shortName: c.n,
    segment: c.g, product: c.p, objective: c.o,
    dealType: c.g === "linear" ? "Upfront" : c.b > 400 ? "Direct IO" : "Programmatic guaranteed",
    start: c.s, end: c.e, weeks: c.e - c.s + 1, budget,
    goalMetric: c.g === "linear" ? "Guaranteed GRPs (A25-54, C3)" : "Guaranteed impressions",
    guaranteed: (c.g === "linear" ? grps : imps) / (delIdx / 100),
    delivered: c.g === "linear" ? grps : imps,
    deliveryIdx: delIdx, grps, imps,
    cpp: c.cpp || 0, cpm: c.cpm || 0,
    vcr: c.vcr || 0, viewability: c.vw || 0, onTarget: c.ot || 0,
    ctr: c.ctr || 0, cvr: c.cvr || 0, lift: c.lift || 0, incrReach: c.ir || 0,
    c3: c.c3 || 0, preempt: c.pre || 0,
    spotsOrdered: c.g === "linear" ? Math.round(budget / 4200) : 0,
    outcomeIdx: c.oc, discrepancy: c.disc || 0,
    score: Math.round(sc.raw), scoreRaw: sc.raw, scoreParts: sc,
  };
});
const byId = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c]));
const PRODUCTS = {
  digital: ["All", ...new Set(CAMPAIGNS.filter((c) => c.segment !== "linear").map((c) => c.product))],
  linear:  ["All", ...new Set(CAMPAIGNS.filter((c) => c.segment === "linear").map((c) => c.product))],
  all: ["All"],
};

/* ---------- weekly fact table ---------- */
const FACTS = [];
CAMPAIGNS.forEach((c) => {
  const r = rng(c.id + "wk");
  const raw = [];
  for (let w = c.start; w <= c.end; w++) {
    // auto seasonality: model-year changeover in late Q1, fall changeover from wk34
    const season = 1 + (w >= 8 && w <= 15 ? 0.28 : 0) + (w >= 34 ? 0.22 : 0);
    const ramp = c.weeks > 6 ? 0.82 + 0.36 * Math.min(1, (w - c.start + 1) / 4) : 1;
    raw.push({ w, wt: season * ramp * (0.88 + r() * 0.24) });
  }
  const tot = raw.reduce((s, x) => s + x.wt, 0);
  raw.forEach(({ w, wt }) => {
    const share = wt / tot, rev = c.budget * share;
    const j = (k) => (rng(c.id + w + k)() - 0.5);
    let vw = c.viewability, vcr = c.vcr, ot = c.onTarget, pre = c.preempt, del = c.deliveryIdx;
    // Summer Drive drifted on mobile-web-heavy supply from week 27
    if (c.shortName === "Summer Drive Event" && w >= 27) { vw = 69; ot = 72; del = 96; }
    vw = clamp(vw + j("v") * 5, 0, 96);
    vcr = clamp(vcr + j("c") * 4, 0, 98);
    ot = clamp(ot + j("o") * 4, 0, 96);
    const grps = c.segment === "linear" ? (rev / c.cpp) * (del / c.deliveryIdx) : 0;
    const impressions = c.segment === "linear" ? grps * UE_A2554
      : (rev / c.cpm) * 1000 * (del / c.deliveryIdx);
    FACTS.push({
      cid: c.id, w, rev, grps, impressions,
      measured: impressions * 0.94,
      viewable: impressions * 0.94 * (vw / 100),
      completes: impressions * (vcr / 100),
      inTarget: impressions * (ot / 100),
      clicks: impressions * (c.ctr / 100),
      conversions: impressions * (c.ctr / 100) * (c.cvr / 100) * 10,
      spotsOrdered: c.segment === "linear" ? c.spotsOrdered * share : 0,
      spotsAired: c.segment === "linear" ? c.spotsOrdered * share * (1 - pre / 100) : 0,
      preempt: pre, delIdx: del, vw, vcr, ot,
    });
  });
});

/* fit weekly facts to BOTH campaign budgets and booked quarterly actuals */
(function fitQuarters() {
  const budgets = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c.budget]));
  for (let pass = 0; pass < 80; pass++) {
    const q = [0, 0, 0];
    FACTS.forEach((f) => { q[WEEKS[f.w - 1].quarter - 1] += f.rev; });
    FACTS.forEach((f) => {
      const qi = WEEKS[f.w - 1].quarter - 1;
      if (q[qi] > 0) f.rev *= ACTUAL_QUARTER[qi] / q[qi];
    });
    const c = {};
    FACTS.forEach((f) => { c[f.cid] = (c[f.cid] || 0) + f.rev; });
    FACTS.forEach((f) => { if (c[f.cid] > 0) f.rev *= budgets[f.cid] / c[f.cid]; });
  }
  FACTS.forEach((f) => {
    const c = byId[f.cid];
    const unit = c.segment === "linear" ? f.rev / c.cpp : (f.rev / c.cpm) * 1000;
    const ratio = c.segment === "linear"
      ? (f.grps ? unit / f.grps : 1)
      : (f.impressions ? unit / f.impressions : 1);
    ["grps","impressions","measured","viewable","completes","inTarget","clicks",
     "conversions","spotsOrdered","spotsAired"].forEach((k) => { f[k] *= ratio; });
  });
})();

/* ---------- revenue bridge ---------- */
const BRIDGE = [
  { label: "Linear booked", delta: 1_740_000, kind: "up" },
  { label: "Streaming booked", delta: 1_020_000, kind: "up" },
  { label: "Digital booked", delta: 840_000, kind: "up" },
  { label: "Under-delivery credits", delta: -18_000, kind: "down" },
  { label: "ADU / make-good", delta: -24_000, kind: "down" },
  { label: "Pre-emptions & cancels", delta: -31_000, kind: "down" },
];

/* ---------- audience segments, Omega delivery only ---------- */
const SEGMENTS = [
  { name:"Auto Intenders", type:"Stellar 1P", index:172, onTarget:89, comp:22.4, ecpm:39, vcr:93, view:88, cvr:3.8, lift:6.4, reach:8.2, incr:34 },
  { name:"In-market truck & SUV", type:"Stellar 1P", index:158, onTarget:87, comp:11.6, ecpm:43, vcr:92, view:87, cvr:3.4, lift:5.9, reach:5.1, incr:29 },
  { name:"Sports Loyalists", type:"Stellar 1P", index:149, onTarget:90, comp:9.8, ecpm:41, vcr:94, view:89, cvr:3.0, lift:6.1, reach:4.6, incr:31 },
  { name:"Omega owner CRM match", type:"1P match", index:141, onTarget:91, comp:6.2, ecpm:46, vcr:91, view:86, cvr:4.4, lift:3.8, reach:2.2, incr:11 },
  { name:"Premium Streamers", type:"Stellar 1P", index:128, onTarget:85, comp:10.4, ecpm:44, vcr:93, view:88, cvr:2.6, lift:4.9, reach:4.3, incr:27 },
  { name:"A25-54", type:"Nielsen demo", index:116, onTarget:81, comp:15.2, ecpm:30, vcr:88, view:82, cvr:1.9, lift:3.3, reach:9.8, incr:15 },
  { name:"Auto intender lookalike", type:"Lookalike", index:98, onTarget:72, comp:8.4, ecpm:27, vcr:84, view:77, cvr:1.5, lift:2.2, reach:3.6, incr:10 },
  { name:"M18-34", type:"Nielsen demo", index:74, onTarget:56, comp:7.6, ecpm:24, vcr:79, view:71, cvr:0.9, lift:1.0, reach:3.1, incr:8 },
  { name:"Value Shoppers (3P)", type:"3P syndicated", index:66, onTarget:59, comp:5.1, ecpm:19, vcr:76, view:66, cvr:0.7, lift:0.5, reach:2.0, incr:4 },
  { name:"Run-of-network remnant", type:"Untargeted", index:55, onTarget:42, comp:3.3, ecpm:14, vcr:71, view:61, cvr:0.4, lift:0.2, reach:1.4, incr:2 },
];

/* ---------- delivery grids, Omega's bought inventory only ---------- */
const LINEAR_GRID = {
  rows: ["Early fringe", "Access", "Primetime", "Late night"],
  cols: ["SBN", "Stellar Sports", "O&O Stations"],
  values: [[101, 99, 98], [104, 109, 102], [108, 116, 105], [102, 97, 100]],
};
const DIGITAL_GRID = {
  rows: ["Pre-roll", "Mid-roll", "In-feed video", "Display banner"],
  cols: ["CTV", "Connected mobile", "Desktop", "Mobile web"],
  values: [[111, 102, 97, 88], [114, 105, 99, 86], [0, 98, 93, 81], [0, 92, 89, 76]],
};

/* ---------- cross-platform reach, this account ---------- */
const REACH = {
  linear: 12.6, streaming: 7.4, digital: 4.9, dedup: 19.8,
  incremental: 5.2, incrementalPct: 41.3,
  curve: Array.from({ length: 12 }, (_, i) => {
    const f = i + 1;
    return {
      freq: f,
      linear: +(12.6 * (1 - Math.exp(-0.55 * f))).toFixed(1),
      combined: +(19.8 * (1 - Math.exp(-0.42 * f))).toFixed(1),
    };
  }),
};

/* ---------- Q4 pipeline on this account ---------- */
const PIPELINE = [
  { stage: "Q4 Model Year Changeover", product: "Primetime + Sports", amount: 840_000, prob: 0.6, stageName: "Negotiation", close: "Oct 9" },
  { stage: "Holiday Drive Event", product: "CTV / Streaming", amount: 420_000, prob: 0.85, stageName: "Verbal commit", close: "Oct 23" },
  { stage: "Year-End Clearance", product: "Display + Online video", amount: 215_000, prob: 0.35, stageName: "Proposal sent", close: "Nov 13" },
];
const Q4_CLOSED = 180_000;

/* ---------- per-campaign narrative ---------- */
const NOTES = {
  "Always-On CTV": {
    verdict: "good",
    text: "The strongest line on the account and the one to lead the renewal with. Running all 39 weeks instead of in bursts let frequency build without saturating: 41% of its reach was incremental to Omega's linear buy, at 89% on-target and a 94% completion rate. The always-on structure is also what made mid-flight optimization possible — there was enough runway to shift weight onto Auto Intenders from week 12 onward, and the conversion rate moved with it.",
  },
  "Ridgeline Launch — Sports": {
    verdict: "good",
    text: "Sports inventory at a $13,800 CPP looked expensive on the plan and returned a C3 index of 121 against a 100 guarantee. The launch window landed against three high-rating events and posting closed at 101% with pre-emptions held to 2.1%. This is the line that justifies paying the sports premium next year.",
  },
  "Q1 Model Year Clearance": {
    verdict: "good",
    text: "The workhorse. Posted at 103% with a C3 index of 114 and pre-emptions under 1.5% across a 13-week primetime flight. Nothing surprising happened, which on a clearance campaign is the point.",
  },
  "Intender Retargeting": {
    verdict: "good",
    text: "The most efficient line on the account by a wide margin: a $11 CPM producing a 3.4% conversion rate, the highest of any Omega placement. It is also the smallest line at $340K. The obvious question for FY27 is why.",
  },
  "Summer Drive Event": {
    verdict: "bad",
    cause: "Supply mix, not inventory scarcity. The buy ran mobile-web-heavy from week 27, and viewability fell to 69% with on-target delivery at 72% — the only Omega line to finish under 80% on-target. Completion at 81% was also the account's weakest. Delivery itself was fine at 99%.",
    fix: "Re-cut as CTV mid-roll with a mobile-web exclusion for FY27. The same budget in the Always-On CTV supply mix would have carried roughly 14 points more on-target delivery.",
    impact: "$12,000 under-delivery credit · 6.2% third-party discrepancy, inside threshold",
    text: "Delivery met the guarantee and the campaign still returned only 96% of its consideration goal. The cause was the supply mix rather than the flight or the creative.",
  },
};

const DICTIONARY = [
  { title: "Digital and streaming", rows: [
    ["Impressions delivered", "Ad-server counted impressions on the server of record", "Google Ad Manager / FreeWheel"],
    ["Delivery index", "Delivered ÷ contracted impressions × 100", "Ad server + Salesforce"],
    ["VCR", "Completed views ÷ video impressions started", "Ad server"],
    ["Viewability", "MRC-viewable ÷ measured impressions", "IAS via ad server"],
    ["On-target %", "Verified in-target ÷ measured impressions", "Nielsen DAR + Stellar Data Cloud"],
    ["eCPM", "Net revenue ÷ (delivered impressions ÷ 1,000)", "Salesforce + ad server"],
    ["Attributed conversions", "Post-exposure actions inside a 30-day window", "Stellar Data Cloud"],
    ["Discrepancy", "(Stellar count − third-party count) ÷ Stellar count", "GAM vs. CM360"],
  ]},
  { title: "Linear", rows: [
    ["GRPs", "Sum of rating points in the target demo", "Nielsen"],
    ["Demo impressions", "Rating × universe estimate (A25-54 UE 128.0M)", "Nielsen"],
    ["CPP", "Net spend ÷ GRPs delivered", "Salesforce + Nielsen"],
    ["Posting %", "Delivered GRPs ÷ guaranteed GRPs", "Nielsen + Operative.One"],
    ["C3 index", "Commercial rating live plus three days, indexed to guarantee", "Nielsen"],
    ["Pre-emption rate", "Pre-empted spots ÷ ordered spots", "Operative.One"],
  ]},
  { title: "Account", rows: [
    ["Booked revenue", "Net revenue on closed-won opportunities for this account", "Salesforce CRM"],
    ["Net billable revenue", "Booked less credits, ADU value and pre-emptions", "Salesforce + Operative.One"],
    ["Account plan attainment", "Booked ÷ account plan for the period", "Salesforce Account Plan"],
    ["Share of measured spend", "Stellar revenue ÷ Omega's total measured media spend", "Nielsen Ad Intel"],
    ["Composite score", "30% delivery accuracy + 30% quality + 40% outcome vs. goal", "This report"],
  ]},
];

/* ============================ UI PRIMITIVES ============================ */

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

function Bullet({ actual, target, max, threshold, thresholdLabel }) {
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
        <span className="absolute" style={{ left: `${t}%`, transform: "translateX(-50%)" }}>Plan {usd(target)}</span>
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

function bucket(facts, grain) {
  const key = (w) => grain === "weekly" ? w : grain === "monthly" ? WEEKS[w - 1].month : WEEKS[w - 1].quarter;
  const map = new Map();
  facts.forEach((f) => {
    const k = key(f.w);
    if (!map.has(k)) map.set(k, { k, rev: 0, imps: 0, grps: 0, viewable: 0, measured: 0, completes: 0, inTarget: 0, clicks: 0, conversions: 0 });
    const b = map.get(k);
    b.rev += f.rev; b.imps += f.impressions; b.grps += f.grps;
    b.viewable += f.viewable; b.measured += f.measured; b.completes += f.completes;
    b.inTarget += f.inTarget; b.clicks += f.clicks; b.conversions += f.conversions;
  });
  return [...map.values()].sort((a, b) => a.k - b.k).map((b) => ({
    ...b,
    label: grain === "weekly" ? `w/e ${WEEKS[b.k - 1].label}` : grain === "monthly" ? MONTHS[b.k] : `Q${b.k}`,
    vcr: b.imps ? (b.completes / b.imps) * 100 : 0,
    viewRate: b.measured ? (b.viewable / b.measured) * 100 : 0,
    otRate: b.imps ? (b.inTarget / b.imps) * 100 : 0,
  }));
}

function totals(facts, camps) {
  const t = facts.reduce((s, f) => ({
    rev: s.rev + f.rev, imps: s.imps + f.impressions, grps: s.grps + f.grps,
    viewable: s.viewable + f.viewable, measured: s.measured + f.measured,
    completes: s.completes + f.completes, inTarget: s.inTarget + f.inTarget,
    clicks: s.clicks + f.clicks, conversions: s.conversions + f.conversions,
    spotsOrdered: s.spotsOrdered + f.spotsOrdered, spotsAired: s.spotsAired + f.spotsAired,
  }), { rev:0, imps:0, grps:0, viewable:0, measured:0, completes:0, inTarget:0, clicks:0, conversions:0, spotsOrdered:0, spotsAired:0 });
  const guaranteed = camps.reduce((s, c) => s + c.guaranteed, 0);
  const isLin = camps.length && camps.every((c) => c.segment === "linear");
  const videoImps = facts.filter((f) => byId[f.cid].vcr > 0).reduce((s, f) => s + f.impressions, 0);
  return {
    ...t, campaignCount: camps.length, guaranteed,
    deliveryRate: guaranteed ? ((isLin ? t.grps : t.imps) / guaranteed) * 100 : 0,
    vcr: videoImps ? (t.completes / videoImps) * 100 : 0,
    viewRate: t.measured ? (t.viewable / t.measured) * 100 : 0,
    otRate: t.imps ? (t.inTarget / t.imps) * 100 : 0,
    ecpm: t.imps ? t.rev / (t.imps / 1000) : 0,
    cpp: t.grps ? t.rev / t.grps : 0,
    weightedDelivery: camps.length
      ? camps.reduce((s, c) => s + c.budget * c.deliveryIdx, 0) / camps.reduce((s, c) => s + c.budget, 0) : 0,
    preemptRate: t.spotsOrdered ? (1 - t.spotsAired / t.spotsOrdered) * 100 : 0,
  };
}

/* ============================ NARRATIVE ============================ */

function buildNarrative({ tot, camps, productView }) {
  if (!camps.length) return null;
  const ranked = [...camps].sort((a, b) => b.scoreRaw - a.scoreRaw);
  const best = ranked[0], weakest = ranked[ranked.length - 1];
  const avg = Math.round(ranked.reduce((s, c) => s + c.scoreRaw, 0) / ranked.length);
  const scope = productView === "linear" ? "Omega's linear buy"
    : productView === "digital" ? "Omega's digital and streaming buy"
    : "the Omega book";
  const bestSeg = SEGMENTS[0], worstSeg = SEGMENTS[SEGMENTS.length - 1];

  const p1 = `Through the close of Q3, ${scope} booked ${usdFull(tot.rev)} across ${camps.length} campaign${camps.length > 1 ? "s" : ""}. ` +
    (productView === "all"
      ? `That is 114% of the ${usd(PLAN_YTD)} year-to-date account plan and 15.4% ahead of the same period last year. Stellar now carries ${WALLET_SHARE}% of Omega's measured media spend, up from ${WALLET_PRIOR}% in FY25. On current pace the account lands at roughly ${usd(FY_PROJECTION)} against a ${usd(PLAN_ANNUAL)} annual plan.`
      : `Account plan, wallet share and the full-year projection are measured across all products; switch back to All products to see them.`);

  const p2 = `${best.name} was the strongest line at a composite score of ${best.score} against an account average of ${avg}. ${
    best.segment === "linear"
      ? `It posted at ${best.deliveryIdx}% of guaranteed GRPs with a C3 index of ${best.c3} and pre-emptions held to ${best.preempt}%.`
      : `It delivered ${best.deliveryIdx}% of contracted impressions at ${best.onTarget}% on-target and a ${best.vcr}% completion rate, with ${best.incrReach}% of its reach incremental to the linear buy.`
  }`;

  const p3 = ranked.length > 1
    ? `${weakest.name} was the weakest at ${weakest.score}. ${NOTES[weakest.shortName]?.text || `It delivered ${weakest.deliveryIdx}% of contracted inventory and returned ${weakest.outcomeIdx}% of its outcome goal.`} Nothing on this account failed outright — the spread between best and weakest is ${Math.round(best.scoreRaw - weakest.scoreRaw)} points, which is narrow. The opportunity here is reallocation, not repair.`
    : `Only one campaign is in scope at these filters, so there is no internal comparison to draw.`;

  const p4 = `On audience, ${bestSeg.name} was Omega's best-performing segment — index ${bestSeg.index}, ${bestSeg.onTarget}% on-target, a ${bestSeg.cvr}% conversion rate — and it already carries ${bestSeg.comp}% of delivery, the largest share on the account. That is the right shape. The problem is at the other end: ${worstSeg.name} and ${SEGMENTS[SEGMENTS.length - 2].name} together absorbed ${(worstSeg.comp + SEGMENTS[SEGMENTS.length - 2].comp).toFixed(1)}% of impressions at an average index of ${Math.round((worstSeg.index + SEGMENTS[SEGMENTS.length - 2].index) / 2)}, and M18-34 took another 7.6% at 56% on-target.`;

  const actions = [
    `Grow Intender Retargeting. At $340K it is the smallest line on the account and returns the highest conversion rate — 3.4% at an $11 CPM. Nothing in the data argues for keeping it this small.`,
    `Re-cut Summer Drive Event as CTV mid-roll with a mobile-web exclusion. The same $500K in the Always-On CTV supply mix would have carried roughly 14 points more on-target delivery.`,
    `Move the 16.0% of delivery sitting in M18-34, Value Shoppers and run-of-network remnant into Auto Intenders and in-market truck and SUV. No new budget required.`,
    `Lead the FY27 upfront with incremental reach. Streaming added ${REACH.incremental}M individuals on top of the linear buy — a ${REACH.incrementalPct}% lift — and that is the number Priya Raman asked for in the September planning call.`,
    `Clear the $24K ADU balance inside Q4, before the changeover buy is written.`,
  ];

  return { paras: [p1, p2, p3, p4].filter(Boolean), actions, best, weakest, ranked, avg };
}

/* ============================ CAMPAIGN TABLE ============================ */

function CampaignTable({ rows, sparks, expanded, setExpanded }) {
  if (!rows.length) return (
    <div className="py-6 text-xs text-center" style={{ color: C.muted }}>
      No campaigns match these filters. Clear the product filter to see the full Omega book.
    </div>
  );
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs" style={{ minWidth: 640 }}>
        <thead>
          <tr style={{ color: C.muted }}>
            <th className="text-left font-medium pb-1.5 pl-1">Campaign</th>
            <th className="text-left font-medium pb-1.5">Product</th>
            <th className="text-right font-medium pb-1.5">Revenue</th>
            <th className="text-right font-medium pb-1.5">Delivery</th>
            <th className="text-right font-medium pb-1.5">Quality</th>
            <th className="text-right font-medium pb-1.5">Outcome</th>
            <th className="text-right font-medium pb-1.5">Score</th>
            <th className="text-left font-medium pb-1.5 pl-3">Flight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const open = expanded === c.id;
            const note = NOTES[c.shortName];
            const bad = note?.verdict === "bad";
            return (
              <React.Fragment key={c.id}>
                <tr onClick={() => setExpanded(open ? null : c.id)}
                    style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer", background: open ? C.blueSoft : "transparent" }}>
                  <td className="py-2 pl-1">
                    <div className="flex items-center gap-1">
                      {open ? <ChevronDown size={12} style={{ color: C.blue }} /> : <ChevronRight size={12} style={{ color: C.muted }} />}
                      <span className="font-medium" style={{ color: C.blue }}>{c.name}</span>
                    </div>
                    <div className="pl-4" style={{ color: C.muted }}>{c.dealType} · {c.objective}</div>
                  </td>
                  <td style={{ color: C.ink2 }}>{c.product}</td>
                  <td className="text-right font-medium" style={{ ...TNUM, color: C.ink }}>{usd(c.budget)}</td>
                  <td className="text-right" style={TNUM}><StatusDot v={c.deliveryIdx} /> {Math.round(c.deliveryIdx)}%</td>
                  <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>
                    {c.segment === "linear" ? `C3 ${c.c3}` : `${Math.round(c.viewability || c.vcr)}% vw`}
                  </td>
                  <td className="text-right" style={{ ...TNUM, color: c.outcomeIdx >= 100 ? C.green : c.outcomeIdx >= 85 ? C.ink2 : C.red }}>
                    {c.outcomeIdx}%
                  </td>
                  <td className="text-right font-semibold"
                      style={{ ...TNUM, color: bad ? C.amber : C.green }}
                      title={`Delivery ${Math.round(c.scoreParts.delivery)} (30%) · Quality ${Math.round(c.scoreParts.quality)} (30%) · Outcome ${Math.round(c.scoreParts.outcome)} (40%)`}>
                    {c.score}
                  </td>
                  <td className="pl-3"><Sparkline values={sparks.get(c.id) || []} color={bad ? C.t10[1] : C.t10[4]} /></td>
                </tr>
                {open && (
                  <tr style={{ background: C.blueSoft }}>
                    <td colSpan={8} className="px-4 pb-3 pt-1">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mb-3">
                        {[
                          ["Opportunity ID", c.sfId],
                          ["Flight", `Weeks ${c.start}–${c.end} (${c.weeks} wks)`],
                          ["Net budget", usdFull(c.budget)],
                          ["Goal metric", c.goalMetric],
                          ["Guaranteed", c.segment === "linear" ? `${Math.round(c.guaranteed).toLocaleString()} GRPs` : `${num(c.guaranteed)} imps`],
                          ["Delivered", c.segment === "linear" ? `${Math.round(c.delivered).toLocaleString()} GRPs` : `${num(c.delivered)} imps`],
                          ["Unit cost", c.segment === "linear" ? `${usdFull(c.cpp)} CPP` : `$${c.cpm.toFixed(2)} CPM`],
                          c.segment === "linear" ? ["Pre-emption rate", pct(c.preempt)] : ["3P discrepancy", `${c.discrepancy}%`],
                          c.segment === "linear" ? ["Spots ordered", c.spotsOrdered.toLocaleString()] : ["On-target", pct(c.onTarget, 0)],
                          c.segment === "linear" ? ["C3 index", c.c3] : ["Incremental reach", pct(c.incrReach, 0)],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ color: C.muted }}>{k}</div>
                            <div className="font-medium" style={{ ...TNUM, color: C.ink }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {note?.verdict === "bad" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div><div className="font-semibold mb-0.5" style={{ color: C.red }}>Diagnosed cause</div>
                            <div style={{ color: C.ink2 }}>{note.cause}</div></div>
                          <div><div className="font-semibold mb-0.5" style={{ color: C.blue }}>Remediation</div>
                            <div style={{ color: C.ink2 }}>{note.fix}</div></div>
                          <div><div className="font-semibold mb-0.5" style={{ color: C.ink }}>Dollar impact</div>
                            <div style={{ ...TNUM, color: C.ink2 }}>{note.impact}</div></div>
                        </div>
                      ) : (
                        <div style={{ color: C.ink2, maxWidth: "78ch" }}>{note?.text}</div>
                      )}
                      <div className="mt-2" style={{ color: C.muted }}>
                        Composite {c.score} = 0.30 × delivery {Math.round(c.scoreParts.delivery)} + 0.30 × quality{" "}
                        {Math.round(c.scoreParts.quality)} + 0.40 × outcome {Math.round(c.scoreParts.outcome)}.
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================ APP ============================ */

const SECTIONS = [
  { id: "s-a", n: "A", label: "Summary" },
  { id: "s-b", n: "B", label: "Revenue vs. plan" },
  { id: "s-c", n: "C", label: "Campaigns" },
  { id: "s-d", n: "D", label: "Delivery" },
  { id: "s-e", n: "E", label: "Audiences" },
  { id: "s-f", n: "F", label: "Reach" },
  { id: "s-g", n: "G", label: "Q4 & FY27" },
];

const WALLET = [
  { name: "Stellar Media", v: 31.4, c: C.t10[0] },
  { name: "Network B", v: 22.1, c: C.t10[9] },
  { name: "Digital platforms", v: 19.3, c: "#C9C7C5" },
  { name: "Network C", v: 18.6, c: "#DEDCDA" },
  { name: "Other", v: 8.6, c: "#EFEDEB" },
];

export default function OmegaAccountWrap() {
  const [productView, setProductView] = useState("all");
  const [subFilter, setSubFilter] = useState("All");
  const [grain, setGrain] = useState("monthly");
  const [objective, setObjective] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [dict, setDict] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chrome, setChrome] = useState(false);
  const [active, setActive] = useState("s-a");

  useEffect(() => { setSubFilter("All"); }, [productView]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-140px 0px -70% 0px" });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const camps = useMemo(() => CAMPAIGNS.filter((c) =>
    (productView === "all" || (productView === "linear" ? c.segment === "linear" : c.segment !== "linear")) &&
    (subFilter === "All" || c.product === subFilter) &&
    (objective === "All" || c.objective === objective)
  ), [productView, subFilter, objective]);

  const facts = useMemo(() => {
    const ids = new Set(camps.map((c) => c.id));
    return FACTS.filter((f) => ids.has(f.cid));
  }, [camps]);

  const series = useMemo(() => bucket(facts, grain), [facts, grain]);
  const tot = useMemo(() => totals(facts, camps), [facts, camps]);
  const narrative = useMemo(() => buildNarrative({ tot, camps, productView }), [tot, camps, productView]);

  const scoped = useMemo(() => CAMPAIGNS.filter((c) =>
    (subFilter === "All" || c.product === subFilter) && (objective === "All" || c.objective === objective)
  ), [subFilter, objective]);
  const digTot = useMemo(() => {
    const cs = scoped.filter((c) => c.segment !== "linear"), ids = new Set(cs.map((c) => c.id));
    return totals(FACTS.filter((f) => ids.has(f.cid)), cs);
  }, [scoped]);
  const linTot = useMemo(() => {
    const cs = scoped.filter((c) => c.segment === "linear"), ids = new Set(cs.map((c) => c.id));
    return totals(FACTS.filter((f) => ids.has(f.cid)), cs);
  }, [scoped]);

  const sparks = useMemo(() => {
    const m = new Map();
    FACTS.forEach((f) => {
      if (!m.has(f.cid)) m.set(f.cid, new Array(39).fill(0));
      m.get(f.cid)[f.w - 1] = f.rev;
    });
    return m;
  }, []);

  const attainment = useMemo(() => {
    const all = bucket(FACTS, grain);
    const planWeekly = WEEKS.map((w) => PLAN_QUARTER[w.quarter - 1] / 13);
    let cumA = 0, cumP = 0;
    const rows = all.map((b) => {
      cumA += b.rev;
      cumP += grain === "weekly" ? planWeekly[b.k - 1]
        : grain === "monthly" ? WEEKS.filter((w) => w.month === b.k).reduce((s, w) => s + planWeekly[w.idx - 1], 0)
        : PLAN_QUARTER[b.k - 1];
      return { label: b.label, actual: cumA, plan: cumP };
    });
    const last = rows[rows.length - 1];
    const steps = grain === "quarterly" ? ["Q4 proj."]
      : grain === "monthly" ? ["Oct", "Nov", "Dec"]
      : Array.from({ length: 13 }, (_, i) => {
          const d = new Date(WEEK0 + (39 + i) * 7 * 86400000);
          return `w/e ${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
        });
    const proj = steps.map((label, i) => {
      const t = (i + 1) / steps.length;
      return {
        label, actual: null,
        plan: last.plan + PLAN_QUARTER[3] * t,
        projected: last.actual + (FY_PROJECTION - last.actual) * t,
        projLo: last.actual + (4_480_000 - last.actual) * t,
        projHi: last.actual + (5_010_000 - last.actual) * t,
      };
    });
    rows[rows.length - 1] = { ...last, projected: last.actual, projLo: last.actual, projHi: last.actual };
    return [...rows, ...proj];
  }, [grain]);

  const waterfall = useMemo(() => {
    let run = 0;
    const rows = BRIDGE.map((b) => {
      const base = b.delta >= 0 ? run : run + b.delta;
      const r = { label: b.label, base, value: Math.abs(b.delta), kind: b.kind };
      run += b.delta; return r;
    });
    rows.push({ label: "Net billable", base: 0, value: run, kind: "total" });
    return rows;
  }, []);

  const byProduct = useMemo(() => {
    const m = new Map();
    facts.forEach((f) => {
      const p = byId[f.cid].product;
      m.set(p, (m.get(p) || 0) + f.rev);
    });
    return [...m.entries()].map(([product, rev]) => ({ product, rev })).sort((a, b) => b.rev - a.rev);
  }, [facts]);

  const scatterData = useMemo(() => {
    const lin = CAMPAIGNS.filter((c) => c.segment === "linear").map((c) => c.cpp);
    const dig = CAMPAIGNS.filter((c) => c.segment !== "linear").map((c) => c.cpm);
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 1; };
    const mL = med(lin), mD = med(dig);
    return camps.map((c) => ({
      name: c.name, segment: c.segment, score: c.score, budget: c.budget,
      eff: clamp((c.segment === "linear" ? mL / c.cpp : mD / c.cpm) * 100, 55, 290),
    }));
  }, [camps]);

  const discrepancyRows = useMemo(() =>
    scoped.filter((c) => c.segment !== "linear")
      .map((c) => ({ name: c.name, discrepancy: c.discrepancy, budget: c.budget }))
      .sort((a, b) => b.discrepancy - a.discrepancy), [scoped]);

  const isLinear = productView === "linear", isDigital = productView === "digital";
  const src = (systems, caveat) => ({ systems, refresh: "Sep 28, 2026 06:14 PT", caveat });

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented value={productView} onChange={setProductView} options={[
        { value: "all", label: "All products" },
        { value: "digital", label: "Digital & streaming" },
        { value: "linear", label: "Linear" }]} />
      <Segmented value={grain} onChange={setGrain} options={[
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" }]} />
      {PRODUCTS[productView].length > 1 && (
        <Segmented size="sm" value={subFilter} onChange={setSubFilter}
          options={PRODUCTS[productView].map((p) => ({ value: p, label: p }))} />
      )}
      {objective !== "All" && <Chip onClear={() => setObjective("All")}>Objective: {objective}</Chip>}
    </div>
  );

  /* ---------------- the component ---------------- */
  const component = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="grid place-items-center" style={{ width: 26, height: 26, background: C.blueDark, borderRadius: 4 }}>
          <PanelsTopLeft size={14} color="#fff" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: C.ink }}>Campaign wrap — FY26 through Q3</div>
          <div className="text-xs" style={{ color: C.muted }}>
            {ACCOUNT.name} · {camps.length} of {CAMPAIGNS.length} campaigns in view · {usdFull(tot.rev)} booked
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setDict(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded"
                  style={{ color: C.blue, border: `1px solid ${C.rule}` }}><BookOpen size={13} /> Metrics</button>
          <button onClick={() => setExportOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded"
                  style={{ color: C.blue, border: `1px solid ${C.rule}` }}><Download size={13} /> Export</button>
        </div>
      </div>

      <div className="sticky px-4 py-2 flex flex-wrap items-center gap-3"
           style={{ top: 0, zIndex: 10, background: "#FAFAF9", borderBottom: `1px solid ${C.border}` }}>
        {controls}
        <div className="flex flex-wrap gap-1 ml-auto">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-xs px-2 py-1 rounded"
               style={{ color: active === s.id ? "#fff" : C.muted, background: active === s.id ? C.blue : "transparent" }}>
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="px-4 pb-2 pt-2 text-xs" style={{ color: C.muted }}>
        {productView === "all"
          ? "Linear and digital are compared at the revenue line only. GRPs and impressions are different currencies and are not summed."
          : isLinear
            ? "Linear is measured in Nielsen C3 GRPs on the broadcast calendar. The metric tiles below are the linear set."
            : "Digital and streaming are measured in ad-server impressions on the Gregorian calendar. The metric tiles below are the digital set."}
      </div>

      <div className="px-4 pb-4 space-y-7">

        {/* ---------- A · SUMMARY ---------- */}
        <div id="s-a">
          <SectionTitle n="A" title="Account summary"
            blurb="Written for the Omega QBR. Regenerates against the filters above." />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <Card className="xl:col-span-2" title="Where the account stands"
                  sources={src(["Salesforce CRM — Account, Opportunity, Order Product, Account Plan",
                                "Google Ad Manager + FreeWheel — delivery",
                                "Nielsen / VideoAmp — linear posting and cross-platform dedupe",
                                "Operative.One — as-run logs, ADU",
                                "Stellar Data Cloud — segments and attributed outcomes"],
                    "All figures on this component are filtered to Account 001Rx00000Kd41Q.")}>
              <div className="space-y-3" style={{ maxWidth: "78ch" }}>
                {narrative?.paras.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: C.ink2 }}>{p}</p>
                ))}
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="text-xs font-semibold mb-2" style={{ color: C.ink }}>
                  Recommended actions for Q4 and the FY27 upfront
                </div>
                <ol className="space-y-1.5">
                  {narrative?.actions.map((a, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: C.ink2 }}>
                      <span style={{ color: C.blue, fontWeight: 600, ...TNUM }}>{i + 1}.</span>
                      <span style={{ maxWidth: "74ch" }}>{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>

            <div className="space-y-3">
              <Card title="Account health" sources={src(["Salesforce CRM", "Operative.One"], "Net billable reflects credits issued through Sep 26.")}>
                <div className="grid grid-cols-2 gap-2">
                  <KpiTile label="Booked YTD" value={usd(tot.rev, 2)} sub="vs. plan $3.15M" trend={15.4} tone="good" />
                  <KpiTile label="Net billable" value={usd(NET_BILLABLE, 2)} sub="after credits" />
                  <KpiTile label="Delivery health" value={pct(tot.weightedDelivery, 0)} sub="weighted index"
                           tone={tot.weightedDelivery >= 99 ? "good" : "warn"} />
                  <KpiTile label="Share of spend" value={pct(WALLET_SHARE)} sub="of measured media" trend={3.6} tone="good" />
                </div>
              </Card>
              <Card title="Open items" sources={src(["Operative.One", "GAM vs. CM360"], "Nothing on this account is above the 10% dispute threshold.")}>
                <ul className="text-xs space-y-2">
                  <li className="flex items-center gap-2"><AlertTriangle size={13} style={{ color: C.amber }} />
                    <span style={{ color: C.ink2 }}>ADU / make-good balance</span>
                    <span className="ml-auto font-semibold" style={TNUM}>$24,000</span></li>
                  <li className="flex items-center gap-2"><AlertTriangle size={13} style={{ color: C.amber }} />
                    <span style={{ color: C.ink2 }}>Under-delivery credits</span>
                    <span className="ml-auto font-semibold" style={TNUM}>$18,000</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={13} style={{ color: C.green }} />
                    <span style={{ color: C.ink2 }}>Counts in dispute</span>
                    <span className="ml-auto font-semibold" style={TNUM}>None</span></li>
                  <li className="flex items-center gap-2"><Info size={13} style={{ color: C.muted }} />
                    <span style={{ color: C.ink2 }}>FY27 upfront committed</span>
                    <span className="ml-auto font-semibold" style={TNUM}>$4.10M</span></li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        {/* ---------- B · REVENUE VS PLAN ---------- */}
        <div id="s-b">
          <SectionTitle n="B" title="Revenue against account plan"
            blurb="Attainment is measured on Salesforce closed-won revenue for this account. Net billable reconciles that against delivered inventory." />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <Card className="xl:col-span-2" title="YTD booked revenue against the FY26 account plan"
                  subtitle="Amber marker is the 110% stretch target agreed with the agency at the FY26 upfront."
                  sources={src(["Salesforce CRM — Account Plan, Opportunity closed-won"],
                    "Plan is set quarterly: $1.66M / $0.81M / $0.68M / $1.05M, shaped to Omega's model-year calendar.")}>
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <span className="font-bold" style={{ ...TNUM, fontSize: 34, color: C.green }}>{usd(ACTUAL_YTD, 2)}</span>
                <span className="text-sm" style={{ color: C.ink2 }}>booked · <strong>114%</strong> of YTD plan</span>
                <span className="text-xs px-2 py-1 rounded" style={{ background: C.greenSoft, color: "#194E31" }}>
                  Pacing to {usd(FY_PROJECTION, 2)} · 113% of annual plan
                </span>
              </div>
              <Bullet actual={ACTUAL_YTD} target={PLAN_YTD} max={4_200_000}
                      threshold={PLAN_YTD * 1.1} thresholdLabel="Stretch 110%" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                <KpiTile label="Attainment vs. plan" value="114%" tone="good" sub="+$450K over plan" />
                <KpiTile label="Vs. prior year" value="+15.4%" tone="good" sub={`${usd(PRIOR_YTD, 2)} LY same period`} />
                <KpiTile label="Average campaign size" value={usd(720_000)} sub="5 campaigns" />
                <KpiTile label="Q4 pipeline coverage" value="1.4×" sub="on $1.05M Q4 plan" tone="good" />
              </div>
            </Card>

            <Card title="Share of Omega's measured spend"
                  subtitle="Stellar's share of the account's total measured media investment."
                  sources={src(["Nielsen Ad Intel — competitive spend", "Salesforce CRM"],
                    "Ad Intel excludes search, social and unmeasured direct buys, so true wallet share is lower.")}>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-bold" style={{ ...TNUM, fontSize: 30, color: C.ink }}>{pct(WALLET_SHARE)}</span>
                <span className="text-xs" style={{ color: C.green, fontWeight: 600 }}>▲ 3.6 pts</span>
                <span className="text-xs" style={{ color: C.muted }}>vs. FY25</span>
              </div>
              <div className="flex overflow-hidden" style={{ height: 26, borderRadius: 3 }}>
                {WALLET.map((w) => (
                  <div key={w.name} title={`${w.name}: ${w.v}%`} style={{ width: `${w.v}%`, background: w.c }} />
                ))}
              </div>
              <div className="mt-2 space-y-1">
                {WALLET.map((w) => (
                  <div key={w.name} className="flex items-center gap-2 text-xs">
                    <span style={{ width: 9, height: 9, background: w.c, display: "inline-block", borderRadius: 1 }} />
                    <span style={{ color: C.ink2 }}>{w.name}</span>
                    <span className="ml-auto" style={{ ...TNUM, color: C.ink }}>{w.v}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
            <Card title="Cumulative revenue against plan"
                  subtitle={`${grain === "weekly" ? "Broadcast weeks" : grain === "monthly" ? "Calendar months" : "Fiscal quarters"} · dashed line is the Q4 projection with its range.`}
                  sources={src(["Salesforce CRM — Opportunity close date and amount"],
                    "Projection extends trailing booking velocity plus the signed Q4 changeover schedule; it is not a committed forecast.")}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={attainment} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke={C.rule} />
                  <XAxis dataKey="label" {...axis} interval={grain === "weekly" ? 4 : 0} />
                  <YAxis {...axis} tickFormatter={(v) => usd(v)} width={52} />
                  <Tooltip content={<TT fmt={(v) => (v == null ? "—" : usdFull(v))} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                  <Line type="monotone" dataKey="plan" name="Account plan" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="projLo" name="Projection range" stroke={C.green} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 3" dot={false} />
                  <Line type="monotone" dataKey="projHi" stroke={C.green} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 3" dot={false} legendType="none" />
                  <Line type="monotone" dataKey="actual" name="Booked" stroke={C.green} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="projected" name="Q4 projection" stroke={C.green} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  <ReferenceLine y={PLAN_ANNUAL} stroke={C.ink} strokeDasharray="2 2"
                    label={{ value: "Annual plan $4.20M", position: "insideTopLeft", fontSize: 10, fill: C.ink }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Booked revenue to net billable"
                  subtitle="What Omega is invoiced is not what the opportunity closed at. This is the bridge."
                  sources={src(["Salesforce CRM — closed-won by segment", "Operative.One — ADU and pre-emptions", "Ad server — under-delivery reconciliation"],
                    "Credits are recognized when the make-good is agreed, not when the shortfall occurs.")}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={waterfall} margin={{ top: 8, right: 10, left: 4, bottom: 46 }}>
                  <CartesianGrid vertical={false} stroke={C.rule} />
                  <XAxis dataKey="label" {...axis} angle={-30} textAnchor="end" height={62} interval={0} tick={{ fontSize: 10, fill: C.muted }} />
                  <YAxis {...axis} tickFormatter={(v) => usd(v)} width={52} />
                  <Tooltip content={<TT fmt={(v, n, p) => `${p.kind === "down" ? "−" : ""}${usdFull(v)}`} />} />
                  <Bar dataKey="base" stackId="a" fill="transparent" legendType="none" />
                  <Bar dataKey="value" stackId="a" maxBarSize={40}>
                    {waterfall.map((r, i) => (
                      <Cell key={i} fill={r.kind === "up" ? C.t10[0] : r.kind === "down" ? C.t10[2] : C.blueDark} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs mt-1" style={{ color: C.muted }}>
                $73K of booked revenue does not convert to billings — 2.0% of the account, against 4.0% across the wider book.
              </div>
            </Card>
          </div>

          <Card className="mt-3" title="Revenue by product"
                subtitle="Where Omega's investment sat this year, sorted descending."
                sources={src(["Salesforce CRM — Order Product"], "Product taxonomy matches the FY26 rate card.")}>
            <ResponsiveContainer width="100%" height={Math.max(160, byProduct.length * 34)}>
              <BarChart data={byProduct} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={C.rule} />
                <XAxis type="number" {...axis} tickFormatter={(v) => usd(v)} />
                <YAxis type="category" dataKey="product" {...axis} width={112} tick={{ fontSize: 11, fill: C.ink2 }} />
                <Tooltip content={<TT fmt={(v) => usdFull(v)} />} />
                <Bar dataKey="rev" name="Booked revenue" maxBarSize={18} fill={C.t10[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ---------- C · CAMPAIGNS ---------- */}
        <div id="s-c">
          <SectionTitle n="C" title="Campaign performance"
            blurb="Composite score = 30% delivery accuracy + 30% quality + 40% outcome versus the goal written on the IO. Hover a score for the three components; click a row for the full detail." />
          <Card title="All Omega campaigns, ranked"
                subtitle="Sorted on composite score. Sparklines show weekly delivered revenue across the flight."
                sources={src(["Salesforce CRM — Order Product", "Ad server — delivery and quality",
                              "Nielsen — C3 posting", "Stellar Data Cloud — outcomes"],
                  "Outcome index is measured against the campaign's own goal, not against an account or book average.")}>
            <CampaignTable rows={narrative?.ranked || []} sparks={sparks} expanded={expanded} setExpanded={setExpanded} />
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
            <Card title="Efficiency against effectiveness"
                  subtitle="Efficiency is indexed inside each segment, because CPP and CPM are not the same measurement. Bubble size is revenue."
                  sources={src(["Salesforce CRM", "Nielsen — CPP", "Ad server — eCPM"],
                    "Reference lines are the medians across Omega's own campaigns.")}>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 26 }}>
                  <CartesianGrid stroke={C.rule} />
                  <XAxis type="number" dataKey="eff" name="Efficiency index" domain={[50, 300]} {...axis}
                         label={{ value: "Efficiency index (100 = account median)", position: "insideBottom", offset: -14, fontSize: 10, fill: C.muted }} />
                  <YAxis type="number" dataKey="score" name="Composite score" domain={[75, 100]} {...axis} width={34} />
                  <ZAxis type="number" dataKey="budget" range={[70, 460]} />
                  <ReferenceLine x={100} stroke={C.ink} strokeDasharray="3 3" />
                  <ReferenceLine y={narrative?.avg || 90} stroke={C.ink} strokeDasharray="3 3" />
                  <Tooltip content={<TT title={(p) => p.name} fmt={(v) => Math.round(v)} />} />
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => (
                      <Cell key={i} fill={d.segment === "linear" ? C.t10[0] : d.segment === "streaming" ? C.t10[3] : C.t10[1]} fillOpacity={0.78} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.muted }}>
                <span><span style={{ color: C.t10[0] }}>●</span> Linear</span>
                <span><span style={{ color: C.t10[3] }}>●</span> Streaming</span>
                <span><span style={{ color: C.t10[1] }}>●</span> Digital</span>
                <span className="w-full">Intender Retargeting sits far right — cheap and effective — and is the smallest bubble on the chart.</span>
              </div>
            </Card>

            <div className="space-y-3">
              {narrative?.best && (
                <Card title={`Strongest line — ${narrative.best.name}`}
                      subtitle={`${narrative.best.product} · ${narrative.best.objective} · weeks ${narrative.best.start}–${narrative.best.end} · ${usdFull(narrative.best.budget)}`}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-bold" style={{ ...TNUM, fontSize: 28, color: C.green }}>{narrative.best.score}</span>
                    <span className="text-xs" style={{ color: C.muted }}>composite</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: C.greenSoft, color: "#194E31", ...TNUM }}>
                      {narrative.best.outcomeIdx}% of goal
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>{NOTES[narrative.best.shortName]?.text}</p>
                </Card>
              )}
              {narrative?.weakest && narrative.weakest.id !== narrative.best.id && (
                <Card title={`Weakest line — ${narrative.weakest.name}`}
                      subtitle={`${narrative.weakest.product} · ${narrative.weakest.objective} · weeks ${narrative.weakest.start}–${narrative.weakest.end} · ${usdFull(narrative.weakest.budget)}`}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-bold" style={{ ...TNUM, fontSize: 28, color: C.amber }}>{narrative.weakest.score}</span>
                    <span className="text-xs" style={{ color: C.muted }}>composite</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: C.amberSoft, color: "#8C4B02", ...TNUM }}>
                      {narrative.weakest.outcomeIdx}% of goal
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    {NOTES[narrative.weakest.shortName]?.cause || NOTES[narrative.weakest.shortName]?.text}
                  </p>
                  {NOTES[narrative.weakest.shortName]?.impact && (
                    <div className="text-xs px-3 py-2 rounded mt-2" style={{ background: C.amberSoft, color: "#8C4B02" }}>
                      {NOTES[narrative.weakest.shortName].fix} Dollar impact{" "}
                      <strong style={TNUM}>{NOTES[narrative.weakest.shortName].impact}</strong>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* ---------- D · DELIVERY ---------- */}
        <div id="s-d">
          <SectionTitle n="D" title="Delivery and pacing"
            blurb={isLinear ? "Linear metric set: GRPs, posting, CPP and spot compliance on Nielsen C3."
              : isDigital ? "Digital metric set: impressions, delivery index, completion, viewability, on-target and eCPM on ad-server counts."
              : "All-products view shows both metric sets. They are not summed and not compared."} />

          {(productView === "all" || isDigital) && digTot.campaignCount > 0 && (
            <>
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.ink2 }}>
                <MonitorPlay size={13} style={{ color: C.t10[1] }} /> Digital &amp; streaming metric set
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <KpiTile label="Impressions delivered" value={num(digTot.imps)} sub={`${pct(digTot.deliveryRate, 0)} of contracted`} tone={digTot.deliveryRate >= 100 ? "good" : "warn"} />
                <KpiTile label="Video completion rate" value={pct(digTot.vcr, 0)} sub="video impressions only" tone={digTot.vcr >= 88 ? "good" : "neutral"} />
                <KpiTile label="Viewability (MRC)" value={pct(digTot.viewRate, 0)} sub="of measured" tone={digTot.viewRate >= 70 ? "good" : "warn"} />
                <KpiTile label="On-target %" value={pct(digTot.otRate, 0)} sub="70% guarantee" tone={digTot.otRate >= 70 ? "good" : "bad"} />
                <KpiTile label="eCPM" value={`$${digTot.ecpm.toFixed(2)}`} sub="net revenue basis" />
                <KpiTile label="Attributed conversions" value={num(digTot.conversions)} sub="30-day post-exposure" />
                <KpiTile label="Incremental reach" value="41%" sub="CTV over linear" tone="good" />
                <KpiTile label="Max discrepancy" value="6.2%" sub="threshold 10%" />
              </div>
            </>
          )}

          {(productView === "all" || isLinear) && linTot.campaignCount > 0 && (
            <>
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.ink2 }}>
                <Radio size={13} style={{ color: C.t10[0] }} /> Linear metric set
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <KpiTile label="GRPs delivered (A25-54)" value={Math.round(linTot.grps).toLocaleString()} sub="C3 basis" />
                <KpiTile label="Posting %" value={pct(linTot.deliveryRate, 0)} sub="of guaranteed GRPs" tone={linTot.deliveryRate >= 100 ? "good" : "warn"} />
                <KpiTile label="Demo impressions" value={num(linTot.imps)} sub="rating × universe" />
                <KpiTile label="CPP" value={usdFull(linTot.cpp)} sub="net spend ÷ GRPs" />
                <KpiTile label="CPM equivalent" value={linTot.imps ? `$${(linTot.rev / (linTot.imps / 1000)).toFixed(2)}` : "—"} sub="not comparable to digital" />
                <KpiTile label="Spots aired / ordered" value={linTot.spotsOrdered ? pct((linTot.spotsAired / linTot.spotsOrdered) * 100, 1) : "—"} sub={`${Math.round(linTot.spotsOrdered).toLocaleString()} ordered`} />
                <KpiTile label="Pre-emption rate" value={pct(linTot.preemptRate)} sub="of ordered spots" tone={linTot.preemptRate < 3 ? "neutral" : "warn"} />
                <KpiTile label="ADU balance" value="$24K" sub="open into Q4" tone="warn" />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Card title="Pacing by campaign"
                  subtitle="Delivered-to-date against expected-to-date. Shaded band is the 95–105% acceptable corridor."
                  sources={src(["Google Ad Manager / FreeWheel", "Operative.One — as-run", "Salesforce CRM — flight dates"],
                    "Expected-to-date assumes even pacing unless the IO specifies a weighted schedule.")}>
              <DotPlot items={camps.map((c) => ({
                        label: c.name, value: c.deliveryIdx,
                        color: c.deliveryIdx >= 95 && c.deliveryIdx <= 105 ? C.t10[0] : c.deliveryIdx < 95 ? C.red : C.amber,
                      })).sort((a, b) => a.value - b.value)}
                      lo={90} hi={110} band={[95, 105]} target={100}
                      valueFmt={(v) => `${Math.round(v)}%`} height={220} />
              <div className="text-xs mt-2" style={{ color: C.muted }}>
                Every Omega line finished inside the corridor. No pacing intervention was required this year.
              </div>
            </Card>

            <Card title={isLinear ? "Delivery index by daypart and network" : "Delivery index by placement and device"}
                  subtitle="Only the inventory Omega actually bought. Blank cells carried no delivery."
                  sources={src(isLinear ? ["Nielsen — C3 by daypart", "Operative.One — as-run"] : ["Google Ad Manager", "FreeWheel"],
                    isLinear ? "Sports primetime carried the Ridgeline launch." : "Mobile web is the weak column and it is where Summer Drive concentrated.")}>
              <Heatmap grid={isLinear ? LINEAR_GRID : DIGITAL_GRID}
                       caption={isLinear ? "Sports primetime at 116 is the best inventory on the account."
                                         : "CTV outperforms every other environment; mobile web underperforms in every format."} />
            </Card>
          </div>

          {(productView === "all" || isDigital) && discrepancyRows.length > 0 && (
            <Card className="mt-3" title="Third-party count discrepancy"
                  subtitle="Stellar ad-server counts against Omega's agency-side counts. The 10% line is where the IO permits a billing dispute."
                  sources={src(["Google Ad Manager (server of record)", "Campaign Manager 360 via Meridian West Media"],
                    "2–5% is normal and attributable to latency and tag-fire loss. Nothing on this account is escalated.")}>
              <ResponsiveContainer width="100%" height={Math.max(140, discrepancyRows.length * 34)}>
                <BarChart data={discrepancyRows} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={C.rule} />
                  <XAxis type="number" {...axis} domain={[0, 12]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" {...axis} width={150} tick={{ fontSize: 10, fill: C.ink2 }} />
                  <Tooltip content={<TT fmt={(v, n, p) => `${v}% on ${usdFull(p.budget)} of billings`} />} />
                  <ReferenceLine x={10} stroke={C.red} strokeDasharray="4 3"
                    label={{ value: "Dispute threshold", position: "top", fontSize: 10, fill: C.red }} />
                  <Bar dataKey="discrepancy" name="Discrepancy" maxBarSize={14}>
                    {discrepancyRows.map((d, i) => (
                      <Cell key={i} fill={d.discrepancy >= 10 ? C.red : d.discrepancy >= 8 ? C.amber : C.t10[0]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* ---------- E · AUDIENCES ---------- */}
        <div id="s-e">
          <SectionTitle n="E" title="Audience segments"
            blurb="Segment performance across Omega's delivery only. On-target percentage anchors the view because it is what triggers make-goods and what the agency renews on." />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Card title="Segment index against general population"
                  subtitle="100 = parity. Sorted best to worst, diverging from the parity line."
                  sources={src(["Nielsen / VideoAmp — demo verification", "Stellar Data Cloud — 1P segments", "LiveRamp — CRM match"],
                    "Index is calculated on verified in-target impressions, not on planned targeting.")}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SEGMENTS.map((s) => ({ ...s, delta: s.index - 100 }))} layout="vertical"
                          margin={{ top: 4, right: 34, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={C.rule} />
                  <XAxis type="number" {...axis} domain={[-50, 80]} tickFormatter={(v) => `${100 + v}`} />
                  <YAxis type="category" dataKey="name" {...axis} width={150} tick={{ fontSize: 10, fill: C.ink2 }} />
                  <Tooltip content={<TT title={(p) => `${p.name} · ${p.type}`}
                    fmt={(v, n, p) => `Index ${p.index} · ${p.onTarget}% on-target · ${p.comp}% of delivery`} />} />
                  <ReferenceLine x={0} stroke={C.ink} />
                  <Bar dataKey="delta" name="Index" maxBarSize={13}>
                    {SEGMENTS.map((s, i) => <Cell key={i} fill={s.index >= 100 ? C.t10[0] : C.t10[1]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="On-target delivery and share of impressions"
                  subtitle="Dot is on-target rate; the line is the 70% contractual guarantee."
                  sources={src(["Nielsen Digital Ad Ratings", "VideoAmp", "Stellar Data Cloud"],
                    "Segments below 70% carry a bonus-weight obligation on guaranteed-audience lines.")}>
              <DotPlot items={SEGMENTS.map((s) => ({
                        label: `${s.name} · ${s.comp}%`, value: s.onTarget,
                        color: s.onTarget >= 80 ? C.green : s.onTarget >= 70 ? C.t10[0] : s.onTarget >= 60 ? C.amber : C.red,
                      })).sort((a, b) => b.value - a.value)}
                      lo={35} hi={95} target={70} labelWidth={172}
                      valueFmt={(v) => `${Math.round(v)}%`} height={300} />
              <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: C.amber }}>
                <AlertTriangle size={12} /> Three segments below the 70% guarantee, carrying 16.0% of delivery between them.
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
            <Card title="Cost against outcome"
                  subtitle="Effective CPM to reach the segment against its conversion rate. Bubble size is share of delivery."
                  sources={src(["Salesforce CRM — net revenue", "Ad server — delivery by segment", "Stellar Data Cloud — attribution"],
                    "Conversion is a 30-day post-exposure attributed action, deduplicated across platforms.")}>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 26 }}>
                  <CartesianGrid stroke={C.rule} />
                  <XAxis type="number" dataKey="ecpm" name="eCPM" domain={[10, 50]} {...axis} tickFormatter={(v) => `$${v}`}
                         label={{ value: "Effective CPM to reach segment", position: "insideBottom", offset: -14, fontSize: 10, fill: C.muted }} />
                  <YAxis type="number" dataKey="cvr" name="Conversion rate" domain={[0, 5]} {...axis} width={34} tickFormatter={(v) => `${v}%`} />
                  <ZAxis type="number" dataKey="comp" range={[60, 460]} />
                  <ReferenceLine x={33} stroke={C.ink} strokeDasharray="3 3" />
                  <ReferenceLine y={2.3} stroke={C.ink} strokeDasharray="3 3" />
                  <Tooltip content={<TT title={(p) => p.name} fmt={(v, n) => n === "eCPM" ? `$${v}` : `${v}%`} />} />
                  <Scatter data={SEGMENTS}>
                    {SEGMENTS.map((s, i) => (
                      <Cell key={i} fill={s.index >= 130 ? C.green : s.index >= 100 ? C.t10[0] : C.t10[2]} fillOpacity={0.74} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Card>

            <Card title="What the segment data says">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.green }}>Best performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Auto Intenders indexed at 172 with 89% on-target delivery and a 3.8% conversion rate, and it already
                    carries 22.4% of Omega's delivery — the largest share on the account. In-market truck and SUV
                    and Sports Loyalists follow. All three are Stellar first-party segments, which is the argument for
                    pricing them at a premium in the FY27 upfront rather than folding them into a broad demo guarantee.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.red }}>Worst performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Run-of-network remnant delivered at 42% on-target, well under the guarantee. Value Shoppers, a
                    third-party syndicated segment, indexed at 66 and converted at 0.7%. M18-34 looks cheap at a $24
                    eCPM and is not: at 56% on-target the real cost per in-target impression is $43, within $8 of the
                    Omega owner CRM match — which converts at 4.4% instead of 0.9%.
                  </p>
                </div>
                <div className="p-2.5 rounded" style={{ background: C.blueSoft }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.blueDark }}>The move</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    M18-34, Value Shoppers and remnant together absorb 16.0% of Omega's impressions at an average
                    index of 65. Reallocating that into Auto Intenders and in-market truck and SUV is worth roughly
                    $214K of equivalent working value on identical spend — no new budget, no new inventory, just a
                    different plan.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ---------- F · REACH ---------- */}
        {productView === "all" && (
          <div id="s-f">
            <SectionTitle n="F" title="Cross-platform reach"
              blurb="Deduplicated reach across Omega's linear, streaming and digital delivery. This is the number that carries the FY27 upfront conversation." />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <Card title="Deduplicated reach overlap"
                    subtitle="Unique individuals reached, in millions, across the three platform groups."
                    sources={src(["VideoAmp — cross-platform dedupe", "Nielsen — linear panel", "FreeWheel + GAM — device graph"],
                      "Dedupe is modeled at the individual level with a 4.1% margin of error at this sample size.")}>
                <div className="flex justify-center py-1">
                  <svg viewBox="0 0 360 240" style={{ width: "100%", maxWidth: 360 }} role="img"
                       aria-label="Omega reach overlap: linear 12.6 million, streaming 7.4 million, digital 4.9 million, 19.8 million deduplicated">
                    <circle cx="142" cy="100" r="76" fill={C.t10[0]} fillOpacity="0.42" />
                    <circle cx="214" cy="100" r="56" fill={C.t10[3]} fillOpacity="0.42" />
                    <circle cx="178" cy="156" r="47" fill={C.t10[1]} fillOpacity="0.42" />
                    <text x="98" y="66" fontSize="12" fill={C.ink} fontWeight="600">Linear</text>
                    <text x="98" y="82" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>12.6M</text>
                    <text x="236" y="66" fontSize="12" fill={C.ink} fontWeight="600">Streaming</text>
                    <text x="236" y="82" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>7.4M</text>
                    <text x="152" y="204" fontSize="12" fill={C.ink} fontWeight="600">Digital</text>
                    <text x="152" y="220" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>4.9M</text>
                    <text x="178" y="112" fontSize="11" fill={C.ink2} textAnchor="middle" style={TNUM}>1.2M all three</text>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <KpiTile label="Deduplicated reach" value="19.8M" sub="unique individuals" />
                  <KpiTile label="Incremental from streaming" value="+5.2M" sub="on top of linear" tone="good" />
                  <KpiTile label="Reach lift" value="+41.3%" sub="vs. linear alone" tone="good" />
                </div>
              </Card>

              <Card title="Reach and frequency curve"
                    subtitle="Cumulative reach at each frequency level. The gap between the lines is the case for the streaming buy."
                    sources={src(["VideoAmp — cross-platform R/F", "Nielsen — linear R/F"],
                      "Curves are modeled at Omega's actual FY26 CPM mix.")}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={REACH.curve} margin={{ top: 8, right: 16, left: 4, bottom: 18 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="freq" {...axis}
                           label={{ value: "Average frequency", position: "insideBottom", offset: -8, fontSize: 10, fill: C.muted }} />
                    <YAxis {...axis} width={40} tickFormatter={(v) => `${v}M`} />
                    <Tooltip content={<TT fmt={(v) => `${v}M individuals`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Area type="monotone" dataKey="combined" name="Linear + streaming + digital" stroke={C.t10[0]} fill={C.t10[0]} fillOpacity={0.14} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="linear" name="Linear alone" stroke={C.t10[9]} strokeWidth={2} dot={false} />
                    <ReferenceLine x={4} stroke={C.ink} strokeDasharray="3 3"
                      label={{ value: "Planned frequency", position: "top", fontSize: 10, fill: C.muted }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs" style={{ color: C.muted }}>
                  At the planned average frequency of 4, streaming and digital added 4.9M individuals the linear buy never reached.
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ---------- G · Q4 & FY27 ---------- */}
        <div id="s-g">
          <SectionTitle n="G" title="Q4 pipeline and FY27 outlook"
            blurb="Open opportunities on this account, and what this year's performance implies for the upfront." />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Card title="Open Q4 opportunities"
                  subtitle="Weighted at the stage default probability."
                  sources={src(["Salesforce CRM — Opportunity stage, amount, close date"],
                    "Stage probabilities are org defaults, not seller-adjusted.")}>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={PIPELINE.map((p) => ({ ...p, weighted: p.amount * p.prob }))} layout="vertical"
                          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={C.rule} />
                  <XAxis type="number" {...axis} tickFormatter={(v) => usd(v)} />
                  <YAxis type="category" dataKey="stage" {...axis} width={150} tick={{ fontSize: 10, fill: C.ink2 }} />
                  <Tooltip content={<TT fmt={(v, n, p) => `${usdFull(v)} · ${p.stageName} · closes ${p.close}`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                  <Bar dataKey="amount" name="Open value" fill={C.t10[9]} maxBarSize={14} />
                  <Bar dataKey="weighted" name="Weighted" fill={C.t10[0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <KpiTile label="Open Q4 pipeline" value={usd(1_475_000)} sub="3 opportunities" />
                <KpiTile label="Weighted + closed" value={usd(1_116_000)} sub="vs. $1.05M plan" tone="good" />
                <KpiTile label="Closed Q4 to date" value={usd(Q4_CLOSED)} sub="1 opportunity" />
              </div>
            </Card>

            <Card title="FY27 outlook" subtitle="What the FY26 result argues for at the upfront.">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <KpiTile label="Renewal probability" value="94%" tone="good" sub="modeled on 3yr history" />
                <KpiTile label="FY27 upfront committed" value="$4.10M" tone="good" sub="before scatter" />
              </div>
              <ul className="space-y-2">
                {[
                  ["Grow Intender Retargeting from $340K", "Highest conversion rate on the account at the lowest CPM. The smallest line is the most efficient one."],
                  ["Hold the sports premium", "A 121 C3 index against a 100 guarantee justifies the $13,800 CPP on the Ridgeline launch."],
                  ["Re-cut Summer Drive as CTV mid-roll", "Mobile-web supply cost roughly 14 points of on-target delivery on a $500K line."],
                  ["Price 1P segments separately", "Auto Intenders and in-market truck and SUV index at 172 and 158. They should not sit inside a broad demo guarantee."],
                ].map(([t, d], i) => (
                  <li key={i} className="flex gap-2.5">
                    <Star size={13} style={{ color: C.blue, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: C.ink }}>{t}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.muted }}>{d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <div className="pt-2 text-xs" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>
          <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2">
            <span>Filtered to Account {ACCOUNT.sfId} · {ACCOUNT.name}</span>
            <span>Billing server of record: Google Ad Manager (digital), Operative.One (linear)</span>
            <span>Linear runs on the broadcast calendar, digital on the Gregorian calendar; quarter boundaries differ by up to six days.</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------------- Lightning record page shell ---------------- */
  const field = (label, value, icon) => (
    <div className="min-w-0">
      <div className="text-xs" style={{ color: C.muted }}>{label}</div>
      <div className="text-xs font-medium truncate flex items-center gap-1" style={{ color: C.ink }}>
        {icon}{value}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.canvas, fontFamily: FONT, color: C.ink, minHeight: "100vh" }}>
      <style>{`
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
        button:focus-visible,a:focus-visible{outline:2px solid ${C.blue};outline-offset:2px}
      `}</style>

      {chrome && (
        <>
          <div className="flex items-center gap-3 px-4" style={{ background: "#032D60", height: 40 }}>
            <div className="grid place-items-center font-bold text-white" style={{ width: 24, height: 24, background: "#0B5CAB", borderRadius: 4, fontSize: 11 }}>SM</div>
            <span className="text-xs font-semibold" style={{ color: "#fff" }}>Ad Sales Console</span>
            <div className="flex items-center gap-4 ml-4">
              {["Home", "Accounts", "Opportunities", "Orders", "Reports"].map((t) => (
                <span key={t} className="text-xs" style={{ color: t === "Accounts" ? "#fff" : "#C9E1F7" }}>{t}</span>
              ))}
            </div>
            <span className="ml-auto text-xs" style={{ color: "#C9E1F7" }}>Jennifer Smith</span>
          </div>

          <div className="px-4 pt-3 pb-2" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-start gap-3">
              <div className="grid place-items-center shrink-0" style={{ width: 40, height: 40, background: "#F9A825", borderRadius: 6 }}>
                <Building2 size={20} color="#fff" />
              </div>
              <div className="min-w-0">
                <div className="text-xs" style={{ color: C.muted }}>Account</div>
                <h1 className="font-semibold leading-tight" style={{ fontSize: 20, color: C.ink }}>{ACCOUNT.name}</h1>
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {["Follow", "New Opportunity", "New Order", "Edit"].map((b, i) => (
                  <button key={b} className="text-xs px-3 py-1.5 rounded"
                          style={{ border: `1px solid ${C.rule}`, color: i === 3 ? "#fff" : C.blue, background: i === 3 ? C.blue : C.card }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mt-3">
              {field("Type", ACCOUNT.type)}
              {field("Industry", ACCOUNT.industry)}
              {field("Account Owner", ACCOUNT.owner)}
              {field("Agency of Record", ACCOUNT.agency)}
              {field("Account Number", ACCOUNT.number)}
              {field("Customer Since", ACCOUNT.since)}
            </div>
            <div className="flex gap-1 mt-3 flex-wrap">
              {["Related", "Details", "News", "Campaign Performance"].map((t) => {
                const on = t === "Campaign Performance";
                return (
                  <span key={t} className="text-xs px-3 py-2"
                        style={{ color: on ? C.blue : C.ink2, fontWeight: on ? 600 : 400,
                                 borderBottom: `2px solid ${on ? C.blue : "transparent"}` }}>
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}


      <div className="flex gap-3 px-3 pb-6 items-start">
        <main className="flex-1 min-w-0" style={{ maxWidth: 1120 }}>{component}</main>

        {chrome && (
          <aside className="hidden xl:block shrink-0 space-y-3" style={{ width: 300 }}>
            <Card title="Account details">
              <div className="space-y-2">
                {[["Website", ACCOUNT.website, <Globe size={11} key="g" />],
                  ["Phone", ACCOUNT.phone, <Phone size={11} key="p" />],
                  ["Billing address", ACCOUNT.billing, null],
                  ["Account segment", ACCOUNT.segment, null],
                  ["Account team", ACCOUNT.team, <Briefcase size={11} key="b" />],
                  ["Agency contact", ACCOUNT.agencyContact, <Mail size={11} key="m" />]].map(([l, v, ic]) => (
                  <div key={l}>
                    <div className="text-xs" style={{ color: C.muted }}>{l}</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: C.ink2 }}>{ic}{v}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Open opportunities (3)">
              <div className="space-y-2">
                {PIPELINE.map((p) => (
                  <div key={p.stage} className="pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="text-xs font-medium" style={{ color: C.blue }}>{p.stage}</div>
                    <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: C.muted }}>
                      <span style={TNUM}>{usd(p.amount)}</span><span>·</span><span>{p.stageName}</span>
                    </div>
                    <div className="text-xs" style={{ color: C.muted }}>Closes {p.close}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Upcoming activity">
              <div className="flex gap-2">
                <Calendar size={13} style={{ color: C.blue, marginTop: 2 }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: C.ink }}>FY27 upfront presentation</div>
                  <div className="text-xs" style={{ color: C.muted }}>Oct 6, 2026 · Priya Raman, Meridian West Media</div>
                </div>
              </div>
              <div className="text-xs mt-3" style={{ color: C.muted }}>
                Last activity: {ACCOUNT.lastActivity}
              </div>
            </Card>
          </aside>
        )}
      </div>

      {/* metric dictionary */}
      {dict && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setDict(false)}>
          <div className="h-full overflow-y-auto" style={{ width: "min(540px,100%)", background: C.card }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center gap-2 px-4 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              <BookOpen size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Metric dictionary</h3>
              <button className="ml-auto" onClick={() => setDict(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs mb-3" style={{ color: C.muted }}>
                Every metric on this component, with its formula and source system. If a number is not here, it is not in the report.
              </p>
              {DICTIONARY.map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="text-xs font-semibold mb-2" style={{ color: C.ink }}>{g.title}</div>
                  <table className="w-full text-xs">
                    <thead><tr style={{ color: C.muted }}>
                      <th className="text-left font-medium pb-1" style={{ width: "30%" }}>Metric</th>
                      <th className="text-left font-medium pb-1">Definition</th>
                      <th className="text-left font-medium pb-1" style={{ width: "26%" }}>Source</th>
                    </tr></thead>
                    <tbody>{g.rows.map((r) => (
                      <tr key={r[0]} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="py-1.5 pr-2 font-medium" style={{ color: C.ink2 }}>{r[0]}</td>
                        <td className="py-1.5 pr-2" style={{ color: C.ink2 }}>{r[1]}</td>
                        <td className="py-1.5" style={{ color: C.muted }}>{r[2]}</td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* export */}
      {exportOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center px-4" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setExportOpen(false)}>
          <div className="p-4" style={{ background: C.card, width: "min(440px,100%)", borderRadius: 4 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Export</h3>
              <button className="ml-auto" onClick={() => setExportOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Exports carry the current filters: {productView === "all" ? "all products" : productView === "linear" ? "linear only" : "digital and streaming"}, {grain} grain.
            </p>
            <div className="space-y-2">
              {[["Client-ready PDF", "Narrative, charts and annotations on Stellar letterhead. Wallet share and pipeline omitted."],
                ["Internal PDF", "Everything, including plan attainment, wallet share and Q4 pipeline."],
                ["Attach to Account", "Saves the PDF to Files on this record and posts to Chatter."],
                ["Underlying CSV", "Campaign-week fact table for this account, 112 rows, with source-system columns."]].map(([t, d]) => (
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
