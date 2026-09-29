/* =========================================================
   Regal Group International — traffic-source attribution
   Remembers how a visitor first and most recently arrived (UTM tags,
   partner ?ref= codes, ad click ids, external referrer) for 90 days,
   so the loan application can credit the right channel or partner.
   ========================================================= */
(function () {
  "use strict";
  var KEY = "regal_attr_v1";
  var TTL = 90 * 24 * 60 * 60 * 1000;
  var PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "gclid", "fbclid"];

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && d.first && Date.now() - d.first.at < TTL) return d;
    } catch (e) {}
    return {};
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }

  var data = load();
  var qs = new URLSearchParams(location.search);
  var touch = {};
  PARAMS.forEach(function (k) {
    var v = qs.get(k);
    if (v) touch[k] = v.trim().slice(0, 120);
  });
  if (touch.ref) touch.ref = touch.ref.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);

  var ext = "";
  try {
    if (document.referrer && new URL(document.referrer).hostname !== location.hostname) ext = document.referrer.slice(0, 300);
  } catch (e) {}
  if (ext) touch.referrer = ext;

  if (Object.keys(touch).length) {
    touch.landing = location.pathname;
    touch.at = Date.now();
    if (!data.first) data.first = touch;
    data.last = touch;
    save(data);
  } else if (!data.first) {
    data.first = { landing: location.pathname, at: Date.now(), direct: true };
    save(data);
  }

  window.RegalAttribution = function () { return data; };
})();
