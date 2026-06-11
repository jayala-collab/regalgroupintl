/* =========================================================
   Regal Group International — interactions
   ========================================================= */
(function () {
  "use strict";

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
})();
