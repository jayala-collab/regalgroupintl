/* =========================================================
   Regal loan portal — borrower dashboard
   ========================================================= */
(function () {
  "use strict";
  var R = window.Regal, esc = R.esc;
  var TOKEN_KEY = "regal_token";
  var FALLBACK_STAGES = ["Application received", "Processing", "Underwriting", "Approved", "Closing", "Funded"]
    .map(function (l, i) { return { id: "f" + i, label: l, kind: i === 5 ? "won" : "open" }; });

  var token = null, me = null, curId = null, loginEmail = "";
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  function show(view) {
    ["loginView", "dashView", "loadingView"].forEach(function (v) { $(v).hidden = v !== view; });
    $("logoutBtn").hidden = view !== "dashView";
  }

  /* ---------- sign in ---------- */
  function loginErr(msg) { $("loginErr").textContent = msg || ""; $("loginErr").hidden = !msg; }

  $("emailForm").addEventListener("submit", function (e) {
    e.preventDefault();
    loginEmail = $("loginEmail").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(loginEmail)) return loginErr("Enter a valid email address.");
    loginErr("");
    var btn = e.target.querySelector("button"); btn.disabled = true;
    R.api("/api/auth/request-code", { json: { email: loginEmail } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return loginErr(res.error);
      $("emailForm").hidden = true; $("codeForm").hidden = false;
      $("loginInfo").hidden = false;
      $("loginInfo").textContent = "If " + loginEmail + " has an application with us, a code is on its way. It expires in 10 minutes." +
        (res.devCode ? " [dev code: " + res.devCode + "]" : "");
      $("loginCode").focus();
    });
  });

  $("codeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = $("loginCode").value.replace(/\D/g, "");
    if (code.length !== 6) return loginErr("Enter the 6-digit code from your email.");
    var btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
    R.api("/api/auth/verify", { json: { email: loginEmail, code: code } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return loginErr(res.error);
      token = res.token;
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch (err) {}
      loginErr(""); $("loginInfo").hidden = true;
      load();
    });
  });

  $("resendBtn").addEventListener("click", function () {
    $("codeForm").hidden = true; $("emailForm").hidden = false; $("loginInfo").hidden = true; loginErr("");
  });

  $("logoutBtn").addEventListener("click", function () {
    R.api("/api/logout", { method: "POST", token: token });
    signOut();
  });
  function signOut(msg) {
    token = null; me = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    $("who").textContent = "";
    show("loginView");
    loginErr(msg || "");
  }

  /* ---------- dashboard ---------- */
  function load() {
    if (!token) return show("loginView");
    show("loadingView");
    R.api("/api/me", { token: token }).then(function (res) {
      if (res._status === 401) return signOut("Your session expired. Please sign in again.");
      if (!res.ok) { show("loginView"); return loginErr(res.error); }
      me = res;
      $("who").textContent = res.email;
      if (!res.apps.length) { show("loginView"); return loginErr("No applications found for this email."); }
      var hashId = location.hash.slice(1);
      curId = res.apps.some(function (a) { return a.id === hashId; }) ? hashId : res.apps[0].id;
      var welcome = new URLSearchParams(location.search).get("welcome");
      if (welcome) {
        $("welcome").hidden = false;
        $("welcome").innerHTML = "<strong>Application " + esc(welcome) + " received.</strong> Thank you — Juan will review it personally. " +
          "Next, upload the documents below. You can come back any time and sign in with your email.";
        history.replaceState(null, "", location.pathname + "#" + curId);
      }
      render();
      show("dashView");
    });
  }

  function curApp() { return me.apps.filter(function (a) { return a.id === curId; })[0]; }

  function render() {
    var tabs = $("appTabs");
    tabs.hidden = me.apps.length < 2;
    tabs.innerHTML = me.apps.map(function (a) {
      return '<button class="btn btn--sm ' + (a.id === curId ? "btn--navy" : "btn--ghost") + '" data-app="' + a.id + '">' +
        esc(a.ref) + " · " + esc(a.loan_type_label) + "</button>";
    }).join("");
    renderHead();
    renderNeeds();
  }
  $("appTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-app]");
    if (!b) return;
    curId = b.dataset.app; history.replaceState(null, "", "#" + curId); render();
  });

  function renderHead() {
    var a = curApp();
    var stages = (me.stages && me.stages.length ? me.stages : FALLBACK_STAGES);
    var curStage = stages.filter(function (s) { return s.id === a.stage_id; })[0];
    var lost = curStage && curStage.kind === "lost";
    var shown = stages.filter(function (s) { return s.kind !== "lost"; });
    // Show open stages then the first "won" stage as the finish line.
    var firstWon = shown.filter(function (s) { return s.kind === "won"; })[0];
    shown = shown.filter(function (s) { return s.kind === "open"; }).concat(firstWon ? [firstWon] : []);
    var ci = Math.max(0, shown.findIndex(function (s) { return s.id === a.stage_id; }));

    var tracker = lost
      ? '<div class="notice notice--info" style="margin-top:20px">This file is currently closed. Please contact Juan with any questions.</div>'
      : '<div class="tracker">' + shown.map(function (s, i) {
          return '<div class="tracker__s ' + (i < ci ? "is-done" : i === ci ? "is-cur" : "") + '">' + esc(s.label) + "</div>";
        }).join("") + "</div>";

    $("loanHead").innerHTML =
      '<div class="loanhead"><div><p class="eyebrow">Application ' + esc(a.ref) + "</p><h1>" + esc(a.loan_type_label) + "</h1></div>" +
      '<div class="kv"><div>Amount<b>' + esc(R.money(a.loan_amount) || "—") + "</b></div><div>Purpose<b>" + esc(a.loan_purpose || "—") +
      "</b></div><div>Submitted<b>" + esc(R.fmtDate(a.created_at)) + "</b></div><div>Status<b>" + esc(lost ? "Closed" : (shown[ci] || {}).label || "Received") +
      "</b></div></div></div>" + tracker;
  }

  function renderNeeds() {
    var a = curApp();
    var secs = R.checklistFor(a);
    var byCat = {};
    a.documents.forEach(function (d) { (byCat[d.category] = byCat[d.category] || []).push(d); });
    var total = 0, done = 0;
    secs.forEach(function (s) { if (!s.other) s.items.forEach(function (it) { total++; if (byCat[it.label]) done++; }); });
    // Uploads whose category isn't on the list (e.g. removed request) show under "Other documents".
    var known = {};
    secs.forEach(function (s) { s.items.forEach(function (it) { known[it.label] = 1; }); });
    var orphans = a.documents.filter(function (d) { return !known[d.category]; });

    var html = '<div class="loanhead"><div><h2>Document checklist</h2><p class="lead small">Upload what you have now — not every item applies to every deal. ' +
      "We'll let you know if anything else is needed.</p></div><div class=\"small muted\"><b style=\"color:var(--ink)\">" + done + " of " + total +
      "</b> items received</div></div>" +
      '<div class="progress"><span style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></span></div>';

    secs.forEach(function (s) {
      html += '<div class="needs__sec' + (s.requested ? " needs__sec--req" : "") + '"><h3>' + esc(s.title) + "</h3>";
      s.items.forEach(function (it) {
        var files = (byCat[it.label] || []).concat(s.other ? orphans : []);
        var up = files.length > 0 && !s.other;
        html += '<div class="item' + (up ? " is-up" : "") + '" data-cat="' + esc(it.label) + '">' +
          '<span class="item__ic">' + (up ? "✓" : "") + "</span>" +
          '<div><div class="item__lbl">' + esc(s.other ? "Anything else you'd like us to have" : it.label) + "</div>" +
          (it.note ? '<div class="item__note">' + esc(it.note) + "</div>" : "") +
          '<div class="item__files">' + files.map(fileHTML).join("") + "</div>" +
          '<div class="item__bar" hidden><span></span></div></div>' +
          '<label class="btn btn--ghost btn--sm upl">' + (up ? "Add more" : "Upload") +
          '<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" /></label></div>';
      });
      html += "</div>";
    });
    $("needs").innerHTML = html;
  }

  function fileHTML(d) {
    return '<span class="file">📄 <button type="button" class="linkbtn" data-doc="' + d.id + '" data-name="' + esc(d.filename) + '">' +
      esc(d.filename) + "</button> · " + R.fmtSize(d.size) + " · " + R.fmtDate(d.created_at) + (d.uploaded_by === "admin" ? " · from Regal" : "") + "</span>";
  }

  /* ---------- uploads ---------- */
  $("needs").addEventListener("change", function (e) {
    if (e.target.type !== "file") return;
    var item = e.target.closest(".item");
    uploadFiles(item, Array.prototype.slice.call(e.target.files));
    e.target.value = "";
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    $("needs").addEventListener(ev, function (e) {
      var item = e.target.closest(".item"); if (!item) return;
      e.preventDefault(); item.classList.add("is-drag");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    $("needs").addEventListener(ev, function (e) {
      var item = e.target.closest(".item"); if (!item) return;
      e.preventDefault(); item.classList.remove("is-drag");
      if (ev === "drop" && e.dataTransfer.files.length) uploadFiles(item, Array.prototype.slice.call(e.dataTransfer.files));
    });
  });

  function uploadFiles(item, files) {
    var a = curApp(), cat = item.dataset.cat;
    var bar = item.querySelector(".item__bar"), fill = bar.querySelector("span"), list = item.querySelector(".item__files");
    var errs = [];
    (function next(i) {
      if (i >= files.length) {
        bar.hidden = true;
        if (errs.length) alert(errs.join("\n"));
        renderNeeds();
        return;
      }
      var f = files[i];
      if (f.size > 25 * 1024 * 1024) { errs.push(f.name + ": larger than 25 MB."); return next(i + 1); }
      bar.hidden = false; fill.style.width = "0%";
      var fd = new FormData(); fd.append("file", f); fd.append("category", cat);
      var xhr = new XMLHttpRequest();
      xhr.open("POST", window.REGAL_API + "/api/applications/" + a.id + "/documents");
      xhr.setRequestHeader("Authorization", "Bearer " + token);
      xhr.upload.onprogress = function (ev) { if (ev.lengthComputable) fill.style.width = Math.round(ev.loaded / ev.total * 100) + "%"; };
      xhr.onload = function () {
        var res = {}; try { res = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status === 401) return signOut("Your session expired. Please sign in again.");
        if (res.ok) { a.documents.push(res.document); list.insertAdjacentHTML("beforeend", fileHTML(res.document)); }
        else errs.push(f.name + ": " + (res.error || "upload failed"));
        next(i + 1);
      };
      xhr.onerror = function () { errs.push(f.name + ": network error"); next(i + 1); };
      xhr.send(fd);
    })(0);
  }

  /* ---------- downloads ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-doc]");
    if (!b) return;
    R.api("/api/documents/" + b.dataset.doc, { token: token, raw: true }).then(function (res) {
      if (!res || !res.ok) return alert("Couldn't open that file.");
      return res.blob().then(function (blob) {
        var url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = b.dataset.name; document.body.appendChild(link); link.click();
        setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 1000);
      });
    });
  });

  load();
})();
