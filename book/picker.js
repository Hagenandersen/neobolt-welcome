/* Neobolt phone booking picker (19 Nov 2026). Mounted by /calendar and /watch (GHL pages) under 740px wide.
   Talks only to the Supabase function book-draft (GHL key stays server-side). Same Quick Call calendar, so the
   calendar's own booking workflows fire. Safe to load twice (GHL runs pasted scripts twice).
   Usage on a page:
     <div id="nbbk" data-source="Booking page (phone)"></div>
     <script src="https://hagenandersen.github.io/neobolt-welcome/book/picker.js" defer></script>
     window.NBBK_FALLBACK = function(){ ...show the GHL widget... }   (called on error, >4s slot load, or "Trouble?" link)
   Source: repo hagenandersen/neobolt-welcome, book/picker.js */
(function () {
  if (window.__nbbkLoaded) return; window.__nbbkLoaded = true;
  var API = "https://gzlmxyqgbulnwsoxqppx.supabase.co/functions/v1/book-draft";
  var CONSENT = "I confirm that I want to receive content from this company using any contact information I provide."; /* word for word from the GHL widget */
  var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix"; } catch (e) { return "America/Phoenix"; } })();
  var CSS = "#nbbk{min-width:0;max-width:100%}#nbbk .nbbk{margin:0;box-sizing:border-box;max-width:100%;min-width:0}#nbbk h3,#nbbk p{margin:0;padding:0;letter-spacing:0;text-transform:none}#nbbk button{letter-spacing:0;text-transform:none;box-shadow:none}.nbbk{font:16px/1.5 Inter,system-ui,-apple-system,sans-serif;color:#f2f5ee;background:#13241a;border:1px solid rgba(198,244,50,.25);border-radius:20px;padding:16px;text-align:left}" +
    ".nbbk *{box-sizing:border-box}.nbbk h3{margin:0 0 4px;font-size:19px;font-weight:800;color:#f2f5ee}.nbbk .nbbk-sub{color:#a9b8a6;font-size:14px;margin:0 0 12px}" +
    ".nbbk-days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin:0 0 12px;scrollbar-width:none}.nbbk-days::-webkit-scrollbar{display:none}" +
    ".nbbk-day{flex:0 0 auto;min-width:86px;border:1.5px solid rgba(198,244,50,.25);background:transparent;color:#f2f5ee;border-radius:14px;padding:9px 12px;font:600 15px/1.2 Inter,sans-serif;text-align:left;cursor:pointer}" +
    ".nbbk-day small{display:block;color:#a9b8a6;font-weight:500;font-size:12.5px;margin-top:3px}.nbbk-day[aria-pressed=true]{background:#c6f432;color:#0a140c;border-color:#c6f432}.nbbk-day[aria-pressed=true] small{color:#2b3a1a}" +
    ".nbbk-times{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}@media(min-width:420px){.nbbk-times{grid-template-columns:repeat(3,1fr)}}" +
    ".nbbk-t{min-height:54px;border:1.5px solid rgba(198,244,50,.45);background:rgba(198,244,50,.06);color:#f2f5ee;border-radius:14px;font:700 17px Inter,sans-serif;cursor:pointer}" +
    ".nbbk-t:focus-visible,.nbbk-day:focus-visible,.nbbk-btn:focus-visible{outline:3px solid #c6f432;outline-offset:2px}" +
    ".nbbk-tz{color:#a9b8a6;font-size:13px;margin:12px 2px 0}.nbbk-none{color:#a9b8a6;padding:10px 2px;grid-column:1/-1}" +
    ".nbbk-sel{display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(198,244,50,.1);border:1px solid rgba(198,244,50,.25);border-radius:14px;padding:12px 14px;margin-bottom:10px}" +
    ".nbbk-sel b{font-size:16.5px}.nbbk-link{background:none;border:0;color:#c6f432;font:600 14.5px Inter,sans-serif;text-decoration:underline;cursor:pointer;padding:6px}" +
    ".nbbk label{display:block;font-weight:600;font-size:14.5px;margin:11px 0 6px;color:#f2f5ee}" +
    ".nbbk input[type=text],.nbbk input[type=tel],.nbbk input[type=email]{width:100%;min-height:52px;border-radius:12px;border:1.5px solid #2f4a33;background:#0d1a10;color:#f2f5ee;font:500 17px Inter,sans-serif;padding:12px 14px}" +
    ".nbbk input:focus{outline:none;border-color:#c6f432}.nbbk-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".nbbk-cb{display:flex;gap:10px;align-items:flex-start;margin:14px 0 0;font-weight:500;font-size:14px;color:#c9d3c6;line-height:1.45;cursor:pointer}" +
    ".nbbk-cb input{width:22px;height:22px;flex:none;margin:1px 0 0;accent-color:#c6f432}" +
    ".nbbk-btn{display:flex;width:100%;justify-content:center;align-items:center;min-height:56px;margin-top:16px;border:0;border-radius:14px;background:#c6f432;color:#0a140c;font:800 17px Inter,sans-serif;cursor:pointer}.nbbk-btn:disabled{opacity:.6}" +
    ".nbbk-msg{min-height:20px;margin:10px 2px 0;font-size:15px;color:#ffb4a2}.nbbk-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}" +
    ".nbbk-ok h3{font-size:24px}.nbbk-ok p{color:#a9b8a6;margin:6px 0}.nbbk-ok .nbbk-big{color:#f2f5ee;font-size:18px;font-weight:700}.nbbk-ok a{color:#c6f432}" +
    ".nbbk-skel{height:54px;border-radius:14px;background:linear-gradient(90deg,#16291c,#1d3524,#16291c);background-size:200% 100%;animation:nbbksh 1.2s infinite}@keyframes nbbksh{to{background-position:-200% 0}}" +
    "@media(prefers-reduced-motion:reduce){.nbbk-skel{animation:none}}.nbbk-alt{text-align:center;margin:12px 0 0;font-size:14px}.nbbk-alt a{color:#a9b8a6;text-decoration:underline}";

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function f(o) { return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: TZ }, o)); }
  function dayKey(d) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
  var fmtTime = function (d) { return f({ hour: "numeric", minute: "2-digit" }).format(d); };
  var fmtDay = function (d) { return f({ month: "short", day: "numeric" }).format(d); };
  var fmtWd = function (d) { return f({ weekday: "short" }).format(d); };
  var fmtLong = function (d) { return f({ weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d); };
  function tzName() { try { return f({ timeZoneName: "long" }).formatToParts(new Date()).filter(function (p) { return p.type === "timeZoneName"; })[0].value; } catch (e) { return TZ; } }

  function mount(host) {
    if (!host || host.getAttribute("data-nbbk") === "1") return; host.setAttribute("data-nbbk", "1");
    var source = host.getAttribute("data-source") || "Booking page (phone)";
    if (!document.getElementById("nbbk-css")) { var st = document.createElement("style"); st.id = "nbbk-css"; st.textContent = CSS; document.head.appendChild(st); }
    host.innerHTML =
      '<div class="nbbk" id="nbbk-s1"><h3>Pick a time</h3><p class="nbbk-sub">Tap a time. You get the Google Meet link by email.</p>' +
      '<p class="nbbk-msg" id="nbbk-m1" hidden></p><div class="nbbk-days" id="nbbk-days" role="group" aria-label="Day"></div>' +
      '<div class="nbbk-times" id="nbbk-times" aria-live="polite"><div class="nbbk-skel"></div><div class="nbbk-skel"></div><div class="nbbk-skel"></div><div class="nbbk-skel"></div></div>' +
      '<p class="nbbk-tz" id="nbbk-tz"></p></div>' +
      '<div class="nbbk" id="nbbk-s2" hidden><div class="nbbk-sel"><div><small style="color:#a9b8a6">Your call</small><br><b id="nbbk-selt"></b></div><button class="nbbk-link" type="button" id="nbbk-chg">Change</button></div>' +
      '<form id="nbbk-f" novalidate autocomplete="on"><div class="nbbk-row"><div><label for="nbbk-first">First name</label><input type="text" id="nbbk-first" name="first" autocomplete="given-name"></div>' +
      '<div><label for="nbbk-last">Last name</label><input type="text" id="nbbk-last" name="last" autocomplete="family-name"></div></div>' +
      '<label for="nbbk-phone">Phone</label><input type="tel" id="nbbk-phone" name="phone" inputmode="tel" autocomplete="tel">' +
      '<label for="nbbk-email">Email</label><input type="email" id="nbbk-email" name="email" inputmode="email" autocomplete="email">' +
      '<label for="nbbk-biz">Business name</label><input type="text" id="nbbk-biz" name="business" autocomplete="organization">' +
      '<div class="nbbk-hp" aria-hidden="true"><label for="nbbk-web">Website</label><input type="text" id="nbbk-web" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<label class="nbbk-cb"><input type="checkbox" id="nbbk-consent" name="consent"><span>' + esc(CONSENT) + '</span></label>' +
      '<button class="nbbk-btn" type="submit" id="nbbk-go">Book my call</button><p class="nbbk-msg" id="nbbk-m2" role="status" aria-live="polite"></p></form></div>' +
      '<div class="nbbk nbbk-ok" id="nbbk-s3" hidden aria-live="polite"><h3>You\'re booked.</h3><p class="nbbk-big" id="nbbk-okt"></p>' +
      '<p>Google Meet link: <a href="https://meet.google.com/ftw-joyk-bau">meet.google.com/ftw-joyk-bau</a>. It\'s also on its way by email.</p></div>' +
      '<p class="nbbk-alt" id="nbbk-alt"><a href="#" id="nbbk-classic">Trouble? Use the classic calendar</a></p>';
    var $ = function (id) { return document.getElementById(id); };
    /* 19 Nov: GA4 events through the gtag already on the page (no new script). Never sends names, phones or emails. */
    function trk(name, params) { try { if (typeof window.gtag === "function") window.gtag("event", name, Object.assign({ nb_page: location.pathname, nb_source: source }, params || {})); } catch (e) {} }
    var shown = Date.now(), picked = null, byDay = {}, order = [], failed = false;
    function fallback(why) {
      if (failed) return; failed = true; trk("nb_picker_fallback", { reason: String(why || "") });
      host.style.display = "none";
      try { if (typeof window.NBBK_FALLBACK === "function") window.NBBK_FALLBACK(why); } catch (e) {}
    }
    $("nbbk-classic").onclick = function (e) { e.preventDefault(); fallback("link"); };
    function label(k) {
      var today = dayKey(new Date()), tom = dayKey(new Date(Date.now() + 86400000));
      return k === today ? "Today" : k === tom ? "Tomorrow" : fmtWd(byDay[k][0]);
    }
    function renderDays(active) {
      var box = $("nbbk-days"); box.innerHTML = "";
      order.forEach(function (k) {
        var b = document.createElement("button"); b.type = "button"; b.className = "nbbk-day"; b.setAttribute("aria-pressed", k === active ? "true" : "false");
        b.innerHTML = label(k) + "<small>" + fmtDay(byDay[k][0]) + " &middot; " + byDay[k].length + " open</small>";
        b.onclick = function () { renderDays(k); renderTimes(k); }; box.appendChild(b);
      });
    }
    function renderTimes(k) {
      var box = $("nbbk-times"); box.innerHTML = "";
      if (!k || !byDay[k]) { box.innerHTML = '<p class="nbbk-none">No open times in the next few days. Use the classic calendar below, or call or text (833) 359-4833.</p>'; return; }
      byDay[k].forEach(function (d) { var b = document.createElement("button"); b.type = "button"; b.className = "nbbk-t"; b.textContent = fmtTime(d); b.onclick = function () { pick(d); }; box.appendChild(b); });
    }
    function load(keepDay, first) {
      /* 4s budget counted from when the page started loading the picker (window.__nbbkT0), at least 1.5s for the slot call */
      var left = first ? Math.max(1500, (window.__nbbkT0 || Date.now()) + 4000 - Date.now()) : 15000;
      var done = false, t = setTimeout(function () { if (!done && first) fallback("slow"); }, left);
      fetch(API + "?days=5").then(function (r) { return r.json(); }).then(function (j) {
        done = true; clearTimeout(t); if (failed) return;
        if (!j.ok || !j.slots) throw new Error("bad");
        byDay = {}; order = [];
        j.slots.forEach(function (s) { var d = new Date(s), k = dayKey(d); if (!byDay[k]) { byDay[k] = []; order.push(k); } byDay[k].push(d); });
        if (!order.length && first) return fallback("empty");
        var k0 = keepDay && byDay[keepDay] ? keepDay : order[0];
        renderDays(k0); renderTimes(k0);
        if (first) trk("nb_picker_shown", { slots: j.slots.length, ms: Date.now() - (window.__nbbkT0 || shown) });
        $("nbbk-tz").textContent = "Times are in your time zone: " + tzName() + ".";
      }).catch(function () { done = true; clearTimeout(t); if (first) fallback("error"); else renderTimes(null); });
    }
    function pick(d) {
      picked = d; trk("nb_time_picked", { days_ahead: Math.round((d - Date.now()) / 86400000) }); $("nbbk-m1").hidden = true; $("nbbk-selt").textContent = fmtLong(d);
      $("nbbk-s1").hidden = true; $("nbbk-s2").hidden = false; $("nbbk-m2").textContent = "";
      try { host.scrollIntoView({ block: "start" }); } catch (e) {}
    }
    $("nbbk-chg").onclick = function () { $("nbbk-s2").hidden = true; $("nbbk-s1").hidden = false; };
    $("nbbk-f").addEventListener("submit", function (e) {
      e.preventDefault();
      var go = $("nbbk-go"), msg = $("nbbk-m2");
      function err(t) { trk("nb_book_error", { reason: String(t).slice(0, 60) }); msg.textContent = t; go.disabled = false; go.textContent = "Book my call"; }
      var v = function (id) { return $(id).value.trim(); };
      if (!v("nbbk-first") || !v("nbbk-last")) return err("Please add your first and last name.");
      if (v("nbbk-phone").replace(/\D/g, "").length < 10) return err("Please add a 10-digit phone number.");
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v("nbbk-email"))) return err("Please check your email.");
      go.disabled = true; go.textContent = "Booking..."; trk("nb_book_submit");
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        first: v("nbbk-first"), last: v("nbbk-last"), phone: v("nbbk-phone"), email: v("nbbk-email"), business: v("nbbk-biz"),
        consent: $("nbbk-consent").checked, slot: picked.toISOString(), hp: $("nbbk-web").value, ts: shown, tz: TZ, source: source }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.ok) { trk("nb_booked"); $("nbbk-s2").hidden = true; $("nbbk-s3").hidden = false; $("nbbk-alt").hidden = true; $("nbbk-okt").textContent = fmtLong(picked); try { host.scrollIntoView({ block: "start" }); } catch (e) {} return; }
          if (j.taken) { trk("nb_slot_taken"); go.disabled = false; go.textContent = "Book my call"; $("nbbk-s2").hidden = true; $("nbbk-s1").hidden = false; $("nbbk-m1").textContent = j.error; $("nbbk-m1").hidden = false; load(dayKey(picked), false); return; }
          err(j.error || "Something went wrong. Please call or text (833) 359-4833.");
        }).catch(function () { err("Couldn't reach the booking system. Try again, or use the classic calendar below."); });
    });
    load(null, true);
  }
  function start() { var h = document.getElementById("nbbk"); if (h) mount(h); }
  /* GHL can re-render pasted code after load (it runs pasted scripts twice): re-mount into a fresh empty #nbbk for 15s */
  var tries = 0, iv = setInterval(function () { tries++; var h = document.getElementById("nbbk"); if (h && h.getAttribute("data-nbbk") !== "1" && !document.documentElement.classList.contains("nbbk-fb")) mount(h); if (tries > 30) clearInterval(iv); }, 500);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.NBBK_MOUNT = start;
})();
