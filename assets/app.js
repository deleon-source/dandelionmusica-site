/* Dandelion Musica — renders the site from /data/*.json.
   Monthly update = edit data/releases.json (+ news.json). No code changes needed. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var fmt = function (iso) { if (!iso) return ""; var p = iso.split("-"); return MONTHS[+p[1] - 1] + " " + (+p[2]); };
  var fmtLong = function (iso) { if (!iso) return ""; var p = iso.split("-"); return MONTHS[+p[1] - 1] + " " + (+p[2]) + ", " + p[0]; };
  var NEWTAB = '<span class="sr-only"> (opens in new tab)</span>';
  var ext = function (url, label, cls, aria) { return '<a class="' + (cls || "") + '" href="' + esc(url) + '" target="_blank" rel="noopener"' + (aria ? ' aria-label="' + esc(aria + " (opens in new tab)") + '"' : "") + ">" + esc(label) + (aria ? "" : NEWTAB) + "</a>"; };
  var LINK_LABELS = { presave: "Pre-save", traxsource: "Traxsource", beatport: "Beatport", spotify: "Spotify", apple: "Apple Music", youtube: "YouTube", soundcloud: "SoundCloud", bandcamp: "Bandcamp", free: "Free download" };

  function load(name) {
    return fetch("data/" + name + ".json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(name); return r.json(); });
  }

  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  // A release is "upcoming" until its date passes, even if the JSON still says upcoming.
  function isUpcoming(r) { return r.status === "upcoming" && (!r.date || r.date > today()); }

  function renderHero(releases) {
    var r = releases.find(isUpcoming) || releases[0];
    if (!r) return;
    heroRelease = r;
    var up = isUpcoming(r);
    $("hero-bg").style.backgroundImage = "url('" + r.cover + "')";
    var img = $("hero-cover"); img.src = r.cover; img.alt = r.title + " cover art";
    $("hero-title").textContent = r.title;
    $("hero-artist").textContent = r.artists;
    var chip = up ? "Out " + fmt(r.date) : "Out now";
    if (r.genre) chip += " · " + r.genre;
    $("hero-chip").textContent = chip;
    var L = r.links || {}, html = "";
    if (up) {
      if (L.presave) html += ext(L.presave, "Pre-save", "btn btn-teal");
      if (L.traxsource && r.preorderDate) html += ext(L.traxsource, (r.preorderDate <= today() ? "Pre-order" : "Pre-order " + fmt(r.preorderDate)) + " on Traxsource", "btn btn-gold");
      $("hero-meta").textContent = r.preorderDate ? "Traxsource exclusive " + fmt(r.preorderDate) + " · Everywhere " + fmt(r.date) : "Everywhere " + fmtLong(r.date);
    } else {
      var listen = L.smartlink || L.spotify || L.presave;
      if (listen) html += ext(listen, "Listen now", "btn btn-teal");
      var buy = L.traxsource || L.beatport;
      if (buy) html += ext(buy, "Buy on " + (L.traxsource ? "Traxsource" : "Beatport"), "btn btn-gold");
      $("hero-meta").textContent = r.date ? "Released " + fmtLong(r.date) : "Out now on Dandelion Musica";
    }
    $("hero-actions").innerHTML = html;
    setupPreview(r);
    var go = function () { $("hero").classList.add("ready"); };
    if (img.complete) setTimeout(go, 150); else img.addEventListener("load", function () { setTimeout(go, 150); });
  }

  // 30-second preview on the hero cover. The record spins faster while it plays.
  function setupPreview(r) {
    var rec = document.querySelector(".record"); if (!rec || !r.preview) return;
    var audio = new Audio(r.preview); audio.preload = "none";
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "preview-btn"; btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = '<span class="pv-icon" aria-hidden="true"></span><span class="pv-text">Play 30s preview</span><span class="pv-bar" aria-hidden="true"><i></i></span>';
    btn.setAttribute("aria-label", "Play 30-second preview of " + r.title);
    rec.appendChild(btn);
    var bar = btn.querySelector(".pv-bar i"), text = btn.querySelector(".pv-text"), hero = $("hero");
    var set = function (on) {
      btn.setAttribute("aria-pressed", String(on)); hero.classList.toggle("playing", on);
      text.textContent = on ? "Pause preview" : (audio.currentTime > 0 && !audio.ended ? "Resume preview" : "Play 30s preview");
      btn.setAttribute("aria-label", (on ? "Pause" : "Play") + " 30-second preview of " + r.title);
    };
    btn.addEventListener("click", function () {
      if (audio.paused) {
        var radio = $("play-btn"); if (radio && radio.getAttribute("aria-expanded") === "true") radio.click();
        audio.play().then(function () { set(true); if (window.fbq) window.fbq("track", "ViewContent", { content_name: r.title + " preview" }); }).catch(function () { set(false); });
      } else { audio.pause(); set(false); }
    });
    audio.addEventListener("timeupdate", function () { if (audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + "%"; });
    audio.addEventListener("ended", function () { audio.currentTime = 0; bar.style.width = "0"; set(false); });
  }

  function renderTicker(releases, news) {
    var items = [];
    releases.filter(isUpcoming).forEach(function (r) {
      if (r.preorderDate) items.push("<b>" + esc(r.title) + "</b> Traxsource pre-order " + fmt(r.preorderDate));
      items.push("<b>" + esc(r.title) + "</b> out everywhere " + fmt(r.date));
    });
    news.slice(0, 3).forEach(function (n) { items.push(esc(n.title)); });
    items.push("<b>Demos open</b> House · Techno · Disco · Indie Dance");
    var one = items.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    $("ticker").innerHTML = one + one; // doubled for a seamless loop (hidden from screen readers)
    $("ticker-sr").innerHTML = items.map(function (t) { return "<li>" + t + "</li>"; }).join("");
  }

  function renderReleases(releases) {
    $("release-grid").innerHTML = releases.map(function (r) {
      var up = isUpcoming(r), L = r.links || {};
      var main = (up ? L.presave : (L.smartlink || L.beatport || L.traxsource || L.spotify)) || "#";
      var links = Object.keys(L).filter(function (k) { return LINK_LABELS[k]; }).map(function (k) {
        return ext(L[k], LINK_LABELS[k], k === "presave" ? "primary" : "", LINK_LABELS[k] + ": " + r.title);
      }).join("");
      var badge = up ? '<span class="chip chip-clay rel-badge">' + esc("Out " + fmt(r.date)) + "</span>" : "";
      return '<article class="rel">' +
        '<a class="rel-art" href="' + esc(main) + '" target="_blank" rel="noopener" aria-label="' + esc(r.title + " by " + r.artists + " (opens in new tab)") + '">' +
          '<img src="' + esc(r.cover) + '" alt="" loading="lazy" width="600" height="600">' + badge + '<span class="play-ov" aria-hidden="true"></span></a>' +
        '<h3><a href="' + esc(main) + '" target="_blank" rel="noopener">' + esc(r.title) + NEWTAB + "</a></h3>" +
        "<p>" + esc(r.artists) + (r.genre ? " · " + esc(r.genre) : "") + "</p>" +
        '<div class="rel-links">' + links + "</div></article>";
    }).join("");
  }

  function renderArtists(artists) {
    var grid = $("artist-grid");
    grid.innerHTML = artists.map(function (a, i) {
      var href = a.website || (a.spotify ? "https://open.spotify.com/artist/" + a.spotify : a.beatport);
      return '<a class="artist" href="' + esc(href) + '" target="_blank" rel="noopener">' +
        '<img data-i="' + i + '" src="' + esc(a.photo) + '" alt="" loading="lazy">' +
        '<span class="artist-meta">' + (a.role ? "<em>" + esc(a.role) + "</em>" : "") + "<b>" + esc(a.name) + "</b><span>" + (a.website ? "Visit dannydeleon.com" : a.spotify ? "Listen on Spotify" : "View on Beatport") + "</span></span>" + NEWTAB + "</a>";
    }).join("");
    $("roster-count").textContent = artists.length + " artists";
    // Live profile photos: pull each artist's current Spotify picture.
    artists.forEach(function (a, i) {
      if (!a.spotify || !a.livePhoto) return;
      fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent("https://open.spotify.com/artist/" + a.spotify))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.thumbnail_url) return;
          var pre = new Image();
          pre.onload = function () { var el = grid.querySelector('img[data-i="' + i + '"]'); if (el) el.src = j.thumbnail_url; };
          pre.src = j.thumbnail_url;
        }).catch(function () {});
    });
  }

  function renderNews(news) {
    $("news-grid").innerHTML = news.map(function (n) {
      var img = n.image ? '<div class="news-img"><img src="' + esc(n.image) + '" alt="" loading="lazy"></div>' : '<div class="news-img fallback" aria-hidden="true">DM</div>';
      return '<a class="news" href="' + esc(n.link || "#") + '" target="_blank" rel="noopener">' + img + NEWTAB +
        '<div class="news-body"><time datetime="' + esc(n.date) + '">' + esc(fmtLong(n.date)) + "</time><h3>" + esc(n.title) + "</h3><p>" + esc(n.text) + "</p></div></a>";
    }).join("");
  }

  var PLATFORM_COLOR = { "Spotify": "#1DB954", "Apple Music": "#FA243C", "SoundCloud": "#FF5500", "YouTube": "#FF0000", "Bandcamp": "#1DA0C3", "Traxsource": "#3A9B96", "Beatport": "#01FF95" };
  var GROUP_NAME = { stream: "Stream", watch: "Watch", buy: "Buy and support" };

  function renderListen(items) {
    var groups = ["stream", "watch", "buy"];
    $("listen-groups").innerHTML = groups.map(function (g) {
      var cards = items.filter(function (i) { return i.group === g; }).map(function (i) {
        var play = i.player ? '<button class="go" type="button" data-open-player>Play here</button>' : "";
        return '<div class="lcard" style="--c:' + (PLATFORM_COLOR[i.platform] || "var(--gold)") + '">' +
          '<span class="plat"><i aria-hidden="true"></i>' + esc(i.platform) + "</span>" +
          "<b>" + esc(i.title) + "</b><p>" + esc(i.meta) + "</p>" +
          '<div class="lcard-actions">' + ext(i.url, i.cta, "go", i.cta + ": " + i.title + " on " + i.platform) + play + "</div></div>";
      }).join("");
      return cards ? '<div class="listen-group"><h3>' + GROUP_NAME[g] + '</h3><div class="listen-row">' + cards + "</div></div>" : "";
    }).join("");
    document.querySelectorAll("[data-open-player]").forEach(function (b) {
      b.addEventListener("click", function () { var p = $("play-btn"); if (p.getAttribute("aria-expanded") !== "true") p.click(); });
    });
  }

  // Meta pixel: only on the live domain, so retargeting audiences only count real visitors.
  function setupPixel(site) {
    if (!site.pixelId || !site.liveDomain || location.hostname.indexOf(site.liveDomain) === -1) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", site.pixelId);
    window.fbq("track", "PageView");
    // Every outbound click is a funnel step: pre-save / join = Lead, store = InitiateCheckout, stream/social = ViewContent.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='http']");
      if (!a || a.hostname === location.hostname) return;
      var h = a.href, ev = "ViewContent";
      if (/hypeddit\.com/.test(h)) ev = "Lead";
      else if (/traxsource|beatport|bandcamp|itunes/.test(h)) ev = "InitiateCheckout";
      window.fbq("track", ev, { content_name: (a.textContent || "").trim().slice(0, 60), destination: a.hostname });
    }, true);
  }

  // "Join the list" opens a label sign-up panel on the site instead of leaving for Hypeddit.
  var heroRelease = null;
  function setupJoin(site) {
    var dlg = $("join-dialog"); if (!dlg || !site.joinForm || typeof dlg.showModal !== "function") return;
    var form = $("jd-form"), email = $("jd-email"), err = $("jd-error"), done = $("jd-done"), submit = $("jd-submit");
    var follow = [ext("https://open.spotify.com/playlist/" + site.playlistId, "Follow the label playlist", "btn btn-teal")];
    var ig = site.social && site.social["Dandelion Musica"] && site.social["Dandelion Musica"].Instagram;
    if (ig) follow.push(ext(ig, "Follow Dandelion Musica on Instagram", "btn btn-ghost"));
    if (heroRelease && isUpcoming(heroRelease) && heroRelease.links && heroRelease.links.presave) follow.unshift(ext(heroRelease.links.presave, "Pre-save " + heroRelease.title, "btn btn-gold"));
    $("jd-follow").innerHTML = follow.join("");
    document.querySelectorAll('a[href="' + site.joinUrl + '"], .join-link').forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); err.hidden = true; dlg.showModal(); setTimeout(function () { (done.hidden ? email : done).focus(); }, 30); });
    });
    $("jd-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = "Enter a valid email address, like name@gmail.com."; err.hidden = false; email.focus(); return; }
      err.hidden = true; submit.disabled = true; submit.textContent = "Joining…";
      var fd = new FormData(); fd.append(site.joinForm.emailField, v);
      fetch(site.joinForm.action, { method: "POST", mode: "no-cors", body: fd }).then(function () {
        err.hidden = true; form.hidden = true; done.hidden = false; done.focus();
        if (window.fbq) window.fbq("track", "CompleteRegistration", { content_name: "Join the list" });
      }).catch(function () {
        err.textContent = "That didn't go through. Check your connection and try again."; err.hidden = false;
      }).then(function () { submit.disabled = false; submit.textContent = "Join"; });
    });
  }

  function renderSite(site) {
    var soc = site.social || {};
    $("social").innerHTML = Object.keys(soc).map(function (brand) {
      return '<div class="foot-row"><span>' + esc(brand) + "</span>" + Object.keys(soc[brand]).map(function (k) { return ext(soc[brand][k], k, "", k + ", " + brand); }).join("") + "</div>";
    }).join("");
    if (site.listen) renderListen(site.listen);
    if (site.bookingEmail) $("booking").innerHTML = "Bookings, licensing and press: " + esc(site.bookingEmail);
    setupPixel(site);
    setupJoin(site);
    var cta = site.demoFormUrl
      ? ext(site.demoFormUrl, "Submit a demo", "btn btn-gold btn-lg") + "<small>Takes 2 minutes. We reply within 3 weeks if it fits.</small>"
      : '<a class="btn btn-gold btn-lg" href="mailto:' + esc(site.demoEmail) + '?subject=Demo%20for%20Dandelion%20Musica">Email your demo</a><small>' + esc(site.demoEmail) + "</small>";
    $("demo-cta").innerHTML = cta;
    document.querySelectorAll('a[href="https://hypeddit.com/dannydeleon"]').forEach(function (a) { if (site.joinUrl) a.href = site.joinUrl; });
    setupPlayer(site.playlistId);
  }

  function setupPlayer(id) {
    var btn = $("play-btn"), panel = $("player-panel"), loaded = false;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      if (!open && !loaded) {
        loaded = true;
        panel.innerHTML = '<iframe title="Dandelion Musica playlist on Spotify" src="https://open.spotify.com/embed/playlist/' + esc(id) + '?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) btn.click(); });
  }

  $("year").textContent = new Date().getFullYear();

  // Static links in the HTML that open a new tab get the same screen-reader notice.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    if (!a.querySelector(".sr-only") && !a.hasAttribute("aria-label")) a.insertAdjacentHTML("beforeend", NEWTAB);
  });

  // One control pauses every moving element (WCAG 2.2.2).
  (function () {
    var b = $("ticker-pause"); if (!b) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var set = function (on) { document.body.classList.toggle("paused", on); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Play motion" : "Pause motion"; };
    if (reduce) document.body.classList.add("calm"); // ticker stops for reduce-motion users; the record keeps spinning unless they press Pause
    b.addEventListener("click", function () { set(!document.body.classList.contains("paused")); });
  })();

  Promise.all([load("releases"), load("artists"), load("news"), load("site")]).then(function (d) {
    var releases = d[0].releases, artists = d[1].artists, news = d[2].news, site = d[3];
    renderHero(releases); renderTicker(releases, news); renderReleases(releases);
    renderArtists(artists); renderNews(news); renderSite(site);
  }).catch(function (e) { console.error("Site data failed to load:", e); });
})();
