/* Vertex Sovereign Diagnostic - scoring engine (browser port of scoring.py).
   Deterministic. No network, no AI. Exposes window.Scoring = { QUESTIONS, compute }. */
(function () {
  "use strict";

  // ===== 1. QUESTIONNAIRE =================================================
  const QUESTIONS = [
    {id: "first_name", section: "Welcome", type: "text",
     question: `Before we begin — what should we call you?`,
     help: `So your dossier reads as yours. Used once, on the cover.`,
     placeholder: "First name"},

    {id: "trigger", section: "Your situation", type: "single",
     question: `What prompted you to look at this now?`,
     help: `This shapes how we read everything that follows.`,
     options: [
       {value: "banking_issue", label: `A banking or account issue I'm dealing with right now`},
       {value: "liquidity_event", label: `A move, exit, or liquidity event likely within 12 months`},
       {value: "regulatory", label: `A tax, regulatory or political change I'm anticipating`},
       {value: "longterm", label: `Longer-term planning — nothing time-critical`},
       {value: "exploratory", label: `Exploratory — I want to understand my position`},
     ]},

    {id: "horizon", section: "Your situation", type: "single",
     question: `Over what horizon are you likely to act?`,
     options: [
       {value: "0_6", label: `Within 6 months`},
       {value: "6_18", label: `6–18 months`},
       {value: "2y", label: `2+ years`},
       {value: "exploring", label: `Just exploring for now`},
     ]},

    {id: "income_band", section: "Your situation", type: "single",
     question: `Roughly, your annual income that doesn't come from a salary?`,
     help: `Investments, dividends, business profits, rentals, royalties — income other than a regular employment salary. For calibration only; never stored against your name.`,
     options: [
       {value: "150_300", label: `£150k–£300k`},
       {value: "300_750", label: `£300k–£750k`},
       {value: "750_2m", label: `£750k–£2m`},
       {value: "2m", label: `£2m+`},
       {value: "na", label: `Prefer not to say`},
     ]},

    {id: "advisors", section: "Your situation", type: "multi",
     question: `Which professional advisers do you already work with?`,
     help: `Select any that apply — so your report doesn't tell you things you already know.`,
     options: [
       {value: "accountant", label: `Accountant`},
       {value: "tax", label: `Tax adviser`},
       {value: "wealth", label: `Wealth manager`},
       {value: "lawyer", label: `Cross-border lawyer`},
       {value: "none", label: `None yet`},
     ]},

    {id: "us_person", section: "A few key facts", type: "single",
     question: `Are you — or is anyone who ultimately owns or benefits from your assets — subject to US tax (for example, a US citizen or green-card holder)?`,
     help: `We mean US tax exposure of any kind — citizenship, a green card, or another reason the US treats you as taxable. "Ultimately owns or benefits" covers people behind a company or trust, not just the name on the account. It changes more cross-border planning than any other single fact, so we ask early.`,
     options: [
       {value: "yes", label: `Yes`}, {value: "no", label: `No`}, {value: "unsure", label: `Unsure`},
     ]},

    {id: "tax_residency", section: "A few key facts", type: "single",
     question: `How clear-cut is the country where you're tax-resident today?`,
     help: `Tax residence is the country with the main right to tax your worldwide income — not necessarily where you hold a passport or spend the most time. If two countries both claim you, a tax treaty usually has a "tie-breaker" rule that settles which one wins.`,
     options: [
       {value: "clear", label: `A single, clear country of tax residence`},
       {value: "dual", label: `Possibly tax-resident in two countries, relying on a treaty rule to decide which one — and I haven't confirmed it`},
       {value: "claiming", label: `Claiming non-residence, but still spending significant time in a high-tax country`},
       {value: "nomad", label: `Genuinely mobile, with no clear tax residence`},
     ]},

    {id: "exit_tax", section: "A few key facts", type: "single",
     question: `If you left your current country, could that trigger a tax simply for leaving — even on assets you haven't actually sold?`,
     help: `Some countries charge an "exit" or "departure" tax when you stop being resident — and may tax you as if you'd sold your investments on the way out, even though you still hold them (a "deemed disposal"). Pick "Don't know" if you're unsure; it's a common one to be unsure about.`,
     options: [
       {value: "yes", label: `Yes`}, {value: "no", label: `No`}, {value: "dont_know", label: `Don't know`},
     ]},

    {id: "cfc", section: "A few key facts", type: "single",
     question: `Do you control one or more companies based outside your country of residence?`,
     help: `"Control" usually means you own most of it, or otherwise call the shots. This matters because some countries can tax you personally on a foreign company's profits even if you never take the money out.`,
     options: [{value: "yes", label: `Yes`}, {value: "no", label: `No`}]},

    {id: "sanctions", section: "A few key facts", type: "multi",
     question: `Do any of these apply?`,
     help: `Select any — or "None of these." This only affects how account-opening checks are handled, not your score.`,
     options: [
       {value: "pep", label: `A senior political or public role — held by you, or by a close family member or associate`},
       {value: "sanctioned", label: `A citizenship under sanctions or heightened scrutiny`},
       {value: "hard_evidence", label: `Wealth whose origin would be hard to document if a bank asked`},
       {value: "none", label: `None of these`},
     ]},

    {id: "banking_structure", section: "Banking", type: "single",
     question: `How is your banking structured today?`,
     help: `Where your liquidity lives, and how resilient that is.`,
     options: [
       {value: "one_one", label: `One bank, in one country`, score: 10},
       {value: "two_same", label: `Two or more banks, but all in one country`, score: 30},
       {value: "home_plus_one", label: `Home country plus one international relationship`, score: 55},
       {value: "multi", label: `Accounts across three or more independent regions`, score: 85},
     ]},

    {id: "banking_hub", section: "Banking", type: "single",
     question: `Do you hold at least one banking relationship in a stable financial centre outside your home region?`,
     help: `Redundancy, not secrecy — a second banking base that isn't exposed to the same local shock as your home one.`,
     options: [{value: "yes", label: `Yes`}, {value: "no", label: `No / not sure`}]},

    {id: "banking_event", section: "Banking", type: "single",
     question: `In the last 24 months, has any account been restricted, frozen, or closed?`,
     options: [{value: "yes", label: `Yes`}, {value: "no", label: `No`}]},

    {id: "tax_structure", section: "Tax", type: "single",
     question: `Which best describes your tax planning?`,
     help: `We score what's in place — not how you feel about it.`,
     options: [
       {value: "none", label: `No tax planning in place`, score: 15},
       {value: "aware", label: `Aware of my exposure, but nothing structured yet`, score: 35},
       {value: "single", label: `Single-country planning via my accountant (pensions, timing, allowances)`, score: 60},
       {value: "residency", label: `Active, documented planning that uses where I'm tax-resident (e.g. a special tax status or non-dom arrangement)`, score: 78},
       {value: "multi", label: `Tax affairs deliberately arranged across several countries, fully documented and reviewed every year`, score: 90},
     ]},

    {id: "passport_strength", section: "Mobility", type: "single",
     question: `How would you describe your strongest passport?`,
     help: `Mobility is about passport strength, not how many you hold.`,
     options: [
       {value: "tier1", label: `Strong and stable — lets me enter most countries without arranging a visa first`, score: 40},
       {value: "tier2", label: `Good mobility, though not top-tier`, score: 28},
       {value: "limited", label: `Limited mobility`, score: 15},
       {value: "sanctioned", label: `Currently under sanctions or heightened scrutiny`, score: 8},
     ]},

    {id: "second_residency", section: "Mobility", type: "single",
     question: `What is your second-residency position?`,
     options: [
       {value: "none", label: `None, and no active plan`, score: 5},
       {value: "applying", label: `An application in progress`, score: 20},
       {value: "active", label: `An active secondary residency`, score: 35},
       {value: "active_plus", label: `An active secondary residency, plus a fallback I could execute quickly`, score: 50},
     ]},

    {id: "descent", section: "Mobility", type: "single",
     question: `Could you claim another citizenship or residency that you haven't yet — through a parent, grandparent, or marriage?`,
     help: `"By descent" means qualifying through your ancestry — often a parent or grandparent. It's frequently the cheapest option people overlook, because they don't realise they're eligible.`,
     options: [{value: "yes", label: `Yes`}, {value: "no", label: `No`}, {value: "unsure", label: `Unsure`}]},

    {id: "asset_structure", section: "Assets", type: "single",
     question: `How are your main assets held?`,
     options: [
       {value: "personal", label: `All in my personal name, in one jurisdiction`, score: 15},
       {value: "company_same", label: `Through a company, in the same jurisdiction`, score: 40},
       {value: "multi_juris", label: `Spread across two or more jurisdictions`, score: 58},
       {value: "trust", label: `A trust or foundation is in place`, score: 75},
       {value: "multilayer", label: `A multi-layer structure — separate entities to own, to operate, and to protect`, score: 88},
     ]},

    {id: "asset_disclosure", section: "Assets", type: "single",
     question: `Is that structure professionally run, reviewed within the last two years, and correctly declared to every tax authority it answers to?`,
     help: `All three need to be true for a "Yes." A structure that exists only on paper — unmaintained or under-reported — doesn't protect what you think it does. If you're unsure on any part, choose "No."`,
     options: [
       {value: "yes", label: `Yes — run, reviewed and correctly declared`},
       {value: "no", label: `No, or I'm not certain`},
     ]},

    {id: "asset_exposed", section: "Assets", type: "multi",
     question: `What makes up most of what you'd want to protect?`,
     help: `Select any that apply.`,
     options: [
       {value: "operating_business", label: `An operating business`},
       {value: "liquid", label: `Liquid investments / cash`},
       {value: "real_estate", label: `Real estate`},
       {value: "ip", label: `Intellectual property / royalties`},
       {value: "other", label: `Other`},
     ]},

    {id: "estate_plan", section: "Succession & Family", type: "single",
     question: `What's in place for succession?`,
     help: `"Succession" here means what happens to your wealth — who inherits, how, and the tax on it — when you die. A cross-border plan accounts for every country your assets and family touch.`,
     options: [
       {value: "none", label: `No will or estate plan`, score: 15},
       {value: "one_juris", label: `A will covering one jurisdiction only`, score: 40},
       {value: "cross_old", label: `An estate plan covering more than one country, but not reviewed recently`, score: 62},
       {value: "cross_current", label: `A current cross-border succession plan covering all relevant jurisdictions`, score: 88},
     ]},

    {id: "dependents", section: "Succession & Family", type: "multi",
     question: `Who depends on your position?`,
     help: `Select any that apply.`,
     options: [
       {value: "spouse", label: `A spouse or partner`},
       {value: "children", label: `Children`},
       {value: "other", label: `Other dependents`},
       {value: "none", label: `No dependents`},
     ]},

    {id: "capital_borrowing", section: "Capital Access", type: "single",
     question: `What borrowing can you tap that's secured against your assets and works outside your home country?`,
     help: `"Asset-backed" means a loan secured against things you own (investments, property) rather than your income. "Portable" means it isn't tied to your home country — you could draw on it even if you moved or your home banks pulled back.`,
     options: [
       {value: "none", label: `None`, score: 15},
       {value: "domestic", label: `Domestic mortgage / domestic credit only`, score: 35},
       {value: "lombard", label: `A loan secured against my investment portfolio (a "Lombard" or securities-backed facility)`, score: 62},
       {value: "multi", label: `Credit lines in more than one country, plus private-bank lending`, score: 88},
     ]},

    {id: "digital_gate", section: "Digital", type: "single",
     question: `Do digital assets — such as cryptocurrency — feature in your wealth?`,
     options: [{value: "yes", label: `Yes`}, {value: "no", label: `No`}]},

    {id: "digital_holdings", section: "Digital", type: "single",
     show_if: {q: "digital_gate", eq: "yes"},
     question: `How are those digital assets held?`,
     help: `Whether a bank will accept these turns on a "source-of-wealth" trail — clear, lawful records showing where the holdings came from and that tax on them is up to date. The options below describe how complete that paper trail is.`,
     options: [
       {value: "restricted", label: `Held, but a bank has already restricted, frozen, or refused them`, score: 15},
       {value: "no_sow", label: `Held, with no source-of-wealth records`, score: 20},
       {value: "partial", label: `Held, with partial source-of-wealth records`, score: 48},
       {value: "full", label: `Complete, verifiable source-of-wealth records, tax reporting up to date`, score: 78},
       {value: "integrated", label: `A fully integrated, compliant, bankable digital-asset strategy`, score: 90},
     ]},
  ];

  // ===== 2. DIMENSIONS / WEIGHTS / BANDS ==================================
  const DIMENSION_NAMES = {
    mobility: "Mobility & Identity", banking: "Banking Survivability", asset: "Asset Protection",
    tax: "Tax Efficiency", succession: "Succession & Family", capital: "Capital Access",
    digital: "Digital Sovereignty",
  };
  const DIMENSION_ORDER = ["mobility", "banking", "asset", "tax", "succession", "capital", "digital"];
  const BASE_WEIGHTS = {mobility: .18, banking: .18, asset: .18, tax: .18, succession: .10, capital: .08, digital: .10};

  function dimensionBand(s) {
    if (s <= 35) return ["critical", "Critical", "#C0392B"];
    if (s <= 55) return ["exposed", "Exposed", "#D4912B"];
    if (s <= 75) return ["developing", "Developing", "#3C6E9E"];
    return ["sovereign", "Sovereign", "#3F7A52"];
  }
  function overallBand(s) {
    if (s <= 35) return "Critical Risk";
    if (s <= 55) return "High Exposure";
    if (s <= 75) return "Developing";
    return "Sovereign";
  }

  // ===== 3. REPORT COPY ===================================================
  const SUMMARIES = {
    mobility: {critical: `Your life is anchored to a single country, with no real alternative if access changes.`, exposed: `You've started to diversify, but no genuine second option is yet in place.`, developing: `A reasonable mobility base exists, with room to add a backup.`, sovereign: `Your identity and mobility are well-diversified, with a documented fallback.`},
    banking: {critical: `Your cash depends on a single bank that could restrict it at short notice.`, exposed: `You hold some international banking, but it's still concentrated in too few places.`, developing: `Your banking spans several regions, approaching a genuine backup.`, sovereign: `Your cash is spread across genuinely independent banking routes.`},
    asset: {critical: `On what you told us, your assets sit largely exposed in your personal name.`, exposed: `Some structuring exists, but having it all in one place still leaves a clear line of exposure.`, developing: `Your assets are spread and partly structured, with protection gaps remaining.`, sovereign: `Your assets are held through layered, maintained structures across countries.`},
    tax: {critical: `You carry tax exposure with little or no structure around it.`, exposed: `Your tax position is only lightly managed.`, developing: `Sensible single-country planning is in place, with cross-border optimisation still available.`, sovereign: `Your footprint is clean, documented and deliberately optimised.`},
    succession: {critical: `There is little or nothing in place to govern what happens to your wealth and family.`, exposed: `Your succession planning covers one country at most.`, developing: `A cross-border plan exists but may be out of date.`, sovereign: `Your succession is planned across every relevant country and kept current.`},
    capital: {critical: `You have little borrowing you could draw on from outside your home country.`, exposed: `Your credit access is largely domestic.`, developing: `You hold some portable, asset-backed borrowing.`, sovereign: `You hold credit and liquidity you can reach across several countries.`},
    digital: {critical: `Your digital assets are, on what you told us, difficult to bank as they stand.`, exposed: `Your digital holdings carry risk on two fronts: proving their origin, and getting a bank to accept them.`, developing: `Your digital-asset records are partial but improving.`, sovereign: `Your digital assets are documented, compliant and bankable.`},
  };

  const ANALYSIS = {
    mobility: {
      critical: `On what you've described, your ability to live, bank and travel rests on a single government's continued goodwill, with no real alternative in place. This is the foundation everything else sits on — and right now it has no backup.`,
      exposed: `You've begun to diversify, but a second pathway that's still in progress isn't a second pathway yet. Until it's actually in place, your choices exist on paper, not in practice.`,
      developing: `You hold more than one credible base, so your whole position no longer rests on a single point. The remaining work is depth — making the second base documented and usable at short notice.`,
      sovereign: `Multiple strong options, a maintained secondary residency, and a fallback. The priority here is maintenance and review as programmes shift.`},
    banking: {
      critical: `Access to your own cash depends on too few banks in too few places. Banks can restrict or close accounts on their own and at short notice — and with no second route to your money, one such decision can leave you locked out of it.`,
      exposed: `You've moved beyond a single bank, which is the right direction — but one home bank plus one overseas account still leaves your money sitting with very few institutions.`,
      developing: `Your banking spans several regions, which makes it far harder to cut off all at once. What's left is placing it deliberately — across regions that are genuinely independent of each other, ideally including one stable neutral centre.`,
      sovereign: `Your capital is spread across genuinely independent banking routes. The ongoing work is simply keeping each relationship active and compliant as reporting standards change.`},
    asset: {
      critical: `Holding assets in your personal name in one jurisdiction is the most exposed configuration: everything is reachable through one legal system, in one name. Structuring here is about lawful separation between owner and asset, not secrecy.`,
      exposed: `You've introduced some structure, but having it all in one jurisdiction still leaves a clear line of exposure. Half-built protection often feels safer than it is, and tends not to hold under pressure.`,
      developing: `Your assets are spread and partly structured — a solid base. The gaps are in how the layers fit together: whether what you own, how you operate, and what protects it are genuinely held apart.`,
      sovereign: `Your assets sit within layered, maintained structures. A well-engineered position whose value is preserved through disciplined administration.`},
    tax: {
      critical: `With little structure around your tax exposure, choices that are open today tend to close over time. The goal is legitimate, well-documented optimisation — not aggressive schemes that invite scrutiny.`,
      exposed: `Your position is only lightly managed. Clarity on where you actually stand is the necessary first step before any optimisation.`,
      developing: `Sensible single-country planning is a constructive position. The opportunity is moving from local steps to a coherent, documented cross-border strategy where that genuinely fits your life.`,
      sovereign: `A clean, documented footprint that withstands scrutiny. The work from here is vigilance as transparency standards tighten.`},
    succession: {
      critical: `With no will or estate plan, what happens to your wealth and family defaults to whichever country's rules apply — rarely the ones you'd choose, and at the worst possible moment.`,
      exposed: `A single-country will leaves cross-border assets and family exposed to conflicting rules. For a globally connected family this gap does disproportionate damage when it surfaces.`,
      developing: `A cross-border plan exists, which puts you ahead of most — but an unreviewed plan can quietly fall out of step with both your life and the law.`,
      sovereign: `A current, cross-border succession plan is exactly the right posture. The task is periodic review as family and countries change.`},
    capital: {
      critical: `With borrowing tied to your home country, wealth you can't draw on from elsewhere may be out of reach exactly when you need it. Portable credit is the quiet infrastructure that turns assets into options.`,
      exposed: `Largely domestic access narrows your ability to act across borders — to seize an opportunity, bridge liquidity, or avoid a forced sale. Parallel access takes time, which is why it starts early.`,
      developing: `You hold some portable, asset-backed borrowing. The path forward is genuinely jurisdiction-independent facilities.`,
      sovereign: `Credit and cash you can reach across countries turn wealth that would otherwise sit still into something you can act on. From here, the job is simply keeping each facility in good standing.`},
    digital: {
      critical: `Holdings that have already been restricted or refused signal a gap between what you hold and what the financial system will accept. The issue is rarely the asset — it's the documented, lawful trail connecting it to you.`,
      exposed: `Your digital assets carry a real risk on two fronts: proving where the wealth came from, and getting a bank to accept them. Closing that gap is a documentation job — evidencing lawful origin and up-to-date reporting — not a trading one.`,
      developing: `A partial source-of-wealth record is in place. The remaining work is completeness, so digital assets can move into the regulated system without friction.`,
      sovereign: `Documented, compliant and bankable, integrated into your broader structure — the position that lets digital wealth function as freely as traditional capital.`},
  };

  const TAKEAWAY = {
    mobility: `The usual first move is securing one genuinely independent second residency before adding anything more elaborate — so you always have somewhere to stand.`,
    banking: `The first move is almost always a second, genuinely independent banking relationship in a stable centre — established before you need it, not during a crisis.`,
    asset: `The starting point is separating ownership from operation for your single most valuable asset, rather than layering everything at once.`,
    tax: `The first step is establishing — on paper — exactly where you are tax-resident and what that costs you today, before optimising anything.`,
    succession: `The first move is a will that actually accounts for every country your assets and family touch.`,
    capital: `The starting point is one portable, asset-backed facility that doesn't depend on your home-country standing.`,
    digital: `The first move is a complete source-of-wealth file evidencing lawful origin and current tax reporting — the thing banks actually ask for.`,
  };

  const STAKES = {
    mobility: `Illustrative — when access to a single base is disrupted, arranging an alternative under time pressure is slower and narrower than arranging it in advance.`,
    banking: `Illustrative — when an account is restricted during a bank review, resolution typically runs weeks to months, with the balance out of reach throughout.`,
    asset: `Illustrative — once a claim or dispute attaches to an asset held in your own name, restructuring it afterwards is far harder than separating it beforehand.`,
    tax: `Illustrative — an unmanaged residency position can crystallise a tax bill on a date you didn't choose, with little room to act after the fact.`,
    succession: `Illustrative — without a cross-border plan, an estate can be frozen across countries while conflicting default rules are resolved.`,
    capital: `Illustrative — in a domestic cash squeeze, the absence of portable credit can force a sale that better infrastructure would have avoided.`,
    digital: `Illustrative — digital holdings without a documented origin trail can be declined or frozen by the regulated system when you try to use them.`,
  };

  const RISK_FLAGS = {
    mobility: ["Single-country dependency", `Your right to live, bank and travel currently rests on one government, with no real alternative in place. If that single point gives way, everything above it is exposed.`],
    banking: ["Concentrated banking risk", `Access to your own money depends on too few banks in too few places. One decision you don't control could cut you off from it, with no second route standing by.`],
    asset: ["Unprotected asset exposure", `Significant assets are reachable through a single legal system in your own name, without deliberate, lawful separation between owner and asset.`],
    tax: ["Unmanaged tax exposure", `A lightly-managed position only gets harder to fix as rules tighten and reporting gets stricter — and the legitimate options open to you shrink the longer it's left.`],
    succession: ["Succession gap", `With little in place, what happens to your wealth and family would default to rules you didn't choose, at the worst possible time.`],
    capital: ["No portable capital access", `With borrowing confined to home, your assets can't easily be drawn on across borders when it matters most.`],
    digital: ["Unbankable digital assets", `Digital holdings without a documented, lawful origin trail are increasingly declined or frozen by the regulated system.`],
  };

  const EXEC_SUMMARY = {
    "Critical Risk": `your diagnostic places you in the **Critical Risk** band. The core pillars of your position — where you can live, where your cash sits, and how your assets are held — are concentrated in a way that leaves little room for error. That's not unusual for people whose structure never caught up with their success, and it's exactly the position where acting early changes the outcome most.`,
    "High Exposure": `your diagnostic places you in the **High Exposure** band. You've built something worth protecting, but the structure beneath it hasn't yet been engineered to match. Several pillars remain concentrated or undocumented — clear gaps between the life you have and the resilience it should have.`,
    "Developing": `your diagnostic places you in the **Developing** band. You've taken real steps toward a resilient position, and parts of your architecture work as intended. What remain are specific, identifiable gaps — places where partial coverage can create a false sense of security.`,
    "Sovereign": `your diagnostic places you in the **Sovereign** band. Your position reflects deliberate, mature architecture across most pillars. This configuration is uncommon. The priority now is vigilance — preserving what you've built as the transparency and regulatory landscape tightens.`,
  };

  const POSITIONING = `For reference, this scale runs from a single-jurisdiction starting point at the lower end to a mature, multi-country position at the upper end. Your score reflects where your current architecture sits on that range — not a judgement of you, but of the structure around you.`;

  const METHODOLOGY = `This assessment points you in a direction; it doesn't hand you a regulated rating or a final number. It's based solely on the answers you gave and built on the Vertex diagnostic framework — the same structure our strategists use in paid engagements, applied here to your own answers. Read it as a structured second opinion, not a final answer — directional by design, so you can see where you stand before deciding whether the detail is worth a closer look.`;

  const DISCLAIMER = `This diagnostic is a general educational assessment based solely on the answers you provided. It is not legal, tax, financial, or investment advice, and is not tailored to your jurisdiction or personal circumstances. Your Sovereign Score is produced by a proprietary scoring model — not a regulated or independently validated measure. Take no action without advice from an appropriately qualified, licensed professional in the relevant jurisdiction. Vertex Global Access coordinates advisory services and does not itself provide regulated legal or tax advice.`;

  // Tier 2 engagement terms. PROVISIONAL — confirm fee + credit with the client.
  const TIER2_PRICE = "£5,000";
  const TIER2_CREDIT = "credited in full toward a full engagement";
  const ENGAGEMENT = {
    who: `A Vertex strategist who works in cross-border tax and structuring — not a salesperson.`,
    format: `A private, 90-minute working session, with this diagnostic in hand.`,
    deliverable: `You leave with a written, dated, sequenced plan — one you can act on, or hand to the advisers you already have.`,
    investment: TIER2_CREDIT ? (TIER2_PRICE + " — " + TIER2_CREDIT + ".") : (TIER2_PRICE + "."),
    reassurance: `And if we don't believe there's enough here to be worth your time, we'll tell you on the call.`,
    price_anchor: `Illustrative — getting the order of these moves wrong around a major event is rarely a ` + TIER2_PRICE + `-sized question.`,
    bridge_line: `You've already done the diagnosis. The call is where it becomes a decision.`,
  };

  const OPEN_QUESTIONS_LEDE = `Three questions your answers raised that a form can't responsibly settle — because each turns on detail only a conversation surfaces. These aren't gaps in the report. They're the specific decisions where getting it right is worth far more than getting it fast — and they're the agenda for a strategy call: a working session against your position, not a sales script.`;

  // ===== 4. HELPERS ======================================================
  function optScore(qid, value) {
    for (const q of QUESTIONS) if (q.id === qid && q.options)
      for (const o of q.options) if (o.value === value) return o.score || 0;
    return 0;
  }
  function has(a, qid) { const vals = [].slice.call(arguments, 2); return vals.indexOf(a[qid]) >= 0; }
  function multiHas(a, qid, val) { return (a[qid] || []).indexOf(val) >= 0; }

  // ===== 5. SCREENING FLAGS ==============================================
  function screeningFlags(a) {
    const flags = [];
    if (has(a, "us_person", "yes", "unsure"))
      flags.push({title: "US tax exposure", severity: "High", magnitude: `Reshapes most cross-border structuring and carries heavy reporting obligations.`, note: `A US connection changes which structures help and which actively backfire. This is the first thing a strategist would pressure-test — and it caps how 'clean' any tax verdict here can be.`});
    if (has(a, "tax_residency", "dual", "claiming"))
      flags.push({title: "Unconfirmed / contested tax residency", severity: "Medium-High", magnitude: `Where you're tax-resident drives almost every other number in this report.`, note: `An unconfirmed or contested residency position is the kind of thing that turns a borderline call over where you belong into an expensive dispute. It should be settled before anything is built on top of it.`});
    if (has(a, "exit_tax", "yes", "dont_know"))
      flags.push({title: "Possible tax on leaving your country", severity: "High · time-sensitive", magnitude: `Often decided by steps taken before you go, not after.`, note: `If a move could trigger a tax simply for leaving, the order and timing around your departure can be the difference between two very different bills. This is the most time-pressured item in your diagnostic.`});
    if (has(a, "cfc", "yes"))
      flags.push({title: "Foreign company you control", severity: "Medium-High", magnitude: `A foreign company's profits can be taxed on you personally, even if you take nothing out.`, note: `Controlling a company outside your country of residence can create a tax exposure that doesn't show up in your bank balance. Worth reviewing before it compounds.`});
    if (multiHas(a, "sanctions", "sanctioned") || multiHas(a, "sanctions", "pep") || multiHas(a, "sanctions", "hard_evidence"))
      flags.push({title: "Account-opening sensitivity", severity: "High for banking", magnitude: `Directly affects whether new banking and structures can be opened at all.`, note: `A senior public role, a sensitive citizenship, or wealth that's hard to document all raise the bar when opening accounts. This is material for the banking and asset work, and is best handled deliberately.`});
    return flags;
  }

  // ===== 6. INTERACTION INSIGHTS (priority-sorted) =======================
  function interactions(a) {
    const out = [];
    const add = (p, title, body) => out.push([p, title, body]);

    if (has(a, "asset_structure", "personal", "company_same") && (has(a, "trigger", "liquidity_event") || has(a, "horizon", "0_6", "6_18")))
      add(10, `Same two moves. Two very different outcomes. The difference is the order.`, `You hold your assets in a single name or domestic company, and a sale, exit or other liquidity event is on the horizon. Done in the order that feels natural, restructuring after the sale can lock in exposure the same restructuring beforehand could often legitimately reduce. Once the deal completes, that window is usually shut — and once it's shut, it doesn't reopen.`);
    if (has(a, "banking_event", "yes") && has(a, "banking_structure", "one_one", "two_same"))
      add(8, `This isn't hypothetical for you — it already happened`, `You told us an account was restricted, frozen or closed in the last two years, and your banking is still concentrated in one place. The warning has already fired once, and the structure that allowed it hasn't changed. The question isn't whether it could happen again — it's whether you'd have a second route to your money the next time it does.`);
    if (has(a, "exit_tax", "yes", "dont_know") && has(a, "horizon", "0_6", "6_18"))
      add(15, `Your timeline is the variable doing the most work`, `You may trigger a tax simply for leaving, and you're likely to move within the year. These outcomes are often set by steps taken before departure rather than after — so the date you move can quietly become the line between two very different bills. Of everything here, this is the one most sensitive to timing.`);
    if (has(a, "us_person", "yes", "unsure") && has(a, "asset_structure", "trust", "multilayer"))
      add(20, `A structure that looks optimised on paper, and may not be`, `You have US tax exposure (or you're unsure), and you hold a trust or layered structure. People with a US connection inside non-US structures can face look-through and reporting treatment that quietly undoes the protection the structure was built for — while adding a heavy compliance burden. This is precisely the combination that reads as 'sorted' and frequently isn't.`);
    if (multiHas(a, "asset_exposed", "operating_business") && has(a, "estate_plan", "none", "one_juris"))
      add(24, `The engine that funds everything has no plan for what happens to it`, `Your operating business is central to what you'd protect, and your succession plan doesn't yet cover it properly. A business is the hardest asset to pass on cleanly — valuation, control and tax collide at once — and with nothing current in place, that collision plays out on default rules, at the worst possible time, for the people who depend on it.`);
    if (has(a, "us_person", "yes", "unsure") && has(a, "tax_structure", "residency", "multi"))
      add(28, `Your tax plan may rest on an assumption the US overrides`, `You have active, documented tax planning — and US tax exposure. US rules can sit on top of an otherwise well-built plan, taxing on citizenship rather than residence and treating some structures very differently from how your home country does. The risk here isn't that you've done nothing; it's that what you've done may not account for the one factor that overrides the rest.`);
    if (has(a, "cfc", "yes") && has(a, "tax_structure", "none", "aware"))
      add(30, `A company you control may be taxing you invisibly`, `You control a company outside your country of residence, with no structured tax planning around it. Some countries can tax that company's profits on you personally — whether or not you've taken the money out — which means an exposure you can't see by looking at your bank balance.`);
    if (has(a, "asset_structure", "multi_juris", "trust", "multilayer") && has(a, "second_residency", "none", "applying") && has(a, "passport_strength", "tier2", "limited", "sanctioned"))
      add(34, `Your money is more global than you are`, `You've structured your assets across borders, but your own mobility — passport and residency — hasn't kept pace. It's a quietly common imbalance: capital that can move freely, held by a person who can't. If access to your home base ever changed, the structure protecting your wealth wouldn't help you stand anywhere else.`);
    if (has(a, "tax_residency", "dual", "claiming") && has(a, "second_residency", "none"))
      add(36, `You have a residency question and no anchor to answer it with`, `Where you're tax-resident is unconfirmed or contested, yet you hold no second residency as a clean alternative. That pairing is what turns a borderline call into a problem: without a credible base to point to, you have little leverage if an authority challenges where you really belong.`);
    if (multiHas(a, "asset_exposed", "liquid") && has(a, "asset_structure", "personal"))
      add(40, `Your most reachable wealth sits in your most exposed place`, `A large share of what you'd want to protect is liquid — and it's held in your personal name. Liquid assets are the easiest for a claim, a dispute or an authority to reach, and personal ownership puts the least standing between you and them. It's the combination that's quickest to address and most exposed until you do.`);
    if (multiHas(a, "asset_exposed", "real_estate") && has(a, "asset_structure", "personal", "company_same"))
      add(44, `The one asset you can't move is in the place you're most exposed`, `Property makes up much of what you'd protect, and your assets sit in a single jurisdiction. Real estate is the least portable thing you own — you can't restructure it at the last minute the way you can liquid assets — which is exactly why getting its ownership right early matters more than for anything else.`);
    if (has(a, "income_band", "750_2m", "2m") && has(a, "asset_structure", "personal"))
      add(48, `Your widest gap scales with your success`, `At your income scale, holding assets in your personal name is the single widest opening in your position — and it isn't an abstract risk: the larger your wealth, the more sits exposed. It's usually the first thing addressed, precisely because the cost of leaving it grows with everything you build.`);
    if (has(a, "digital_gate", "yes") && has(a, "digital_holdings", "restricted", "no_sow") && has(a, "banking_structure", "one_one", "two_same"))
      add(52, `Two answers that compound into one risk`, `You hold digital assets without clear records of where the wealth came from, and your banking sits concentrated in one place. The risk isn't either fact alone — it's that a single bank review can freeze the one route you depend on, while under-documented assets make it harder to reopen. Concentration plus undocumented origin is the exact combination banks act on.`);
    if ((multiHas(a, "sanctions", "pep") || multiHas(a, "sanctions", "sanctioned") || multiHas(a, "sanctions", "hard_evidence")) && has(a, "banking_structure", "one_one", "two_same"))
      add(56, `The hardest time to open new banking is the moment you suddenly need it`, `Your profile raises the bar at account-opening, and your banking is concentrated in one place. New relationships take longest to establish for exactly the profiles that most need a backup — so the second route is best built deliberately, in calm conditions, rather than under pressure when the first one closes.`);
    if ((multiHas(a, "dependents", "children") || multiHas(a, "dependents", "spouse")) && has(a, "estate_plan", "none"))
      add(60, `The exposure that surfaces at the worst possible time`, `You have dependents and no estate plan. For a cross-border family this is the gap that does the most damage when it surfaces — because it surfaces under whichever country's default rules apply, rarely the ones you'd have chosen, and exactly when no one can act.`);
    if (has(a, "tax_residency", "nomad") && !has(a, "income_band", "na"))
      add(64, `'Nowhere' is not as safe as it feels`, `Being genuinely mobile with no clear tax residence can feel like freedom, but it can be the most contestable position of all — several countries can each make a claim, and 'nowhere' is rarely a defence. At your income level this is worth resolving on purpose rather than leaving ambiguous.`);
    if (has(a, "descent", "yes") && has(a, "second_residency", "none", "applying"))
      add(68, `You may already be entitled to the thing you're missing`, `You flagged possible eligibility for another citizenship or residency by descent or marriage — and you have no second base in place. That's often the cheapest optionality available to anyone: a right you may already hold, simply unclaimed. It's usually the first thing worth checking, because it can make the expensive routes unnecessary.`);

    out.sort((x, y) => x[0] - y[0]);
    return out.map(t => ({title: t[1], body: t[2]}));
  }

  // ===== 7. PATTERN NOTE =================================================
  function patternNote(a) {
    const singleJuris = has(a, "asset_structure", "personal", "company_same");
    const domesticBank = has(a, "banking_structure", "one_one", "two_same", "home_plus_one");
    const noSecond = has(a, "second_residency", "none", "applying");
    if (singleJuris && noSecond && has(a, "tax_structure", "single", "aware", "none"))
      return `We see this configuration constantly: a successful operator whose business, banking, assets and life all sit in one country, with tax handled competently but locally. It's what success looks like before anyone has had reason to rebuild the structure. The work, when it comes, usually comes down to three decisions taken in the right order: a second place to stand, a second place to bank, and separating what you own from where you operate.`;
    if (has(a, "asset_structure", "trust", "multilayer") && domesticBank)
      return `This is a familiar shape too: real structuring on the asset side, but the banking and mobility layers haven't caught up with it. Sophisticated ownership sitting on top of a concentrated base is more common than people expect — and the fix is usually rebalancing, not rebuilding.`;
    if (has(a, "trigger", "liquidity_event") || has(a, "horizon", "0_6", "6_18"))
      return `We see a lot of positions like yours right before an event. The instinct is to optimise everything at once; in practice it usually comes down to getting two or three specific decisions in the right sequence before the event fixes them in place.`;
    return `Positions like yours tend to come down to a small number of decisions taken in the right order, rather than a wholesale rebuild. The value is in identifying which two or three, and sequencing them.`;
  }

  // ===== 8. OPEN QUESTIONS ===============================================
  function openQuestions(a) {
    const q = [];
    if (has(a, "us_person", "yes", "unsure")) q.push(`Exactly how your US tax exposure reshapes the recommended structure — it often changes the answer entirely.`);
    if (has(a, "exit_tax", "yes", "dont_know")) q.push(`Whether your planned move triggers a tax on leaving, and the specific steps before departure that change the outcome.`);
    if (has(a, "asset_structure", "personal", "company_same") && (has(a, "trigger", "liquidity_event") || has(a, "horizon", "0_6", "6_18"))) q.push(`Whether to restructure before or after your liquidity event — and what that ordering is worth in your specific case.`);
    if (has(a, "cfc", "yes")) q.push(`Whether your foreign company creates a personal tax you can't see in your accounts, and how to contain it.`);
    const generic = [
      `Which one of these areas to address first, given your timeline and what's actually achievable.`,
      `Whether the structures you already have still do what they were set up to do — or have quietly drifted out of step with your life and the rules.`,
      `What a realistic, sequenced 12-month plan looks like for a position like yours.`,
    ];
    for (const g of generic) { if (q.length >= 3) break; q.push(g); }
    return q.slice(0, 3);
  }

  // ===== 9. CTA ==========================================================
  function cta(band) {
    if (band === "Critical Risk" || band === "High Exposure")
      return {kind: "rescue", label: `Request a private strategy session`, lede: `On the call we do one thing: put your two or three moves in the right order — before a completion date, a move, or a bank review puts them in the wrong one for you.`};
    if (band === "Developing")
      return {kind: "plan", label: `Request a private strategy session`, lede: `You don't need a rebuild — you need the right two or three gaps closed in the right order. The call turns this diagnostic into a dated, sequenced plan you can hand to the advisers you already have.`};
    return {kind: "stewardship", label: `Speak with us about ongoing stewardship`, lede: `You may not need a full engagement. At your level the value is a periodic, expert pressure-test as rules shift — and we'll tell you plainly if there's nothing to do.`};
  }

  // ===== 10. COMPUTE =====================================================
  function compute(answers) {
    const a = answers || {};
    const raw = {};
    raw.banking = optScore("banking_structure", a.banking_structure);
    if (has(a, "banking_hub", "yes")) raw.banking = Math.min(100, raw.banking + 5);
    raw.tax = optScore("tax_structure", a.tax_structure);
    let mob = optScore("passport_strength", a.passport_strength) + optScore("second_residency", a.second_residency);
    raw.mobility = Math.max(0, Math.min(100, mob));
    raw.asset = optScore("asset_structure", a.asset_structure);
    if (!has(a, "asset_disclosure", "yes")) raw.asset = Math.min(raw.asset, 55);
    raw.succession = optScore("estate_plan", a.estate_plan);
    raw.capital = optScore("capital_borrowing", a.capital_borrowing);
    const digitalApplies = has(a, "digital_gate", "yes");
    if (digitalApplies) raw.digital = optScore("digital_holdings", a.digital_holdings);

    let taxCapped = false;
    if (has(a, "us_person", "yes", "unsure") || has(a, "exit_tax", "yes", "dont_know") || has(a, "cfc", "yes")) {
      if (raw.tax > 70) raw.tax = 70;
      taxCapped = true;
    }

    const active = DIMENSION_ORDER.filter(d => d in raw);
    const wsum = active.reduce((s, d) => s + BASE_WEIGHTS[d], 0);
    const weights = {}; active.forEach(d => weights[d] = BASE_WEIGHTS[d] / wsum);
    const sovereignScore = Math.round(active.reduce((s, d) => s + raw[d] * weights[d], 0));
    const band = overallBand(sovereignScore);

    const scores = {};
    active.forEach(d => {
      const s = raw[d];
      const [bkey, blabel, color] = dimensionBand(s);
      const entry = {name: DIMENSION_NAMES[d], score: s, band: bkey, band_label: blabel, color: color,
        summary: SUMMARIES[d][bkey], analysis: ANALYSIS[d][bkey]};
      if (bkey !== "sovereign") entry.takeaway = TAKEAWAY[d];
      if (bkey === "critical" || bkey === "exposed") entry.stakes = STAKES[d];
      if (d === "tax" && taxCapped)
        entry.analysis += ` Note: because of a screening flag you raised (US tax exposure, a tax on leaving, or a foreign company you control), this rating is held back deliberately — a clean-looking tax position can't be confirmed until that flag is resolved.`;
      scores[d] = entry;
    });

    const excluded = DIMENSION_ORDER.filter(d => !(d in raw)).map(d => DIMENSION_NAMES[d]);

    const riskDims = active.filter(d => raw[d] <= 55).sort((x, y) => (raw[x] - raw[y]) || (BASE_WEIGHTS[y] - BASE_WEIGHTS[x]));
    const topRisks = riskDims.slice(0, 3).map(d => {
      const [title, why] = RISK_FLAGS[d];
      const color = dimensionBand(raw[d])[2];
      return {dimension: DIMENSION_NAMES[d], title: title, why: why, score: raw[d], color: color};
    });
    const nGaps = riskDims.length;

    const flags = screeningFlags(a);
    const ints = interactions(a).slice(0, 4);
    const pattern = patternNote(a);
    const openQs = openQuestions(a);
    const ctaObj = cta(band);

    const firstName = ((a.first_name || "").trim()) || "there";
    const nameCap = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    const triggerLine = {
      banking_issue: ` You came in dealing with a live banking issue — exactly the kind of pressure this is meant to get ahead of.`,
      liquidity_event: ` You told us a liquidity event is likely within the year — precisely the window in which this matters most.`,
      regulatory: ` You're anticipating a regulatory or political change — so the question is less 'where do you stand' than 'how fast can you move.'`,
      longterm: ` You're planning for the long term, with no immediate pressure — the best possible time to do this work calmly.`,
      exploratory: ` You're here to understand your position — so we've kept this diagnostic, not directive.`,
    }[a.trigger] || "";

    let execSummary;
    if (ints.length)
      execSummary = `${nameCap}, two of your answers, taken together, point to something most people in your position never see until it costs them — we'll come to it below. First, the shape of the whole: ${EXEC_SUMMARY[band]}${triggerLine}`;
    else
      execSummary = `${nameCap}, ${EXEC_SUMMARY[band]}${triggerLine}`;

    const oneLine = {
      "Critical Risk": `Your global architecture carries structural exposure at its foundations — the layer worth addressing first.`,
      "High Exposure": `Your global architecture has significant gaps that leave you materially exposed.`,
      "Developing": `Your global architecture is partly built, with specific gaps still to close.`,
      "Sovereign": `Your global architecture is mature and well-engineered across the board.`,
    }[band];

    let mid;
    if (nGaps) mid = `On your answers, it flagged ${nGaps} area${nGaps === 1 ? "" : "s"} worth attention — and connected a couple you might not have linked yourself.`;
    else mid = `On your answers, it found little to flag — which is itself worth knowing.`;
    const strategicNote = `This diagnostic was built to do two things: show you where you stand, and surface something you hadn't already connected. ${mid} What it can't do — and shouldn't pretend to — is decide the order you act in. That turns on detail no form should fill in: your real timeline, the actual numbers, which countries are genuinely on the table for you. That's the conversation the call is for.`;

    return {
      first_name: firstName, sovereign_score: sovereignScore, overall_band: band, one_line: oneLine,
      positioning: POSITIONING, methodology: METHODOLOGY, scores: scores, dimension_order: active,
      excluded: excluded, screening_flags: flags, top_risks: topRisks, n_gaps: nGaps,
      interactions: ints, pattern_note: pattern, open_questions: openQs, open_questions_lede: OPEN_QUESTIONS_LEDE,
      exec_summary: execSummary, strategic_note: strategicNote, cta: ctaObj, engagement: ENGAGEMENT, disclaimer: DISCLAIMER,
    };
  }

  window.Scoring = {QUESTIONS: QUESTIONS, compute: compute};
})();
