/* =========================================================
   Regal loan portal — shared definitions
   Application steps/fields (drives the form, review screen, HubSpot summary
   and admin view) + per-program document checklists.
   ========================================================= */
(function () {
  "use strict";

  var RE = ["commercial", "residential", "construction", "bridge", "cre_loc"];
  var isRE = function (v) { return RE.indexOf(v.loan_type) !== -1; };
  var isEntity = function (v) { return v.borrower_type && v.borrower_type !== "Individual"; };
  var hasCob = function (v) { return v.has_cob === "yes"; };
  var YN = ["No", "Yes"];

  var LOAN_TYPES = [
    { v: "commercial",   l: "Commercial",           d: "Acquisition, refinance & bridge for income property" },
    { v: "residential",  l: "Residential",          d: "Primary, second-home & investment residences" },
    { v: "construction", l: "Construction",         d: "Ground-up & value-add with draw structures" },
    { v: "bridge",       l: "Private Equity & Bridge", d: "Fast business-purpose private capital" },
    { v: "cre_loc",      l: "CRE Line of Credit",   d: "Revolving liquidity secured by CRE" },
    { v: "aircraft",     l: "Aircraft",             d: "Private & business aircraft" },
    { v: "maritime",     l: "Maritime",             d: "Yachts & commercial vessels" }
  ];

  var STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","PR","Outside U.S."];

  var STEPS = [
    {
      id: "loan", title: "The Loan", sub: "Tell us what you're financing.",
      fields: [
        { n: "loan_type", l: "Financing program", t: "cards", req: true, opts: LOAN_TYPES },
        { n: "loan_purpose", l: "Loan purpose", t: "select", req: true,
          opts: ["Purchase", "Refinance", "Cash-out refinance", "Construction / renovation", "Line of credit", "Other"] },
        { n: "loan_amount", l: "Loan amount requested", t: "money", req: true, half: true },
        { n: "value", l: "Purchase price or estimated value", t: "money", req: true, half: true },
        { n: "down_payment", l: "Down payment / equity", t: "money", half: true, show: function (v) { return v.loan_purpose === "Purchase"; } },
        { n: "payoff", l: "Existing loan payoff", t: "money", half: true, show: function (v) { return /refinance/i.test(v.loan_purpose || ""); } },
        { n: "close_by", l: "Target closing date", t: "date", half: true },
        { n: "exit", l: "Exit strategy", t: "select", half: true, opts: ["Sale", "Refinance", "Hold / cash flow", "Other"],
          show: function (v) { return v.loan_type === "bridge" || v.loan_type === "construction"; } },
        { n: "loan_notes", l: "Anything we should know about the deal?", t: "textarea", ph: "Timing, structure, special circumstances…" }
      ]
    },
    {
      id: "borrower", title: "Borrower", sub: "Who is borrowing and who will guarantee.",
      fields: [
        { n: "borrower_type", l: "Borrowing as", t: "select", req: true, opts: ["Individual", "LLC", "Corporation", "Trust", "Partnership"] },
        { n: "e_name", l: "Entity legal name", t: "text", req: true, show: isEntity, half: true },
        { n: "e_ein", l: "Entity EIN", t: "ein", show: isEntity, half: true, pii: true, help: "Optional now — encrypted." },
        { n: "e_state", l: "State of formation", t: "state", show: isEntity, half: true },
        { n: "e_role", l: "Your title & ownership %", t: "text", show: isEntity, half: true, ph: "Managing Member, 50%" },
        { t: "heading", l: "Primary borrower / guarantor" },
        { n: "b_first", l: "First name", t: "text", req: true, half: true, ac: "given-name" },
        { n: "b_last", l: "Last name", t: "text", req: true, half: true, ac: "family-name" },
        { n: "b_email", l: "Email", t: "email", req: true, half: true, ac: "email", help: "You'll sign in to your portal with this email." },
        { n: "b_phone", l: "Mobile phone", t: "tel", req: true, half: true, ac: "tel" },
        { n: "b_dob", l: "Date of birth", t: "date", req: true, half: true, pii: true },
        { n: "b_ssn", l: "SSN or ITIN", t: "ssn", half: true, pii: true, req: function (v) { return v.b_citizenship !== "Foreign national"; },
          help: "Encrypted and never shared outside Regal and your lender." },
        { n: "b_citizenship", l: "Citizenship", t: "select", req: true, half: true, opts: ["U.S. citizen", "Permanent resident", "Non-permanent resident", "Foreign national"] },
        { n: "b_marital", l: "Marital status", t: "select", half: true, opts: ["Married", "Unmarried", "Separated"] },
        { n: "b_addr", l: "Current home address", t: "text", req: true, ac: "street-address" },
        { n: "b_city", l: "City", t: "text", req: true, third: true, ac: "address-level2" },
        { n: "b_state", l: "State", t: "state", req: true, third: true },
        { n: "b_zip", l: "ZIP / postal code", t: "text", req: true, third: true, ac: "postal-code" },
        { n: "b_country", l: "Country", t: "text", half: true, show: function (v) { return v.b_state === "Outside U.S."; } },
        { n: "b_years_at", l: "Years at this address", t: "number", half: true },
        { n: "b_housing", l: "Housing", t: "select", half: true, opts: ["Own", "Rent", "Other"] },
        { n: "has_cob", l: "Is there a co-borrower or additional guarantor?", t: "radio", opts: YN, req: true, map: { No: "no", Yes: "yes" } }
      ]
    },
    {
      id: "cob", title: "Co-Borrower", sub: "Additional borrower or guarantor.", show: hasCob,
      fields: [
        { n: "c_first", l: "First name", t: "text", req: true, half: true },
        { n: "c_last", l: "Last name", t: "text", req: true, half: true },
        { n: "c_email", l: "Email", t: "email", req: true, half: true },
        { n: "c_phone", l: "Phone", t: "tel", half: true },
        { n: "c_dob", l: "Date of birth", t: "date", half: true, pii: true },
        { n: "c_ssn", l: "SSN or ITIN", t: "ssn", half: true, pii: true },
        { n: "c_citizenship", l: "Citizenship", t: "select", half: true, opts: ["U.S. citizen", "Permanent resident", "Non-permanent resident", "Foreign national"] },
        { n: "c_relationship", l: "Relationship to borrower", t: "text", half: true, ph: "Spouse, partner, guarantor…" }
      ]
    },
    {
      id: "collateral", title: "Collateral", sub: "The asset securing the loan.",
      fields: [
        // Real estate
        { n: "p_addr", l: "Property address", t: "text", req: isRE, show: isRE, help: "Not under contract yet? Enter the target area." },
        { n: "p_city", l: "City", t: "text", third: true, req: isRE, show: isRE },
        { n: "p_state", l: "State", t: "state", third: true, req: isRE, show: isRE },
        { n: "p_zip", l: "ZIP", t: "text", third: true, show: isRE },
        { n: "p_type", l: "Property type", t: "select", half: true, req: isRE, show: isRE,
          opts: ["Single-family", "Condo", "2–4 unit", "Multifamily (5+)", "Retail", "Office", "Industrial", "Mixed-use", "Hospitality", "Land", "Other"] },
        { n: "p_occupancy", l: "Occupancy", t: "select", half: true, show: isRE,
          opts: ["Primary residence", "Second home", "Investment", "Owner-occupied business", "Vacant / development"] },
        { n: "p_units", l: "Units / suites", t: "number", third: true, show: isRE },
        { n: "p_sqft", l: "Square feet", t: "number", third: true, show: isRE },
        { n: "p_year", l: "Year built", t: "number", third: true, show: isRE },
        { n: "p_rent", l: "Gross monthly rent (if income-producing)", t: "money", half: true, show: isRE },
        { n: "p_taxes_ins", l: "Annual taxes + insurance", t: "money", half: true, show: isRE },
        // Construction
        { t: "heading", l: "Construction project", show: function (v) { return v.loan_type === "construction"; } },
        { n: "k_budget", l: "Total construction budget", t: "money", half: true, req: true, show: function (v) { return v.loan_type === "construction"; } },
        { n: "k_land_owned", l: "Is the land owned?", t: "radio", opts: YN, show: function (v) { return v.loan_type === "construction"; } },
        { n: "k_gc", l: "General contractor", t: "text", half: true, show: function (v) { return v.loan_type === "construction"; } },
        { n: "k_months", l: "Build timeline (months)", t: "number", half: true, show: function (v) { return v.loan_type === "construction"; } },
        { n: "k_permits", l: "Permit status", t: "select", half: true, opts: ["Approved", "In process", "Not started"], show: function (v) { return v.loan_type === "construction"; } },
        { n: "p_more", l: "Additional collateral (other properties offered)", t: "textarea", show: function (v) { return v.loan_type === "cre_loc"; } },
        // Aircraft
        { n: "a_make", l: "Make", t: "text", half: true, req: true, show: function (v) { return v.loan_type === "aircraft"; }, ph: "Gulfstream" },
        { n: "a_model", l: "Model", t: "text", half: true, req: true, show: function (v) { return v.loan_type === "aircraft"; }, ph: "G550" },
        { n: "a_year", l: "Year", t: "number", third: true, show: function (v) { return v.loan_type === "aircraft"; } },
        { n: "a_serial", l: "Serial number", t: "text", third: true, show: function (v) { return v.loan_type === "aircraft"; } },
        { n: "a_tail", l: "Tail number", t: "text", third: true, show: function (v) { return v.loan_type === "aircraft"; } },
        { n: "a_hours", l: "Total time (hours)", t: "number", half: true, show: function (v) { return v.loan_type === "aircraft"; } },
        { n: "a_use", l: "Intended use", t: "select", half: true, opts: ["Part 91 (private)", "Part 135 (charter)", "Mixed"], show: function (v) { return v.loan_type === "aircraft"; } },
        { n: "a_base", l: "Home airport", t: "text", half: true, show: function (v) { return v.loan_type === "aircraft"; } },
        // Maritime
        { n: "v_builder", l: "Builder", t: "text", half: true, req: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_model", l: "Model", t: "text", half: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_year", l: "Year", t: "number", third: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_length", l: "Length (ft)", t: "number", third: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_flag", l: "Flag", t: "text", third: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_hin", l: "HIN / IMO", t: "text", half: true, show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_use", l: "Intended use", t: "select", half: true, opts: ["Private", "Charter", "Mixed"], show: function (v) { return v.loan_type === "maritime"; } },
        { n: "v_port", l: "Home port / marina", t: "text", half: true, show: function (v) { return v.loan_type === "maritime"; } }
      ]
    },
    {
      id: "income", title: "Income", sub: "Employment and income for the primary borrower.",
      fields: [
        { n: "i_status", l: "Employment", t: "select", req: true, half: true, opts: ["Employed", "Self-employed", "Business owner", "Retired", "Other"] },
        { n: "i_employer", l: "Employer / business name", t: "text", half: true, show: function (v) { return v.i_status && v.i_status !== "Retired"; } },
        { n: "i_title", l: "Title / position", t: "text", half: true, show: function (v) { return v.i_status && v.i_status !== "Retired"; } },
        { n: "i_years", l: "Years in this line of work", t: "number", half: true },
        { n: "i_income", l: "Gross monthly income", t: "money", req: true, half: true },
        { n: "i_other", l: "Other monthly income", t: "money", half: true },
        { n: "i_other_src", l: "Source of other income", t: "text", show: function (v) { return !!v.i_other; } },
        { t: "heading", l: "Co-borrower income", show: hasCob },
        { n: "ci_employer", l: "Employer / business", t: "text", half: true, show: hasCob },
        { n: "ci_income", l: "Gross monthly income", t: "money", half: true, show: hasCob },
        { n: "experience", l: "Comparable projects completed in the last 5 years", t: "number", half: true,
          show: function (v) { return ["commercial", "construction", "bridge", "cre_loc"].indexOf(v.loan_type) !== -1; } }
      ]
    },
    {
      id: "assets", title: "Assets & Declarations", sub: "Liquidity, real estate owned and standard disclosures.",
      fields: [
        { n: "a_liquid", l: "Cash in bank accounts", t: "money", req: true, half: true },
        { n: "a_invest", l: "Stocks / brokerage", t: "money", half: true },
        { n: "a_retire", l: "Retirement accounts", t: "money", half: true },
        { n: "l_monthly", l: "Monthly debt payments (excl. rent)", t: "money", half: true },
        { n: "reo_count", l: "Properties currently owned", t: "number", third: true },
        { n: "reo_value", l: "Total value", t: "money", third: true },
        { n: "reo_debt", l: "Total mortgage balances", t: "money", third: true },
        { t: "heading", l: "Declarations" },
        { n: "d_bk", l: "Declared bankruptcy in the past 7 years?", t: "radio", opts: YN, req: true },
        { n: "d_fc", l: "Foreclosure, short sale or deed-in-lieu in the past 7 years?", t: "radio", opts: YN, req: true },
        { n: "d_suit", l: "Party to a pending lawsuit?", t: "radio", opts: YN, req: true },
        { n: "d_judg", l: "Any outstanding judgments or tax liens?", t: "radio", opts: YN, req: true },
        { n: "d_fed", l: "Delinquent or in default on any federal debt?", t: "radio", opts: YN, req: true },
        { n: "d_explain", l: "Please explain any \"Yes\" answers", t: "textarea", req: true,
          show: function (v) { return ["d_bk", "d_fc", "d_suit", "d_judg", "d_fed"].some(function (k) { return v[k] === "Yes"; }); } }
      ]
    },
    {
      id: "review", title: "Review & Sign", sub: "Confirm your information and authorize us to proceed.",
      review: true,
      fields: [
        { n: "consent_econsent", l: "I agree to receive disclosures and sign electronically.", t: "check", req: true },
        { n: "consent_credit", l: "I authorize Regal Group International and its lending partners to obtain credit reports and verify the information provided, for the purpose of evaluating this financing request.", t: "check", req: true },
        { n: "consent_accuracy", l: "I certify the information in this application is true and complete to the best of my knowledge.", t: "check", req: true },
        { n: "sign_name", l: "Type your full legal name to sign", t: "text", req: true, half: true, ac: "name" },
        { n: "sign_date", l: "Date", t: "text", half: true, readonly: true }
      ]
    }
  ];

  /* Document checklists per program (mirrors assets/docs/*-checklist.pdf). */
  var CHECKLISTS = {
    commercial: [
      ["Borrower & Entity", ["Government-issued photo ID — all principals/guarantors", "Entity documents: Articles, Operating Agreement, EIN letter", "Certificate of Good Standing", "Personal Financial Statement — each guarantor (≥20%)", "Schedule of Real Estate Owned"]],
      ["Financials", ["Business tax returns — last 2–3 years", "Personal tax returns — last 2 years (each guarantor)", "Year-to-date P&L and Balance Sheet", "Business bank statements — last 3 months", "Existing debt schedule"]],
      ["Property", ["Purchase contract or Letter of Intent", "Current rent roll & trailing-12 operating statements", "Property photos & condition notes", "Appraisal and/or Phase I environmental (if available)", "Evidence of property insurance"]],
      ["Deal", ["Use of funds / sources & uses", "Executive summary or investment thesis"]]
    ],
    residential: [
      ["Borrower", ["Government-issued photo ID"]],
      ["Income", ["W-2s / 1099s — last 2 years", "Most recent 30 days of pay stubs", "Tax returns — last 2 years (self-employed)"]],
      ["Assets", ["Bank/asset statements — last 2 months", "Gift letter (if applicable)"]],
      ["Property", ["Purchase contract", "Homeowner's insurance quote", "HOA / condo information (if applicable)"]],
      ["Foreign-National Program", ["Valid passport and U.S. visa", "International bank reference & foreign credit reference"]]
    ],
    construction: [
      ["Borrower & Entity", ["Photo ID — all principals/guarantors", "Entity documents & Certificate of Good Standing", "Personal Financial Statement; Schedule of Real Estate Owned", "Construction experience / completed-projects résumé"]],
      ["Project", ["Detailed line-item construction budget", "Architectural plans & specifications", "Permits and municipal approvals", "General Contractor agreement, license & insurance", "Project timeline & proposed draw schedule", "Builder's risk insurance"]],
      ["Property", ["Land purchase contract or proof of ownership", "Survey & zoning verification", "As-completed appraisal"]],
      ["Financials", ["Business & personal tax returns — last 2 years", "Bank statements & proof of equity injection"]]
    ],
    bridge: [
      ["Borrower & Entity", ["Photo ID — all principals/guarantors", "Entity documents (Articles, Operating Agreement, EIN)", "Personal Financial Statement"]],
      ["Asset", ["Current appraisal, BPO, or valuation", "Purchase contract or proof of ownership", "Rent roll (if income-producing) & property photos", "Title / preliminary title report"]],
      ["Deal", ["Executive summary & exit strategy", "Use of funds / sources & uses", "Payoff statement (if refinance)"]],
      ["Financials", ["Bank statements — proof of liquidity", "Schedule of Real Estate Owned"]]
    ],
    cre_loc: [
      ["Borrower & Entity", ["Photo ID — all principals/guarantors", "Entity documents & Certificate of Good Standing", "Personal Financial Statement — each guarantor"]],
      ["Collateral", ["Schedule of CRE collateral offered", "Current appraisals / valuations", "Rent rolls & trailing-12 operating statements", "Mortgage statements / payoff figures", "Evidence of property insurance"]],
      ["Financials", ["Business & personal tax returns — last 2–3 years", "Year-to-date financial statements", "Existing debt schedule"]]
    ],
    aircraft: [
      ["Borrower & Entity", ["Photo ID — all principals/guarantors", "Entity / ownership-structure documents", "Personal Financial Statement"]],
      ["Aircraft", ["Purchase agreement or Letter of Intent", "Spec sheet: make, model, year, serial & tail number", "Logbooks & maintenance records", "Pre-buy inspection report", "Appraisal / valuation; damage history", "Current registration & title"]],
      ["Operations", ["Management or charter agreement (if any)", "Insurance binder"]],
      ["Financials", ["Tax returns — last 2–3 years", "Bank statements — proof of down payment & liquidity"]]
    ],
    maritime: [
      ["Borrower & Entity", ["Photo ID — all principals/guarantors", "Entity / ownership-structure documents", "Personal Financial Statement"]],
      ["Vessel", ["Purchase agreement or Letter of Intent", "Spec sheet: make, model, year, HIN, length & flag", "Marine survey (condition & valuation)", "Sea-trial report", "Documentation / registration & title", "Prior ownership & service history"]],
      ["Operations", ["Captain & crew information (if applicable)", "Marine insurance binder; moorage / marina info"]],
      ["Financials", ["Tax returns — last 2–3 years", "Bank statements — proof of down payment & liquidity"]]
    ]
  };

  /* ---- helpers shared by all pages ---- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    var x = parseInt(String(n == null ? "" : n).replace(/[^0-9]/g, ""), 10);
    return isFinite(x) ? "$" + x.toLocaleString("en-US") : "";
  }
  function fmtDate(ts) {
    return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function when(x, v) { return typeof x === "function" ? !!x(v) : !!x; }
  function fieldVisible(f, v) { return !f.show || f.show(v); }
  function stepVisible(s, v) { return !s.show || s.show(v); }

  /** Human-readable value for a field (never used for PII). */
  function display(f, val) {
    if (val == null || val === "") return "";
    if (f.t === "money") return money(val);
    if (f.t === "cards") { var o = LOAN_TYPES.filter(function (x) { return x.v === val; })[0]; return o ? o.l : val; }
    if (f.t === "check") return val === "yes" ? "Agreed" : "";
    if (f.map) { for (var k in f.map) if (f.map[k] === val) return k; }
    return String(val);
  }

  /** [label, value] rows for everything visible and non-PII. */
  function summarize(v) {
    var rows = [];
    STEPS.forEach(function (s) {
      if (!stepVisible(s, v)) return;
      s.fields.forEach(function (f) {
        if (!f.n || f.pii || !fieldVisible(f, v)) return;
        var d = display(f, v[f.n]);
        if (d) rows.push([s.title + " · " + f.l, d]);
      });
    });
    return rows;
  }

  /** Checklist sections for an application, including items Regal requested. */
  function checklistFor(app) {
    var base = (CHECKLISTS[app.loan_type] || []).map(function (sec) {
      return { title: sec[0], items: sec[1].map(function (l) { return { label: l }; }) };
    });
    if (app.has_cob) base[0] && base[0].items.push({ label: "Co-borrower photo ID" });
    if (app.extra_items && app.extra_items.length) {
      base.unshift({
        title: "Requested by Regal", requested: true,
        items: app.extra_items.map(function (i) { return { label: i.label, note: i.note, id: i.id }; })
      });
    }
    base.push({ title: "Other documents", other: true, items: [{ label: "Other" }] });
    return base;
  }

  window.Regal = {
    LOAN_TYPES: LOAN_TYPES, STATES: STATES, STEPS: STEPS, CHECKLISTS: CHECKLISTS,
    esc: esc, money: money, fmtDate: fmtDate, fmtSize: fmtSize, when: when,
    fieldVisible: fieldVisible, stepVisible: stepVisible, display: display,
    summarize: summarize, checklistFor: checklistFor,
    api: function (path, opts) {
      opts = opts || {};
      var headers = opts.headers || {};
      if (opts.token) headers.Authorization = "Bearer " + opts.token;
      if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.json); }
      return fetch(window.REGAL_API + path, { method: opts.method || (opts.body ? "POST" : "GET"), headers: headers, body: opts.body })
        .then(function (res) {
          if (opts.raw) return res;
          return res.json().catch(function () { return {}; }).then(function (d) { d._status = res.status; return d; });
        })
        .catch(function () { return { ok: false, error: "Can't reach the server. Check your connection and try again.", _status: 0 }; });
    }
  };
})();
