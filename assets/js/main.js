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

  /* ---- Lead form → HubSpot Forms API (creates a Contact in the CRM) ---- */
  var HS_PORTAL = "245223034";
  var HS_FORM = "9447e86d-2870-4244-8d05-03319d72ed41";
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

      // Fold the loan details into the message field (the HubSpot form captures these)
      var lines = [];
      [["Financing type", "type"], ["Loan purpose", "purpose"], ["Property location", "property"],
       ["Estimated amount", "amount"], ["Timeline", "timeline"]].forEach(function (p) {
        var v = val(p[1]); if (v) lines.push(p[0] + ": " + v);
      });
      var notes = val("message");
      var message = lines.join("\n") + (notes ? ("\n\nNotes: " + notes) : "");

      var payload = {
        fields: [
          { name: "firstname", value: firstname },
          { name: "lastname", value: lastname },
          { name: "email", value: email },
          { name: "phone", value: val("phone") },
          { name: "message", value: message }
        ],
        context: { pageUri: location.href, pageName: document.title }
      };

      fetch("https://api.hsforms.com/submissions/v3/integration/submit/" + HS_PORTAL + "/" + HS_FORM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (res.ok) {
          note.style.color = "";
          note.textContent = "Thank you — your request has been received. Juan will personally follow up within one business day.";
          form.reset();
        } else {
          return res.json().then(function (d) { throw new Error((d && d.message) || ("HTTP " + res.status)); });
        }
      }).catch(function () {
        note.style.color = "#E2A0A0";
        note.textContent = "Sorry — something went wrong. Please call (786) 247-0244 or email info@regalgroupintl.com.";
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }
})();
