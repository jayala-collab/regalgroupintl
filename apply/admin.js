/* =========================================================
   Regal loan portal — admin dashboard
   ========================================================= */
(function () {
  "use strict";
  var R = window.Regal, esc = R.esc;
  var TOKEN_KEY = "regal_admin_token";
  var token = null, apps = [], stages = [], detail = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };

  function show(view) {
    ["loginView", "listView", "detailView", "partnersView", "loadingView"].forEach(function (v) { $(v).hidden = v !== view; });
    var authed = view === "listView" || view === "detailView" || view === "partnersView";
    $("logoutBtn").hidden = !authed;
    $("homeLink").hidden = view !== "detailView" && view !== "partnersView";
  }
  function api(path, opts) {
    opts = opts || {}; opts.token = token;
    return R.api(path, opts).then(function (res) {
      if (res._status === 401) { signOut("Session expired — sign in again."); throw new Error("auth"); }
      return res;
    });
  }

  /* ---------- auth ---------- */
  function loginErr(m) { $("loginErr").textContent = m || ""; $("loginErr").hidden = !m; }
  $("pwForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = e.target.querySelector("button"); btn.disabled = true;
    R.api("/api/admin/login", { json: { password: $("pw").value } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return loginErr(res.error);
      loginErr(""); $("pw").value = "";
      $("pwForm").hidden = true; $("codeForm").hidden = false;
      if (res.devCode) $("codeInfo").textContent += " [dev code: " + res.devCode + "]";
      $("code").focus();
    });
  });
  $("codeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = e.target.querySelector("button"); btn.disabled = true;
    R.api("/api/admin/verify", { json: { code: $("code").value } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return loginErr(res.error);
      token = res.token;
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch (err) {}
      $("code").value = ""; $("codeForm").hidden = true; $("pwForm").hidden = false;
      route();
    });
  });
  $("logoutBtn").addEventListener("click", function () { R.api("/api/logout", { method: "POST", token: token }); signOut(); });
  function signOut(msg) {
    token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    show("loginView"); loginErr(msg || "");
  }
  $("homeLink").addEventListener("click", function (e) { e.preventDefault(); location.hash = ""; });

  /* ---------- routing ---------- */
  window.addEventListener("hashchange", route);
  function route() {
    if (!token) return show("loginView");
    var id = location.hash.slice(1);
    if (id === "partners") loadPartners(); else if (id) loadDetail(id); else loadList();
  }

  /* ---------- list ---------- */
  function loadList() {
    show("loadingView");
    Promise.all([api("/api/admin/applications"), api("/api/stages")]).then(function (r) {
      if (!r[0].ok) return alert(r[0].error);
      apps = r[0].apps; stages = r[1].stages || [];
      var sel = $("stageFilter"), keep = sel.value;
      sel.innerHTML = '<option value="">All stages</option>' + stages.map(function (s) { return '<option value="' + s.id + '">' + esc(s.label) + "</option>"; }).join("");
      sel.value = keep;
      renderList(); show("listView");
    }).catch(function () {});
  }
  $("q").addEventListener("input", renderList);
  $("stageFilter").addEventListener("change", renderList);

  function renderList() {
    var q = $("q").value.trim().toLowerCase(), st = $("stageFilter").value;
    var rows = apps.filter(function (a) {
      if (st && a.stage_id !== st) return false;
      if (!q) return true;
      return [a.ref, a.first_name, a.last_name, a.email, a.loan_type_label, a.source_label].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    $("count").textContent = rows.length + " of " + apps.length;
    $("rows").innerHTML = rows.length ? rows.map(function (a) {
      var pend = (a.extra_items || []).length ? ' <span class="pill pill--warn">' + a.extra_items.length + " requested</span>" : "";
      return '<tr data-id="' + a.id + '"><td><strong>' + esc(a.ref) + "</strong></td><td>" + esc(a.first_name + " " + a.last_name) +
        '<br><span class="muted small">' + esc(a.email) + "</span></td><td>" + esc(a.loan_type_label) +
        '<br><span class="muted small">' + esc(a.loan_purpose || "") + "</span></td><td>" + esc(R.money(a.loan_amount)) +
        '</td><td class="small">' + esc(a.source_label || "Direct") +
        "</td><td>" + (a.hs_error ? '<span class="pill pill--warn" title="' + esc(a.hs_error) + '">CRM sync failed</span>' : '<span class="pill">' + esc(a.stage_label || "—") + "</span>") +
        "</td><td>" + a.doc_count + pend + (a.last_upload ? '<br><span class="muted small">last ' + R.fmtDate(a.last_upload) + "</span>" : "") +
        "</td><td>" + R.fmtDate(a.created_at) + "</td></tr>";
    }).join("") : '<tr><td colspan="8" class="muted center" style="padding:40px">No applications yet.</td></tr>';
  }
  $("rows").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-id]");
    if (tr) location.hash = tr.dataset.id;
  });

  /* ---------- detail ---------- */
  function loadDetail(id) {
    show("loadingView");
    api("/api/admin/applications/" + id).then(function (res) {
      if (!res.ok) { alert(res.error); location.hash = ""; return; }
      detail = res; stages = res.stages || stages;
      renderDetail(); show("detailView");
    }).catch(function () {});
  }

  function renderDetail(revealed) {
    var a = detail.app, v = a.fields || {};
    var pii = revealed || a.pii_masked || {};

    var sections = R.STEPS.filter(function (s) { return R.stepVisible(s, v); }).map(function (s) {
      var rows = s.fields.filter(function (f) { return f.n && (f.pii ? pii[f.n] : v[f.n]); }).map(function (f) {
        var val = f.pii ? pii[f.n] : R.display(f, v[f.n]);
        if (revealed && f.t === "ssn") val = String(val).replace(/^(\d{3})(\d{2})(\d{4})$/, "$1-$2-$3");
        return "<dt>" + esc(f.l) + "</dt><dd" + (f.pii ? ' class="pii"' : "") + ">" + esc(val) + (f.pii ? " 🔒" : "") + "</dd>";
      }).join("");
      return rows ? '<section class="review__sec"><header><h3>' + esc(s.title) + "</h3></header><dl>" + rows + "</dl></section>" : "";
    }).join("");

    // Documents grouped by checklist
    var byCat = {};
    a.documents.forEach(function (d) { (byCat[d.category] = byCat[d.category] || []).push(d); });
    var secs = R.checklistFor(a), known = {};
    secs.forEach(function (s) { s.items.forEach(function (it) { known[it.label] = 1; }); });
    var total = 0, done = 0;
    var docsHtml = secs.map(function (s) {
      return '<div class="needs__sec' + (s.requested ? " needs__sec--req" : "") + '"><h3>' + esc(s.title) + "</h3>" + s.items.map(function (it) {
        var files = (byCat[it.label] || []).concat(s.other ? a.documents.filter(function (d) { return !known[d.category]; }) : []);
        if (!s.other) { total++; if (files.length) done++; }
        return '<div class="item' + (files.length && !s.other ? " is-up" : "") + '"><span class="item__ic">' + (files.length && !s.other ? "✓" : "") + "</span><div>" +
          '<div class="item__lbl">' + esc(s.other ? "Other / uncategorized" : it.label) + "</div>" +
          (it.note ? '<div class="item__note">' + esc(it.note) + "</div>" : "") +
          '<div class="item__files">' + files.map(function (d) {
            return '<span class="file">📄 <button class="linkbtn" data-doc="' + d.id + '" data-name="' + esc(d.filename) + '">' + esc(d.filename) +
              "</button> · " + R.fmtSize(d.size) + " · " + R.fmtDate(d.created_at) + (d.uploaded_by === "admin" ? " · by you" : "") + "</span>";
          }).join("") + "</div></div>" +
          (s.requested ? '<button class="linkbtn" data-rm-item="' + it.id + '">Remove</button>' : "<span></span>") + "</div>";
      }).join("") + "</div>";
    }).join("");

    var stageOpts = stages.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === a.stage_id ? " selected" : "") + ">" + esc(s.label) + "</option>";
    }).join("");

    var log = (detail.log || []).map(function (l) {
      return "<div>" + new Date(l.at * 1000).toLocaleString() + " — " + esc(l.action) + (l.detail ? ": " + esc(l.detail) : "") + ' <span class="muted">(' + esc(l.actor) + ")</span></div>";
    }).join("");

    $("detailView").innerHTML =
      '<p class="small"><a href="#">← All applications</a></p>' +
      '<section class="card card__pad" style="margin:12px 0 24px"><div class="loanhead"><div><p class="eyebrow">' + esc(a.ref) + " · " + esc(a.loan_type_label) +
      "</p><h1>" + esc(a.first_name + " " + a.last_name) + '</h1><p class="lead small">' + esc(a.email) + " · " + esc(a.phone || "") +
      '</p></div><div class="kv"><div>Amount<b>' + esc(R.money(a.loan_amount) || "—") + "</b></div><div>Purpose<b>" + esc(a.loan_purpose || "—") +
      "</b></div><div>Submitted<b>" + R.fmtDate(a.created_at) + "</b></div><div>Checklist<b>" + done + " / " + total + "</b></div></div></div></section>" +
      '<div class="detail"><div class="stack">' +
      '<section class="card card__pad"><div class="loanhead" style="margin-bottom:16px"><h2>Application</h2>' +
      (Object.keys(a.pii_masked || {}).length ? '<button class="btn btn--ghost btn--sm" id="revealBtn">' + (revealed ? "Hide SSN / DOB" : "Reveal SSN / DOB") + "</button>" : "") +
      '</div><div class="review">' + sections + "</div></section>" +
      '<section class="card card__pad"><h2>Documents</h2>' + docsHtml +
      '<div class="needs__sec" style="padding-top:14px"><label class="btn btn--ghost btn--sm upl">Upload a file to this loan<input type="file" id="adminUpload" multiple /></label></div></section>' +
      "</div><aside class=\"stack\">" + exportCard(a) + sourceCard(a) +
      '<section class="card card__pad"><h3>Stage</h3><p class="small muted" style="margin:0 0 10px">Syncs to the HubSpot deal; the borrower sees it in their portal.</p>' +
      '<select id="stageSel">' + stageOpts + '</select><button class="btn btn--navy btn--sm" id="stageBtn" style="margin-top:10px;width:100%">Update stage</button></section>' +
      '<section class="card card__pad"><h3>Request a document</h3><form id="itemForm" class="stack">' +
      '<div class="f"><label for="itemLabel">Document</label><input type="text" id="itemLabel" placeholder="e.g. 2025 K-1 for ABC Holdings LLC" /></div>' +
      '<div class="f"><label for="itemNote">Note to borrower (optional)</label><textarea id="itemNote" style="min-height:70px"></textarea></div>' +
      '<label class="check" style="background:none;border:0;padding:0"><input type="checkbox" id="itemNotify" checked /><span>Email the borrower</span></label>' +
      '<button class="btn btn--gold btn--sm" style="width:100%">Add to needs list</button></form></section>' +
      '<section class="card card__pad"><h3>CRM</h3>' +
      (a.hs_error ? '<div class="notice notice--err small">' + esc(a.hs_error) + "</div>" : "") +
      (a.hs_deal_url ? '<p class="small"><a href="' + a.hs_deal_url + '" target="_blank" rel="noopener">Open deal in HubSpot ↗</a></p>' : '<p class="small muted">Not linked to HubSpot yet.</p>') +
      '<button class="btn btn--ghost btn--sm" id="syncBtn">' + (a.hs_deal_id ? "Re-sync contact" : "Retry HubSpot sync") + "</button></section>" +
      '<section class="card card__pad"><h3>Activity</h3><div class="log">' + (log || '<span class="muted">No activity yet.</span>') + "</div></section>" +
      "</aside></div>";

    bindDetail(!!revealed);
  }

  function bindDetail(revealed) {
    var a = detail.app;
    var rb = $("revealBtn");
    if (rb) rb.onclick = function () {
      if (revealed) return renderDetail();
      if (!confirm("Reveal SSN / DOB / EIN? This is logged.")) return;
      api("/api/admin/applications/" + a.id + "/reveal", { method: "POST" }).then(function (res) {
        if (res.ok) renderDetail(res.pii); else alert(res.error);
      }).catch(function () {});
    };
    $("stageBtn").onclick = function () {
      var btn = this; btn.disabled = true;
      api("/api/admin/applications/" + a.id + "/stage", { json: { stageId: $("stageSel").value } }).then(function (res) {
        btn.disabled = false;
        if (!res.ok) return alert(res.error);
        btn.textContent = "Saved ✓"; setTimeout(function () { btn.textContent = "Update stage"; }, 1500);
        a.stage_id = res.stage_id; a.stage_label = res.stage_label;
      }).catch(function () {});
    };
    $("itemForm").onsubmit = function (e) {
      e.preventDefault();
      var label = $("itemLabel").value.trim();
      if (!label) return;
      api("/api/admin/applications/" + a.id + "/items", { json: { label: label, note: $("itemNote").value.trim(), notify: $("itemNotify").checked } })
        .then(function (res) { if (!res.ok) return alert(res.error); loadDetail(a.id); }).catch(function () {});
    };
    $("syncBtn").onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = "Syncing…";
      api("/api/admin/applications/" + a.id + "/sync", { method: "POST" }).then(function (res) {
        if (!res.ok) { btn.disabled = false; btn.textContent = "Retry HubSpot sync"; return alert(res.error); }
        loadDetail(a.id);
      }).catch(function () {});
    };
    $("detailView").querySelectorAll("[data-rm-item]").forEach(function (b) {
      b.onclick = function () {
        if (!confirm("Remove this requested item?")) return;
        api("/api/admin/applications/" + a.id + "/items/" + b.dataset.rmItem, { method: "DELETE" }).then(function () { loadDetail(a.id); }).catch(function () {});
      };
    });
    $("adminUpload").onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      (function next(i) {
        if (i >= files.length) return loadDetail(a.id);
        var fd = new FormData(); fd.append("file", files[i]); fd.append("category", "Other");
        R.api("/api/applications/" + a.id + "/documents", { method: "POST", body: fd, token: token }).then(function (res) {
          if (!res.ok) alert(files[i].name + ": " + res.error);
          next(i + 1);
        });
      })(0);
    };
  }

  function exportCard(a) {
    return '<section class="card card__pad"><h3>Loan files</h3>' +
      '<p class="small muted" style="margin:0 0 12px">Fannie Mae ULAD / MISMO 3.4 — imports into Calyx Point, Arive and LendingPad. Contains SSN; each download is logged.</p>' +
      '<button class="btn btn--navy btn--sm" style="width:100%" data-export="mismo.xml">Download MISMO 3.4 XML</button>' +
      "</section>";
  }

  function sourceCard(a) {
    var src = a.source || {}, rows = "";
    [["Most recent visit", src.last], ["First visit", src.first]].forEach(function (pair) {
      var t = pair[1];
      if (!t || (pair[0] === "First visit" && src.last && JSON.stringify(t) === JSON.stringify(src.last))) return;
      var bits = [];
      ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        if (t[k]) bits.push(k.replace("utm_", "") + ": " + t[k]);
      });
      if (t.gclid) bits.push("Google Ads click");
      if (t.fbclid) bits.push("Facebook/Instagram click");
      if (t.referrer) bits.push("from " + t.referrer);
      if (t.landing) bits.push("landed on " + t.landing);
      if (t.at) bits.push(new Date(t.at * 1000).toLocaleDateString());
      rows += '<p class="small" style="margin:8px 0 0"><strong>' + pair[0] + ":</strong> " + esc(bits.join(" · ") || "direct visit") + "</p>";
    });
    return '<section class="card card__pad"><h3>Source</h3><p style="margin:0;font-weight:600">' + esc(a.source_label || "Direct") + "</p>" + rows + "</section>";
  }

  /* ---------- referral partners ---------- */
  var partnerData = null;
  function loadPartners() {
    show("loadingView");
    api("/api/admin/partners").then(function (res) {
      if (!res.ok) return alert(res.error);
      partnerData = res; renderPartners(); show("partnersView");
    }).catch(function () {});
  }
  function partnerLink(code) {
    var site = (partnerData && partnerData.site) || location.origin;
    return $("linkTarget").value === "home" ? site + "/?ref=" + code : site + "/apply/?ref=" + code;
  }
  function renderPartners() {
    var list = partnerData.partners;
    $("partnerRows").innerHTML = list.length ? list.map(function (p) {
      return "<tr><td><strong>" + esc(p.name) + "</strong>" + (p.firm ? '<br><span class="muted small">' + esc(p.firm) + "</span>" : "") +
        (p.kind ? '<br><span class="pill">' + esc(p.kind) + "</span>" : "") +
        '</td><td class="small"><code>' + esc(partnerLink(p.code)) + '</code><br><button class="linkbtn" data-copy="' + esc(p.code) + '">Copy link</button></td>' +
        "<td>" + p.apps + "</td><td>" + p.funded + "</td><td>" + esc(R.money(p.volume) || "—") + '</td><td class="small">' +
        (p.last_app ? R.fmtDate(p.last_app) : "—") + '</td><td><button class="linkbtn" data-rm-partner="' + esc(p.code) + '">Remove</button></td></tr>';
    }).join("") : '<tr><td colspan="7" class="muted center" style="padding:32px">No partners yet — add your first one on the right.</td></tr>';
    var u = partnerData.unknown || [];
    $("unknownCodes").hidden = !u.length;
    $("unknownCodes").innerHTML = u.length ? "<strong>Unregistered codes seen on applications:</strong> " +
      u.map(function (x) { return "<code>" + esc(x.code) + "</code> (" + x.apps + ")"; }).join(", ") +
      '<br><span class="muted">Add a partner with the same code to credit them.</span>' : "";
  }
  $("linkTarget").addEventListener("change", function () { if (partnerData) renderPartners(); });
  $("partnerRows").addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]"), rm = e.target.closest("[data-rm-partner]");
    if (c) {
      var link = partnerLink(c.dataset.copy);
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () {
        c.textContent = "Copied ✓"; setTimeout(function () { c.textContent = "Copy link"; }, 1500);
      }, function () { prompt("Copy this link:", link); });
    }
    if (rm && confirm("Remove this partner? Past applications keep their code.")) {
      api("/api/admin/partners/" + rm.dataset.rmPartner, { method: "DELETE" }).then(loadPartners).catch(function () {});
    }
  });
  $("partnerForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = e.target.querySelector("button"); btn.disabled = true;
    api("/api/admin/partners", { json: { name: $("pName").value, firm: $("pFirm").value, kind: $("pKind").value, email: $("pEmail").value } })
      .then(function (res) {
        btn.disabled = false;
        if (!res.ok) return alert(res.error);
        e.target.reset(); loadPartners();
      }).catch(function () { btn.disabled = false; });
  });

  document.addEventListener("click", function (e) {
    var x = e.target.closest("[data-export]");
    if (!x || !detail) return;
    var label = x.textContent; x.disabled = true; x.textContent = "Preparing…";
    R.api("/api/admin/applications/" + detail.app.id + "/" + x.dataset.export, { token: token, raw: true }).then(function (res) {
      x.disabled = false; x.textContent = label;
      if (!res || !res.ok) return alert("Couldn't generate that file.");
      var name = ((res.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/) || [])[1] || detail.app.ref + "." + x.dataset.export.split(".").pop();
      return res.blob().then(function (blob) {
        var url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = name; document.body.appendChild(link); link.click();
        setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 1000);
      });
    });
  });

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

  route();
})();
