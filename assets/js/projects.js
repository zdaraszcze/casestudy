/* =============================================================
   CONTENT — edit this file to update the site.
   -------------------------------------------------------------
   SITE      → your name, tagline, contact links.
   PROJECTS  → one object per project. Cards + detail pages are
               generated automatically from this array.

   To add a project: copy an existing object, change the fields,
   drop your files into /case-studies, /prototypes, /images, and
   point the paths at them. Order here = order on the page.
   ============================================================= */

const SITE = {
  // Browser tab title (nothing personal is shown on the page).
  pageTitle: "Selected work",

  // The only intro copy on the page.
  bio: "Engineer and senior product designer, <b>15+ years</b> in complex enterprise software: telecom, fintech, and regulated industries. I design <span class='accent'>AI-driven workflows</span> that close the gap between what systems can do and what people can actually use.",
};

const PROJECTS = [
  {
    id: "dm-for-singleran",
    index: "01",
    title: "D&M for SingleRAN",
    subtitle: "Diagnostics & Maintenance",
    client: "Nokia · SingleRAN",
    year: "Case study",
    role: "UX & Systems Design",
    statusLabel: "Case study + screens",
    oneLiner: "A browser console for a live multi-technology base station.",
    summary: "A browser-based operations console for Nokia SingleRAN base stations. It takes the tangle of a live multi-technology site (system and baseband modules, radio units, antenna lines, and the data streams between them) and renders it as a single, stateful topology that a field engineer at the cabinet and an operator in the NOC can both read at a glance.",
    discipline: ["UX Design", "Systems", "Design System", "Case Study"],
    thumb: "images/thumbs/dm.jpg",
    caseStudy: "case-studies/dm-for-singleran.html",
    prototype: null,
    gallery: [
      { src: "images/ADMIN_HW_viw_v_01.jpg",      cap: "<b>Runtime view</b>: the whole station in one screen: objects, live topology, and a fault log." },
      { src: "images/ADMIN_HW_separate_view_v2.jpg", cap: "<b>Cells view</b>: the signal path from core network to antenna, colour-coded by state." },
      { src: "images/ADMIN_HW_view_elements.jpg", cap: "<b>State matrix</b>: every node type drawn in each of its states: normal, hover, selected, failed, undetected, alarmed." },
      { src: "images/ADMIN_HW_view_elements_1_use_cases.jpg", cap: "<b>The state vocabulary</b>, close up.", half: true },
      { src: "images/ADMIN_COM_wizard.jpg",       cap: "<b>Commissioning wizard</b>: assembling a site, one guided step at a time.", half: true },
      { src: "images/ADMIN_HW_separate_view.jpg", cap: "<b>Bare topology</b>: the connective logic before styling: how everything wires together." },
    ],
  },
  {
    id: "bsu-transparency-register",
    index: "02",
    title: "Transparency Register",
    subtitle: "Case Manager",
    client: "BSU · Compliance",
    year: "Case study",
    role: "UX Design · Prototype",
    statusLabel: "Case study + live prototype",
    oneLiner: "Reconciles a bank’s ownership records against the public register and tracks each discrepancy to resolution.",
    summary: "A case-management workspace that reconciles the bank's own beneficial-ownership records against the public Transparency Register, surfaces exactly what fails to match, and drives each discrepancy to a defensible resolution before the statutory reporting window closes.",
    discipline: ["UX Design", "Prototype", "Compliance", "Case Study"],
    thumb: "images/thumbs/bsu.jpg",
    caseStudy: "case-studies/bsu-transparency-register.html",
    prototype: "prototypes/bsu-transparency-register.html",
    gallery: null,
  },
  {
    id: "onboarding",
    index: "03",
    title: "Digital Assisted Onboarding",
    subtitle: "Private-banking client onboarding",
    client: "BSU · Private Banking",
    year: "Prototype",
    role: "UX Design · Prototype",
    statusLabel: "Case study + live prototype",
    oneLiner: "A guided client-onboarding journey that collapses paper-based KYC into one verified flow, cutting setup from weeks to under 5 days.",
    summary: "A redesigned private-banking onboarding journey that captures client data once and guides it through source-of-wealth, signing, and go-live. It brings four roles into one system (client advisor, prospect, compliance, and formalities), collapses 28 manual formality steps into a single verified action, and adds AI-assisted risk review on the compliance side.",
    discipline: ["UX Design", "Prototype", "FinTech", "KYC/AML"],
    thumb: "images/thumbs/onboarding.jpg",
    caseStudy: "case-studies/onboarding.html",
    prototype: "prototypes/onboarding.html",
    gallery: null,
  },
  {
    id: "graphwalk",
    index: "04",
    title: "GraphWalk",
    subtitle: "Workspace & Virtual Path",
    client: "GraphWalk · Investigations",
    year: "Case study",
    role: "UX Design · Prototype",
    statusLabel: "Case study + live prototype",
    oneLiner: "Redesign of the workspace and the path-authoring flow for a graph-analytics investigation platform.",
    summary: "Two GraphWalk redesigns held together by one principle. The Workspace stopped scaling once investigators kept dozens to hundreds of link charts; the Virtual Path authoring UI asked people to select entities by raw ID. Both are reframed around role-driven views, name-based selection, and validate-before-commit: author with guardrails, not by removing them.",
    discipline: ["UX Design", "Prototype", "Data Platform", "Case Study"],
    thumb: "images/thumbs/graphwalk.jpg",
    caseStudy: "case-studies/graphwalk.html",
    prototype: "prototypes/graphwalk.html",
    gallery: null,
  },
];
