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
  // Residential loans get the full Uniform Residential Loan Application (Fannie Mae 1003) question set.
  var isRes = function (v) { return v.loan_type === "residential"; };
  var notRes = function (v) { return v.loan_type !== "residential"; };
  var yearsAgo = function (d) { var t = Date.parse(d); return isFinite(t) ? (Date.now() - t) / 31557600000 : Infinity; };
  var shortAddr = function (v) { return isRes(v) && v.b_years_at !== undefined && v.b_years_at !== "" && Number(v.b_years_at) < 2; };
  var shortJob = function (v) { return isRes(v) && yearsAgo(v.i_start) < 2; };
  var selfEmp = function (v) { return v.i_status === "Self-employed" || v.i_status === "Business owner"; };
  var NEG_DECL = ["d_bk", "d_fc", "d_suit", "d_judg", "d_fed", "dx_undisclosed", "dx_other_mtg", "dx_new_credit", "dx_pace", "dx_cosign", "dx_conveyed", "dx_short", "dx_foreclosed"];
  var ETHNICITY = ["Hispanic or Latino", "Mexican", "Puerto Rican", "Cuban", "Other Hispanic or Latino", "Not Hispanic or Latino", "I do not wish to provide this information"];
  var RACE = ["American Indian or Alaska Native", "Asian", "Asian Indian", "Chinese", "Filipino", "Japanese", "Korean", "Vietnamese", "Other Asian",
    "Black or African American", "Native Hawaiian or Other Pacific Islander", "Native Hawaiian", "Guamanian or Chamorro", "Samoan", "Other Pacific Islander",
    "White", "I do not wish to provide this information"];
  var SEX = ["Female", "Male", "I do not wish to provide this information"];
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
        { n: "b_middle", l: "Middle name", t: "text", third: true, show: isRes, ac: "additional-name" },
        { n: "b_suffix", l: "Suffix", t: "select", third: true, show: isRes, opts: ["Jr.", "Sr.", "II", "III", "IV"] },
        { n: "b_alt_names", l: "Alternate names (if any)", t: "text", third: true, show: isRes, help: "Names under which credit was received." },
        { n: "b_email", l: "Email", t: "email", req: true, half: true, ac: "email", help: "You'll sign in to your portal with this email." },
        { n: "b_phone", l: "Mobile phone", t: "tel", req: true, half: true, ac: "tel" },
        { n: "b_dob", l: "Date of birth", t: "date", req: true, half: true, pii: true },
        { n: "b_ssn", l: "SSN or ITIN", t: "ssn", half: true, pii: true, req: function (v) { return v.b_citizenship !== "Foreign national"; },
          help: "Encrypted and never shared outside Regal and your lender." },
        { n: "b_citizenship", l: "Citizenship", t: "select", req: true, half: true, opts: ["U.S. citizen", "Permanent resident", "Non-permanent resident", "Foreign national"] },
        { n: "b_marital", l: "Marital status", t: "select", half: true, req: isRes, opts: ["Married", "Unmarried", "Separated"],
          help: "Unmarried includes single, divorced, widowed, civil union and domestic partnership." },
        { n: "b_dependents", l: "Number of dependents", t: "number", third: true, show: isRes },
        { n: "b_dep_ages", l: "Ages of dependents", t: "text", third: true, show: function (v) { return isRes(v) && Number(v.b_dependents) > 0; }, ph: "4, 9" },
        { n: "b_work_phone", l: "Work phone", t: "tel", third: true, show: isRes },
        { n: "b_addr", l: "Current home address", t: "text", req: true, ac: "street-address" },
        { n: "b_city", l: "City", t: "text", req: true, third: true, ac: "address-level2" },
        { n: "b_state", l: "State", t: "state", req: true, third: true },
        { n: "b_zip", l: "ZIP / postal code", t: "text", req: true, third: true, ac: "postal-code" },
        { n: "b_country", l: "Country", t: "text", half: true, show: function (v) { return v.b_state === "Outside U.S."; } },
        { n: "b_years_at", l: "Years at this address", t: "number", half: true, req: isRes },
        { n: "b_months_at", l: "Additional months", t: "number", half: true, show: isRes },
        { n: "b_housing", l: "Housing", t: "select", half: true, req: isRes, opts: ["Own", "Rent", "No primary housing expense", "Other"] },
        { n: "b_rent", l: "Monthly rent", t: "money", half: true, show: function (v) { return isRes(v) && v.b_housing === "Rent"; } },
        { t: "heading", l: "Former address (less than 2 years at current address)", show: shortAddr },
        { n: "b_prev_addr", l: "Former street address", t: "text", req: shortAddr, show: shortAddr },
        { n: "b_prev_city", l: "City", t: "text", third: true, req: shortAddr, show: shortAddr },
        { n: "b_prev_state", l: "State", t: "state", third: true, req: shortAddr, show: shortAddr },
        { n: "b_prev_zip", l: "ZIP", t: "text", third: true, show: shortAddr },
        { n: "b_prev_years", l: "Years there", t: "number", half: true, show: shortAddr },
        { n: "b_prev_housing", l: "Housing", t: "select", half: true, show: shortAddr, opts: ["Own", "Rent", "No primary housing expense", "Other"] },
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
        { n: "i_emp_phone", l: "Employer phone", t: "tel", half: true, show: function (v) { return isRes(v) && v.i_status && v.i_status !== "Retired"; } },
        { n: "i_emp_addr", l: "Employer address", t: "text", show: function (v) { return isRes(v) && v.i_status && v.i_status !== "Retired"; } },
        { n: "i_start", l: "Start date", t: "date", half: true, req: function (v) { return isRes(v) && v.i_status && v.i_status !== "Retired"; },
          show: function (v) { return isRes(v) && v.i_status && v.i_status !== "Retired"; } },
        { n: "i_years", l: "Years in this line of work", t: "number", half: true },
        { n: "i_family", l: "Employed by a family member, property seller, real estate agent or other party to the transaction?", t: "radio", opts: YN,
          show: function (v) { return isRes(v) && v.i_status && v.i_status !== "Retired"; } },
        { n: "i_self_share", l: "Your ownership share", t: "select", half: true, opts: ["Less than 25%", "25% or more"],
          req: function (v) { return isRes(v) && selfEmp(v); }, show: function (v) { return isRes(v) && selfEmp(v); } },
        { n: "i_income", l: "Gross monthly income (total)", t: "money", req: true, half: true },
        { t: "heading", l: "Monthly income breakdown", show: isRes },
        { n: "i_base", l: "Base", t: "money", third: true, show: isRes },
        { n: "i_overtime", l: "Overtime", t: "money", third: true, show: isRes },
        { n: "i_bonus", l: "Bonus", t: "money", third: true, show: isRes },
        { n: "i_commission", l: "Commission", t: "money", third: true, show: isRes },
        { n: "i_military", l: "Military entitlements", t: "money", third: true, show: isRes },
        { n: "i_emp_other", l: "Other (employment)", t: "money", third: true, show: isRes },
        { t: "heading", l: "Previous employment (current job less than 2 years)", show: shortJob },
        { n: "pe_employer", l: "Previous employer", t: "text", half: true, req: shortJob, show: shortJob },
        { n: "pe_title", l: "Position", t: "text", half: true, show: shortJob },
        { n: "pe_start", l: "Start date", t: "date", third: true, show: shortJob },
        { n: "pe_end", l: "End date", t: "date", third: true, show: shortJob },
        { n: "pe_income", l: "Previous gross monthly income", t: "money", third: true, show: shortJob },
        { n: "i_other", l: "Other monthly income", t: "money", half: true },
        { n: "i_other_src", l: "Source of other income", t: "select",
          opts: ["Alimony / child support", "Social Security", "Pension / retirement", "Rental income", "Dividends / interest", "Trust", "Disability", "Capital gains", "Notes receivable", "Other"],
          show: function (v) { return !!v.i_other; } },
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
        { n: "a_liquid", l: "Cash in bank accounts", t: "money", req: notRes, show: notRes, half: true },
        { n: "a_invest", l: "Stocks / brokerage", t: "money", half: true, show: notRes },
        { n: "a_retire", l: "Retirement accounts", t: "money", half: true, show: notRes },
        { n: "l_monthly", l: "Monthly debt payments (excl. rent)", t: "money", half: true, show: notRes },
        { n: "reo_count", l: "Properties currently owned", t: "number", third: true, show: notRes },
        { n: "reo_value", l: "Total value", t: "money", third: true, show: notRes },
        { n: "reo_debt", l: "Total mortgage balances", t: "money", third: true, show: notRes },
        // Residential (URLA sections 2–3)
        { n: "asset_list", l: "Bank, retirement and other accounts", t: "list", show: isRes, req: isRes, add: "Add account",
          help: "List each account. Account numbers aren't needed — we'll get them from your statements.",
          fields: [
            { n: "type", l: "Account type", t: "select", opts: ["Checking", "Savings", "Money market", "Certificate of deposit", "Mutual fund", "Stocks", "Bonds", "Retirement (401k, IRA)", "Bridge loan proceeds", "Trust account", "Cash value of life insurance", "Other"] },
            { n: "institution", l: "Financial institution", t: "text" },
            { n: "value", l: "Cash or market value", t: "money" }
          ] },
        { n: "liab_list", l: "Debts: credit cards, auto, student loans, other mortgages", t: "list", show: isRes, add: "Add debt",
          help: "Your credit report will also list these; include anything that might not appear there.",
          fields: [
            { n: "type", l: "Type", t: "select", opts: ["Revolving (credit card)", "Installment (auto, student, personal)", "Open 30-day (balance paid monthly)", "Lease", "Other"] },
            { n: "creditor", l: "Company", t: "text" },
            { n: "balance", l: "Unpaid balance", t: "money" },
            { n: "payment", l: "Monthly payment", t: "money" },
            { n: "payoff", l: "Paid off at or before closing?", t: "select", opts: ["No", "Yes"] }
          ] },
        { n: "reo_list", l: "Real estate you own", t: "list", show: isRes, add: "Add property",
          fields: [
            { n: "addr", l: "Property address", t: "text", wide: true },
            { n: "value", l: "Market value", t: "money" },
            { n: "status", l: "Status", t: "select", opts: ["Retained", "Pending sale", "Sold"] },
            { n: "occupancy", l: "Intended occupancy", t: "select", opts: ["Primary residence", "Second home", "Investment", "Other"] },
            { n: "expenses", l: "Monthly insurance, taxes, HOA", t: "money" },
            { n: "rent", l: "Monthly rental income", t: "money" },
            { n: "mtg_balance", l: "Mortgage balance", t: "money" },
            { n: "mtg_payment", l: "Mortgage monthly payment", t: "money" }
          ] },
        { n: "gift_amount", l: "Gifts or grants toward this purchase", t: "money", half: true, show: function (v) { return isRes(v) && v.loan_purpose === "Purchase"; } },
        { n: "gift_source", l: "Source of gift", t: "select", half: true, opts: ["Relative", "Employer", "Community nonprofit", "Federal agency", "State agency", "Local agency", "Religious nonprofit", "Unmarried partner", "Other"],
          show: function (v) { return isRes(v) && Number(v.gift_amount) > 0; } },
        { t: "heading", l: "Declarations" },
        { n: "dx_occupy", l: "A. Will you occupy the property as your primary residence?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_own3", l: "Have you had an ownership interest in another property in the last three years?", t: "radio", opts: YN, req: isRes,
          show: function (v) { return isRes(v) && v.dx_occupy === "Yes"; } },
        { n: "dx_own3_type", l: "Type of that property", t: "select", half: true, opts: ["Primary residence", "FHA secondary residence", "Second home", "Investment property"],
          show: function (v) { return isRes(v) && v.dx_own3 === "Yes"; } },
        { n: "dx_own3_title", l: "How did you hold title?", t: "select", half: true, opts: ["By yourself", "Jointly with your spouse", "Jointly with another person"],
          show: function (v) { return isRes(v) && v.dx_own3 === "Yes"; } },
        { n: "dx_family", l: "B. Do you have a family or business relationship with the seller of the property?", t: "radio", opts: YN,
          req: function (v) { return isRes(v) && v.loan_purpose === "Purchase"; }, show: function (v) { return isRes(v) && v.loan_purpose === "Purchase"; } },
        { n: "dx_undisclosed", l: "C. Are you borrowing any money for this transaction (e.g. closing costs or down payment) that isn't disclosed elsewhere in this application?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_undisclosed_amt", l: "Amount", t: "money", half: true, show: function (v) { return isRes(v) && v.dx_undisclosed === "Yes"; } },
        { n: "dx_other_mtg", l: "D1. Have you or will you be applying for a mortgage loan on another property before closing this transaction?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_new_credit", l: "D2. Have you or will you be applying for any new credit (e.g. installment loan, credit card) before closing this loan?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_pace", l: "E. Will this property be subject to a lien that could take priority over the first mortgage lien, such as a clean-energy (PACE) lien?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_cosign", l: "F. Are you a co-signer or guarantor on any debt or loan that isn't disclosed on this application?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "d_judg", l: "Are there any outstanding judgments or tax liens against you?", t: "radio", opts: YN, req: true },
        { n: "d_fed", l: "Are you currently delinquent or in default on a federal debt?", t: "radio", opts: YN, req: true },
        { n: "d_suit", l: "Are you a party to a lawsuit in which you potentially have any personal financial liability?", t: "radio", opts: YN, req: true },
        { n: "dx_conveyed", l: "J. Have you conveyed title to any property in lieu of foreclosure in the past 7 years?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_short", l: "K. Within the past 7 years, have you completed a pre-foreclosure sale or short sale?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "dx_foreclosed", l: "L. Have you had property foreclosed upon in the last 7 years?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "d_fc", l: "Foreclosure, short sale or deed-in-lieu in the past 7 years?", t: "radio", opts: YN, req: notRes, show: notRes },
        { n: "d_bk", l: "Have you declared bankruptcy within the past 7 years?", t: "radio", opts: YN, req: true },
        { n: "dx_bk_type", l: "Type of bankruptcy", t: "multi", opts: ["Chapter 7", "Chapter 11", "Chapter 12", "Chapter 13"],
          req: function (v) { return isRes(v) && v.d_bk === "Yes"; }, show: function (v) { return isRes(v) && v.d_bk === "Yes"; } },
        { n: "d_explain", l: "Please explain any \"Yes\" answers above", t: "textarea", req: true,
          show: function (v) { return NEG_DECL.some(function (k) { return v[k] === "Yes"; }); } },
        { t: "heading", l: "Military service", show: isRes },
        { n: "mil_service", l: "Did you (or your deceased spouse) ever serve, or are you currently serving, in the U.S. Armed Forces?", t: "radio", opts: YN, req: isRes, show: isRes },
        { n: "mil_status", l: "Military status", t: "multi", req: function (v) { return isRes(v) && v.mil_service === "Yes"; },
          opts: ["Currently serving on active duty", "Currently retired, discharged, or separated from service", "Only period of service was as a non-activated member of the Reserve or National Guard", "Surviving spouse"],
          show: function (v) { return isRes(v) && v.mil_service === "Yes"; } },
        { n: "mil_expires", l: "Projected expiration date of service/tour", t: "date", half: true,
          show: function (v) { return isRes(v) && /active duty/.test(v.mil_status || ""); } }
      ]
    },
    {
      id: "demographics", title: "Demographic Information", sub: "Required by federal law for residential mortgage applications.", show: isRes,
      fields: [
        { t: "note", l: "The purpose of collecting this information is to help ensure that all applicants are treated fairly and that the housing needs of communities and neighborhoods are being fulfilled. For residential mortgage lending, Federal law requires that we ask applicants for their demographic information (ethnicity, sex, and race) in order to monitor our compliance with equal credit opportunity, fair housing, and home mortgage disclosure laws. You are not required to provide this information, but are encouraged to do so. You may select one or more designations for \"Ethnicity\" and one or more designations for \"Race.\" The law provides that we may not discriminate on the basis of this information, or on whether you choose to provide it. However, if you choose not to provide the information and you have made this application in person, Federal regulations require us to note your ethnicity, sex, and race on the basis of visual observation or surname. The law also provides that we may not discriminate on the basis of age or marital status information you provide in this application. If you do not wish to provide some or all of this information, please check below." },
        { t: "heading", l: "Primary borrower" },
        { n: "dm_eth", nosum: true, l: "Ethnicity", t: "multi", req: true, opts: ETHNICITY },
        { n: "dm_eth_other", nosum: true, l: "Other Hispanic or Latino — please specify (e.g. Colombian, Dominican, Venezuelan)", t: "text", show: function (v) { return /Other Hispanic/.test(v.dm_eth || ""); } },
        { n: "dm_race", nosum: true, l: "Race", t: "multi", req: true, opts: RACE },
        { n: "dm_race_detail", nosum: true, l: "Enrolled or principal tribe / other Asian / other Pacific Islander — please specify", t: "text",
          show: function (v) { return /American Indian|Other Asian|Other Pacific/.test(v.dm_race || ""); } },
        { n: "dm_sex", nosum: true, l: "Sex", t: "multi", req: true, opts: SEX },
        { t: "heading", l: "Co-borrower", show: hasCob },
        { n: "cdm_eth", nosum: true, l: "Ethnicity", t: "multi", req: hasCob, show: hasCob, opts: ETHNICITY },
        { n: "cdm_eth_other", nosum: true, l: "Other Hispanic or Latino — please specify", t: "text", show: function (v) { return hasCob(v) && /Other Hispanic/.test(v.cdm_eth || ""); } },
        { n: "cdm_race", nosum: true, l: "Race", t: "multi", req: hasCob, show: hasCob, opts: RACE },
        { n: "cdm_race_detail", nosum: true, l: "Tribe / other Asian / other Pacific Islander — please specify", t: "text",
          show: function (v) { return hasCob(v) && /American Indian|Other Asian|Other Pacific/.test(v.cdm_race || ""); } },
        { n: "cdm_sex", nosum: true, l: "Sex", t: "multi", req: hasCob, show: hasCob, opts: SEX }
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
  function rowFilled(r) {
    return !!r && Object.keys(r).some(function (k) { return String(r[k] == null ? "" : r[k]).trim() !== ""; });
  }
  function fieldVisible(f, v) { return !f.show || f.show(v); }
  function stepVisible(s, v) { return !s.show || s.show(v); }

  /** Human-readable value for a field (never used for PII). */
  function display(f, val) {
    if (val == null || val === "") return "";
    if (f.t === "money") return money(val);
    if (f.t === "cards") { var o = LOAN_TYPES.filter(function (x) { return x.v === val; })[0]; return o ? o.l : val; }
    if (f.t === "check") return val === "yes" ? "Agreed" : "";
    if (f.t === "list") {
      var rows = val;
      if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch (e) { return ""; } }
      if (!Array.isArray(rows)) return "";
      return rows.filter(rowFilled).map(function (r) {
        return f.fields.map(function (sf) { var x = r[sf.n]; return x ? (sf.t === "money" ? money(x) : String(x)) : ""; }).filter(Boolean).join(" · ");
      }).join("  |  ");
    }
    if (f.map) { for (var k in f.map) if (f.map[k] === val) return k; }
    return String(val);
  }

  /** [label, value] rows for everything visible and non-PII. */
  function summarize(v) {
    var rows = [];
    STEPS.forEach(function (s) {
      if (!stepVisible(s, v)) return;
      s.fields.forEach(function (f) {
        // HMDA demographics never go to the CRM summary (kept with the application + 1003/XML only).
        if (!f.n || f.pii || f.nosum || !fieldVisible(f, v)) return;
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
    summarize: summarize, checklistFor: checklistFor, rowFilled: rowFilled,
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
