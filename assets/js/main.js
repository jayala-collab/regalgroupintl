/* =========================================================
   Regal Group International — interactions
   ========================================================= */
(function () {
  "use strict";

  /* ---- Meta Pixel helper (no-op until a real Pixel ID is set in index.html) ---- */
  function track(event, params) {
    if (typeof window.fbq === "function" && window.META_PIXEL_ID && /^\d+$/.test(window.META_PIXEL_ID)) {
      window.fbq("track", event, params || {});
    }
  }

  /* ---- Sticky nav shading ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("nav--scrolled");
    else nav.classList.remove("nav--scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("navToggle");
  var mobile = document.getElementById("navMobile");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobile.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Count-up stats ---- */
  var counters = document.querySelectorAll("[data-count]");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (prefersReduced || isNaN(target)) { return; }
    var dur = 1100, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---- Lead form → Cloudflare relay → HubSpot (Contact + Deal in "Mortgage Leads") ---- */
  var RELAY_URL = "https://regal-lead-relay.j-ayala.workers.dev";
  var form = document.getElementById("leadForm");
  var note = document.getElementById("formNote");
  if (form) {
    var val = function (id) { var el = form.querySelector("#" + id); return el ? el.value.trim() : ""; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstname = val("firstname"), lastname = val("lastname"), email = val("email");
      if (!firstname || !lastname || !email) {
        note.style.color = "#E2A0A0";
        note.textContent = "Please add your name and email so Juan can reach you.";
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      note.style.color = ""; note.textContent = "";

      // Compose a readable summary of the loan details for the contact note / deal description
      var lines = [];
      [["Financing type", "type"], ["Loan purpose", "purpose"], ["Property location", "property"],
       ["Estimated amount", "amount"], ["Timeline", "timeline"]].forEach(function (p) {
        var v = val(p[1]); if (v) lines.push(p[0] + ": " + v);
      });
      var notes = val("message");
      var message = lines.join("\n") + (notes ? ("\n\nNotes: " + notes) : "");

      // Send raw fields — the relay builds the Contact + Deal in HubSpot
      var payload = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        phone: val("phone"),
        financing_type: val("type"),
        loan_purpose: val("purpose"),
        property_location: val("property"),
        loan_amount: val("amount"),
        timeline: val("timeline"),
        message: message,
        pageUri: location.href
      };

      fetch(RELAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().then(function (d) {
          if (res.ok && d && d.ok) {
            track("Lead", { content_name: "Get Started Form", content_category: val("type") || "Lending Inquiry" });
            note.style.color = "";
            note.textContent = "Thank you — your request has been received. Juan will personally follow up within one business day.";
            form.reset();
          } else {
            throw new Error((d && d.error) || ("HTTP " + res.status));
          }
        });
      }).catch(function () {
        note.style.color = "#E2A0A0";
        note.textContent = "Sorry — something went wrong. Please call (786) 247-0244 or email info@regalgroupintl.com.";
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }

  /* ---- Newsletter signup ("The Capital Brief") → same relay, contact-only ---- */
  var nlForm = document.getElementById("newsletterForm");
  var nlNote = document.getElementById("newsletterNote");
  if (nlForm) {
    nlForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (document.getElementById("nlEmail").value || "").trim();
      var first = (document.getElementById("nlFirst").value || "").trim();
      if (!email) {
        nlNote.style.color = "#E2A0A0";
        nlNote.textContent = "Please enter your email to subscribe.";
        return;
      }
      var nlBtn = nlForm.querySelector('button[type="submit"]');
      var nlLabel = nlBtn ? nlBtn.textContent : "";
      if (nlBtn) { nlBtn.disabled = true; nlBtn.textContent = "Subscribing…"; }
      nlNote.style.color = ""; nlNote.textContent = "";

      fetch(RELAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: first, lastname: "", email: email,
          newsletter: true,
          message: "Newsletter subscription — The Regal Capital Brief",
          financing_type: "Newsletter Subscriber",
          pageUri: location.href
        })
      }).then(function (res) {
        return res.json().then(function (d) {
          if (res.ok && d && d.ok) {
            track("Subscribe", { content_name: "The Regal Capital Brief" });
            nlNote.style.color = "";
            nlNote.textContent = "You're in — the next issue of The Regal Capital Brief is on its way.";
            nlForm.reset();
          } else {
            throw new Error((d && d.error) || ("HTTP " + res.status));
          }
        });
      }).catch(function () {
        nlNote.style.color = "#E2A0A0";
        nlNote.textContent = "Sorry — something went wrong. Please email info@regalgroupintl.com to subscribe.";
      }).then(function () {
        if (nlBtn) { nlBtn.disabled = false; nlBtn.textContent = nlLabel; }
      });
    });
  }

  /* ---- High-intent click tracking for Meta (Apply + checklist downloads) ---- */
  document.querySelectorAll('a[href*="floify.com"], a.apply-cta').forEach(function (a) {
    a.addEventListener("click", function () {
      track("InitiateCheckout", { content_name: "Apply — Floify" });
    });
  });
  document.querySelectorAll("a.card-doc").forEach(function (a) {
    a.addEventListener("click", function () {
      var href = a.getAttribute("href") || "";
      var name = href.split("/").pop().replace("-checklist.pdf", "").replace(/-/g, " ");
      track("ViewContent", { content_name: name, content_category: "Financing Checklist" });
    });
  });
})();
