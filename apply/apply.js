/* =========================================================
   Regal loan portal — multi-step application
   ========================================================= */
(function () {
  "use strict";
  var R = window.Regal, esc = R.esc;
  var DRAFT_KEY = "regal_app_draft_v1";
  var NO_DRAFT = /^(b_ssn|c_ssn|b_dob|c_dob|e_ein|consent_.*|sign_name|sign_date)$/;

  var v = {};
  var cur = 0;
  var maxReached = 0;

  var el = {
    form: document.getElementById("appForm"), fields: document.getElementById("fields"), review: document.getElementById("review"),
    list: document.getElementById("stepList"), title: document.getElementById("stepTitle"), sub: document.getElementById("stepSub"),
    count: document.getElementById("stepCount"), back: document.getElementById("backBtn"), next: document.getElementById("nextBtn"),
    err: document.getElementById("formErr"), saved: document.getElementById("savedNote")
  };

  /* ---------- draft ---------- */
  try {
    var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d && d.v) { v = d.v; maxReached = d.max || 0; }
  } catch (e) {}
  var qType = new URLSearchParams(location.search).get("type");
  if (qType && R.LOAN_TYPES.some(function (t) { return t.v === qType; }) && !v.loan_type) v.loan_type = qType;

  function saveDraft() {
    var out = {};
    Object.keys(v).forEach(function (k) { if (!NO_DRAFT.test(k)) out[k] = v[k]; });
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: out, max: maxReached })); el.saved.textContent = "Progress saved on this device"; } catch (e) {}
  }

  /* ---------- steps ---------- */
  function visibleSteps() { return R.STEPS.filter(function (s) { return R.stepVisible(s, v); }); }

  function renderStepList() {
    var steps = visibleSteps();
    el.list.innerHTML = steps.map(function (s, i) {
      var cls = i === cur ? "is-cur" : (i <= maxReached ? "is-done" : "");
      return '<li class="' + cls + '" data-i="' + i + '"><span class="n">' + (i < cur || (i <= maxReached && i !== cur) ? "✓" : i + 1) +
        '</span><span class="t">' + esc(s.title) + "</span></li>";
    }).join("");
  }
  el.list.addEventListener("click", function (e) {
    var li = e.target.closest("li");
    if (!li) return;
    var i = +li.dataset.i;
    if (i <= maxReached && i !== cur) go(i);
  });

  /* ---------- field rendering ---------- */
  function reqMark(f) { return f.req ? '<span class="req" aria-hidden="true">*</span>' : ""; }
  function lock(f) { return f.pii ? '<span class="f__lock">🔒 encrypted</span>' : ""; }

  function fieldHTML(f, i) {
    if (f.t === "heading") return '<h3 class="heading" data-fi="' + i + '">' + esc(f.l) + "</h3>";
    var id = "f_" + f.n, val = v[f.n] == null ? "" : String(v[f.n]);
    var cls = "f" + (f.half ? " f--half" : "") + (f.third ? " f--third" : "") + (f.t === "radio" ? " f--radio" : "");
    var help = f.help ? '<span class="f__help">' + esc(f.help) + "</span>" : "";
    var errs = '<span class="f__err" id="' + id + '_err"></span>';
    var ac = f.ac ? ' autocomplete="' + f.ac + '"' : "";
    var ph = f.ph ? ' placeholder="' + esc(f.ph) + '"' : "";
    var input;

    switch (f.t) {
      case "cards":
        input = '<div class="cards" role="radiogroup">' + f.opts.map(function (o) {
          return '<label><input type="radio" name="' + f.n + '" value="' + o.v + '"' + (val === o.v ? " checked" : "") + ' /><strong>' +
            esc(o.l) + "</strong><span>" + esc(o.d) + "</span></label>";
        }).join("") + "</div>";
        return '<div class="' + cls + '" data-fi="' + i + '"><span class="f__label">' + esc(f.l) + reqMark(f) + "</span>" + input + errs + "</div>";
      case "radio":
        input = '<div class="radios" role="radiogroup">' + f.opts.map(function (o) {
          var ov = f.map ? f.map[o] : o;
          return '<label><input type="radio" name="' + f.n + '" value="' + esc(ov) + '"' + (val === ov ? " checked" : "") + " />" + esc(o) + "</label>";
        }).join("") + "</div>";
        return '<div class="' + cls + '" data-fi="' + i + '"><span class="f__label">' + esc(f.l) + reqMark(f) + "</span>" + input + errs + "</div>";
      case "check":
        return '<div class="' + cls + '" data-fi="' + i + '"><label class="check"><input type="checkbox" name="' + f.n + '"' +
          (val === "yes" ? " checked" : "") + " /><span>" + esc(f.l) + "</span></label>" + errs + "</div>";
      case "select":
      case "state":
        var opts = f.t === "state" ? R.STATES : f.opts;
        input = '<select id="' + id + '" name="' + f.n + '"><option value="">Select…</option>' + opts.map(function (o) {
          return '<option' + (val === o ? " selected" : "") + ">" + esc(o) + "</option>";
        }).join("") + "</select>";
        break;
      case "textarea":
        input = '<textarea id="' + id + '" name="' + f.n + '"' + ph + ">" + esc(val) + "</textarea>";
        break;
      case "money":
        input = '<div class="money"><input type="text" inputmode="numeric" id="' + id + '" name="' + f.n + '" value="' + esc(fmtNum(val)) + '"' + ph + " /></div>";
        break;
      case "ssn":
        input = '<input type="text" inputmode="numeric" autocomplete="off" id="' + id + '" name="' + f.n + '" value="' + esc(fmtSSN(val)) + '" placeholder="###-##-####" maxlength="11" />';
        break;
      case "ein":
        input = '<input type="text" inputmode="numeric" autocomplete="off" id="' + id + '" name="' + f.n + '" value="' + esc(fmtEIN(val)) + '" placeholder="##-#######" maxlength="10" />';
        break;
      default:
        var type = { email: "email", tel: "tel", date: "date", number: "number" }[f.t] || "text";
        input = '<input type="' + type + '" id="' + id + '" name="' + f.n + '" value="' + esc(val) + '"' + ac + ph +
          (f.t === "number" ? ' inputmode="numeric" min="0"' : "") + (f.readonly ? " readonly" : "") + " />";
    }
    return '<div class="' + cls + '" data-fi="' + i + '"><label for="' + id + '">' + esc(f.l) + reqMark(f) + lock(f) + "</label>" + input + help + errs + "</div>";
  }

  function fmtNum(s) { var d = String(s || "").replace(/\D/g, ""); return d ? Number(d).toLocaleString("en-US") : ""; }
  function fmtSSN(s) { var d = String(s || "").replace(/\D/g, "").slice(0, 9); return d.length > 5 ? d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5) : d.length > 3 ? d.slice(0, 3) + "-" + d.slice(3) : d; }
  function fmtEIN(s) { var d = String(s || "").replace(/\D/g, "").slice(0, 9); return d.length > 2 ? d.slice(0, 2) + "-" + d.slice(2) : d; }

  function applyVisibility() {
    var step = visibleSteps()[cur];
    step.fields.forEach(function (f, i) {
      var node = el.fields.querySelector('[data-fi="' + i + '"]');
      if (node) node.hidden = !R.fieldVisible(f, v);
    });
  }

  /* ---------- review ---------- */
  function renderReview() {
    var steps = visibleSteps();
    el.review.innerHTML = steps.slice(0, -1).map(function (s, si) {
      var rows = s.fields.filter(function (f) { return f.n && R.fieldVisible(f, v) && v[f.n]; }).map(function (f) {
        var d = f.t === "ssn" ? "•••-••-" + String(v[f.n]).slice(-4) : f.t === "ein" ? "••-•••" + String(v[f.n]).slice(-4) : R.display(f, v[f.n]);
        return "<dt>" + esc(f.l) + "</dt><dd>" + esc(d) + "</dd>";
      }).join("");
      return '<section class="review__sec"><header><h3>' + esc(s.title) + '</h3><button type="button" class="linkbtn" data-edit="' + si +
        '">Edit</button></header><dl>' + (rows || '<dd class="muted">—</dd>') + "</dl></section>";
    }).join("");
  }
  el.review.addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]");
    if (b) go(+b.dataset.edit);
  });

  /* ---------- navigation ---------- */
  function go(i) {
    var steps = visibleSteps();
    cur = Math.max(0, Math.min(i, steps.length - 1));
    maxReached = Math.max(maxReached, cur);
    var s = steps[cur];
    if (s.id === "review" && !v.sign_date) v.sign_date = new Date().toLocaleDateString("en-US");
    el.count.textContent = "Step " + (cur + 1) + " of " + steps.length;
    el.title.textContent = s.title;
    el.sub.textContent = s.sub || "";
    el.fields.innerHTML = s.fields.map(fieldHTML).join("");
    el.review.hidden = !s.review;
    if (s.review) renderReview();
    el.back.style.visibility = cur === 0 ? "hidden" : "visible";
    el.next.textContent = s.review ? "Submit application" : "Continue";
    el.err.hidden = true;
    applyVisibility();
    renderStepList();
    saveDraft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  el.back.addEventListener("click", function () { go(cur - 1); });

  el.fields.addEventListener("input", onInput);
  el.fields.addEventListener("change", onInput);
  function onInput(e) {
    var t = e.target;
    if (!t.name) return;
    var f = findField(t.name);
    if (!f) return;
    if (f.t === "check") v[f.n] = t.checked ? "yes" : "";
    else if (f.t === "money") { var d = t.value.replace(/\D/g, ""); v[f.n] = d; if (e.type === "input") t.value = fmtNum(d); }
    else if (f.t === "ssn") { v[f.n] = t.value.replace(/\D/g, "").slice(0, 9); if (e.type === "input") t.value = fmtSSN(v[f.n]); }
    else if (f.t === "ein") { v[f.n] = t.value.replace(/\D/g, "").slice(0, 9); if (e.type === "input") t.value = fmtEIN(v[f.n]); }
    else v[f.n] = t.value;
    var node = t.closest(".f");
    if (node) node.classList.remove("has-err");
    applyVisibility();
    if (e.type === "change") { saveDraft(); renderStepList(); }
  }
  function findField(n) {
    for (var i = 0; i < R.STEPS.length; i++) for (var j = 0; j < R.STEPS[i].fields.length; j++) if (R.STEPS[i].fields[j].n === n) return R.STEPS[i].fields[j];
    return null;
  }

  /* ---------- validation ---------- */
  function validate(step) {
    var firstBad = null;
    step.fields.forEach(function (f, i) {
      if (!f.n || !R.fieldVisible(f, v)) return;
      var val = (v[f.n] || "").toString().trim(), msg = "";
      if (R.when(f.req, v) && !val) msg = f.t === "check" ? "Required to submit." : "Required.";
      else if (val) {
        if (f.t === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) msg = "Enter a valid email.";
        if (f.t === "tel" && val.replace(/\D/g, "").length < 10) msg = "Enter a valid phone number.";
        if (f.t === "ssn" && val.length !== 9) msg = "Enter all 9 digits.";
        if (f.t === "ein" && val.length !== 9) msg = "Enter all 9 digits.";
        if (f.n === "b_dob" || f.n === "c_dob") {
          var age = (Date.now() - new Date(val).getTime()) / 31557600000;
          if (!(age >= 18 && age < 110)) msg = "Enter a valid date of birth (18+).";
        }
        if (f.n === "sign_name" && v.b_last && val.toLowerCase().indexOf(String(v.b_last).toLowerCase()) === -1)
          msg = "Signature must match the borrower's name.";
      }
      var node = el.fields.querySelector('[data-fi="' + i + '"]');
      if (node) {
        node.classList.toggle("has-err", !!msg);
        var er = node.querySelector(".f__err");
        if (er) er.textContent = msg;
        if (msg && !firstBad) firstBad = node;
      }
    });
    if (firstBad) {
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      var inp = firstBad.querySelector("input,select,textarea");
      if (inp) setTimeout(function () { inp.focus({ preventScroll: true }); }, 250);
    }
    return !firstBad;
  }

  /* ---------- submit ---------- */
  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var steps = visibleSteps(), s = steps[cur];
    if (!validate(s)) return;
    if (!s.review) return go(cur + 1);

    // Only send fields that are visible in the final answers (drops stale hidden values).
    var out = {};
    steps.forEach(function (st) {
      st.fields.forEach(function (f) { if (f.n && R.fieldVisible(f, v) && v[f.n]) out[f.n] = v[f.n]; });
    });
    out.b_email = String(out.b_email || "").trim().toLowerCase();

    el.next.disabled = true;
    el.next.innerHTML = '<span class="spinner"></span> Submitting…';
    R.api("/api/applications", { json: { fields: out, summary: R.summarize(out) } }).then(function (res) {
      if (res.ok) {
        try { localStorage.removeItem(DRAFT_KEY); sessionStorage.setItem("regal_token", res.token); } catch (err) {}
        location.href = "/apply/portal.html?welcome=" + encodeURIComponent(res.ref) + "#" + res.id;
        return;
      }
      el.err.textContent = res.error || "We couldn't submit your application. Please try again or call (786) 247-0244.";
      el.err.hidden = false;
      el.err.scrollIntoView({ behavior: "smooth", block: "center" });
      el.next.disabled = false;
      el.next.textContent = "Submit application";
    });
  });

  go(0);
})();
