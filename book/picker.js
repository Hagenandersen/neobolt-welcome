/* Neobolt phone booking picker (19 Nov 2026). Mounted by /calendar and /watch (GHL pages) under 740px wide.
   Talks only to the Supabase function book-draft (GHL key stays server-side). Same Quick Call calendar, so the
   calendar's own booking workflows fire. Safe to load twice (GHL runs pasted scripts twice).
   Usage on a page:
     <div id="nbp" data-source="Booking page (phone)"></div>
     <script src="https://hagenandersen.github.io/neobolt-welcome/book/picker.js" defer></script>
     window.NBP_FALLBACK = function(){ ...show the GHL widget... }   (called on error, >4s slot load, or "Trouble?" link)
   Source: repo hagenandersen/neobolt-welcome, book/picker.js */
(function () {
  if (window.__nbpLoaded) return; window.__nbpLoaded = true;
  var API = "https://gzlmxyqgbulnwsoxqppx.supabase.co/functions/v1/book-draft";
  var CONSENT = "I confirm that I want to receive content from this company using any contact information I provide."; /* word for word from the GHL widget */
  var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix"; } catch (e) { return "America/Phoenix"; } })();
  var CSS = ".nbp{font:16px/1.5 Inter,system-ui,-apple-system,sans-serif;color:#f2f5ee;background:#13241a;border:1px solid rgba(198,244,50,.25);border-radius:20px;padding:16px;text-align:left}" +
    ".nbp *{box-sizing:border-box}.nbp h3{margin:0 0 4px;font-size:19px;font-weight:800;color:#f2f5ee}.nbp .nbp-sub{color:#a9b8a6;font-size:14px;margin:0 0 12px}" +
    ".nbp-days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin:0 0 12px;scrollbar-width:none}.nbp-days::-webkit-scrollbar{display:none}" +
    ".nbp-day{flex:0 0 auto;min-width:86px;border:1.5px solid rgba(198,244,50,.25);background:transparent;color:#f2f5ee;border-radius:14px;padding:9px 12px;font:600 15px/1.2 Inter,sans-serif;text-align:left;cursor:pointer}" +
    ".nbp-day small{display:block;color:#a9b8a6;font-weight:500;font-size:12.5px;margin-top:3px}.nbp-day[aria-pressed=true]{background:#c6f432;color:#0a140c;border-color:#c6f432}.nbp-day[aria-pressed=true] small{color:#2b3a1a}" +
    ".nbp-times{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}@media(min-width:420px){.nbp-times{grid-template-columns:repeat(3,1fr)}}" +
    ".nbp-t{min-height:54px;border:1.5px solid rgba(198,244,50,.45);background:rgba(198,244,50,.06);color:#f2f5ee;border-radius:14px;font:700 17px Inter,sans-serif;cursor:pointer}" +
    ".nbp-t:focus-visible,.nbp-day:focus-visible,.nbp-btn:focus-visible{outline:3px solid #c6f432;outline-offset:2px}" +
    ".nbp-tz{color:#a9b8a6;font-size:13px;margin:12px 2px 0}.nbp-none{color:#a9b8a6;padding:10px 2px;grid-column:1/-1}" +
    ".nbp-sel{display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(198,244,50,.1);border:1px solid rgba(198,244,50,.25);border-radius:14px;padding:12px 14px;margin-bottom:10px}" +
    ".nbp-sel b{font-size:16.5px}.nbp-link{background:none;border:0;color:#c6f432;font:600 14.5px Inter,sans-serif;text-decoration:underline;cursor:pointer;padding:6px}" +
    ".nbp label{display:block;font-weight:600;font-size:14.5px;margin:11px 0 6px;color:#f2f5ee}" +
    ".nbp input[type=text],.nbp input[type=tel],.nbp input[type=email]{width:100%;min-height:52px;border-radius:12px;border:1.5px solid #2f4a33;background:#0d1a10;color:#f2f5ee;font:500 17px Inter,sans-serif;padding:12px 14px}" +
    ".nbp input:focus{outline:none;border-color:#c6f432}.nbp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".nbp-cb{display:flex;gap:10px;align-items:flex-start;margin:14px 0 0;font-weight:500;font-size:14px;color:#c9d3c6;line-height:1.45;cursor:pointer}" +
    ".nbp-cb input{width:22px;height:22px;flex:none;margin:1px 0 0;accent-color:#c6f432}" +
    ".nbp-btn{display:flex;width:100%;justify-content:center;align-items:center;min-height:56px;margin-top:16px;border:0;border-radius:14px;background:#c6f432;color:#0a140c;font:800 17px Inter,sans-serif;cursor:pointer}.nbp-btn:disabled{opacity:.6}" +
    ".nbp-msg{min-height:20px;margin:10px 2px 0;font-size:15px;color:#ffb4a2}.nbp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}" +
    ".nbp-ok h3{font-size:24px}.nbp-ok p{color:#a9b8a6;margin:6px 0}.nbp-ok .nbp-big{color:#f2f5ee;font-size:18px;font-weight:700}.nbp-ok a{color:#c6f432}" +
    ".nbp-skel{height:54px;border-radius:14px;background:linear-gradient(90deg,#16291c,#1d3524,#16291c);background-size:200% 100%;animation:nbpsh 1.2s infinite}@keyframes nbpsh{to{background-position:-200% 0}}" +
    "@media(prefers-reduced-motion:reduce){.nbp-skel{animation:none}}.nbp-alt{text-align:center;margin:12px 0 0;font-size:14px}.nbp-alt a{color:#a9b8a6;text-decoration:underline}";

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function f(o) { return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: TZ }, o)); }
  function dayKey(d) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
  var fmtTime = function (d) { return f({ hour: "numeric", minute: "2-digit" }).format(d); };
  var fmtDay = function (d) { return f({ month: "short", day: "numeric" }).format(d); };
  var fmtWd = function (d) { return f({ weekday: "short" }).format(d); };
  var fmtLong = function (d) { return f({ weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d); };
  function tzName() { try { return f({ timeZoneName: "long" }).formatToParts(new Date()).filter(function (p) { return p.type === "timeZoneName"; })[0].value; } catch (e) { return TZ; } }

  function mount(host) {
    if (!host || host.getAttribute("data-nbp") === "1") return; host.setAttribute("data-nbp", "1");
    var source = host.getAttribute("data-source") || "Booking page (phone)";
    if (!document.getElementById("nbp-css")) { var st = document.createElement("style"); st.id = "nbp-css"; st.textContent = CSS; document.head.appendChild(st); }
    host.innerHTML =
      '<div class="nbp" id="nbp-s1"><h3>Pick a time</h3><p class="nbp-sub">Tap a time. You get the Google Meet link by email.</p>' +
      '<p class="nbp-msg" id="nbp-m1" hidden></p><div class="nbp-days" id="nbp-days" role="group" aria-label="Day"></div>' +
      '<div class="nbp-times" id="nbp-times" aria-live="polite"><div class="nbp-skel"></div><div class="nbp-skel"></div><div class="nbp-skel"></div><div class="nbp-skel"></div></div>' +
      '<p class="nbp-tz" id="nbp-tz"></p></div>' +
      '<div class="nbp" id="nbp-s2" hidden><div class="nbp-sel"><div><small style="color:#a9b8a6">Your call</small><br><b id="nbp-selt"></b></div><button class="nbp-link" type="button" id="nbp-chg">Change</button></div>' +
      '<form id="nbp-f" novalidate autocomplete="on"><div class="nbp-row"><div><label for="nbp-first">First name</label><input type="text" id="nbp-first" name="first" autocomplete="given-name"></div>' +
      '<div><label for="nbp-last">Last name</label><input type="text" id="nbp-last" name="last" autocomplete="family-name"></div></div>' +
      '<label for="nbp-phone">Phone</label><input type="tel" id="nbp-phone" name="phone" inputmode="tel" autocomplete="tel">' +
      '<label for="nbp-email">Email</label><input type="email" id="nbp-email" name="email" inputmode="email" autocomplete="email">' +
      '<label for="nbp-biz">Business name</label><input type="text" id="nbp-biz" name="business" autocomplete="organization">' +
      '<div class="nbp-hp" aria-hidden="true"><label for="nbp-web">Website</label><input type="text" id="nbp-web" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<label class="nbp-cb"><input type="checkbox" id="nbp-consent" name="consent"><span>' + esc(CONSENT) + '</span></label>' +
      '<button class="nbp-btn" type="submit" id="nbp-go">Book my call</button><p class="nbp-msg" id="nbp-m2" role="status" aria-live="polite"></p></form></div>' +
      '<div class="nbp nbp-ok" id="nbp-s3" hidden aria-live="polite"><h3>You\'re booked.</h3><p class="nbp-big" id="nbp-okt"></p>' +
      '<p>Google Meet link: <a href="https://meet.google.com/ftw-joyk-bau">meet.google.com/ftw-joyk-bau</a>. It\'s also on its way by email.</p></div>' +
      '<p class="nbp-alt" id="nbp-alt"><a href="#" id="nbp-classic">Trouble? Use the classic calendar</a></p>';
    var $ = function (id) { return document.getElementById(id); };
    var shown = Date.now(), picked = null, byDay = {}, order = [], failed = false;
    function fallback(why) {
      if (failed) return; failed = true;
      host.style.display = "none";
      try { if (typeof window.NBP_FALLBACK === "function") window.NBP_FALLBACK(why); } catch (e) {}
    }
    $("nbp-classic").onclick = function (e) { e.preventDefault(); fallback("link"); };
    function label(k) {
      var today = dayKey(new Date()), tom = dayKey(new Date(Date.now() + 86400000));
      return k === today ? "Today" : k === tom ? "Tomorrow" : fmtWd(byDay[k][0]);
    }
    function renderDays(active) {
      var box = $("nbp-days"); box.innerHTML = "";
      order.forEach(function (k) {
        var b = document.createElement("button"); b.type = "button"; b.className = "nbp-day"; b.setAttribute("aria-pressed", k === active ? "true" : "false");
        b.innerHTML = label(k) + "<small>" + fmtDay(byDay[k][0]) + " &middot; " + byDay[k].length + " open</small>";
        b.onclick = function () { renderDays(k); renderTimes(k); }; box.appendChild(b);
      });
    }
    function renderTimes(k) {
      var box = $("nbp-times"); box.innerHTML = "";
      if (!k || !byDay[k]) { box.innerHTML = '<p class="nbp-none">No open times in the next few days. Use the classic calendar below, or call or text (833) 359-4833.</p>'; return; }
      byDay[k].forEach(function (d) { var b = document.createElement("button"); b.type = "button"; b.className = "nbp-t"; b.textContent = fmtTime(d); b.onclick = function () { pick(d); }; box.appendChild(b); });
    }
    function load(keepDay, first) {
      /* 4s budget counted from when the page started loading the picker (window.__nbpT0), at least 1.5s for the slot call */
      var left = first ? Math.max(1500, (window.__nbpT0 || Date.now()) + 4000 - Date.now()) : 15000;
      var done = false, t = setTimeout(function () { if (!done && first) fallback("slow"); }, left);
      fetch(API + "?days=5").then(function (r) { return r.json(); }).then(function (j) {
        done = true; clearTimeout(t); if (failed) return;
        if (!j.ok || !j.slots) throw new Error("bad");
        byDay = {}; order = [];
        j.slots.forEach(function (s) { var d = new Date(s), k = dayKey(d); if (!byDay[k]) { byDay[k] = []; order.push(k); } byDay[k].push(d); });
        if (!order.length && first) return fallback("empty");
        var k0 = keepDay && byDay[keepDay] ? keepDay : order[0];
        renderDays(k0); renderTimes(k0);
        $("nbp-tz").textContent = "Times are in your time zone: " + tzName() + ".";
      }).catch(function () { done = true; clearTimeout(t); if (first) fallback("error"); else renderTimes(null); });
    }
    function pick(d) {
      picked = d; $("nbp-m1").hidden = true; $("nbp-selt").textContent = fmtLong(d);
      $("nbp-s1").hidden = true; $("nbp-s2").hidden = false; $("nbp-m2").textContent = "";
      try { host.scrollIntoView({ block: "start" }); } catch (e) {}
    }
    $("nbp-chg").onclick = function () { $("nbp-s2").hidden = true; $("nbp-s1").hidden = false; };
    $("nbp-f").addEventListener("submit", function (e) {
      e.preventDefault();
      var go = $("nbp-go"), msg = $("nbp-m2");
      function err(t) { msg.textContent = t; go.disabled = false; go.textContent = "Book my call"; }
      var v = function (id) { return $(id).value.trim(); };
      if (!v("nbp-first") || !v("nbp-last")) return err("Please add your first and last name.");
      if (v("nbp-phone").replace(/\D/g, "").length < 10) return err("Please add a 10-digit phone number.");
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v("nbp-email"))) return err("Please check your email.");
      go.disabled = true; go.textContent = "Booking...";
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        first: v("nbp-first"), last: v("nbp-last"), phone: v("nbp-phone"), email: v("nbp-email"), business: v("nbp-biz"),
        consent: $("nbp-consent").checked, slot: picked.toISOString(), hp: $("nbp-web").value, ts: shown, tz: TZ, source: source }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.ok) { $("nbp-s2").hidden = true; $("nbp-s3").hidden = false; $("nbp-alt").hidden = true; $("nbp-okt").textContent = fmtLong(picked); try { host.scrollIntoView({ block: "start" }); } catch (e) {} return; }
          if (j.taken) { go.disabled = false; go.textContent = "Book my call"; $("nbp-s2").hidden = true; $("nbp-s1").hidden = false; $("nbp-m1").textContent = j.error; $("nbp-m1").hidden = false; load(dayKey(picked), false); return; }
          err(j.error || "Something went wrong. Please call or text (833) 359-4833.");
        }).catch(function () { err("Couldn't reach the booking system. Try again, or use the classic calendar below."); });
    });
    load(null, true);
  }
  function start() { var h = document.getElementById("nbp"); if (h) mount(h); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.NBP_MOUNT = start;
})();
