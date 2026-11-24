/* NBDraft: server autosave for /setup and /ads (23 Nov 2026).
   - Each device gets a random token (st.dk). Answers upsert to Supabase setup_drafts through
     setup_draft_save (one row per token, debounced, only when something changed).
   - A second device gets the same answers from a resume link (?d=<token>) or by typing the email
     they used (setup_draft_find, rate limited).
   - The EIN is never sent here; the server also drops it. It only leaves the device on the final Send.
   - Publishable key only. The table is private; anon can only call the 3 functions. */
(function() {
  var BASE = "https://gzlmxyqgbulnwsoxqppx.supabase.co/rest/v1/rpc/";
  var KEY = "sb_publishable_sPc5lGDw-r-j46Teqp0kbw_acCw19_R";
  var TOKEN_RE = /^[A-Za-z0-9_-]{24,64}$/;
  var DEBOUNCE = 3000;

  function rpc(fn, body, keepalive) {
    return fetch(BASE + fn, {
      method: "POST", keepalive: !!keepalive,
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }
  function newToken() {
    var a = new Uint8Array(24); (window.crypto || window.msCrypto).getRandomValues(a);
    var s = ""; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function urlToken() {
    try { var d = new URLSearchParams(location.search).get("d") || ""; return TOKEN_RE.test(d) ? d : ""; } catch (e) { return ""; }
  }
  function css() {
    if (document.getElementById("nbd-css")) return;
    var s = document.createElement("style"); s.id = "nbd-css";
    s.textContent =
      ".nbd-pill{position:fixed;right:14px;bottom:14px;z-index:50;display:flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;" +
      "background:rgba(12,23,14,.94);border:1px solid rgba(239,237,230,.16);color:#efede6;font:600 13px/1.2 system-ui,-apple-system,sans-serif;" +
      "box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;pointer-events:none}" +
      ".nbd-pill.on{opacity:1;transform:none}.nbd-pill i{width:8px;height:8px;border-radius:50%;background:#c8f24c;flex:none}" +
      ".nbd-pill.wait i{background:#a9b8a6;animation:nbdp 1s infinite alternate}.nbd-pill.warn i{background:#ffb86b}" +
      "@keyframes nbdp{to{opacity:.3}}" +
      ".nbd-link{background:none;border:0;padding:0;margin-left:4px;color:#c8f24c;font:inherit;text-decoration:underline;cursor:pointer}" +
      ".nbd-find{margin:18px 0 0;padding:14px 16px;border:1px solid rgba(239,237,230,.14);border-radius:16px;background:rgba(239,237,230,.04)}" +
      ".nbd-find summary{cursor:pointer;font-weight:700;list-style:none}.nbd-find summary::-webkit-details-marker{display:none}" +
      ".nbd-find .row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.nbd-find input{flex:1 1 200px;min-width:0}" +
      ".nbd-find button{padding:12px 16px;border-radius:999px;border:0;background:#c8f24c;color:#0d140e;font-weight:800;cursor:pointer}" +
      ".nbd-find p{margin:8px 0 0;font-size:13px;color:#a9b8a6}";
    document.head.appendChild(s);
  }

  /* opts: page ("setup"|"ads"), slug, st, saveLocal(st), root, savedEl, parent (origin or null),
           hasLocal (bool: this device already had answers), apply(state) -> page fills the form */
  function attach(o) {
    css();
    var st = o.st, timer = null, lastSent = "", sending = false, again = false, backoffUntil = 0;
    var ut = urlToken(); if (ut) { st.dk = ut; o.saveLocal(st); }

    var pill = document.createElement("div"); pill.className = "nbd-pill"; pill.setAttribute("role", "status");
    pill.innerHTML = "<i></i><span></span>"; document.body.appendChild(pill);
    var hideT;
    function show(text, cls, stay) {
      pill.className = "nbd-pill on" + (cls ? " " + cls : ""); pill.lastChild.textContent = text;
      clearTimeout(hideT); if (!stay) hideT = setTimeout(function() { pill.classList.remove("on"); }, 2500);
    }

    function resumeLink() {
      var p; try { p = new URLSearchParams(location.search); } catch (e) { p = null; }
      if (!p) return "";
      p.set("d", st.dk);
      var base = o.parent ? o.parent + "/setup" : location.origin + location.pathname;
      return base + "?" + p.toString();
    }
    function savedLine(server) {
      if (!o.savedEl) return;
      o.savedEl.textContent = server ? "Saved. " : "Saved on this device. ";
      if (server && st.dk) {
        var b = document.createElement("button"); b.type = "button"; b.className = "nbd-link";
        b.textContent = "Copy a link to finish on another device";
        b.addEventListener("click", function() {
          var link = resumeLink();
          var done = function(ok) { b.textContent = ok ? "Link copied. Text it to yourself." : link; };
          try { navigator.clipboard.writeText(link).then(function() { done(true); }, function() { done(false); }); } catch (e) { done(false); }
        });
        o.savedEl.appendChild(b);
      }
    }

    function payload() { return JSON.stringify({ answers: st.answers || {}, checks: st.checks || {}, ts: st.ts || 0 }); }
    function send(keepalive) {
      clearTimeout(timer); timer = null;
      if (Date.now() < backoffUntil) { timer = setTimeout(send, backoffUntil - Date.now()); return; }
      var body = payload();
      if (body === lastSent) return;
      if (sending && !keepalive) { again = true; return; }
      if (!st.dk) { st.dk = newToken(); o.saveLocal(st); }
      sending = true; show("Saving...", "wait", true);
      var data = JSON.parse(body); if (data.answers) delete data.answers.ein;
      rpc("setup_draft_save", { p_token: st.dk, p_page: o.page, p_slug: o.slug, p_state: data }, keepalive).then(function(r) {
        sending = false;
        if (r && r.ok) { lastSent = body; show("Saved"); savedLine(true); }
        else { if (r && r.error === "slow down") backoffUntil = Date.now() + 60000; show("Saved on this device", "warn"); savedLine(false); }
        if (again) { again = false; send(); }
      }, function() {
        sending = false; show("Saved on this device", "warn"); savedLine(false);
        backoffUntil = Date.now() + 15000; timer = setTimeout(send, 15000);
      });
    }
    function touch() { st.ts = Date.now(); clearTimeout(timer); timer = setTimeout(send, DEBOUNCE); }
    function flush() { if (timer || payload() !== lastSent) send(); }

    /* nothing typed yet on a new device: never create an empty draft */
    if (!o.hasLocal) lastSent = payload();
    document.addEventListener("visibilitychange", function() { if (document.visibilityState === "hidden" && timer) send(true); });
    window.addEventListener("pagehide", function() { if (timer) send(true); });

    function useRemote(rs, token) {
      if (!rs || !rs.answers) return false;
      if ((rs.ts || 0) <= (st.ts || 0) && !token) return false;
      if (token) { st.dk = token; }
      o.apply(rs);
      lastSent = payload();
      o.saveLocal(st);
      show("Your saved answers are back"); savedLine(true);
      return true;
    }

    if (o.hasLocal && !st.dk) {
      send(); /* answers typed before server autosave existed: upload them once */
    } else if (st.dk) {
      rpc("setup_draft_load", { p_token: st.dk, p_page: o.page }).then(function(r) {
        if (!(r && r.state && useRemote(r.state)) && o.hasLocal) send();
      }, function() {});
    } else if (!o.hasLocal && o.root) {
      /* new device: offer to pull answers saved on another one */
      var box = document.createElement("details"); box.className = "nbd-find";
      box.innerHTML = "<summary>Started this on another phone or computer? Load your answers</summary>" +
        '<div class="row"><input type="email" inputmode="email" autocomplete="email" placeholder="The email you typed on the form" aria-label="Your email">' +
        '<button type="button">Load</button></div><p></p>';
      var anchor = o.root.querySelector(".track"); if (anchor) anchor.parentNode.insertBefore(box, anchor); else o.root.insertBefore(box, o.root.firstChild);
      var inp = box.querySelector("input"), btn = box.querySelector("button"), msg = box.querySelector("p");
      btn.addEventListener("click", function() {
        var em = String(inp.value || "").trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.textContent = "Type the email you used on the form."; return; }
        btn.disabled = true; msg.textContent = "Looking...";
        rpc("setup_draft_find", { p_page: o.page, p_slug: o.slug, p_email: em }).then(function(r) {
          btn.disabled = false;
          if (r && r.token && useRemote(r.state, r.token)) { box.remove(); return; }
          msg.textContent = r && r.error ? "Too many tries. Wait an hour, or use the link from your other device." :
            "Nothing saved under that email for this link. Use the 'finish on another device' link from your other device.";
        }, function() { btn.disabled = false; msg.textContent = "That didn't work. Try again in a minute."; });
      });
    }
    return { touch: touch, flush: flush };
  }
  window.NBDraft = { attach: attach };
})();
