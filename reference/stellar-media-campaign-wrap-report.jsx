import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceArea, Cell, ZAxis
} from "recharts";
import {
  Database, Download, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Info, X, Radio, MonitorPlay, BookOpen
} from "lucide-react";

/* ============================================================================
   STELLAR MEDIA — SELLER CAMPAIGN WRAP REPORT
   Jennifer Smith · Senior Account Executive, West Region
   Sources: Salesforce CRM · Google Ad Manager · FreeWheel · Nielsen/VideoAmp ·
            Operative.One · Stellar Data Cloud (Snowflake + LiveRamp)
   ========================================================================== */

const C = {
  canvas: "#F3F3F3",
  card: "#FFFFFF",
  border: "#E5E5E5",
  rule: "#DDDBDA",
  ink: "#181818",
  ink2: "#3E3E3C",
  muted: "#706E6B",
  blue: "#0176D3",
  blueDark: "#014486",
  blueSoft: "#EEF4FF",
  green: "#2E844A",
  greenSoft: "#EBF7ED",
  amber: "#FE9339",
  amberSoft: "#FEF5E9",
  red: "#EA001E",
  redSoft: "#FEF1F1",
  t10: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
        "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"],
};

const FONT = "'Salesforce Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const TNUM = { fontVariantNumeric: "tabular-nums" };

/* ---------- formatters ---------- */
const usd = (n, d = 0) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(d === 0 ? 1 : d)}M`
  : n >= 1e3 ? `$${Math.round(n / 1e3)}K`
  : `$${Math.round(n)}`;
const usdFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B`
  : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
  : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K`
  : `${Math.round(n)}`;
const pct = (n, d = 1) => `${n.toFixed(d)}%`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- deterministic PRNG ---------- */
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

/* ---------- broadcast calendar: 39 weeks, FY26 through Q3 close ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK0 = Date.UTC(2026, 0, 3);
const WEEKS = Array.from({ length: 39 }, (_, i) => {
  const d = new Date(WEEK0 + i * 7 * 86400000);
  return {
    idx: i + 1,
    label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
    month: d.getUTCMonth(),
    monthLabel: MONTHS[d.getUTCMonth()],
    quarter: i < 13 ? 1 : i < 26 ? 2 : 3,
  };
});

/* ---------- advertisers ---------- */
const ADVERTISERS = {
  "Omega, Inc.":   { cat: "Auto",    prior: 3120, renewalNote: "Upfront anchor" },
  "Foundry Auto Group": { cat: "Auto",    prior: 1610, renewalNote: "Renewed Q2" },
  "Cascade Bank":       { cat: "Finance", prior: 2440, renewalNote: "Upfront anchor" },
  "Torchlight Insurance":{cat: "Finance", prior: 2180, renewalNote: "In renewal" },
  "Vireo Wireless":     { cat: "Telecom", prior: 2510, renewalNote: "At risk" },
  "Meridian Foods":     { cat: "QSR",     prior: 1480, renewalNote: "Renewed Q3" },
  "Verdant Grocery":    { cat: "Retail",  prior: 1290, renewalNote: "At risk" },
  "Apex Athletic":      { cat: "Retail",  prior: 1740, renewalNote: "In renewal" },
  "Halcyon Health":     { cat: "Health",  prior: 1230, renewalNote: "Renewed Q2" },
  "Bellwether Airlines":{ cat: "Travel",  prior: 860,  renewalNote: "New logo" },
  "Lumen Home":         { cat: "Retail",  prior: 1010, renewalNote: "In renewal" },
  "Calyx Beauty":       { cat: "CPG",     prior: 320,  renewalNote: "New logo" },
};

/* ---------- campaign seed (40 campaigns, budgets in $K, sum = 21,600) ----------
   g = segment (linear | streaming | digital), p = product, s/e = flight weeks
   b = net budget $K, o = objective
   LINEAR   : cpp, post (posting %), c3 (C3 index vs guarantee), pre (pre-empt %)
   DIGITAL  : cpm, del (delivery index), vcr, vw (viewability), ot (on-target %),
              ctr, cvr (conv rate %), lift (brand lift pts), ir (incremental reach %)
   oc = outcome index vs goal (100 = goal met)                                   */
const SEED = [
  // Omega, Inc. — 3,600
  {n:"Q1 Model Year Clearance",a:"Omega, Inc.",g:"linear",p:"Primetime",s:1,e:13,b:980,o:"Awareness",cpp:9400,post:103,c3:114,pre:1.4,oc:112},
  {n:"Ridgeline Launch — Sports",a:"Omega, Inc.",g:"linear",p:"Sports",s:5,e:14,b:760,o:"Awareness",cpp:13800,post:101,c3:121,pre:2.1,oc:118},
  {n:"Always-On CTV",a:"Omega, Inc.",g:"streaming",p:"CTV/Streaming",s:1,e:39,b:1020,o:"Reach",cmp:0,cpm:47,del:103,vcr:94,vw:88,ot:89,ctr:0.44,cvr:2.6,lift:6.2,ir:41,oc:131},
  {n:"Intender Retargeting",a:"Omega, Inc.",g:"digital",p:"Display",s:1,e:39,b:340,o:"Performance",cpm:11,del:104,vcr:0,vw:79,ot:83,ctr:0.62,cvr:3.4,lift:1.8,ir:6,oc:121},
  {n:"Summer Drive Event",a:"Omega, Inc.",g:"digital",p:"Online video",s:22,e:32,b:500,o:"Consideration",cpm:29,del:99,vcr:81,vw:74,ot:76,ctr:0.38,cvr:1.7,lift:3.1,ir:12,oc:96},
  // Foundry Auto Group — 1,500
  {n:"Weekend Sales Event",a:"Foundry Auto Group",g:"linear",p:"Syndication",s:1,e:39,b:620,o:"Performance",cpp:4100,post:99,c3:96,pre:2.6,oc:94},
  {n:"Local Dealer FAST",a:"Foundry Auto Group",g:"streaming",p:"CTV/Streaming",s:8,e:39,b:540,o:"Performance",cpm:34,del:102,vcr:90,vw:85,ot:81,ctr:0.35,cvr:2.2,lift:3.4,ir:24,oc:108},
  {n:"Trade-In Offer",a:"Foundry Auto Group",g:"digital",p:"Display",s:14,e:30,b:340,o:"Performance",cpm:9,del:106,vcr:0,vw:71,ot:69,ctr:0.41,cvr:1.9,lift:0.9,ir:5,oc:88},
  // Cascade Bank — 2,900
  {n:"Wealth Q1 Push",a:"Cascade Bank",g:"linear",p:"News",s:1,e:13,b:760,o:"Consideration",cpp:7600,post:102,c3:108,pre:1.1,oc:105},
  {n:"Mortgage Rate Response",a:"Cascade Bank",g:"digital",p:"Display",s:3,e:39,b:420,o:"Performance",cpm:12,del:101,vcr:0,vw:76,ot:78,ctr:0.48,cvr:2.9,lift:1.4,ir:7,oc:113},
  {n:"Brand — Primetime Upfront",a:"Cascade Bank",g:"linear",p:"Primetime",s:1,e:39,b:1080,o:"Awareness",cpp:8800,post:106,c3:117,pre:0.9,oc:116},
  {n:"Small Business Podcast Series",a:"Cascade Bank",g:"digital",p:"Audio/Podcast",s:10,e:34,b:640,o:"Consideration",cpm:26,del:100,vcr:92,vw:0,ot:86,ctr:0.21,cvr:2.4,lift:5.1,ir:19,oc:124},
  // Torchlight Insurance — 2,100
  {n:"Open Enrollment Tease",a:"Torchlight Insurance",g:"linear",p:"News",s:27,e:39,b:690,o:"Awareness",cpp:7100,post:100,c3:104,pre:1.7,oc:101},
  {n:"Bundle & Save CTV",a:"Torchlight Insurance",g:"streaming",p:"CTV/Streaming",s:1,e:39,b:980,o:"Consideration",cpm:44,del:101,vcr:93,vw:87,ot:85,ctr:0.39,cvr:2.5,lift:4.8,ir:33,oc:119},
  {n:"Quote Flow Performance",a:"Torchlight Insurance",g:"digital",p:"Display",s:1,e:39,b:430,o:"Performance",cpm:10,del:102,vcr:0,vw:68,ot:72,ctr:0.33,cvr:1.6,lift:0.6,ir:4,oc:79},
  // Vireo Wireless — 2,400
  {n:"5G Network Sports Takeover",a:"Vireo Wireless",g:"linear",p:"Sports",s:6,e:20,b:880,o:"Awareness",cpp:14200,post:98,c3:109,pre:3.2,oc:99},
  {n:"Family Plan Streaming",a:"Vireo Wireless",g:"streaming",p:"CTV/Streaming",s:1,e:30,b:620,o:"Consideration",cpm:41,del:100,vcr:91,vw:84,ot:80,ctr:0.31,cvr:1.8,lift:2.9,ir:22,oc:97},
  {n:"Device Upgrade OLV",a:"Vireo Wireless",g:"digital",p:"Online video",s:16,e:32,b:410,o:"Performance",cpm:31,del:101,vcr:92,vw:88,ot:74,ctr:0.29,cvr:0.7,lift:0.4,ir:9,oc:42},
  {n:"Late Night Integration",a:"Vireo Wireless",g:"linear",p:"Late night",s:9,e:24,b:490,o:"Awareness",cpp:5200,post:101,c3:99,pre:2.2,oc:93},
  // Meridian Foods — 1,900
  {n:"Spring LTO Launch",a:"Meridian Foods",g:"linear",p:"Primetime",s:9,e:17,b:520,o:"Awareness",cpp:9100,post:104,c3:111,pre:1.5,oc:109},
  {n:"Summer Value Menu",a:"Meridian Foods",g:"streaming",p:"CTV/Streaming",s:20,e:33,b:610,o:"Performance",cpm:39,del:102,vcr:92,vw:86,ot:83,ctr:0.43,cvr:2.8,lift:4.2,ir:29,oc:122},
  {n:"Late Night Cravings",a:"Meridian Foods",g:"linear",p:"Late night",s:1,e:39,b:420,o:"Performance",cpp:3400,post:105,c3:113,pre:1.8,oc:117},
  {n:"Social Branded Content",a:"Meridian Foods",g:"digital",p:"Branded content",s:12,e:24,b:350,o:"Consideration",cpm:22,del:98,vcr:74,vw:72,ot:71,ctr:0.55,cvr:1.5,lift:2.6,ir:14,oc:92},
  // Verdant Grocery — 1,250
  {n:"Fresh Promise Brand",a:"Verdant Grocery",g:"linear",p:"News",s:1,e:26,b:520,o:"Awareness",cpp:6900,post:100,c3:102,pre:1.9,oc:98},
  {n:"Weekly Circular Digital",a:"Verdant Grocery",g:"digital",p:"Display",s:1,e:39,b:310,o:"Performance",cpm:8,del:97,vcr:0,vw:64,ot:61,ctr:0.19,cvr:0.9,lift:0.3,ir:3,oc:61},
  {n:"Summer Grilling FAST",a:"Verdant Grocery",g:"streaming",p:"CTV/Streaming",s:18,e:30,b:420,o:"Consideration",cpm:36,del:101,vcr:89,vw:83,ot:78,ctr:0.34,cvr:2.0,lift:3.3,ir:26,oc:104},
  // Apex Athletic — 1,600
  {n:"Championship Sports Buy",a:"Apex Athletic",g:"linear",p:"Sports",s:1,e:16,b:780,o:"Awareness",cpp:15600,post:87,c3:94,pre:7.4,oc:74},
  {n:"Training Season OLV",a:"Apex Athletic",g:"digital",p:"Online video",s:5,e:22,b:360,o:"Consideration",cpm:28,del:100,vcr:85,vw:80,ot:77,ctr:0.36,cvr:1.9,lift:3.0,ir:15,oc:103},
  {n:"Back-to-School Streaming",a:"Apex Athletic",g:"streaming",p:"CTV/Streaming",s:28,e:39,b:460,o:"Performance",cpm:42,del:103,vcr:93,vw:87,ot:88,ctr:0.46,cvr:3.1,lift:5.4,ir:36,oc:128},
  // Halcyon Health — 1,700
  {n:"Rx Awareness — News",a:"Halcyon Health",g:"linear",p:"News",s:1,e:39,b:760,o:"Awareness",cpp:7800,post:102,c3:106,pre:1.3,oc:104},
  {n:"Condition Educator Hub",a:"Halcyon Health",g:"digital",p:"Branded content",s:6,e:30,b:480,o:"Consideration",cpm:24,del:99,vcr:78,vw:75,ot:82,ctr:0.51,cvr:2.3,lift:4.6,ir:17,oc:114},
  {n:"Caregiver CTV",a:"Halcyon Health",g:"streaming",p:"CTV/Streaming",s:12,e:34,b:460,o:"Reach",cpm:45,del:100,vcr:92,vw:86,ot:84,ctr:0.28,cvr:1.7,lift:4.1,ir:31,oc:110},
  // Bellwether Airlines — 1,100
  {n:"Summer Escapes",a:"Bellwether Airlines",g:"streaming",p:"CTV/Streaming",s:14,e:28,b:450,o:"Consideration",cpm:38,del:101,vcr:90,vw:84,ot:79,ctr:0.37,cvr:2.1,lift:3.6,ir:27,oc:106},
  {n:"Route Launch — West",a:"Bellwether Airlines",g:"linear",p:"Primetime",s:18,e:25,b:380,o:"Awareness",cpp:11900,post:92,c3:88,pre:4.1,oc:77},
  {n:"Fare Sale Performance",a:"Bellwether Airlines",g:"digital",p:"Display",s:1,e:39,b:270,o:"Performance",cpm:9,del:103,vcr:0,vw:73,ot:70,ctr:0.44,cvr:2.2,lift:1.1,ir:6,oc:99},
  // Lumen Home — 950
  {n:"Spring Refresh",a:"Lumen Home",g:"linear",p:"Syndication",s:10,e:22,b:360,o:"Awareness",cpp:3900,post:101,c3:97,pre:2.4,oc:95},
  {n:"DIY How-To Branded",a:"Lumen Home",g:"digital",p:"Branded content",s:8,e:32,b:290,o:"Consideration",cpm:23,del:94,vcr:66,vw:69,ot:63,ctr:0.24,cvr:0.8,lift:0.7,ir:8,oc:66},
  {n:"Smart Home FAST",a:"Lumen Home",g:"streaming",p:"CTV/Streaming",s:20,e:36,b:300,o:"Performance",cpm:33,del:102,vcr:90,vw:85,ot:80,ctr:0.4,cvr:2.3,lift:3.2,ir:25,oc:107},
  // Calyx Beauty — 600
  {n:"Glow Drop Podcast",a:"Calyx Beauty",g:"digital",p:"Audio/Podcast",s:16,e:30,b:260,o:"Consideration",cpm:25,del:98,vcr:90,vw:0,ot:81,ctr:0.18,cvr:2.0,lift:4.4,ir:16,oc:111},
  {n:"Creator Series Streaming",a:"Calyx Beauty",g:"streaming",p:"CTV/Streaming",s:22,e:36,b:340,o:"Performance",cpm:43,del:91,vcr:94,vw:89,ot:90,ctr:0.52,cvr:4.1,lift:6.8,ir:38,oc:148},
];

/* ---------- scoring: 30% delivery accuracy, 30% quality, 40% outcome ---------- */
function scoreOf(c) {
  const delIdx = c.g === "linear" ? c.post : c.del;
  const dScore = 100 - Math.min(45, Math.abs(delIdx - 100) * 2.2);
  const qual = c.g === "linear"
    ? ((c.c3 - 80) / 45) * 70 + ((4 - c.pre) / 4) * 30
    // non-video formats have no completion rate; viewability carries the whole quality term
    : c.vcr > 0 && c.vw > 0
      ? ((c.vw - 55) / 40) * 50 + ((c.vcr - 55) / 40) * 50
      : (((c.vw || c.vcr) - 55) / 40) * 100;
  const qScore = clamp(qual, 0, 100);
  const oScore = clamp(c.oc, 0, 100);
  return {
    delivery: dScore, quality: qScore, outcome: oScore,
    total: Math.round(0.3 * dScore + 0.3 * qScore + 0.4 * oScore),
  };
}

/* ---------- campaigns ---------- */
const UE_A2554 = 1_280_000; // demo impressions per rating point
const CAMPAIGNS = SEED.map((c, i) => {
  const sc = scoreOf(c);
  const budget = c.b * 1000;
  const weeks = c.e - c.s + 1;
  const cat = ADVERTISERS[c.a].cat;
  const delIdx = c.g === "linear" ? c.post : c.del;
  const grps = c.g === "linear" ? budget / c.cpp : 0;
  const imps = c.g === "linear" ? grps * UE_A2554 : (budget / c.cpm) * 1000;
  const r = rng(c.n + c.a);
  return {
    id: `CMP-${String(1000 + i)}`,
    sfId: `006Rx${String(400000 + i * 137)}`,
    name: `${c.a.split(" ")[0].replace(/,$/, "")} ${c.n}`,
    shortName: c.n,
    advertiser: c.a, category: cat, segment: c.g, product: c.p,
    objective: c.o,
    dealType: c.g === "linear"
      ? (c.s <= 2 ? "Upfront" : "Scatter")
      : (c.b > 500 ? "Direct IO" : r() > 0.5 ? "Programmatic guaranteed" : "PMP"),
    start: c.s, end: c.e, weeks, budget,
    goalMetric: c.g === "linear" ? "Guaranteed GRPs (A25-54, C3)" : "Guaranteed impressions",
    guaranteed: c.g === "linear" ? grps / (delIdx / 100) : imps / (delIdx / 100),
    delivered: c.g === "linear" ? grps : imps,
    deliveryIdx: delIdx,
    grps, imps,
    cpp: c.cpp || 0, cpm: c.cpm || (budget / (imps / 1000)),
    vcr: c.vcr || 0, viewability: c.vw || 0, onTarget: c.ot || 0,
    ctr: c.ctr || 0, cvr: c.cvr || 0, lift: c.lift || 0, incrReach: c.ir || 0,
    c3: c.c3 || 0, preempt: c.pre || 0,
    spotsOrdered: c.g === "linear" ? Math.round(budget / 4200) : 0,
    outcomeIdx: c.oc,
    score: sc.total, scoreParts: sc,
    discrepancy: c.g === "linear" ? 0 : +(1.4 + r() * 6.2).toFixed(1),
  };
});
// known third-party count dispute
CAMPAIGNS.find((x) => x.shortName === "Weekly Circular Digital").discrepancy = 12.4;
CAMPAIGNS.find((x) => x.shortName === "Quote Flow Performance").discrepancy = 9.6;

const byId = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c]));

/* ---------- weekly fact table (atomic grain — everything aggregates from here) --- */
const CAT_SEASON = {
  Auto:    (w) => 1 + (w >= 8 && w <= 15 ? 0.28 : 0) + (w >= 34 ? 0.22 : 0),
  Finance: (w) => 1 + (w <= 10 ? 0.24 : 0) + (w >= 36 ? 0.18 : 0),
  QSR:     (w) => 1 + (w >= 19 && w <= 31 ? 0.26 : 0),
  Retail:  (w) => 1 + (w >= 27 && w <= 36 ? 0.24 : 0),
  Telecom: (w) => 1 + (w >= 6 && w <= 20 ? 0.18 : 0),
  Health:  (w) => 1 + (w >= 1 && w <= 12 ? 0.14 : 0),
  Travel:  (w) => 1 + (w >= 14 && w <= 28 ? 0.3 : 0),
  CPG:     (w) => 1 + (w >= 22 ? 0.2 : 0),
};

const FACTS = [];
CAMPAIGNS.forEach((c) => {
  const r = rng(c.id + "wk");
  const raw = [];
  for (let w = c.start; w <= c.end; w++) {
    const season = CAT_SEASON[c.category](w);
    const ramp = c.weeks > 6 ? 0.82 + 0.36 * Math.min(1, (w - c.start + 1) / 4) : 1;
    raw.push({ w, wt: season * ramp * (0.88 + r() * 0.24) });
  }
  const tot = raw.reduce((s, x) => s + x.wt, 0);
  raw.forEach(({ w, wt }) => {
    const share = wt / tot;
    const rev = c.budget * share;
    // deterministic in-flight quality wobble + planted incidents
    const j = (k) => (rng(c.id + w + k)() - 0.5);
    let vw = c.viewability, vcr = c.vcr, ot = c.onTarget, pre = c.preempt, del = c.deliveryIdx;
    if (c.shortName === "Quote Flow Performance" && w >= 3 && w <= 6) vw = 51;
    if (c.shortName === "Quote Flow Performance" && w > 8) vw = 79;
    if (c.shortName === "Championship Sports Buy" && w >= 9 && w <= 11) { pre = 19.5; del = 62; }
    if (c.shortName === "Weekly Circular Digital" && w > 20) del = 92;
    if (c.shortName === "Creator Series Streaming" && w >= 30) del = 84;
    vw = clamp(vw + j("v") * 5, 0, 96);
    vcr = clamp(vcr + j("c") * 4, 0, 98);
    ot = clamp(ot + j("o") * 4, 0, 96);
    const grps = c.segment === "linear" ? (rev / c.cpp) * (del / c.deliveryIdx) : 0;
    const impressions = c.segment === "linear"
      ? grps * UE_A2554
      : (rev / c.cpm) * 1000 * (del / c.deliveryIdx);
    FACTS.push({
      cid: c.id, w, rev,
      grps, impressions,
      measured: impressions * 0.94,
      viewable: impressions * 0.94 * (vw / 100),
      completes: impressions * (vcr / 100),
      inTarget: impressions * (ot / 100),
      clicks: impressions * (c.ctr / 100),
      conversions: impressions * (c.ctr / 100) * (c.cvr / 100) * 10,
      spotsOrdered: c.segment === "linear" ? (c.spotsOrdered * share) : 0,
      spotsAired: c.segment === "linear" ? (c.spotsOrdered * share) * (1 - pre / 100) : 0,
      preempt: pre, delIdx: del, vw, vcr, ot,
    });
  });
});

/* ---- iterative proportional fit: weekly facts must reconcile to BOTH the
   campaign budget and the booked quarterly revenue actuals ---- */
const QUARTER_ACTUAL = [6_600_000, 7_300_000, 7_700_000];
(function fitQuarters() {
  const budgets = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c.budget]));
  for (let pass = 0; pass < 60; pass++) {
    const q = [0, 0, 0];
    FACTS.forEach((f) => { q[WEEKS[f.w - 1].quarter - 1] += f.rev; });
    FACTS.forEach((f) => {
      const qi = WEEKS[f.w - 1].quarter - 1;
      if (q[qi] > 0) f.rev *= QUARTER_ACTUAL[qi] / q[qi];
    });
    const c = {};
    FACTS.forEach((f) => { c[f.cid] = (c[f.cid] || 0) + f.rev; });
    FACTS.forEach((f) => { if (c[f.cid] > 0) f.rev *= budgets[f.cid] / c[f.cid]; });
  }
  // rescale every volume measure off the fitted revenue so nothing drifts apart
  FACTS.forEach((f) => {
    const c = byId[f.cid];
    const unit = c.segment === "linear" ? f.rev / c.cpp : (f.rev / c.cpm) * 1000;
    const ratio = c.segment === "linear" ? (f.grps ? unit / f.grps : 1) : (f.impressions ? unit / f.impressions : 1);
    ["grps","impressions","measured","viewable","completes","inTarget","clicks","conversions","spotsOrdered","spotsAired"]
      .forEach((k) => { f[k] *= ratio; });
  });
})();

/* ---------- quota ---------- */
const ANNUAL_QUOTA = 24_000_000;
const QUARTER_QUOTA = [5_400_000, 6_000_000, 6_600_000, 6_000_000];
const YTD_QUOTA = QUARTER_QUOTA[0] + QUARTER_QUOTA[1] + QUARTER_QUOTA[2]; // 18.0M
const CLUB_THRESHOLD = 1.10;
const FY_PROJECTION = 28_600_000;

const QUOTA_WEEKLY = WEEKS.map((wk) => QUARTER_QUOTA[wk.quarter - 1] / 13);

/* ---------- revenue bridge ---------- */
const BRIDGE = [
  { label: "Linear closed-won", delta: 10_000_000, kind: "up" },
  { label: "Streaming closed-won", delta: 6_200_000, kind: "up" },
  { label: "Digital closed-won", delta: 5_400_000, kind: "up" },
  { label: "Under-delivery credits", delta: -412_000, kind: "down" },
  { label: "ADU / make-good liability", delta: -286_000, kind: "down" },
  { label: "Cancellations & pre-emptions", delta: -174_000, kind: "down" },
];

/* ---------- audience segments ---------- */
const SEGMENTS = [
  { name:"Sports Loyalists", type:"Stellar 1P", index:168, onTarget:91, comp: 8.2, ecpm:41, vcr:94, view:89, cvr:3.6, lift:6.9, reach:9.4, incr:37, seg:"both" },
  { name:"Auto Intenders", type:"Stellar 1P", index:154, onTarget:87, comp: 12.4, ecpm:38, vcr:92, view:87, cvr:3.1, lift:5.8, reach:12.8, incr:31, seg:"both" },
  { name:"Premium Streamers", type:"Stellar 1P", index:141, onTarget:84, comp: 9.6, ecpm:44, vcr:93, view:88, cvr:2.7, lift:5.1, reach:10.2, incr:34, seg:"digital" },
  { name:"Advertiser CRM match", type:"1P match", index:137, onTarget:89, comp: 5.2, ecpm:47, vcr:91, view:86, cvr:4.2, lift:4.4, reach:4.1, incr:12, seg:"digital" },
  { name:"News Devotees", type:"Stellar 1P", index:126, onTarget:82, comp: 8.1, ecpm:33, vcr:90, view:84, cvr:2.2, lift:4.0, reach:8.6, incr:19, seg:"both" },
  { name:"A25-54", type:"Nielsen demo", index:118, onTarget:80, comp: 13.0, ecpm:29, vcr:88, view:82, cvr:1.9, lift:3.4, reach:22.4, incr:16, seg:"both" },
  { name:"W25-54", type:"Nielsen demo", index:112, onTarget:77, comp: 8.0, ecpm:31, vcr:89, view:83, cvr:2.0, lift:3.2, reach:13.1, incr:15, seg:"both" },
  { name:"Early Adopters", type:"Stellar 1P", index:108, onTarget:75, comp: 3.4, ecpm:40, vcr:87, view:81, cvr:1.8, lift:3.0, reach:3.4, incr:21, seg:"digital" },
  { name:"A18-49", type:"Nielsen demo", index:104, onTarget:74, comp: 9.2, ecpm:30, vcr:86, view:80, cvr:1.6, lift:2.6, reach:19.8, incr:14, seg:"both" },
  { name:"Auto Intender lookalike", type:"Lookalike", index:96, onTarget:71, comp: 4.4, ecpm:26, vcr:84, view:77, cvr:1.4, lift:2.1, reach:6.9, incr:11, seg:"digital" },
  { name:"P35+ Broad Reach", type:"Nielsen demo", index:79, onTarget:66, comp: 6.2, ecpm:22, vcr:82, view:74, cvr:1.0, lift:1.4, reach:16.2, incr:8, seg:"both" },
  { name:"M18-34", type:"Nielsen demo", index:71, onTarget:54, comp: 5.0, ecpm:24, vcr:79, view:71, cvr:0.8, lift:0.9, reach:7.8, incr:9, seg:"both" },
  { name:"Value Shoppers (3P)", type:"3P syndicated", index:68, onTarget:58, comp: 4.4, ecpm:19, vcr:76, view:66, cvr:0.7, lift:0.6, reach:5.2, incr:5, seg:"digital" },
  { name:"Run-of-network remnant", type:"Untargeted", index:57, onTarget:41, comp: 2.9, ecpm:14, vcr:71, view:61, cvr:0.4, lift:0.2, reach:4.6, incr:3, seg:"digital" },
];

/* ---------- daypart × network delivery heatmap (linear) ---------- */
const LINEAR_GRID = {
  rows: ["Early morning", "Daytime", "Early fringe", "Access", "Primetime", "Late night", "Overnight"],
  cols: ["SBN", "Stellar Sports", "Stellar News", "O&O Stations", "Syndication"],
  values: [
    [ 98,  94, 103,  97,  92],
    [ 96,  89, 101,  99,  95],
    [102,  97, 104, 101,  98],
    [105, 108, 103, 102,  99],
    [107, 112, 106, 104, 100],
    [104,  99, 102, 103, 101],
    [ 91,  86,  94,  93,  90],
  ],
};
const DIGITAL_GRID = {
  rows: ["Pre-roll", "Mid-roll", "In-feed video", "Display banner", "Native", "Podcast host-read"],
  cols: ["CTV", "Connected mobile", "Desktop", "Mobile web", "Smart audio"],
  values: [
    [109, 101,  96,  93,  0],
    [112, 104,  97,  91,  0],
    [  0,  99,  94,  96,  0],
    [  0,  88,  86,  79,  0],
    [  0,  95,  92,  90,  0],
    [  0,   0,   0,   0, 103],
  ],
};

/* ---------- cross-platform reach (millions) ---------- */
const REACH = {
  linear: 38.4, streaming: 22.1, digital: 19.6,
  linearStreaming: 9.7, linearDigital: 7.4, streamingDigital: 6.1, all: 3.8,
  dedup: 61.2, incrementalStreaming: 14.8, incrementalPct: 38.5,
  curve: Array.from({ length: 12 }, (_, i) => {
    const f = i + 1;
    return {
      freq: f,
      linear: +(38.4 * (1 - Math.exp(-0.55 * f))).toFixed(1),
      combined: +(61.2 * (1 - Math.exp(-0.42 * f))).toFixed(1),
    };
  }),
};

/* ---------- Q4 pipeline ---------- */
const PIPELINE = [
  { stage: "Prospecting", amount: 2_140_000, count: 9, prob: 0.15 },
  { stage: "Proposal sent", amount: 3_380_000, count: 11, prob: 0.35 },
  { stage: "Negotiation", amount: 2_960_000, count: 7, prob: 0.6 },
  { stage: "Verbal commit", amount: 1_840_000, count: 5, prob: 0.85 },
  { stage: "Closed-won (Q4 to date)", amount: 1_120_000, count: 4, prob: 1.0 },
];

/* ---------- peer distribution (anonymized attainment %) ---------- */
const PEERS = [
  62, 71, 74, 78, 81, 83, 86, 88, 89, 91, 93, 94, 96, 97, 98, 99,
  101, 103, 104, 106, 108, 109, 112, 114, 117, 121, 127, 134,
];
const JENNIFER_ATTAIN = 120;

/* ============================ UI PRIMITIVES ============================ */

function Card({ title, subtitle, right, children, sources, className = "", id }) {
  const [openSrc, setOpenSrc] = useState(false);
  return (
    <section
      id={id}
      className={`rounded ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}
    >
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 px-4 pt-3 pb-2">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold leading-tight" style={{ color: C.ink }}>{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5 leading-snug" style={{ color: C.muted, maxWidth: "72ch" }}>{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {right}
            {sources && (
              <button
                onClick={() => setOpenSrc((v) => !v)}
                className="flex items-center gap-1 text-xs px-1.5 py-1 rounded"
                style={{ color: openSrc ? C.blue : C.muted, background: openSrc ? C.blueSoft : "transparent" }}
                aria-expanded={openSrc}
              >
                <Database size={12} /> Sources
              </button>
            )}
          </div>
        </header>
      )}
      {openSrc && sources && (
        <div className="mx-4 mb-2 px-3 py-2 text-xs rounded" style={{ background: C.blueSoft, color: C.ink2, borderLeft: `3px solid ${C.blue}` }}>
          <div className="font-semibold mb-1">Data sources</div>
          <ul className="space-y-0.5">
            {sources.systems.map((s) => <li key={s}>· {s}</li>)}
          </ul>
          <div className="mt-1.5" style={{ color: C.muted }}>
            Last refresh {sources.refresh}. {sources.caveat}
          </div>
        </div>
      )}
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function KpiTile({ label, value, sub, trend, tone = "neutral", note }) {
  const toneColor = tone === "good" ? C.green : tone === "warn" ? C.amber : tone === "bad" ? C.red : C.ink;
  return (
    <div className="px-3 py-3 rounded" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
      <div className="text-xs leading-tight" style={{ color: C.muted }}>{label}</div>
      <div className="mt-1 font-bold leading-none" style={{ ...TNUM, fontSize: 28, color: toneColor }}>{value}</div>
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
      {note && <div className="mt-1 text-xs" style={{ color: C.muted }}>{note}</div>}
    </div>
  );
}

function Segmented({ options, value, onChange, size = "md" }) {
  return (
    <div className="inline-flex rounded overflow-hidden" style={{ border: `1px solid ${C.rule}`, borderRadius: 4 }}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`${size === "sm" ? "text-xs px-2 py-1" : "text-xs px-3 py-1.5"} font-medium whitespace-nowrap`}
            style={{
              background: active ? C.blue : C.card,
              color: active ? "#fff" : C.ink2,
              borderLeft: i === 0 ? "none" : `1px solid ${C.rule}`,
            }}
          >
            {o.icon}{o.label}
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
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: bg, color: fg, borderRadius: 12 }}>
      {children}
      {onClear && <button onClick={onClear} aria-label="Clear filter"><X size={12} /></button>}
    </span>
  );
}

function StatusDot({ v, good = 100, warn = 95 }) {
  const c = v >= good ? C.green : v >= warn ? C.amber : C.red;
  const sym = v >= good ? "●" : v >= warn ? "◆" : "▲";
  return <span style={{ color: c, fontSize: 10 }} aria-hidden>{sym}</span>;
}

function SectionTitle({ n, title, blurb }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold" style={{ color: C.blue }}>{n}</span>
        <h2 className="font-semibold" style={{ fontSize: 20, color: C.ink }}>{title}</h2>
      </div>
      {blurb && <p className="text-xs mt-1" style={{ color: C.muted, maxWidth: "78ch" }}>{blurb}</p>}
    </div>
  );
}

/* Tableau-style tooltip */
function TT({ active, payload, label, fmt, title }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="text-xs px-3 py-2" style={{ background: "#fff", border: `1px solid ${C.rule}`, borderRadius: 3, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}>
      <div className="font-semibold mb-1" style={{ color: C.ink }}>{title ? title(payload[0].payload) : label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={TNUM}>
          <span style={{ width: 8, height: 8, background: p.color || p.fill, display: "inline-block", borderRadius: 1 }} />
          <span style={{ color: C.muted }}>{p.name}</span>
          <span className="ml-auto font-medium" style={{ color: C.ink }}>
            {fmt ? fmt(p.value, p.name, p.payload) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const axis = { tick: { fontSize: 11, fill: C.muted }, stroke: C.rule, tickLine: false };

/* Bullet chart — Tableau's canonical target comparison */
function Bullet({ actual, target, max, thresholdLabel, threshold, unit = "$" }) {
  const W = 100;
  const a = (actual / max) * W, t = (target / max) * W, th = (threshold / max) * W;
  return (
    <div>
      <div className="relative h-11 rounded" style={{ background: "#F0F0F0", border: `1px solid ${C.border}` }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${t}%`, background: "#E3E3E3" }} />
        <div className="absolute top-3 bottom-3 left-0 rounded-sm" style={{ width: `${a}%`, background: C.green }} />
        <div className="absolute inset-y-1 w-0.5" style={{ left: `${t}%`, background: C.ink }} title="YTD quota" />
        <div className="absolute inset-y-2 w-0.5" style={{ left: `${th}%`, background: C.amber }} title={thresholdLabel} />
      </div>
      <div className="relative h-5 mt-1 text-xs" style={{ ...TNUM, color: C.muted }}>
        <span className="absolute" style={{ left: `${t}%`, transform: "translateX(-50%)" }}>
          Quota {unit === "$" ? usd(target) : target}
        </span>
        <span className="absolute" style={{ left: `${th}%`, transform: "translateX(-50%)", color: C.amber }}>
          {thresholdLabel}
        </span>
      </div>
    </div>
  );
}

/* ============================ AGGREGATION ============================ */

function useFiltered({ productView, subFilter, advertiser, objective, dealType }) {
  return useMemo(() => {
    const segMatch = (c) =>
      productView === "all" ? true
      : productView === "linear" ? c.segment === "linear"
      : c.segment !== "linear";
    const camps = CAMPAIGNS.filter((c) =>
      segMatch(c) &&
      (subFilter === "All" || c.product === subFilter) &&
      (!advertiser || c.advertiser === advertiser) &&
      (objective === "All" || c.objective === objective) &&
      (dealType === "All" || c.dealType === dealType));
    const ids = new Set(camps.map((c) => c.id));
    const facts = FACTS.filter((f) => ids.has(f.cid));
    return { camps, facts, ids };
  }, [productView, subFilter, advertiser, objective, dealType]);
}

function bucket(facts, grain) {
  const key = (w) => grain === "weekly" ? w
    : grain === "monthly" ? WEEKS[w - 1].month
    : WEEKS[w - 1].quarter;
  const map = new Map();
  facts.forEach((f) => {
    const k = key(f.w);
    if (!map.has(k)) map.set(k, { k, rev: 0, imps: 0, grps: 0, viewable: 0, measured: 0, completes: 0, inTarget: 0, clicks: 0, conversions: 0, spotsOrdered: 0, spotsAired: 0 });
    const b = map.get(k);
    b.rev += f.rev; b.imps += f.impressions; b.grps += f.grps;
    b.viewable += f.viewable; b.measured += f.measured; b.completes += f.completes;
    b.inTarget += f.inTarget; b.clicks += f.clicks; b.conversions += f.conversions;
    b.spotsOrdered += f.spotsOrdered; b.spotsAired += f.spotsAired;
  });
  const rows = [...map.values()].sort((a, b) => a.k - b.k);
  return rows.map((b) => ({
    ...b,
    label: grain === "weekly" ? `w/e ${WEEKS[b.k - 1].label}`
      : grain === "monthly" ? MONTHS[b.k]
      : `Q${b.k}`,
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
  const videoImps = facts.filter((f) => byId[f.cid].vcr > 0).reduce((s, f) => s + f.impressions, 0);
  return {
    ...t,
    campaignCount: camps.length,
    guaranteed,
    deliveryRate: guaranteed ? ((camps[0]?.segment === "linear" ? t.grps : t.imps) / guaranteed) * 100 : 0,
    vcr: videoImps ? (t.completes / videoImps) * 100 : 0,
    viewRate: t.measured ? (t.viewable / t.measured) * 100 : 0,
    otRate: t.imps ? (t.inTarget / t.imps) * 100 : 0,
    ecpm: t.imps ? t.rev / (t.imps / 1000) : 0,
    cpp: t.grps ? t.rev / t.grps : 0,
    postingPct: camps.length ? camps.reduce((s,c)=>s+c.budget*(c.deliveryIdx),0) / camps.reduce((s,c)=>s+c.budget,0) : 0,
    preemptRate: t.spotsOrdered ? (1 - t.spotsAired / t.spotsOrdered) * 100 : 0,
  };
}

/* ============================ NARRATIVE ============================ */

function buildNarrative({ tot, camps, productView, grain, advertiser }) {
  if (!camps.length) return null;
  const ranked = [...camps].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3), bottom = ranked.slice(-3).reverse();
  const scope = productView === "linear" ? "the linear book"
    : productView === "digital" ? "the digital and streaming book"
    : "the full multiplatform book";
  const grainWord = grain === "weekly" ? "week over week" : grain === "monthly" ? "month over month" : "quarter over quarter";
  const bestSeg = SEGMENTS[0], worstSeg = SEGMENTS[SEGMENTS.length - 1];
  const revShare = (tot.rev / 21_600_000) * 100;

  const p1 = advertiser
    ? `Filtered to ${advertiser}: ${usdFull(tot.rev)} in closed-won revenue across ${camps.length} campaign${camps.length > 1 ? "s" : ""}, ${pct(revShare)} of the year's total book. Read the rest of this report with that scope in mind — quota and pipeline figures below stay at book level.`
    : `Through the close of Q3, ${scope} delivered ${usdFull(tot.rev)} in closed-won revenue across ${camps.length} campaigns — ${pct(revShare)} of the $21.6M booked year to date. Against a YTD quota of ${usd(YTD_QUOTA)}, the book stands at ${JENNIFER_ATTAIN}% attainment, clearing the ${Math.round(CLUB_THRESHOLD*100)}% President's Club threshold in the first week of July. On current pace the year lands at roughly ${usd(FY_PROJECTION)}, or 119% of the annual number.`;

  const runnersUp = top.slice(1).filter(Boolean);
  const p2 = `${top[0].name} scored highest in this scope at ${top[0].score} on the composite index, against a book median of ${ranked[Math.floor(ranked.length / 2)].score}. ${
    top[0].segment === "linear"
      ? `It posted at ${top[0].deliveryIdx}% of guaranteed GRPs with a C3 index of ${top[0].c3} and pre-emptions held under ${top[0].preempt}%.`
      : `It delivered ${top[0].deliveryIdx}% of contracted impressions at ${top[0].onTarget}% on-target, a ${top[0].vcr}% completion rate, and ${top[0].incrReach}% reach incremental to the advertiser's linear buy.`
  }${
    runnersUp.length
      ? ` ${runnersUp.map((c) => c.name).join(" and ")} followed, driven by outcome performance rather than delivery mechanics — each cleared its goal by more than ${Math.max(0, Math.min(...runnersUp.map((c) => c.outcomeIdx)) - 100)} points.`
      : ""
  }`;

  const worst = bottom[0] || top[0];
  const p3 = `The book's problems were concentrated, not diffuse. ${worst.name} scored ${worst.score}. ${
    worst.shortName === "Championship Sports Buy"
      ? "Three consecutive live-event overruns in weeks 9 through 11 pushed spot inventory past its window; posting closed at 87% and Stellar carries $101K of ADU liability into Q4."
      : worst.segment === "linear"
        ? `Posting closed at ${worst.deliveryIdx}% against a C3 index of ${worst.c3}, with pre-emptions at ${worst.preempt}%.`
        : `Delivery landed at ${worst.deliveryIdx}% and outcome performance at ${worst.outcomeIdx}% of goal.`
  } Two cases are worth studying past their scores: Calyx Creator Series delivered only 91% of contracted impressions yet returned 148% of its conversion goal, and Vireo Device Upgrade OLV hit every delivery and quality metric on the sheet — 101% delivery, 88% viewability, 92% completion — and still returned 42% of goal. Delivery compliance and campaign effectiveness are not the same measurement, and this book proved it twice.`;

  const p4 = `On audience, ${bestSeg.name} was the strongest segment in the portfolio — index ${bestSeg.index}, ${bestSeg.onTarget}% on-target, ${bestSeg.cvr}% conversion — and it carried only ${bestSeg.comp}% of total delivery. That is the single largest unforced error in the plan. At the other end, ${worstSeg.name} and ${SEGMENTS[SEGMENTS.length-2].name} together absorbed ${(worstSeg.comp + SEGMENTS[SEGMENTS.length-2].comp).toFixed(1)}% of impressions at an average index of ${Math.round((worstSeg.index + SEGMENTS[SEGMENTS.length-2].index)/2)}. Trend is moving the right way ${grainWord}, but the reallocation has not happened at plan level yet.`;

  const actions = [
    `Shift the ${worstSeg.comp + SEGMENTS[SEGMENTS.length-2].comp > 7 ? "~7%" : "~5%"} of delivery sitting in Value Shoppers and run-of-network into Sports Loyalists and Auto Intenders. At current index spread that is roughly $310K of equivalent working value on the same spend.`,
    `Resolve the Verdant Weekly Circular count dispute before Q4 billing. Third-party discrepancy is running 12.4%, above the 10% dispute threshold, on $310K of billings.`,
    `Clear the $286K ADU balance inside Q4 rather than rolling it into the upfront. Apex Championship carries $101K of it and is in renewal.`,
    `Rebuild Vireo Device Upgrade before renewal. Four creative variants ran unchanged for 17 weeks against a segment three times wider than the converting audience.`,
    `Lead the Omega and Torchlight renewals with incremental reach, not GRPs. Streaming added ${REACH.incrementalStreaming}M unduplicated viewers on top of linear — a ${REACH.incrementalPct}% lift — and that is the number that renewed both accounts last year.`,
  ];

  return { paras: [p1, p2, p3, p4], actions, top, bottom };
}

/* ============================ TABLE & DETAIL ============================ */

function Sparkline({ values, color = C.t10[0], w = 96, h = 22 }) {
  const first = values.findIndex((v) => v > 0);
  const last = values.length - 1 - [...values].reverse().findIndex((v) => v > 0);
  const slice = values.slice(first, last + 1);
  const max = Math.max(...slice, 1);
  const step = slice.length > 1 ? w / (slice.length - 1) : w;
  const pts = slice.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 5)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={`Weekly revenue trend across ${slice.length} weeks`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={(slice.length - 1) * step} cy={h - 2 - (slice[slice.length - 1] / max) * (h - 5)} r="2" fill={color} />
    </svg>
  );
}

const DIAGNOSIS = {
  "Championship Sports Buy": {
    cause: "Three live-event overruns in weeks 9–11 pushed ordered spots outside their contracted windows. 7.4% pre-emption rate against a 2.5% book average.",
    fix: "214 ADU spots scheduled across Q4 primetime and access.",
    impact: "$101,000 ADU liability, open",
  },
  "Route Launch — West": {
    cause: "Primetime placement against a competing network tentpole in weeks 20–23. Posting closed at 92% with a C3 index of 88 — the audience was there, the rating was not.",
    fix: "Weight shifted to access and early fringe for the Q4 flight.",
    impact: "$46,000 in under-delivery credits",
  },
  "Weekly Circular Digital": {
    cause: "Creative fatigue. CTR decayed from 0.31% in week 1 to 0.11% by week 20 with no variant rotation. Delivery also fell under corridor from week 21.",
    fix: "Six-variant rotation and a 21-day frequency cap proposed for FY27.",
    impact: "$29,000 credit · 12.4% count discrepancy in dispute",
  },
  "DIY How-To Branded": {
    cause: "Branded content published to a hub with no distribution budget behind it. 94% delivery on impressions, 66% completion, 63% on-target.",
    fix: "Distribution now bundled into branded content rate cards, not sold separately.",
    impact: "$18,000 credit",
  },
  "Device Upgrade OLV": {
    cause: "Clean delivery, failed outcome. Four creative variants unchanged for 17 weeks against a segment roughly three times wider than the converting audience.",
    fix: "Rebuild on Auto Intender-style 1P modeling before renewal.",
    impact: "No credit owed — delivery met. Renewal at risk.",
  },
  "Quote Flow Performance": {
    cause: "A below-the-fold placement was mis-mapped at trafficking. Viewability sat at 51% for weeks 3–6 before detection.",
    fix: "4.1M bonus above-the-fold impressions. Placement QA added to the launch checklist.",
    impact: "$38,000 credit · 9.6% discrepancy, monitored",
  },
  "Trade-In Offer": {
    cause: "Over-paced at 106% and exhausted three weeks early, missing the back half of the promotional window.",
    fix: "Hard daily caps on all Foundry lines going forward.",
    impact: "$11,000 in unbilled over-delivery",
  },
  "Weekend Sales Event": {
    cause: "Syndication inventory at a $4,100 CPP looked efficient and posted at 99%, but the C3 index landed at 96 and the always-on structure produced a 2.6% pre-emption rate spread across 39 weeks.",
    fix: "Consolidating FY27 into three 8-week bursts with protected clearance.",
    impact: "No credit owed — posting met guarantee",
  },
  "Late Night Integration": {
    cause: "Integration read tested well but the C3 index landed at 99 against a 108 plan. Pre-emptions at 2.2% were not the driver.",
    fix: "Integration units repriced on a flat-fee basis rather than a rating guarantee.",
    impact: "No credit — guarantee was on spots, not rating",
  },
};

const WHY_WORKED = {
  "Small Business Podcast Series": "The highest composite score on the book, and nobody expected it. Host-read placement inside a business podcast slate delivered a 92% completion rate at 86% on-target, and returned 124% of its consideration goal on a $26 CPM. Podcast has no viewability measurement, so the quality term rests entirely on completion — worth flagging to the client rather than burying.",
  "Bundle & Save CTV": "Full-year always-on CTV at 101% delivery, 87% viewability and 93% completion. The result that matters to Torchlight is 33% incremental reach on top of their linear buy, which is the number that will carry the renewal conversation.",
  "Caregiver CTV": "Narrow segment, patient flight. Halcyon accepted a 23-week schedule instead of a burst, and the campaign returned 4.1 points of brand lift at 84% on-target with 31% incremental reach — strong for a category where targeting constraints usually cost delivery quality.",
  "Always-On CTV": "Running the full 39 weeks rather than in bursts let frequency build without saturating: 41% of reach was incremental to Omega's linear buy, at 89% on-target. The always-on structure is also what made the segment optimization possible — there was enough runway to move budget toward Auto Intenders by week 12.",
  "Creator Series Streaming": "The tightest inventory on the book and the best result: 90% on-target, 94% completion, and a 4.1% conversion rate against a 2.0% portfolio average. It under-delivered impressions and it did not matter.",
  "Back-to-School Streaming": "Landed the flight against Apex's actual retail calendar rather than the media calendar. 88% on-target and a 5.4-point brand lift in twelve weeks.",
  "Brand — Primetime Upfront": "The steadiest performer on the book. Posted at 106% with a C3 index of 117 and pre-emptions under 1%. Upfront positioning bought the inventory protection that scatter buyers did not get in Q2.",
  "Ridgeline Launch — Sports": "Sports inventory priced at a $13,800 CPP looked expensive on the plan and returned a 121 C3 index against a 100 guarantee. The launch window aligned with three high-rating events.",
  "Summer Value Menu": "Timed to the LTO calendar with a 14-week flight. 122% of goal on attributed visits, driven by mid-roll CTV rather than the pre-roll the client originally asked for.",
  _default: (c) => `Delivered ${Math.round(c.deliveryIdx)}% of contracted inventory and returned ${c.outcomeIdx}% of its outcome target, on a composite score of ${c.score} against a book median of 87.`,
};

const LESSONS = [
  { change: "Live-event inventory gets a 12% contingency reserve, not 5%.", from: "Apex Championship — three overruns produced $101K of ADU liability" },
  { change: "Creative rotation is a contractual line item on any flight over 10 weeks.", from: "Verdant Weekly Circular — 65% CTR decay over 20 weeks with no rotation" },
  { change: "Outcome measurement is scoped at IO signature, not added mid-flight.", from: "Vireo Device Upgrade — clean delivery masked a failing campaign for 17 weeks" },
  { change: "Placement viewability is QA'd within 72 hours of launch, not at first billing.", from: "Torchlight Quote Flow — a mis-mapped placement ran four weeks before detection" },
  { change: "Branded content is sold with distribution attached, never standalone.", from: "Lumen DIY How-To — 63% on-target with no paid distribution behind it" },
  { change: "Impression guarantees on scarce inventory get repriced, not oversold.", from: "Calyx Creator Series — 91% delivery, 148% of outcome goal" },
];

const COMPOSITION = [
  { product: "CTV / Streaming", t1: 24, t2: 31, t3: 28, t4: 12, t5: 5 },
  { product: "Online video",    t1: 14, t2: 22, t3: 34, t4: 21, t5: 9 },
  { product: "Audio / Podcast", t1: 19, t2: 29, t3: 33, t4: 14, t5: 5 },
  { product: "Display",         t1: 8,  t2: 15, t3: 31, t4: 29, t5: 17 },
  { product: "Branded content", t1: 11, t2: 20, t3: 36, t4: 24, t5: 9 },
  { product: "Linear (modeled)",t1: 17, t2: 27, t3: 38, t4: 15, t5: 3 },
];

const DICTIONARY = [
  { title: "Digital and streaming", rows: [
    ["Impressions delivered", "Ad-server counted impressions on the server of record", "Google Ad Manager / FreeWheel"],
    ["Delivery index", "Delivered ÷ contracted impressions × 100", "Ad server + Salesforce"],
    ["Pacing index", "Delivered-to-date ÷ expected-to-date × 100", "Ad server"],
    ["VCR", "Completed views ÷ video impressions started", "Ad server"],
    ["Viewability", "MRC-viewable ÷ measured impressions (50% pixels, 1s display / 2s video)", "IAS via ad server"],
    ["On-target %", "Verified in-target ÷ measured impressions", "Nielsen DAR + Stellar Data Cloud"],
    ["eCPM", "Net revenue ÷ (delivered impressions ÷ 1,000)", "Salesforce + ad server"],
    ["Frequency", "Impressions ÷ unique reach", "FreeWheel"],
    ["CTR", "Clicks ÷ impressions", "Google Ad Manager"],
    ["Attributed conversions", "Post-exposure actions inside a 30-day window, deduped", "Stellar Data Cloud"],
    ["Brand lift", "Point change in aided awareness or intent, exposed vs. control", "Study vendor"],
    ["Discrepancy", "(Stellar count − third-party count) ÷ Stellar count", "GAM vs. CM360"],
  ]},
  { title: "Linear", rows: [
    ["GRPs / TRPs", "Sum of rating points, total or target demo", "Nielsen"],
    ["Demo impressions", "Rating × universe estimate (A25-54 UE 128.0M)", "Nielsen"],
    ["CPP", "Net spend ÷ GRPs delivered", "Salesforce + Nielsen"],
    ["CPM equivalent", "Net spend ÷ (demo impressions ÷ 1,000)", "Salesforce + Nielsen"],
    ["Posting %", "Delivered GRPs ÷ guaranteed GRPs", "Nielsen + Operative.One"],
    ["C3 index", "Commercial rating live plus three days, indexed to guarantee", "Nielsen"],
    ["Spots aired vs. ordered", "As-run spot count ÷ ordered spot count", "Operative.One + station logs"],
    ["Pre-emption rate", "Pre-empted spots ÷ ordered spots", "Operative.One"],
    ["ADU liability", "Value of audience deficiency units owed", "Operative.One + Salesforce"],
  ]},
  { title: "Sales", rows: [
    ["Closed-won revenue", "Net revenue on opportunities in a closed-won stage", "Salesforce CRM"],
    ["Net billable revenue", "Closed-won less credits, ADU value and cancellations", "Salesforce + Operative.One"],
    ["Quota attainment", "Closed-won ÷ period quota", "Salesforce Quota object"],
    ["Pace to plan", "Cumulative closed-won ÷ cumulative quota at the same point", "Salesforce"],
    ["Average deal size", "Closed-won revenue ÷ campaign count", "Salesforce"],
    ["Renewal rate", "Renewed accounts ÷ accounts eligible for renewal", "Salesforce"],
    ["Sell-through rate", "Sold inventory ÷ available inventory in the period", "Operative.One + ad server"],
    ["Composite score", "30% delivery accuracy + 30% quality + 40% outcome vs. goal", "This report"],
  ]},
];

function flightSeries(c, sparks) {
  const arr = sparks.get(c.id) || [];
  const out = [];
  for (let w = c.start; w <= c.end; w++) out.push({ label: `w/e ${WEEKS[w - 1].label}`, rev: arr[w - 1] || 0 });
  return out;
}

function incidentSeries(shortName, field) {
  const c = CAMPAIGNS.find((x) => x.shortName === shortName);
  if (!c) return [];
  return FACTS.filter((f) => f.cid === c.id).map((f) => ({
    label: `w${f.w}`, v: field ? f[field] : f.delIdx,
  }));
}

function CampaignTable({ rows, sparks, expanded, setExpanded, tone }) {
  if (!rows.length) return (
    <div className="py-6 text-xs text-center" style={{ color: C.muted }}>
      No campaigns in this scope. Widen the product or advertiser filter to compare performance.
    </div>
  );
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs" style={{ minWidth: 720 }}>
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
            const d = DIAGNOSIS[c.shortName];
            return (
              <React.Fragment key={c.id}>
                <tr onClick={() => setExpanded(open ? null : c.id)}
                    style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer", background: open ? C.blueSoft : "transparent" }}>
                  <td className="py-2 pl-1">
                    <div className="flex items-center gap-1">
                      {open ? <ChevronDown size={12} style={{ color: C.blue }} /> : <ChevronRight size={12} style={{ color: C.muted }} />}
                      <span className="font-medium" style={{ color: C.ink }}>{c.name}</span>
                    </div>
                    <div className="pl-4" style={{ color: C.muted }}>{c.advertiser} · {c.dealType}</div>
                  </td>
                  <td style={{ color: C.ink2 }}>{c.product}</td>
                  <td className="text-right font-medium" style={{ ...TNUM, color: C.ink }}>{usd(c.budget)}</td>
                  <td className="text-right" style={TNUM}>
                    <StatusDot v={c.deliveryIdx} /> {Math.round(c.deliveryIdx)}%
                  </td>
                  <td className="text-right" style={{ ...TNUM, color: C.ink2 }}>
                    {c.segment === "linear" ? `C3 ${c.c3}` : `${Math.round(c.viewability || c.vcr)}% vw`}
                  </td>
                  <td className="text-right" style={{ ...TNUM, color: c.outcomeIdx >= 100 ? C.green : c.outcomeIdx >= 85 ? C.ink2 : C.red }}>
                    {c.outcomeIdx}%
                  </td>
                  <td className="text-right font-semibold" style={{ ...TNUM, color: tone === "good" ? C.green : c.score < 60 ? C.red : C.amber }}
                      title={`Delivery ${Math.round(c.scoreParts.delivery)} (30%) · Quality ${Math.round(c.scoreParts.quality)} (30%) · Outcome ${Math.round(c.scoreParts.outcome)} (40%)`}>
                    {c.score}
                  </td>
                  <td className="pl-3">
                    <Sparkline values={sparks.get(c.id) || []} color={tone === "good" ? C.t10[4] : C.t10[2]} />
                  </td>
                </tr>
                {open && (
                  <tr style={{ background: C.blueSoft }}>
                    <td colSpan={8} className="px-4 pb-3 pt-1">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mb-3">
                        {[
                          ["Salesforce ID", c.sfId],
                          ["Flight", `Weeks ${c.start}–${c.end} (${c.weeks} wks)`],
                          ["Objective", c.objective],
                          ["Net budget", usdFull(c.budget)],
                          ["Guaranteed", c.segment === "linear" ? `${Math.round(c.guaranteed).toLocaleString()} GRPs` : `${num(c.guaranteed)} imps`],
                          ["Delivered", c.segment === "linear" ? `${Math.round(c.delivered).toLocaleString()} GRPs` : `${num(c.delivered)} imps`],
                          ["Unit cost", c.segment === "linear" ? `${usdFull(c.cpp)} CPP` : `$${c.cpm.toFixed(2)} CPM`],
                          c.segment === "linear"
                            ? ["Pre-emption rate", pct(c.preempt)]
                            : ["3P discrepancy", `${c.discrepancy}%`],
                          c.segment === "linear"
                            ? ["Spots ordered", c.spotsOrdered.toLocaleString()]
                            : ["On-target", pct(c.onTarget, 0)],
                          c.segment === "linear"
                            ? ["C3 index", c.c3]
                            : ["Incremental reach", pct(c.incrReach, 0)],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ color: C.muted }}>{k}</div>
                            <div className="font-medium" style={{ ...TNUM, color: C.ink }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {d ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div><div className="font-semibold mb-0.5" style={{ color: C.red }}>Diagnosed cause</div>
                            <div style={{ color: C.ink2 }}>{d.cause}</div></div>
                          <div><div className="font-semibold mb-0.5" style={{ color: C.blue }}>Remediation</div>
                            <div style={{ color: C.ink2 }}>{d.fix}</div></div>
                          <div><div className="font-semibold mb-0.5" style={{ color: C.ink }}>Dollar impact</div>
                            <div style={{ ...TNUM, color: C.ink2 }}>{d.impact}</div></div>
                        </div>
                      ) : (
                        <div style={{ color: C.ink2, maxWidth: "76ch" }}>
                          {WHY_WORKED[c.shortName] || WHY_WORKED._default(c)}
                        </div>
                      )}
                      <div className="mt-2" style={{ color: C.muted }}>
                        Composite score {c.score} = 0.30 × delivery {Math.round(c.scoreParts.delivery)} + 0.30 × quality{" "}
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

/* ============================ HEATMAP / DOTPLOT ============================ */

function Heatmap({ grid, caption }) {
  const vals = grid.values.flat().filter((v) => v > 0);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const ramp = (v) => {
    if (!v) return "#F7F7F7";
    const t = (v - lo) / (hi - lo || 1);
    const r = Math.round(240 - 200 * t), g = Math.round(246 - 130 * t), b = Math.round(255 - 44 * t);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 2, minWidth: 520 }}>
        <thead>
          <tr>
            <th />
            {grid.cols.map((c) => (
              <th key={c} className="text-xs font-medium pb-1 px-1" style={{ color: C.muted, textAlign: "center" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((r, ri) => (
            <tr key={r}>
              <td className="text-xs pr-2 whitespace-nowrap" style={{ color: C.ink2, width: 118 }}>{r}</td>
              {grid.cols.map((c, ci) => {
                const v = grid.values[ri][ci];
                return (
                  <td key={c} title={`${r} · ${c}: ${v ? `index ${v}` : "no delivery"}`}
                      className="text-xs text-center py-1.5"
                      style={{ ...TNUM, background: ramp(v), color: v > 104 ? "#fff" : C.ink2, borderRadius: 2 }}>
                    {v ? v : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.muted }}>
        <span>{lo}</span>
        <span style={{ width: 90, height: 8, background: `linear-gradient(90deg, ${ramp(lo)}, ${ramp(hi)})`, display: "inline-block", borderRadius: 2 }} />
        <span>{hi}</span>
        <span className="ml-2">Delivery index (100 = on plan). {caption}</span>
      </div>
    </div>
  );
}

function DotPlot({ items, lo, hi, band, target, valueFmt, height = 300 }) {
  const W = 100;
  const x = (v) => ((clamp(v, lo, hi) - lo) / (hi - lo)) * W;
  return (
    <div style={{ maxHeight: height, overflowY: "auto" }}>
      <div className="relative mb-1" style={{ height: 16 }}>
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <span key={t} className="absolute text-xs" style={{ ...TNUM, left: `${x(t)}%`, transform: "translateX(-50%)", color: C.muted }}>
            {valueFmt ? valueFmt(t) : t}
          </span>
        ))}
      </div>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2 py-1">
          <div className="text-xs truncate shrink-0" style={{ width: 168, color: C.ink2 }} title={it.label}>{it.label}</div>
          <div className="relative flex-1" style={{ height: 16 }}>
            <div className="absolute inset-y-1/2 left-0 right-0" style={{ height: 1, background: C.rule }} />
            {band && (
              <div className="absolute inset-y-0" style={{ left: `${x(band[0])}%`, width: `${x(band[1]) - x(band[0])}%`, background: "#EDF3FA" }} />
            )}
            {target != null && (
              <div className="absolute inset-y-0 w-px" style={{ left: `${x(target)}%`, background: C.ink }} />
            )}
            <div className="absolute rounded-full" title={`${it.label}: ${valueFmt ? valueFmt(it.value) : it.value}`}
                 style={{ left: `${x(it.value)}%`, top: 3, width: 10, height: 10, marginLeft: -5, background: it.color, border: "1px solid #fff" }} />
          </div>
          <div className="text-xs shrink-0 text-right" style={{ ...TNUM, width: 54, color: C.ink }}>
            {valueFmt ? valueFmt(it.value) : it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ APP ============================ */

const SECTIONS = [
  { id: "sec-a", n: "A", label: "Executive summary" },
  { id: "sec-b", n: "B", label: "Quota & revenue" },
  { id: "sec-c", n: "C", label: "What worked" },
  { id: "sec-d", n: "D", label: "What didn't" },
  { id: "sec-e", n: "E", label: "Delivery & pacing" },
  { id: "sec-f", n: "F", label: "Audience segments" },
  { id: "sec-g", n: "G", label: "Cross-platform reach" },
  { id: "sec-h", n: "H", label: "Renewals & pipeline" },
];

const SUBS = {
  all: ["All"],
  digital: ["All", "Display", "Online video", "CTV/Streaming", "Audio/Podcast", "Branded content"],
  linear: ["All", "Primetime", "Sports", "News", "Late night", "Syndication"],
};

export default function StellarWrapReport() {
  const [productView, setProductView] = useState("all");
  const [subFilter, setSubFilter] = useState("All");
  const [grain, setGrain] = useState("monthly");
  const [advertiser, setAdvertiser] = useState(null);
  const [objective, setObjective] = useState("All");
  const [dealType, setDealType] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [dict, setDict] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [active, setActive] = useState("sec-a");

  useEffect(() => { setSubFilter("All"); }, [productView]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return; // scroll-spy is progressive enhancement
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const { camps, facts } = useFiltered({ productView, subFilter, advertiser, objective, dealType });
  const series = useMemo(() => bucket(facts, grain), [facts, grain]);
  const tot = useMemo(() => totals(facts, camps), [facts, camps]);
  const narrative = useMemo(
    () => buildNarrative({ tot, camps, productView, grain, advertiser }),
    [tot, camps, productView, grain, advertiser]);

  const isLinear = productView === "linear";
  const isDigital = productView === "digital";

  /* cumulative attainment series */
  const attainment = useMemo(() => {
    const all = bucket(FACTS, grain);
    let cumA = 0, cumQ = 0;
    const rows = all.map((b, i) => {
      cumA += b.rev;
      cumQ += grain === "weekly" ? QUOTA_WEEKLY[b.k - 1]
        : grain === "monthly" ? WEEKS.filter((w) => w.month === b.k).reduce((s, w) => s + QUOTA_WEEKLY[w.idx - 1], 0)
        : QUARTER_QUOTA[b.k - 1];
      return { label: b.label, actual: cumA, quota: cumQ, gap: cumA - cumQ };
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
        quota: last.quota + QUARTER_QUOTA[3] * t,
        projected: last.actual + (FY_PROJECTION - last.actual) * t,
        projLo: last.actual + (27_400_000 - last.actual) * t,
        projHi: last.actual + (29_900_000 - last.actual) * t,
      };
    });
    if (rows.length) rows[rows.length - 1] = { ...last, projected: last.actual, projLo: last.actual, projHi: last.actual };
    return [...rows, ...proj];
  }, [grain]);

  /* revenue by advertiser (respects product filter) */
  const byAdvertiser = useMemo(() => {
    const m = new Map();
    facts.forEach((f) => {
      const a = byId[f.cid].advertiser;
      m.set(a, (m.get(a) || 0) + f.rev);
    });
    return [...m.entries()].map(([a, rev]) => {
      const prior = ADVERTISERS[a].prior * 1000 * (productView === "all" ? 1 : productView === "linear" ? 0.47 : 0.53);
      return { advertiser: a, rev, prior, yoy: ((rev - prior) / prior) * 100, note: ADVERTISERS[a].renewalNote, cat: ADVERTISERS[a].cat };
    }).sort((x, y) => y.rev - x.rev);
  }, [facts, productView]);

  /* waterfall */
  const waterfall = useMemo(() => {
    let run = 0;
    const rows = BRIDGE.map((b) => {
      const base = b.delta >= 0 ? run : run + b.delta;
      const r = { label: b.label, base, value: Math.abs(b.delta), kind: b.kind, running: run + b.delta };
      run += b.delta;
      return r;
    });
    rows.push({ label: "Net billable revenue", base: 0, value: run, kind: "total", running: run });
    return rows;
  }, []);

  const sparks = useMemo(() => {
    const m = new Map();
    FACTS.forEach((f) => {
      if (!m.has(f.cid)) m.set(f.cid, new Array(39).fill(0));
      m.get(f.cid)[f.w - 1] = f.rev;
    });
    return m;
  }, []);

  const ranked = useMemo(() => [...camps].sort((a, b) => b.score - a.score), [camps]);
  const half = Math.floor(ranked.length / 2);
  const winners = ranked.slice(0, Math.min(8, Math.ceil(ranked.length / 2)));
  const losers = ranked.slice(-Math.min(8, half)).reverse();

  const segList = useMemo(
    () => SEGMENTS.filter((s) => productView === "linear" ? s.seg !== "digital" : true),
    [productView]);

  /* segment-pure metric sets — the toggle swaps the vocabulary, not just the rows */
  const scopeCamps = useMemo(
    () => CAMPAIGNS.filter((c) =>
      (!advertiser || c.advertiser === advertiser) &&
      (objective === "All" || c.objective === objective) &&
      (dealType === "All" || c.dealType === dealType) &&
      (subFilter === "All" || c.product === subFilter)),
    [advertiser, objective, dealType, subFilter]);

  const digTot = useMemo(() => {
    const cs = scopeCamps.filter((c) => c.segment !== "linear");
    const ids = new Set(cs.map((c) => c.id));
    return totals(FACTS.filter((f) => ids.has(f.cid)), cs);
  }, [scopeCamps]);

  const linTot = useMemo(() => {
    const cs = scopeCamps.filter((c) => c.segment === "linear");
    const ids = new Set(cs.map((c) => c.id));
    return totals(FACTS.filter((f) => ids.has(f.cid)), cs);
  }, [scopeCamps]);

  const discrepancyRows = useMemo(
    () => scopeCamps.filter((c) => c.segment !== "linear")
      .map((c) => ({ name: c.name, discrepancy: c.discrepancy, budget: c.budget }))
      .sort((a, b) => b.discrepancy - a.discrepancy),
    [scopeCamps]);

  const avgDiscrepancy = useMemo(() => {
    const rows = discrepancyRows;
    const wsum = rows.reduce((s, r) => s + r.budget, 0);
    return wsum ? rows.reduce((s, r) => s + r.discrepancy * r.budget, 0) / wsum : 0;
  }, [discrepancyRows]);

  /* efficiency indexed within segment — CPP and CPM are not the same measurement */
  const scatterData = useMemo(() => {
    const med = (arr) => {
      const a = [...arr].sort((x, y) => x - y);
      return a.length ? a[Math.floor(a.length / 2)] : 1;
    };
    const medCpp = med(CAMPAIGNS.filter((c) => c.segment === "linear").map((c) => c.cpp));
    const medCpm = med(CAMPAIGNS.filter((c) => c.segment !== "linear").map((c) => c.cpm));
    return camps.map((c) => ({
      name: c.name, segment: c.segment, score: c.score, budget: c.budget,
      eff: clamp(((c.segment === "linear" ? medCpp / c.cpp : medCpm / c.cpm)) * 100, 62, 148),
    }));
  }, [camps]);

  const renewalData = useMemo(() => {
    const m = new Map();
    CAMPAIGNS.forEach((c) => {
      if (!m.has(c.advertiser)) m.set(c.advertiser, { scores: [], rev: 0 });
      const e = m.get(c.advertiser);
      e.scores.push(c.score); e.rev += c.budget;
    });
    return [...m.entries()].map(([a, e]) => {
      const avg = e.scores.reduce((s, x) => s + x, 0) / e.scores.length;
      const note = ADVERTISERS[a].renewalNote;
      let p = (avg - 74) * 2.6 + 52;
      if (note === "At risk") p -= 26;
      if (note === "Upfront anchor") p += 5;
      if (note === "New logo") p -= 12;
      return { advertiser: a, score: Math.round(avg), rev: e.rev, prob: Math.round(clamp(p, 8, 94)), note };
    });
  }, []);

  const src = (systems, caveat) => ({ systems, refresh: "Sep 28, 2026 06:14 PT", caveat });

  return (
    <div style={{ background: C.canvas, fontFamily: FONT, color: C.ink, minHeight: "100vh" }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        .rail-btn:focus-visible, button:focus-visible { outline: 2px solid ${C.blue}; outline-offset: 2px; }
        .recharts-cartesian-axis-line { stroke: ${C.rule}; }
      `}</style>

      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-30" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="grid place-items-center font-bold text-white" style={{ width: 28, height: 28, background: C.blueDark, borderRadius: 4, fontSize: 13 }}>SM</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Stellar Media</div>
              <div className="text-xs" style={{ color: C.muted }}>Ad Sales Analytics</div>
            </div>
          </div>
          <div className="hidden md:block h-7 w-px" style={{ background: C.rule }} />
          <div className="min-w-0 hidden md:block">
            <div className="text-sm font-semibold truncate">Campaign wrap report — Jennifer Smith</div>
            <div className="text-xs truncate" style={{ color: C.muted }}>
              Senior AE, West Region · Auto / Finance / QSR · FY26 through Q3 close (Sep 26, 2026)
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDict(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded" style={{ color: C.blue, border: `1px solid ${C.rule}` }}>
              <BookOpen size={13} /> Metric dictionary
            </button>
            <button onClick={() => setExportOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded" style={{ color: C.blue, border: `1px solid ${C.rule}` }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 pb-2">
          <Segmented
            value={productView}
            onChange={setProductView}
            options={[
              { value: "all", label: "All products" },
              { value: "digital", label: "Digital & streaming" },
              { value: "linear", label: "Linear" },
            ]}
          />
          <Segmented
            value={grain}
            onChange={setGrain}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
            ]}
          />
          {SUBS[productView].length > 1 && (
            <Segmented size="sm" value={subFilter} onChange={setSubFilter}
              options={SUBS[productView].map((s) => ({ value: s, label: s }))} />
          )}
          <button onClick={() => setShowFilters((v) => !v)} className="text-xs px-2 py-1.5 rounded flex items-center gap-1" style={{ color: C.muted, border: `1px solid ${C.rule}` }}>
            {showFilters ? <ChevronDown size={13} /> : <ChevronRight size={13} />} More filters
          </button>
          <div className="flex items-center gap-1.5">
            {advertiser && <Chip onClear={() => setAdvertiser(null)}>Advertiser: {advertiser}</Chip>}
            {objective !== "All" && <Chip onClear={() => setObjective("All")}>Objective: {objective}</Chip>}
            {dealType !== "All" && <Chip onClear={() => setDealType("All")}>Deal: {dealType}</Chip>}
          </div>
          <div className="ml-auto text-xs" style={{ color: C.muted }}>
            {camps.length} campaigns · {usdFull(tot.rev)}
          </div>
        </div>

        <div className="px-4 pb-2 text-xs" style={{ color: C.muted }}>
          {productView === "all"
            ? "All products view compares linear and digital at the revenue line only. GRPs and impressions are different currencies and are not summed."
            : productView === "linear"
              ? "Linear is measured in Nielsen C3 GRPs on the broadcast calendar. Metric tiles below are the linear set."
              : "Digital and streaming are measured in ad-server impressions on the Gregorian calendar. Metric tiles below are the digital set."}
        </div>

        {showFilters && (
          <div className="px-4 pb-3 flex flex-wrap gap-4 items-end" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <label className="text-xs" style={{ color: C.muted }}>
              <div className="mb-1">Advertiser</div>
              <select value={advertiser || ""} onChange={(e) => setAdvertiser(e.target.value || null)}
                      className="text-xs px-2 py-1.5 rounded" style={{ border: `1px solid ${C.rule}`, color: C.ink, minWidth: 190 }}>
                <option value="">All advertisers</option>
                {Object.keys(ADVERTISERS).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="text-xs" style={{ color: C.muted }}>
              <div className="mb-1">Campaign objective</div>
              <select value={objective} onChange={(e) => setObjective(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded" style={{ border: `1px solid ${C.rule}`, color: C.ink, minWidth: 150 }}>
                {["All", "Awareness", "Consideration", "Performance", "Reach"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="text-xs" style={{ color: C.muted }}>
              <div className="mb-1">Deal type</div>
              <select value={dealType} onChange={(e) => setDealType(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded" style={{ border: `1px solid ${C.rule}`, color: C.ink, minWidth: 190 }}>
                {["All", "Upfront", "Scatter", "Direct IO", "Programmatic guaranteed", "PMP"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="text-xs" style={{ color: C.muted }}>
              <div className="mb-1">Date range</div>
              <div className="text-xs px-2 py-1.5 rounded" style={{ border: `1px solid ${C.rule}`, color: C.ink }}>
                Jan 3 – Sep 26, 2026 (39 broadcast weeks)
              </div>
            </label>
          </div>
        )}
      </header>

      <div className="flex">
        {/* ---------------- left rail ---------------- */}
        <nav className="hidden lg:block shrink-0 sticky self-start" style={{ width: 216, top: 116, background: C.card, borderRight: `1px solid ${C.border}`, height: "calc(100vh - 116px)" }}>
          <div className="py-3">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                 className="rail-btn block px-4 py-2 text-xs"
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
            <div className="font-semibold" style={{ color: C.ink2 }}>Attainment</div>
            <div className="mt-1 font-bold" style={{ ...TNUM, fontSize: 22, color: C.green }}>{JENNIFER_ATTAIN}%</div>
            <div>of {usd(YTD_QUOTA)} YTD quota</div>
            <div className="mt-2 flex items-center gap-1" style={{ color: C.green }}>
              <CheckCircle2 size={12} /> President's Club cleared
            </div>
          </div>
        </nav>

        {/* ---------------- content ---------------- */}
        <main className="flex-1 min-w-0 px-4 lg:px-6 py-5 space-y-8" style={{ maxWidth: 1440 }}>

          {camps.length === 0 && (
            <div className="px-4 py-6 rounded text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink2 }}>
              No campaigns match these filters. Clear the advertiser or product filter above to bring the book back into view.
            </div>
          )}

          {/* ============ A · EXECUTIVE SUMMARY ============ */}
          <div id="sec-a">
            <SectionTitle n="A" title="Executive summary"
              blurb="Written for Jennifer's Group Director and reusable in client QBRs. Text regenerates against the active filters." />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2"
                    sources={src(["Salesforce CRM — Opportunity, Order Product, Quota", "Google Ad Manager + FreeWheel — delivery", "Nielsen / VideoAmp — linear demo delivery", "Stellar Data Cloud — outcomes and segments"],
                      "Narrative is generated from the same aggregates that feed the charts below; no separate model.")}
                    title="The year so far">
                <div className="space-y-3" style={{ maxWidth: "76ch" }}>
                  {narrative?.paras.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: C.ink2 }}>{p}</p>
                  ))}
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: C.ink }}>Recommended actions for Q4 and the FY27 upfront</div>
                  <ol className="space-y-1.5">
                    {narrative?.actions.map((a, i) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: C.ink2 }}>
                        <span style={{ color: C.blue, fontWeight: 600, ...TNUM }}>{i + 1}.</span>
                        <span style={{ maxWidth: "72ch" }}>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="#sec-f"><Chip tone="green">See the segment reallocation →</Chip></a>
                  <a href="#sec-e"><Chip tone="amber">See the discrepancy monitor →</Chip></a>
                  <a href="#sec-d"><Chip>See the underperformers →</Chip></a>
                </div>
              </Card>

              <div className="space-y-4">
                <Card title="Book health" sources={src(["Salesforce CRM", "Operative.One — spot logs and ADU"], "Net billable reflects credits issued through Sep 26 only.")}>
                  <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Closed-won YTD" value={usd(tot.rev, 2)} sub="vs. $18.0M quota" trend={20.0} tone="good" />
                    <KpiTile label="Net billable" value={usd(20_728_000, 2)} sub="after credits & ADU" />
                    <KpiTile label="Campaigns in scope" value={camps.length} sub={`${new Set(camps.map(c=>c.advertiser)).size} advertisers`} />
                    <KpiTile label="Delivery health" value={pct(tot.postingPct, 0)} sub="weighted delivery index"
                             tone={tot.postingPct >= 99 ? "good" : "warn"} />
                  </div>
                </Card>
                <Card title="Open exposure" sources={src(["Operative.One", "Google Ad Manager vs. Campaign Manager 360"], "Discrepancy compares Stellar's server of record to advertiser-side counts.")}>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-center gap-2"><AlertTriangle size={13} style={{ color: C.amber }} />
                      <span style={{ color: C.ink2 }}>ADU / make-good liability</span>
                      <span className="ml-auto font-semibold" style={TNUM}>$286,000</span></li>
                    <li className="flex items-center gap-2"><AlertTriangle size={13} style={{ color: C.amber }} />
                      <span style={{ color: C.ink2 }}>Under-delivery credits issued</span>
                      <span className="ml-auto font-semibold" style={TNUM}>$412,000</span></li>
                    <li className="flex items-center gap-2"><AlertTriangle size={13} style={{ color: C.red }} />
                      <span style={{ color: C.ink2 }}>Counts in dispute (&gt;10%)</span>
                      <span className="ml-auto font-semibold" style={TNUM}>1 campaign</span></li>
                    <li className="flex items-center gap-2"><Info size={13} style={{ color: C.muted }} />
                      <span style={{ color: C.ink2 }}>Accounts flagged at risk</span>
                      <span className="ml-auto font-semibold" style={TNUM}>2</span></li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>

          {/* ============ B · QUOTA & REVENUE ============ */}
          <div id="sec-b">
            <SectionTitle n="B" title="Quota and revenue attainment"
              blurb="Attainment is measured on Salesforce closed-won revenue. Net billable revenue reconciles that figure against delivered inventory." />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2" title="YTD attainment against quota"
                    subtitle="Closed-won revenue vs. the $18.0M year-to-date quota benchmark, with the 110% President's Club threshold marked."
                    sources={src(["Salesforce CRM — Quota object, Opportunity closed-won"], "Quota is set quarterly: $5.4M / $6.0M / $6.6M / $6.0M.")}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-bold" style={{ ...TNUM, fontSize: 40, color: C.green }}>$21.6M</span>
                  <span className="text-sm" style={{ color: C.ink2 }}>closed-won · <strong>120%</strong> of YTD quota</span>
                  <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: C.greenSoft, color: "#194E31" }}>
                    Pacing to {usd(FY_PROJECTION)} · 119% of annual
                  </span>
                </div>
                <Bullet actual={21_600_000} target={YTD_QUOTA} max={26_000_000}
                        threshold={YTD_QUOTA * CLUB_THRESHOLD} thresholdLabel="Club 110%" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  <KpiTile label="Attainment vs. YTD quota" value="120%" tone="good" sub="+$3.6M over plan" />
                  <KpiTile label="Revenue vs. prior year" value="+14.8%" tone="good" sub="$18.8M LY same period" />
                  <KpiTile label="Average deal size" value="$540K" sub="40 campaigns" />
                  <KpiTile label="Q4 pipeline coverage" value="3.4×" sub="on $6.0M Q4 quota" tone="good" />
                </div>
              </Card>

              <Card title="Where Jennifer sits" subtitle="Anonymized attainment across 28 sellers in the national ad sales org."
                    sources={src(["Salesforce CRM — Quota and Forecast"], "Peer values are anonymized and rounded to whole points.")}>
                <div className="relative mt-6" style={{ height: 96 }}>
                  <div className="absolute left-0 right-0" style={{ top: 44, height: 1, background: C.rule }} />
                  <div className="absolute" style={{ left: `${((100 - 55) / 90) * 100}%`, top: 20, bottom: 26, width: 1, background: C.ink }} />
                  <div className="absolute text-xs" style={{ left: `${((100 - 55) / 90) * 100}%`, top: 2, transform: "translateX(-50%)", color: C.muted }}>100%</div>
                  {PEERS.map((p, i) => (
                    <div key={i} className="absolute rounded-full"
                         style={{ left: `${((p - 55) / 90) * 100}%`, top: 40, width: 9, height: 9, marginLeft: -4.5, background: C.t10[9], opacity: 0.85 }} />
                  ))}
                  <div className="absolute rounded-full"
                       style={{ left: `${((JENNIFER_ATTAIN - 55) / 90) * 100}%`, top: 36, width: 16, height: 16, marginLeft: -8, background: C.green, border: "2px solid #fff", boxShadow: "0 0 0 1px " + C.green }} />
                  <div className="absolute text-xs font-semibold"
                       style={{ left: `${((JENNIFER_ATTAIN - 55) / 90) * 100}%`, top: 60, transform: "translateX(-50%)", color: C.green, whiteSpace: "nowrap" }}>
                    Jennifer · 120%
                  </div>
                </div>
                <div className="text-xs mt-2" style={{ color: C.muted }}>
                  1st of 9 in the West Region. 3rd of 28 nationally. Median seller is at 97%.
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <Card title="Cumulative revenue against quota pace"
                    subtitle={`${grain === "weekly" ? "Broadcast weeks" : grain === "monthly" ? "Calendar months" : "Fiscal quarters"} · shaded area is revenue ahead of plan; dashed line is the Q4 projection.`}
                    sources={src(["Salesforce CRM — Opportunity close date and amount"], "Projection is a linear extension of trailing 13-week booking velocity, not a committed forecast.")}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={attainment} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} interval={grain === "weekly" ? 3 : 0} />
                    <YAxis {...axis} tickFormatter={(v) => usd(v)} width={48} />
                    <Tooltip content={<TT fmt={(v) => (v == null ? "—" : usdFull(v))} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Line type="monotone" dataKey="quota" name="Quota pace" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <Line type="monotone" dataKey="projLo" name="Projection range" stroke={C.green} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 3" dot={false} />
                    <Line type="monotone" dataKey="projHi" stroke={C.green} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 3" dot={false} legendType="none" />
                    <Line type="monotone" dataKey="actual" name="Closed-won" stroke={C.green} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="projected" name="Q4 projection" stroke={C.green} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                    <ReferenceLine y={ANNUAL_QUOTA} stroke={C.ink} strokeDasharray="2 2"
                      label={{ value: "Annual quota $24.0M", position: "insideTopLeft", fontSize: 10, fill: C.ink }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Booked revenue to net billable revenue"
                    subtitle="Salesforce closed-won never equals what Stellar invoices. This is the bridge."
                    sources={src(["Salesforce CRM — closed-won by segment", "Operative.One — ADU and pre-emption liability", "Ad server — under-delivery reconciliation"],
                      "Credits are recognized in the period the make-good is agreed, not the period of under-delivery.")}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={waterfall} margin={{ top: 8, right: 12, left: 4, bottom: 44 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} angle={-28} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10, fill: C.muted }} />
                    <YAxis {...axis} tickFormatter={(v) => usd(v)} width={48} />
                    <Tooltip content={<TT fmt={(v, n, p) => `${p.kind === "down" ? "−" : ""}${usdFull(v)}`} />} />
                    <Bar dataKey="base" stackId="a" fill="transparent" legendType="none" />
                    <Bar dataKey="value" stackId="a" maxBarSize={44}>
                      {waterfall.map((r, i) => (
                        <Cell key={i} fill={r.kind === "up" ? C.t10[0] : r.kind === "down" ? C.t10[2] : C.blueDark} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs mt-1" style={{ color: C.muted }}>
                  $872K of booked revenue does not convert to billings — 4.0% of the book.
                </div>
              </Card>
            </div>

            <Card className="mt-4" title="Revenue by advertiser"
                  subtitle="Sorted descending on current-period revenue. Click a bar to filter the whole report to that advertiser."
                  sources={src(["Salesforce CRM — Account, Order Product"], "Prior-year figures are restated to the current product taxonomy.")}>
              <ResponsiveContainer width="100%" height={Math.max(220, byAdvertiser.length * 30)}>
                <BarChart data={byAdvertiser} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={C.rule} />
                  <XAxis type="number" {...axis} tickFormatter={(v) => usd(v)} />
                  <YAxis type="category" dataKey="advertiser" {...axis} width={132} tick={{ fontSize: 11, fill: C.ink2 }} />
                  <Tooltip content={<TT fmt={(v, n, p) => `${usdFull(v)} · ${p.yoy >= 0 ? "+" : ""}${p.yoy.toFixed(1)}% YoY · ${p.note}`} />} />
                  <Bar dataKey="rev" name="Revenue" maxBarSize={18} cursor="pointer"
                       onClick={(d) => setAdvertiser(d.advertiser === advertiser ? null : d.advertiser)}>
                    {byAdvertiser.map((d, i) => (
                      <Cell key={i} fill={d.note === "At risk" ? C.t10[2] : d.note === "New logo" ? C.t10[4] : C.t10[0]}
                            opacity={advertiser && d.advertiser !== advertiser ? 0.28 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 text-xs mt-1" style={{ color: C.muted }}>
                <span><span style={{ color: C.t10[0] }}>■</span> Renewed or in renewal</span>
                <span><span style={{ color: C.t10[4] }}>■</span> New logo this year</span>
                <span><span style={{ color: C.t10[2] }}>■</span> Flagged at risk</span>
              </div>
            </Card>
          </div>

          {/* ============ C · WHAT WORKED ============ */}
          <div id="sec-c">
            <SectionTitle n="C" title="Campaign performance — what worked"
              blurb="Composite score = 30% delivery accuracy + 30% quality + 40% outcome versus goal. Hover any score to see the three components." />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3" title="Top performing campaigns"
                    subtitle="Ranked on composite score. Sparklines show weekly revenue delivery across the flight. Click a row to expand."
                    sources={src(["Salesforce CRM — Order Product", "Ad server — delivery and quality", "Nielsen — C3 posting", "Stellar Data Cloud — outcomes"],
                      "Outcome index is measured against the goal written on the IO, not against a portfolio average.")}>
                <CampaignTable rows={winners} sparks={sparks} expanded={expanded} setExpanded={setExpanded} tone="good" />
              </Card>

              <Card className="xl:col-span-2" title="Efficiency against effectiveness"
                    subtitle="Efficiency is indexed within each segment, because CPP and CPM are not the same measurement. Bubble size is revenue."
                    sources={src(["Salesforce CRM", "Nielsen — CPP", "Ad server — eCPM"], "Reference lines are the portfolio medians on each axis.")}>
                <ResponsiveContainer width="100%" height={340}>
                  <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 24 }}>
                    <CartesianGrid stroke={C.rule} />
                    <XAxis type="number" dataKey="eff" name="Efficiency index" domain={[60, 150]} {...axis}
                           label={{ value: "Efficiency index (100 = segment median)", position: "insideBottom", offset: -14, fontSize: 10, fill: C.muted }} />
                    <YAxis type="number" dataKey="score" name="Composite score" domain={[45, 100]} {...axis} width={34}
                           label={{ value: "Composite score", angle: -90, position: "insideLeft", fontSize: 10, fill: C.muted }} />
                    <ZAxis type="number" dataKey="budget" range={[40, 460]} />
                    <ReferenceLine x={100} stroke={C.ink} strokeDasharray="3 3" />
                    <ReferenceLine y={87} stroke={C.ink} strokeDasharray="3 3" />
                    <Tooltip content={<TT title={(p) => p.name}
                      fmt={(v, n) => n === "Efficiency index" ? Math.round(v) : Math.round(v)} />} />
                    <Scatter data={scatterData} >
                      {scatterData.map((d, i) => (
                        <Cell key={i} fill={d.segment === "linear" ? C.t10[0] : d.segment === "streaming" ? C.t10[3] : C.t10[1]} fillOpacity={0.75} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.muted }}>
                  <span><span style={{ color: C.t10[0] }}>●</span> Linear</span>
                  <span><span style={{ color: C.t10[3] }}>●</span> Streaming</span>
                  <span><span style={{ color: C.t10[1] }}>●</span> Digital</span>
                  <span className="w-full">Top-right quadrant is cheap and effective. Bottom-right is cheap and ineffective — the worst place to spend a client's money, because it looks like a bargain on the invoice.</span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              {narrative?.top.map((c, i) => (
                <Card key={c.id} title={c.name} subtitle={`${c.product} · ${c.objective} · weeks ${c.start}–${c.end} · ${usdFull(c.budget)}`}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-bold" style={{ ...TNUM, fontSize: 30, color: C.green }}>{c.score}</span>
                    <span className="text-xs" style={{ color: C.muted }}>composite score</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: C.greenSoft, color: "#194E31", ...TNUM }}>
                      {c.outcomeIdx}% of goal
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: C.ink2 }}>{WHY_WORKED[c.shortName] || WHY_WORKED._default(c)}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(c.segment === "linear"
                      ? [["Posting", pct(c.deliveryIdx, 0)], ["C3 index", c.c3], ["Pre-empt", pct(c.preempt)]]
                      : [["Delivery", pct(c.deliveryIdx, 0)], ["On-target", pct(c.onTarget, 0)], ["VCR", pct(c.vcr, 0)]]
                    ).map(([k, v]) => (
                      <div key={k} className="px-2 py-1.5 rounded" style={{ background: "#FAFAF9" }}>
                        <div style={{ color: C.muted }}>{k}</div>
                        <div className="font-semibold" style={{ ...TNUM, color: C.ink }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <ResponsiveContainer width="100%" height={92}>
                      <LineChart data={flightSeries(c, sparks)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={C.rule} />
                        <XAxis dataKey="label" hide />
                        <YAxis hide domain={[0, "dataMax"]} />
                        <Tooltip content={<TT fmt={(v) => usdFull(v)} />} />
                        <Line type="monotone" dataKey="rev" name="Weekly revenue" stroke={C.t10[4]} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="text-xs" style={{ color: C.muted }}>Weekly delivered revenue across flight</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ============ D · WHAT DIDN'T ============ */}
          <div id="sec-d">
            <SectionTitle n="D" title="Campaign performance — what didn't"
              blurb="Same ranking, opposite end. Every underperformer carries a diagnosed cause, the remediation taken, and the dollar impact." />

            <Card title="Underperforming campaigns"
                  subtitle="Ranked ascending on composite score. Click a row for the diagnosis and the remediation."
                  sources={src(["Ad server — delivery and viewability", "Operative.One — pre-emptions, ADU", "Nielsen — posting", "Stellar Data Cloud — outcomes"],
                    "Dollar impact is the credit or ADU value booked against the campaign, not lost opportunity.")}>
              <CampaignTable rows={losers} sparks={sparks} expanded={expanded} setExpanded={setExpanded} tone="bad" />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {productView !== "digital" && (
              <Card title="Apex Championship Sports Buy — where it broke"
                    subtitle="Three live-event overruns in weeks 9–11 pushed ordered spots outside their windows. Posting closed at 87%."
                    sources={src(["Operative.One — as-run spot logs", "Nielsen — C3 posting"], "Delivery index is spots aired against spots ordered, weighted by rating.")}>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={incidentSeries("Championship Sports Buy")} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} interval={1} />
                    <YAxis {...axis} domain={[40, 120]} width={34} />
                    <Tooltip content={<TT fmt={(v) => `${Math.round(v)}`} />} />
                    <ReferenceArea x1="w9" x2="w11" fill={C.red} fillOpacity={0.07} />
                    <ReferenceLine y={100} stroke={C.ink} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="v" name="Weekly delivery index" stroke={C.t10[2]} strokeWidth={2.5} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs px-3 py-2 rounded" style={{ background: C.redSoft, color: "#8A0011" }}>
                  Weeks 9–11 highlighted. Remediation: 214 ADU spots scheduled across Q4 primetime and access.
                  Dollar impact <strong style={TNUM}>$101,000</strong> of ADU liability, still open.
                </div>
              </Card>
              )}

              {productView !== "linear" && (
              <Card title="Torchlight Quote Flow — viewability incident and fix"
                    subtitle="Viewability collapsed to 51% in weeks 3–6 on a mis-mapped below-the-fold placement, then recovered to 79% after the fix."
                    sources={src(["Google Ad Manager", "IAS via ad server"], "MRC standard: 50% of pixels in view for one continuous second for display.")}>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={incidentSeries("Quote Flow Performance", "vw")} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={C.rule} />
                    <XAxis dataKey="label" {...axis} interval={3} />
                    <YAxis {...axis} domain={[40, 95]} width={34} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<TT fmt={(v) => pct(v)} />} />
                    <ReferenceArea x1="w3" x2="w6" fill={C.amber} fillOpacity={0.1} />
                    <ReferenceLine y={70} stroke={C.ink} strokeDasharray="3 3"
                      label={{ value: "70% guarantee", position: "insideBottomRight", fontSize: 10, fill: C.muted }} />
                    <Line type="monotone" dataKey="v" name="Viewable rate" stroke={C.t10[1]} strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs px-3 py-2 rounded" style={{ background: C.amberSoft, color: "#8C4B02" }}>
                  Detected in week 6, fixed in week 8. Remediation: 4.1M bonus impressions above-the-fold.
                  Dollar impact <strong style={TNUM}>$38,000</strong> in credits. Third-party discrepancy still running 9.6%.
                </div>
              </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <Card title="Two cases that break the usual rule"
                    subtitle="Delivery compliance and campaign effectiveness are different measurements. These prove it in both directions.">
                <div className="space-y-3">
                  <div className="p-3 rounded" style={{ background: C.greenSoft }}>
                    <div className="text-xs font-semibold" style={{ color: "#194E31" }}>Under-delivered, over-performed</div>
                    <div className="text-sm font-semibold mt-1">Calyx Creator Series Streaming</div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: C.ink2 }}>
                      Delivered 91% of contracted impressions — technically a shortfall, credited at $24K — and returned
                      148% of its conversion goal. The tight creator-adjacent inventory that caused the shortfall is the
                      same inventory that drove a 4.1% conversion rate against a 2.0% portfolio average. Buying more of
                      it would fix the delivery gap and dilute the result. Recommendation: raise the CPM, hold the inventory,
                      lower the impression guarantee.
                    </p>
                  </div>
                  <div className="p-3 rounded" style={{ background: C.redSoft }}>
                    <div className="text-xs font-semibold" style={{ color: "#8A0011" }}>Delivered clean, failed on outcome</div>
                    <div className="text-sm font-semibold mt-1">Vireo Device Upgrade OLV</div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: C.ink2 }}>
                      101% delivery, 88% viewability, 92% completion rate — a flawless delivery report — and 42% of goal
                      on attributed upgrades, with brand lift at 0.4 points against a 3.0 benchmark. Four creative variants
                      ran unchanged for 17 weeks against a segment roughly three times wider than the converting audience.
                      Nothing in the ad-server data would have caught this. Only outcome measurement did.
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="Lessons carried into FY27 planning"
                    subtitle="Each failure mapped to a specific change in how the next plan gets built.">
                <ol className="space-y-2.5">
                  {LESSONS.map((l, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-xs font-semibold shrink-0 mt-0.5" style={{ ...TNUM, color: C.blue, width: 14 }}>{i + 1}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: C.ink }}>{l.change}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.muted }}>From: {l.from}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>

          {/* ============ E · DELIVERY & PACING ============ */}
          <div id="sec-e">
            <SectionTitle n="E" title="Delivery and pacing"
              blurb={isLinear
                ? "Linear metric set: GRPs, posting, CPP, spot compliance and ADU liability, measured on Nielsen C3 against the broadcast calendar."
                : isDigital
                  ? "Digital metric set: impressions, delivery index, completion, viewability, on-target percentage and eCPM, measured on ad-server counts."
                  : "All-products view shows both metric sets side by side. They are not summed and not compared."} />

            {(productView === "all" || isDigital) && digTot.campaignCount > 0 && (
              <>
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.ink2 }}>
                  <MonitorPlay size={13} style={{ color: C.t10[1] }} /> Digital &amp; streaming metric set
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 mb-4">
                  <KpiTile label="Impressions delivered" value={num(digTot.imps)} sub={`${pct(digTot.deliveryRate, 0)} of contracted`} tone={digTot.deliveryRate >= 100 ? "good" : "warn"} />
                  <KpiTile label="Delivery index" value={pct(digTot.deliveryRate, 0)} sub="95–105% corridor" />
                  <KpiTile label="Video completion rate" value={pct(digTot.vcr, 0)} sub="video impressions only" tone={digTot.vcr >= 88 ? "good" : "neutral"} />
                  <KpiTile label="Viewability (MRC)" value={pct(digTot.viewRate, 0)} sub="of measured impressions" tone={digTot.viewRate >= 70 ? "good" : "warn"} />
                  <KpiTile label="On-target %" value={pct(digTot.otRate, 0)} sub="70% guarantee" tone={digTot.otRate >= 70 ? "good" : "bad"} />
                  <KpiTile label="eCPM" value={`$${digTot.ecpm.toFixed(2)}`} sub="net revenue basis" />
                  <KpiTile label="Attributed conversions" value={num(digTot.conversions)} sub="30-day post-exposure" />
                  <KpiTile label="Avg. count discrepancy" value={pct(avgDiscrepancy)} sub="vs. third-party" tone={avgDiscrepancy < 10 ? "neutral" : "bad"} />
                </div>
              </>
            )}

            {(productView === "all" || isLinear) && linTot.campaignCount > 0 && (
              <>
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.ink2 }}>
                  <Radio size={13} style={{ color: C.t10[0] }} /> Linear metric set
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 mb-4">
                  <KpiTile label="GRPs delivered (A25-54)" value={Math.round(linTot.grps).toLocaleString()} sub="C3 basis" />
                  <KpiTile label="Posting %" value={pct(linTot.deliveryRate, 0)} sub="of guaranteed GRPs" tone={linTot.deliveryRate >= 100 ? "good" : "warn"} />
                  <KpiTile label="Demo impressions" value={num(linTot.imps)} sub="rating × universe" />
                  <KpiTile label="CPP" value={usdFull(linTot.cpp)} sub="net spend ÷ GRPs" />
                  <KpiTile label="CPM equivalent" value={linTot.imps ? `$${(linTot.rev / (linTot.imps / 1000)).toFixed(2)}` : "—"} sub="not comparable to digital" />
                  <KpiTile label="Spots aired / ordered" value={linTot.spotsOrdered ? pct((linTot.spotsAired / linTot.spotsOrdered) * 100, 1) : "—"} sub={`${Math.round(linTot.spotsOrdered).toLocaleString()} ordered`} />
                  <KpiTile label="Pre-emption rate" value={pct(linTot.preemptRate)} sub="of ordered spots" tone={linTot.preemptRate < 3 ? "neutral" : "warn"} />
                  <KpiTile label="ADU liability" value="$286K" sub="open into Q4" tone="warn" />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card title="Pacing by campaign"
                    subtitle="Delivered-to-date against expected-to-date. Shaded band is the 95–105% acceptable corridor; anything outside it needs action this week."
                    sources={src(["Google Ad Manager / FreeWheel — delivery", "Operative.One — linear as-run", "Salesforce CRM — flight dates"],
                      "Expected-to-date assumes even pacing unless the IO specifies a front- or back-weighted schedule.")}>
                <DotPlot
                  items={camps.map((c) => ({
                    label: c.name, value: c.deliveryIdx,
                    color: c.deliveryIdx >= 95 && c.deliveryIdx <= 105 ? C.t10[0] : c.deliveryIdx < 95 ? C.red : C.amber,
                  })).sort((a, b) => a.value - b.value)}
                  lo={80} hi={112} band={[95, 105]} target={100}
                  valueFmt={(v) => `${Math.round(v)}%`} height={360} />
                <div className="text-xs mt-2" style={{ color: C.muted }}>
                  {camps.filter((c) => c.deliveryIdx < 95).length} campaigns under corridor ·{" "}
                  {camps.filter((c) => c.deliveryIdx > 105).length} over-pacing and at risk of early exhaustion.
                </div>
              </Card>

              <Card title={isLinear ? "Delivery index by daypart and network" : "Delivery index by placement and device"}
                    subtitle="Sequential ramp. Blank cells carried no delivery in the period."
                    sources={src(isLinear ? ["Nielsen — C3 by daypart", "Operative.One — as-run"] : ["Google Ad Manager", "FreeWheel"],
                      isLinear ? "Overnight is excluded from most guarantees and shown for completeness." : "Smart audio is measured on download-and-play, not impressions.")}>
                <Heatmap grid={isLinear ? LINEAR_GRID : DIGITAL_GRID}
                         caption={isLinear ? "Primetime and Sports carry the book." : "CTV outperforms every other environment on every format."} />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <KpiTile label="Impressions / GRPs owed" value={isLinear ? "1,184 GRPs" : "18.4M imps"} sub="open under-delivery" tone="warn" />
                  <KpiTile label="Dollar liability" value="$286K" sub="ADU + make-good" tone="warn" />
                  <KpiTile label="Runway to make good" value="13 wks" sub="through Dec 26" />
                </div>
              </Card>
            </div>

            {(productView === "all" || isDigital) && discrepancyRows.length > 0 && (
              <Card className="mt-4" title="Third-party count discrepancy monitor"
                    subtitle="Stellar ad-server counts against advertiser-side counts. The 10% line is where the IO permits a billing dispute."
                    sources={src(["Google Ad Manager (server of record)", "Campaign Manager 360 / advertiser-side tags"],
                      "Discrepancies of 2–5% are normal and attributable to latency and tag-fire loss. Above 10% is escalated to ad ops within 5 business days.")}>
                <ResponsiveContainer width="100%" height={Math.max(200, discrepancyRows.length * 26)}>
                  <BarChart data={discrepancyRows} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} domain={[0, 14]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" {...axis} width={190} tick={{ fontSize: 10, fill: C.ink2 }} />
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

          {/* ============ F · AUDIENCE SEGMENTS ============ */}
          <div id="sec-f">
            <SectionTitle n="F" title="Audience segments"
              blurb="On-target percentage anchors this view because it is the number that triggers make-goods and the number clients renew on. Index and outcome sit alongside it." />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3" title="Segment index against general population"
                    subtitle="100 = parity. Sorted best to worst. Diverging from the parity line, blue above and orange below."
                    sources={src(["Nielsen / VideoAmp — demo verification", "Stellar Data Cloud — 1P segment membership", "LiveRamp — 3P and CRM match"],
                      "Index is calculated on verified in-target impressions, not on planned targeting.")}>
                <ResponsiveContainer width="100%" height={Math.max(300, segList.length * 26)}>
                  <BarChart data={segList.map((s) => ({ ...s, delta: s.index - 100 }))} layout="vertical"
                            margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} domain={[-50, 75]} tickFormatter={(v) => `${100 + v}`} />
                    <YAxis type="category" dataKey="name" {...axis} width={158} tick={{ fontSize: 11, fill: C.ink2 }} />
                    <Tooltip content={<TT title={(p) => `${p.name} · ${p.type}`}
                      fmt={(v, n, p) => `Index ${p.index} · ${p.onTarget}% on-target · ${p.comp}% of delivery`} />} />
                    <ReferenceLine x={0} stroke={C.ink} />
                    <Bar dataKey="delta" name="Index" maxBarSize={14}>
                      {segList.map((s, i) => <Cell key={i} fill={s.index >= 100 ? C.t10[0] : C.t10[1]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="xl:col-span-2" title="On-target delivery"
                    subtitle="Verified in-target impressions as a share of measured impressions. The line is the 70% contractual guarantee."
                    sources={src(["Nielsen Digital Ad Ratings", "VideoAmp", "Stellar Data Cloud"],
                      "Segments below 70% trigger a bonus-weight obligation on guaranteed-audience deals.")}>
                <DotPlot
                  items={segList.map((s) => ({
                    label: s.name, value: s.onTarget,
                    color: s.onTarget >= 80 ? C.green : s.onTarget >= 70 ? C.t10[0] : s.onTarget >= 60 ? C.amber : C.red,
                  })).sort((a, b) => b.value - a.value)}
                  lo={35} hi={95} target={70} valueFmt={(v) => `${Math.round(v)}%`} height={340} />
                <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: C.amber }}>
                  <AlertTriangle size={12} /> 3 segments below the 70% guarantee. Bonus weight owed on two of them.
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-4">
              <Card className="xl:col-span-2" title="Cost against outcome"
                    subtitle="Effective CPM to reach the segment against its conversion rate. Bubble size is share of total delivery."
                    sources={src(["Salesforce CRM — net revenue", "Ad server — delivery by segment", "Stellar Data Cloud — attribution"],
                      "Conversion is a 30-day post-exposure attributed action, deduplicated across platforms.")}>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 24 }}>
                    <CartesianGrid stroke={C.rule} />
                    <XAxis type="number" dataKey="ecpm" name="eCPM" domain={[10, 50]} {...axis}
                           tickFormatter={(v) => `$${v}`}
                           label={{ value: "Effective CPM to reach segment", position: "insideBottom", offset: -14, fontSize: 10, fill: C.muted }} />
                    <YAxis type="number" dataKey="cvr" name="Conversion rate" domain={[0, 4.5]} {...axis} width={34}
                           tickFormatter={(v) => `${v}%`} />
                    <ZAxis type="number" dataKey="comp" range={[50, 420]} />
                    <Tooltip content={<TT title={(p) => p.name} fmt={(v, n) => n === "eCPM" ? `$${v}` : `${v}%`} />} />
                    <ReferenceLine x={31} stroke={C.ink} strokeDasharray="3 3" />
                    <ReferenceLine y={1.9} stroke={C.ink} strokeDasharray="3 3" />
                    <Scatter data={segList}>
                      {segList.map((s, i) => <Cell key={i} fill={s.index >= 130 ? C.green : s.index >= 100 ? C.t10[0] : C.t10[2]} fillOpacity={0.72} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>

              <Card className="xl:col-span-3" title="Delivery composition by product"
                    subtitle="Where the impressions actually went, grouped by segment index tier. This is the picture that makes the reallocation obvious."
                    sources={src(["Ad server — delivery by segment", "Nielsen — linear demo composition"],
                      "Linear composition is modeled from Nielsen panel data, not deterministic.")}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={COMPOSITION} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="product" {...axis} width={118} tick={{ fontSize: 11, fill: C.ink2 }} />
                    <Tooltip content={<TT fmt={(v) => `${v}%`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Bar dataKey="t1" stackId="s" name="Index 130+" fill={C.t10[0]} maxBarSize={26} />
                    <Bar dataKey="t2" stackId="s" name="110–130" fill={C.t10[3]} maxBarSize={26} />
                    <Bar dataKey="t3" stackId="s" name="90–110" fill={C.t10[9]} maxBarSize={26} />
                    <Bar dataKey="t4" stackId="s" name="70–90" fill={C.t10[1]} maxBarSize={26} />
                    <Bar dataKey="t5" stackId="s" name="Below 70" fill={C.t10[2]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="mt-4" title="What the segment data says">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.green }}>Best performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Sports Loyalists indexed at 168 with 91% on-target delivery, a 3.6% conversion rate, and 6.9 points
                    of brand lift — the strongest segment on every dimension measured. Auto Intenders and Premium
                    Streamers followed. All three are Stellar first-party segments, which is the argument for pricing
                    them at a premium rather than bundling them into broad demo guarantees.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.red }}>Worst performing</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Run-of-network remnant delivered at 41% on-target — well below the 70% guarantee and carrying a
                    bonus-weight obligation. Value Shoppers, a third-party syndicated segment, indexed at 68 and
                    converted at 0.7%. M18-34 looks cheap at a $24 eCPM and is not: at 54% on-target, the real cost
                    per in-target impression is $44.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.blue }}>The underused one</div>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink2 }}>
                    Sports Loyalists carried 8.2% of delivery while Value Shoppers and remnant together absorbed 7.3%
                    at roughly a third of the index. Reallocating that 7.3% into the top tier is worth about $310K of
                    equivalent working value on identical spend. It requires no new budget and no new inventory —
                    only a change to the plan.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ============ G · CROSS-PLATFORM REACH ============ */}
          {productView === "all" && (
            <div id="sec-g">
              <SectionTitle n="G" title="Cross-platform reach"
                blurb="Deduplicated reach across linear, streaming and digital. This is the number that carries the multiplatform upfront argument." />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card title="Deduplicated reach overlap"
                      subtitle="Unique individuals reached, in millions, across the three platform groups."
                      sources={src(["VideoAmp — cross-platform dedupe", "Nielsen — linear panel", "FreeWheel + GAM — digital device graph"],
                        "Dedupe is modeled at the individual level with a 4.1% margin of error at this sample size.")}>
                  <div className="flex justify-center py-2">
                    <svg viewBox="0 0 360 250" style={{ width: "100%", maxWidth: 400 }} role="img"
                         aria-label="Overlap of linear, streaming and digital reach: linear 38.4 million, streaming 22.1 million, digital 19.6 million, 61.2 million deduplicated total">
                      <circle cx="140" cy="105" r="78" fill={C.t10[0]} fillOpacity="0.42" />
                      <circle cx="214" cy="105" r="60" fill={C.t10[3]} fillOpacity="0.42" />
                      <circle cx="177" cy="163" r="56" fill={C.t10[1]} fillOpacity="0.42" />
                      <text x="96" y="70" fontSize="12" fill={C.ink} fontWeight="600">Linear</text>
                      <text x="96" y="86" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>38.4M</text>
                      <text x="234" y="70" fontSize="12" fill={C.ink} fontWeight="600">Streaming</text>
                      <text x="234" y="86" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>22.1M</text>
                      <text x="150" y="212" fontSize="12" fill={C.ink} fontWeight="600">Digital</text>
                      <text x="150" y="228" fontSize="15" fill={C.ink} fontWeight="700" style={TNUM}>19.6M</text>
                      <text x="177" y="118" fontSize="11" fill={C.ink2} textAnchor="middle" style={TNUM}>3.8M all three</text>
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <KpiTile label="Deduplicated reach" value="61.2M" sub="unique individuals" />
                    <KpiTile label="Incremental from streaming" value="+14.8M" sub="on top of linear" tone="good" />
                    <KpiTile label="Reach lift" value="+38.5%" sub="vs. linear alone" tone="good" />
                  </div>
                </Card>

                <Card title="Reach and frequency curve"
                      subtitle="Cumulative reach at each frequency level. The gap between the two lines is the case for the streaming buy."
                      sources={src(["VideoAmp — cross-platform R/F", "Nielsen — linear R/F"], "Curves are modeled at the campaign-average CPM mix, not per advertiser.")}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={REACH.curve} margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
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
                    At the planned average frequency of 4, streaming and digital add 15.7M individuals linear never reached.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ============ H · RENEWALS & PIPELINE ============ */}
          <div id="sec-h">
            <SectionTitle n="H" title="Renewals and forward pipeline"
              blurb="Campaign performance is the input to renewal probability. That connection is the reason this report exists." />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-2" title="Q4 pipeline by stage"
                    subtitle="Open opportunity value and weighted value at each stage."
                    sources={src(["Salesforce CRM — Opportunity stage, amount, close date"], "Stage probabilities are the org defaults, not seller-adjusted.")}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={PIPELINE.map((p) => ({ ...p, weighted: p.amount * p.prob }))} layout="vertical"
                            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={C.rule} />
                    <XAxis type="number" {...axis} tickFormatter={(v) => usd(v)} />
                    <YAxis type="category" dataKey="stage" {...axis} width={144} tick={{ fontSize: 11, fill: C.ink2 }} />
                    <Tooltip content={<TT fmt={(v, n, p) => `${usdFull(v)} · ${p.count} opportunities`} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} align="right" verticalAlign="top" />
                    <Bar dataKey="amount" name="Open value" fill={C.t10[9]} maxBarSize={16} />
                    <Bar dataKey="weighted" name="Weighted" fill={C.t10[0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <KpiTile label="Total Q4 pipeline" value="$11.4M" sub="on a $6.0M quota" tone="good" />
                  <KpiTile label="Weighted pipeline" value="$4.9M" sub="plus $1.1M closed" />
                </div>
              </Card>

              <Card className="xl:col-span-3" title="Renewal probability against campaign performance"
                    subtitle="Each advertiser's average composite score plotted against modeled renewal probability. The relationship is the argument."
                    sources={src(["Salesforce CRM — renewal history, Opportunity", "This report — composite scores"],
                      "Probability is modeled on three years of renewal outcomes; it is directional, not a commitment.")}>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 24 }}>
                    <CartesianGrid stroke={C.rule} />
                    <XAxis type="number" dataKey="score" name="Avg. composite score" domain={[40, 100]} {...axis}
                           label={{ value: "Average composite score", position: "insideBottom", offset: -14, fontSize: 10, fill: C.muted }} />
                    <YAxis type="number" dataKey="prob" name="Renewal probability" domain={[0, 100]} {...axis} width={38}
                           tickFormatter={(v) => `${v}%`} />
                    <ZAxis type="number" dataKey="rev" range={[60, 420]} />
                    <Tooltip content={<TT title={(p) => p.advertiser} fmt={(v, n) => n === "Renewal probability" ? `${Math.round(v)}%` : Math.round(v)} />} />
                    <ReferenceLine y={50} stroke={C.ink} strokeDasharray="3 3" />
                    <Scatter data={renewalData}>
                      {renewalData.map((d, i) => (
                        <Cell key={i} fill={d.prob >= 70 ? C.green : d.prob >= 45 ? C.t10[0] : C.red} fillOpacity={0.78} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="p-2.5 rounded text-xs" style={{ background: C.redSoft, color: "#8A0011" }}>
                    <div className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={12} /> At risk</div>
                    Vireo Wireless — Device Upgrade OLV returned 42% of goal and the 5G sports buy posted at 98% with
                    3.2% pre-emptions. Verdant Grocery — Weekly Circular is under corridor and carries the open count dispute.
                  </div>
                  <div className="p-2.5 rounded text-xs" style={{ background: C.greenSoft, color: "#194E31" }}>
                    <div className="font-semibold mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> FY27 upfront committed</div>
                    Omega, Inc. $4.1M, Cascade Bank $3.2M, Torchlight Insurance $2.4M, Meridian Foods $1.6M.
                    $11.3M committed before scatter, against a $24M FY27 quota.
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <footer className="pt-4 pb-8 text-xs" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>Stellar Media Ad Sales Analytics · Campaign wrap, FY26 through Q3</span>
              <span>Server of record for billing: Google Ad Manager (digital), Operative.One (linear)</span>
              <span>Linear runs on the broadcast calendar; digital runs on the Gregorian calendar. Quarter boundaries differ by up to six days.</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ---------------- metric dictionary ---------------- */}
      {dict && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setDict(false)}>
          <div className="h-full overflow-y-auto" style={{ width: "min(560px, 100%)", background: C.card }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center gap-2 px-4 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              <BookOpen size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Metric dictionary</h3>
              <button className="ml-auto" onClick={() => setDict(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs mb-3" style={{ color: C.muted }}>
                Every metric in this report appears below with its formula and the system it comes from. If a number is
                not here, it is not in the report.
              </p>
              {DICTIONARY.map((group) => (
                <div key={group.title} className="mb-5">
                  <div className="text-xs font-semibold mb-2" style={{ color: C.ink }}>{group.title}</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: C.muted }}>
                        <th className="text-left font-medium pb-1" style={{ width: "30%" }}>Metric</th>
                        <th className="text-left font-medium pb-1">Definition</th>
                        <th className="text-left font-medium pb-1" style={{ width: "24%" }}>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((r) => (
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

      {/* ---------------- export ---------------- */}
      {exportOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center px-4" style={{ background: "rgba(0,0,0,.32)" }} onClick={() => setExportOpen(false)}>
          <div className="rounded p-4" style={{ background: C.card, width: "min(440px,100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold">Export this report</h3>
              <button className="ml-auto" onClick={() => setExportOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Exports carry the filters currently applied: {productView === "all" ? "all products" : productView === "linear" ? "linear only" : "digital and streaming"},{" "}
              {grain} grain{advertiser ? `, ${advertiser}` : ""}.
            </p>
            <div className="space-y-2">
              {[
                ["Client-ready PDF", "Narrative, charts and annotations. Stellar Media letterhead, no internal quota section."],
                ["Internal PDF", "Everything, including quota, peer ranking and pipeline."],
                ["PNG — current view", "Single image of the section in view."],
                ["Underlying CSV", "Campaign-week fact table, 947 rows, with source-system columns."],
              ].map(([t, d]) => (
                <button key={t} className="w-full text-left px-3 py-2 rounded" style={{ border: `1px solid ${C.rule}` }}>
                  <div className="text-xs font-semibold" style={{ color: C.blue }}>{t}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{d}</div>
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: C.muted }}>
              Scheduled delivery is configured in Salesforce under Reports &rsaquo; Subscriptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
