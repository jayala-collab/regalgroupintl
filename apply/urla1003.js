/* =========================================================
   Regal loan portal — fills Fannie Mae Form 1003 (URLA 2019, Borrower v28)
   from a portal application. Runs in the admin browser (pdf-lib), so the
   Worker never does heavy PDF work. Same code is used by local tests.

   fill1003(PDFLib, templateBytes, { app, fields, pii }) → Uint8Array (PDF)
   Joint applications get a second, co-borrower copy of the form appended.
   Each copy is flattened so the two copies' identical field names can't clash.
   ========================================================= */
(function (root) {
  "use strict";

  var digits = function (s) { return String(s == null ? "" : s).replace(/\D/g, ""); };
  var money = function (v) { var n = parseInt(digits(v), 10); return isFinite(n) && n > 0 ? n.toLocaleString("en-US") : ""; };
  var sumMoney = function (arr) { var t = 0; arr.forEach(function (v) { var n = parseInt(digits(v), 10); if (isFinite(n)) t += n; }); return t ? t.toLocaleString("en-US") : ""; };
  var has = function (list, s) { return String(list || "").split("; ").indexOf(s) !== -1; };
  var list = function (v) { try { var a = JSON.parse(v || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  var ymd = function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? { y: m[1], m: m[2], d: m[3] } : null; };

  var ACCOUNT = {
    "Checking": "Checking", "Savings": "Savings", "Money market": "Money Market", "Certificate of deposit": "Certificate of Deposit",
    "Mutual fund": "Mutual Fund", "Stocks": "Stocks", "Bonds": "Bonds", "Retirement (401k, IRA)": "Retirement",
    "Bridge loan proceeds": "Bridge Loan Proceeds", "Trust account": "Trust Account", "Cash value of life insurance": "Cash Value of Life Insurance"
  };
  var DEBT = { "Revolving (credit card)": "Revolving", "Installment (auto, student, personal)": "Installment", "Open 30-day (balance paid monthly)": "Open 30-Day", "Lease": "Lease", "Other": "Other" };
  var OTHER_INC = {
    "Alimony / child support": "Alimony", "Social Security": "Social Security", "Pension / retirement": "Retirement", "Rental income": "Other",
    "Dividends / interest": "Interest and Dividends", "Trust": "Trust", "Disability": "Disability", "Capital gains": "Capital Gains",
    "Notes receivable": "Notes Receivable", "Other": "Other"
  };
  var REO_OCC = { "Primary residence": "Primary Residence", "Second home": "Second Home", "Investment": "Investment", "Other": "Other" };
  var SUBJ_OCC = { "Primary residence": "Primary Residence", "Second home": "Second Home", "Investment": "Investment Property" };
  var GIFT_SRC = {
    "Relative": "Relative", "Employer": "Employer", "Community nonprofit": "Community Nonprofit", "Federal agency": "Federal Agency",
    "State agency": "State Agency", "Local agency": "Local Agency", "Religious nonprofit": "Religious Nonprofit", "Unmarried partner": "Unmarried Partner", "Other": "Other"
  };
  var CITIZEN = { "U.S. citizen": "U.S. Citizen", "Permanent resident": "Permanent Resident Alien", "Non-permanent resident": "Non-Permanent Resident Alien", "Foreign national": "Non-Permanent Resident Alien" };
  var HOUSING = { "Own": "Own", "Rent": "Rent", "No primary housing expense": "No primary housing expense" };
  var PRIOR_TYPE = { "Primary residence": "PR", "FHA secondary residence": "SR", "Second home": "SH", "Investment property": "IP" };
  var PRIOR_TITLE = { "By yourself": "S", "Jointly with your spouse": "SP", "Jointly with another person": "O" };

  /** Field access by the last segment of the long XFA-style names, e.g. "_1b_Base". */
  function Filler(PDFLib, form) {
    var index = {};
    form.getFields().forEach(function (f) {
      var seg = f.getName().split(".").pop().replace(/\[\d+\]$/, "");
      (index[seg] = index[seg] || []).push(f);
    });
    function get(seg) { return (index[seg] || [])[0] || null; }
    return {
      text: function (seg, val) {
        var f = get(seg);
        if (!f || val === undefined || val === null || val === "") return;
        if (f.getMaxLength && f.getMaxLength() !== undefined) f.setMaxLength(undefined); // the form ships some wrong limits
        f.setText(String(val));
      },
      textAll: function (seg, val) { (index[seg] || []).forEach(function (f) { if (val) f.setText(String(val)); }); },
      check: function (seg, on) { var f = get(seg); if (f && on) f.check(); },
      radio: function (group, opt) {
        var f = get(group);
        if (!f || !opt) return;
        var opts = f.getOptions();
        var hit = opts.filter(function (o) { return o === opt || o.toLowerCase() === String(opt).toLowerCase(); })[0];
        if (hit) f.select(hit);
      },
      yesNo: function (group, v) { if (v === "Yes") this.radio(group, "YES"); else if (v === "No") this.radio(group, "NO"); },
      drop: function (seg, opt) {
        var f = get(seg);
        if (!f || !opt) return;
        var hit = f.getOptions().filter(function (o) { return o.trim() === opt; })[0];
        if (hit) f.select(hit);
      },
      date: function (prefixM, prefixD, prefixY, v) {
        var d = ymd(v); if (!d) return;
        this.text(prefixM, d.m); this.text(prefixD, d.d); this.text(prefixY, d.y);
      },
      phone: function (p1, p2, p3, v) {
        var n = digits(v); if (n.length === 11 && n[0] === "1") n = n.slice(1);
        if (n.length !== 10) return;
        this.text(p1, n.slice(0, 3)); this.text(p2, n.slice(3, 6)); this.text(p3, n.slice(6));
      }
    };
  }

  /** Fill one copy of the form for `who` = "b" (primary) or "c" (co-borrower). */
  function fillCopy(F, f, pii, who) {
    var co = who === "c", res = f.loan_type === "residential", joint = f.has_cob === "yes";
    var first = co ? f.c_first : f.b_first, last = co ? f.c_last : f.b_last;
    var fullName = [first, co ? "" : f.b_middle, last, co ? "" : f.b_suffix].filter(Boolean).join(" ");
    var otherName = co ? [f.b_first, f.b_last].join(" ") : joint ? [f.c_first, f.c_last].join(" ") : "";

    /* ---- Section 1a: personal information ---- */
    F.textAll("_1a_Name", fullName);
    F.text("3", fullName);
    if (!co) F.text("4", f.b_alt_names);
    var ssn = digits(co ? pii.c_ssn : pii.b_ssn);
    if (ssn.length === 9) { F.text("5", ssn.slice(0, 3)); F.text("6", ssn.slice(3, 5)); F.text("7", ssn.slice(5)); }
    F.date("_1a_Birth_1", "_1a_Birth_2", "_1a_Birth_3", co ? pii.c_dob : pii.b_dob);
    F.radio("Group1", CITIZEN[co ? f.c_citizenship : f.b_citizenship]);
    if (joint) {
      F.radio("Group2", "I am applying for joint credit");
      F.text("_1a_Borrowers_Number", "2");
      F.text("_1a_Borrower_s_Name", otherName);
    } else {
      F.radio("Group2", "I am applying for individual credit.");
    }
    if (co) {
      F.radio("Group3", f.c_marital);
      var same = f.c_same_addr !== "No";
      F.text("_1a_Address_St", same ? f.b_addr : f.c_addr);
      F.text("_1a_Address_City", same ? f.b_city : f.c_city);
      F.drop("_1a_Address_State", same ? f.b_state : f.c_state);
      F.text("_1a_Address_Zip", same ? f.b_zip : f.c_zip);
      F.text("_1a_Address_Country", "USA");
      F.check("_1a_Does_Not_Apply2", true);
    }
    if (!co) {
      F.radio("Group3", f.b_marital);
      F.text("_1a_Dependents", f.b_dependents);
      F.text("_1a_Dependent_Age", f.b_dep_ages);
    }
    F.phone("_1a_PhoneC1", "_1a_PhoneC2", "_1a_PhoneC3", co ? f.c_phone : f.b_phone);
    if (!co) F.phone("_1a_PhoneW1", "_1a_PhoneW2", "_1a_PhoneW3", f.b_work_phone);
    F.text("_1a_Email", co ? f.c_email : f.b_email);

    if (!co) {
      F.text("_1a_Address_St", f.b_addr);
      F.text("_1a_Address_City", f.b_city);
      F.drop("_1a_Address_State", f.b_state);
      F.text("_1a_Address_Zip", f.b_zip);
      F.text("_1a_Address_Country", f.b_state === "Outside U.S." ? f.b_country : "USA");
      F.text("Text1", f.b_years_at);
      F.text("Text2", f.b_months_at);
      F.radio("Group5", HOUSING[f.b_housing]);
      if (f.b_housing === "Rent") F.text("_1a_Address_Rent", money(f.b_rent));
      if (f.b_prev_addr) {
        F.text("_1a_FormerAddress_St", f.b_prev_addr);
        F.text("_1a_Former_Address_City", f.b_prev_city);
        F.drop("_1a_Former_Address_State", f.b_prev_state);
        F.text("_1a_Former_Address_Zip", f.b_prev_zip);
        F.text("_1a_Former_Address_Country", "USA");
        F.text("Text3", f.b_prev_years);
        F.radio("Group7", HOUSING[f.b_prev_housing]);
      } else if (res) {
        F.check("_1a_Does_Not_Apply1", true);
      }
      F.check("_1a_Does_Not_Apply2", true); // mailing address = current address
    }

    /* ---- Section 1b: current employment ---- */
    var employer = co ? f.ci_employer : f.i_employer;
    var working = co ? !!(f.ci_employer || f.ci_income) : (f.i_status && f.i_status !== "Retired");
    if (!working) {
      F.check("_1b_Does_Not_Apply1", true);
    } else {
      F.text("_1b_Employer", employer);
      if (!co) {
        F.phone("_1b_PhoneE1", "_1b_PhoneE2", "_1b_PhoneE3", f.i_emp_phone);
        F.text("_1b_Address", f.i_emp_addr);
        F.text("_1b_Position", f.i_title);
        F.date("_1b_Employment_Start_Month", "_1b_Employment_Start_Day", "_1b_Employment_Start_Year", f.i_start);
        F.text("Text6", f.i_years);
        F.check("_1b_Statement", f.i_family === "Yes");
        var self = f.i_status === "Self-employed" || f.i_status === "Business owner";
        if (self) {
          F.check("_1b_Owner", true);
          F.radio("Group9", f.i_self_share === "25% or more" ? "I have an ownership share of 25% or more." : f.i_self_share ? "I have an ownership share of less than 25%." : "");
          F.text("_1b_Monthly_Income_Loss", money(f.i_income));
        }
      }
      var parts = co ? [f.ci_income] : [f.i_base, f.i_overtime, f.i_bonus, f.i_commission, f.i_military, f.i_emp_other];
      var anyBreakdown = parts.some(function (p) { return money(p); });
      var bigOwner = !co && (f.i_status === "Self-employed" || f.i_status === "Business owner") && f.i_self_share === "25% or more";
      if (bigOwner) { F.text("_1b_IncomeTotal", money(f.i_income)); }
      else if (co || !anyBreakdown) { F.text("_1b_Base", money(co ? f.ci_income : f.i_income)); F.text("_1b_IncomeTotal", money(co ? f.ci_income : f.i_income)); }
      else {
        F.text("_1b_Base", money(f.i_base)); F.text("_1b_Overtime", money(f.i_overtime)); F.text("_1b_Bonus", money(f.i_bonus));
        F.text("_1b_Commission", money(f.i_commission)); F.text("_1b_Military", money(f.i_military)); F.text("_1b_Other", money(f.i_emp_other));
        F.text("_1b_IncomeTotal", sumMoney(parts));
      }
    }

    /* ---- 1c additional job (not collected) / 1d previous job / 1e other income ---- */
    if (res || co) F.check("_1c_Does_Not_Apply", true);
    if (!co && f.pe_employer) {
      F.text("_1d_Employer", f.pe_employer);
      F.text("_1d_Position", f.pe_title);
      F.date("_1d_Employment_Start_Month", "_1d_Employment_Start_Day", "_1d_Employment_Start_Year", f.pe_start);
      F.date("_1d_Employment_End_Month", "_1d_Employment_End_Day", "_1d_Employent_End_Year", f.pe_end);
      F.text("_1d_Gross_Monthly_Income", money(f.pe_income));
    } else if (res || co) {
      F.check("_1d_Does_Not_Apply", true);
    }
    if (!co && money(f.i_other)) {
      F.drop("_1e_Income_Other_Sources1", OTHER_INC[f.i_other_src] || "Other");
      F.text("_1e_Other_Monthly_Income1", money(f.i_other));
      F.text("_1e_Total_Other_Monthly_Income", money(f.i_other));
    } else if (res || co) {
      F.check("_1e_Does_Not_Apply", true);
    }

    /* Sections 2–4 describe the household's finances once, on the primary borrower's copy. */
    if (!co) {
      /* ---- 2a accounts (5 rows on the form) ---- */
      var accts = res ? list(f.asset_list) : [
        { type: "Checking", value: f.a_liquid }, { type: "Stocks", value: f.a_invest }, { type: "Retirement (401k, IRA)", value: f.a_retire }
      ];
      accts = accts.filter(function (a) { return money(a.value); });
      accts.slice(0, 5).forEach(function (a, i) {
        F.drop("_2a_Account_Type" + (i + 1), ACCOUNT[a.type] || "");
        F.text("_2a_Financial" + (i + 1), a.institution || (ACCOUNT[a.type] ? "" : a.type));
        F.text("_2a_Cash" + (i + 1), money(a.value));
      });
      F.text("_2a_Total_Cash", sumMoney(accts.map(function (a) { return a.value; })));
      if (res) F.check("_2b_Does_Not_Apply", true);

      /* ---- 2c debts (5 rows) ---- */
      var debts = res ? list(f.liab_list).filter(function (l) { return money(l.balance) || money(l.payment); }) : [];
      debts.slice(0, 5).forEach(function (l, i) {
        F.drop("_2c_Account_Type" + (i + 1), DEBT[l.type] || "Other");
        F.text("_2c_Company" + (i + 1), l.creditor);
        F.text("_2c_Unpaid" + (i + 1), money(l.balance));
        F.check("_2c_Paid_Off" + (i + 1), l.payoff === "Yes");
        F.text("_2c_Monthly" + (i + 1), money(l.payment));
      });
      if (res && !debts.length) F.check("_2c_Does_Not_Apply", true);

      /* ---- 3 real estate owned (3 properties on the form) ---- */
      var reo = res ? list(f.reo_list).filter(function (r) { return r.addr || money(r.value); }) : [];
      if (res && !reo.length) F.check("_3_Do_Not_Own", true);
      reo.slice(0, 3).forEach(function (r, i) {
        var p = ["_3a_", "_3b_", "_3c_"][i];
        F.text(p + "Address_St", r.addr);
        F.text(p + "Value", money(r.value));
        F.drop(p + "Status", r.status === "Pending sale" ? "Pending Sale" : r.status);
        F.drop(p + "Intended_Occupancy", REO_OCC[r.occupancy]);
        F.text(p + "Monthly_Expenses", money(r.expenses));
        F.text(p + "Monthly_Rent", money(r.rent));
        if (money(r.mtg_balance) || money(r.mtg_payment)) {
          F.text(p + "Monthly_Mortgage1", money(r.mtg_payment));
          F.text(p + "Unpaid1", money(r.mtg_balance));
        } else {
          F.check(p + "Mortgage_Does_Not_Apply", true);
        }
      });

      /* ---- 4a loan and property ---- */
      F.text("_4a_Loan_Amount", money(f.loan_amount));
      var purpose = f.loan_purpose === "Purchase" ? "Purchase" : /refinance/i.test(f.loan_purpose || "") ? "Refinance" : f.loan_purpose ? "Other" : "";
      F.radio("Group11", purpose);
      if (purpose === "Other") F.text("_4a_Purpose_other_spec", f.loan_purpose);
      F.text("_4a_Address_St", f.p_addr);
      F.text("_4a_Address_City", f.p_city);
      F.drop("_4a_Address_State", f.p_state);
      F.text("_4a_Address_Zip", f.p_zip);
      F.text("_4a_Units", f.p_units || (res ? "1" : ""));
      F.text("_4a_Value", money(f.value));
      F.radio("Group12", SUBJ_OCC[f.p_occupancy]);
      F.yesNo("Group13", f.p_mixed_use);
      F.yesNo("Group14", f.p_manufactured);

      /* ---- 4d gifts ---- */
      if (money(f.gift_amount)) {
        F.drop("_4d_Asset_Type1", "Cash Gift");
        F.drop("_4d_Source1", GIFT_SRC[f.gift_source] || "Other");
        F.text("_4d_Cash1", money(f.gift_amount));
      } else if (res) {
        F.check("_4d_Does_Not_Apply", true);
      }

      /* ---- 5 declarations (A–M) ---- */
      F.yesNo("Group19", f.dx_occupy);
      F.yesNo("Group20", f.dx_own3);
      F.drop("_5a_About_A3", PRIOR_TYPE[f.dx_own3_type]);
      F.drop("_5a_About_A4", PRIOR_TITLE[f.dx_own3_title]);
      F.yesNo("Group21", f.dx_family);
      F.yesNo("Group22", f.dx_undisclosed);
      F.text("_5a_About_C2", money(f.dx_undisclosed_amt));
      F.yesNo("Group23", f.dx_other_mtg);
      F.yesNo("Group24", f.dx_new_credit);
      F.yesNo("Group25", f.dx_pace);
      F.yesNo("Group26", f.dx_cosign);
      F.yesNo("Group27", f.d_judg);
      F.yesNo("Group28", f.d_fed);
      F.yesNo("Group29", f.d_suit);
      F.yesNo("Group30", f.dx_conveyed);
      F.yesNo("Group31", res ? f.dx_short : "");
      F.yesNo("Group32", res ? f.dx_foreclosed : f.d_fc);
      F.yesNo("Group33", f.d_bk);
      F.check("_5bM_ch7", has(f.dx_bk_type, "Chapter 7"));
      F.check("_5bM_ch11", has(f.dx_bk_type, "Chapter 11"));
      F.check("_5bM_ch12", has(f.dx_bk_type, "Chapter 12"));
      F.check("_5bM_ch13", has(f.dx_bk_type, "Chapter 13"));

      /* ---- 7 military service ---- */
      F.yesNo("Group34", f.mil_service);
      F.check("_7_current", has(f.mil_status, "Currently serving on active duty"));
      F.date("_7_Active_Duty_Month", "_7_Active_Duty_day", "_7_Active_Duty_Year", f.mil_expires);
      F.check("_7_retired", has(f.mil_status, "Currently retired, discharged, or separated from service"));
      F.check("_7_non_active", has(f.mil_status, "Only period of service was as a non-activated member of the Reserve or National Guard"));
      F.check("_7_surviving", has(f.mil_status, "Surviving spouse"));
    }

    /* ---- 8 demographic information (each borrower's own answers) ---- */
    var p = co ? "cdm_" : "dm_";
    var eth = f[p + "eth"], race = f[p + "race"], sex = f[p + "sex"];
    if (eth || race || sex) {
      F.check("_8_hispanic", has(eth, "Hispanic or Latino") || has(eth, "Mexican") || has(eth, "Puerto Rican") || has(eth, "Cuban") || has(eth, "Other Hispanic or Latino"));
      F.check("_8_ethnicity_Mexican", has(eth, "Mexican"));
      F.check("_8_ethnicity_Puerto_Rican", has(eth, "Puerto Rican"));
      F.check("_8_ethnicity_Cuban", has(eth, "Cuban"));
      F.check("_8_hispanic_other", has(eth, "Other Hispanic or Latino"));
      F.text("_8_other_hispanic", has(eth, "Other Hispanic or Latino") ? f[p + "eth_other"] : "");
      F.check("_8_not_hispanic", has(eth, "Not Hispanic or Latino"));
      F.check("_8_ethnicity_refuse", has(eth, "I do not wish to provide this information"));
      F.radio("Group35", has(sex, "I do not wish to provide this information") ? "I do not wish to provide this information" : has(sex, "Female") ? "Female" : has(sex, "Male") ? "Male" : "");
      var detail = f[p + "race_detail"];
      F.check("_8_race_native_american", has(race, "American Indian or Alaska Native"));
      F.text("_8_race_tribe", has(race, "American Indian or Alaska Native") ? detail : "");
      var asianSubs = ["Asian Indian", "Chinese", "Filipino", "Japanese", "Korean", "Vietnamese", "Other Asian"];
      F.check("_8_race_asian", has(race, "Asian") || asianSubs.some(function (s) { return has(race, s); }));
      F.check("_8_race_indian", has(race, "Asian Indian"));
      F.check("_8_race_chinese", has(race, "Chinese"));
      F.check("_8_race_filipino", has(race, "Filipino"));
      F.check("_8_race_japanese", has(race, "Japanese"));
      F.check("_8_race_korean", has(race, "Korean"));
      F.check("_8_race_vietnamese", has(race, "Vietnamese"));
      F.check("_8_race_asian_other", has(race, "Other Asian"));
      F.text("_8_asian_race", has(race, "Other Asian") ? detail : "");
      F.check("_8_race_black", has(race, "Black or African American"));
      var piSubs = ["Native Hawaiian", "Guamanian or Chamorro", "Samoan", "Other Pacific Islander"];
      F.check("_8_race_pacific", has(race, "Native Hawaiian or Other Pacific Islander") || piSubs.some(function (s) { return has(race, s); }));
      F.check("_8_race_hawaiian", has(race, "Native Hawaiian"));
      F.check("_8_race_guamanian", has(race, "Guamanian or Chamorro"));
      F.check("_8_race_samoan", has(race, "Samoan"));
      F.check("_8_race_pacific_other", has(race, "Other Pacific Islander"));
      F.text("_8_pacific_race", has(race, "Other Pacific Islander") ? detail : "");
      F.check("_8_race_white", has(race, "White"));
      F.check("_8_race_refuse", has(race, "I do not wish to provide this information"));
      // Collected online by the applicant, not by visual observation or surname.
      F.radio("Group36", "NO"); F.radio("Group37", "NO"); F.radio("Group38", "NO");
      F.radio("Group39", "Email or Internet");
    }
    // Section 9 (loan originator) is intentionally left blank — completed by the placing lender.
  }

  async function fill1003(PDFLib, templateBytes, data) {
    var f = data.fields || {}, pii = data.pii || {};
    var who = f.has_cob === "yes" ? ["b", "c"] : ["b"];
    var out = await PDFLib.PDFDocument.create();
    for (var i = 0; i < who.length; i++) {
      var doc = await PDFLib.PDFDocument.load(templateBytes);
      var form = doc.getForm();
      fillCopy(Filler(PDFLib, form), f, pii, who[i]);
      form.flatten();
      // The form is tagged (accessibility structure tree) and those tags point at the
      // field widgets that flatten() removes — drop the tags so no references dangle.
      doc.catalog.delete(PDFLib.PDFName.of("StructTreeRoot"));
      doc.catalog.delete(PDFLib.PDFName.of("MarkInfo"));
      doc.getPages().forEach(function (pg) {
        pg.node.delete(PDFLib.PDFName.of("StructParents"));
        // pdf-lib's flatten() leaves the removed widgets listed in each page's /Annots — prune them.
        var annots = pg.node.Annots();
        if (!annots) return;
        var keep = [];
        for (var a = 0; a < annots.size(); a++) {
          var ref = annots.get(a);
          if (!(ref instanceof PDFLib.PDFRef) || doc.context.lookup(ref)) keep.push(ref);
        }
        if (keep.length) pg.node.set(PDFLib.PDFName.of("Annots"), doc.context.obj(keep));
        else pg.node.delete(PDFLib.PDFName.of("Annots"));
      });
      var clean = await PDFLib.PDFDocument.load(await doc.save());
      var pages = await out.copyPages(clean, clean.getPageIndices());
      pages.forEach(function (pg) { out.addPage(pg); });
    }
    var borrower = [f.b_first, f.b_last].filter(Boolean).join(" ");
    out.setTitle("Uniform Residential Loan Application — " + borrower + (data.app && data.app.ref ? " (" + data.app.ref + ")" : ""));
    out.setAuthor("Regal Group International");
    out.setSubject("Fannie Mae Form 1003 / Freddie Mac Form 65");
    return out.save();
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { fill1003: fill1003 };
  else root.RegalURLA = { fill1003: fill1003 };
})(this);
