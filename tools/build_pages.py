#!/usr/bin/env python3
"""Builds one page per release (music/<slug>/), sitemap.xml and robots.txt from data/releases.json.
Run after every edit to data/releases.json:  python3 tools/build_pages.py"""
import json, re, html, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://dandelionmusica.com"
MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
LABELS = {"presave":"Pre-save","traxsource":"Traxsource","beatport":"Beatport","spotify":"Spotify","apple":"Apple Music",
          "youtube":"YouTube","soundcloud":"SoundCloud","bandcamp":"Bandcamp","smartlink":"All stores","free":"Free download"}
ORDER = ["presave","smartlink","spotify","apple","traxsource","beatport","youtube","soundcloud","bandcamp","free"]

def slug(t): return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
def e(s): return html.escape(str(s or ""), quote=True)
def long_date(iso):
    y, m, d = iso.split("-"); return f"{MONTHS[int(m)-1]} {int(d)}, {y}"

def page(r, today):
    s = slug(r["title"]); url = f"{SITE}/music/{s}/"
    up = r.get("status") == "upcoming" and r.get("date", "") > today
    genre = r.get("genre"); date = r.get("date")
    when = (f"out {long_date(date)}" if up else f"released {long_date(date)}") if date else ""
    desc = f'{r["title"]} by {r["artists"]}' + (f", a {genre} release" if genre else "") + " on Dandelion Musica" + (f", {when}" if when else "") + "."
    if up and r.get("preorderDate"):
        desc += f' Exclusive pre-order on Traxsource from {long_date(r["preorderDate"])}.'
    L = r.get("links", {})
    def label(k):
        if k == "traxsource": return "Pre-order on Traxsource" if up else "Buy on Traxsource"
        if k == "beatport": return "Buy on Beatport"
        return LABELS[k]
    btns = "".join(
        f'<a class="btn {"btn-teal" if i == 0 else "btn-ghost"}" href="{e(L[k])}" target="_blank" rel="noopener">{e(label(k))}<span class="sr-only"> (opens in new tab)</span></a>'
        for i, k in enumerate([k for k in ORDER if L.get(k)]))
    audio = f'<audio class="rp-audio" controls preload="none" src="/{e(r["preview"])}"></audio><p class="rp-small">30-second preview</p>' if r.get("preview") else ""
    ld = {"@context":"https://schema.org","@type":"MusicRecording","name":r["title"],"url":url,
          "byArtist":{"@type":"MusicGroup","name":r["artists"]},"image":f'{SITE}/{r["cover"]}',
          "recordLabel":{"@type":"Organization","name":"Dandelion Musica","url":SITE}}
    if genre: ld["genre"] = genre
    if date: ld["datePublished"] = date
    if L: ld["sameAs"] = [L[k] for k in ORDER if L.get(k)]
    chip = (("Out " + long_date(date)) if up else ("Released " + long_date(date))) if date else "Dandelion Musica"
    if genre: chip += " · " + genre
    title = f'{r["title"]} – {r["artists"]} | Dandelion Musica'
    return s, f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light only">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="music.song">
<meta property="og:site_name" content="Dandelion Musica">
<meta property="og:title" content="{e(r['title'] + ' – ' + r['artists'])}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/{e(r['cover'])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/label-logo.jpg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="/assets/style.css?v=10">
</head>
<body class="rp-body">
<a class="skip" href="#main">Skip to main content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/" aria-label="Dandelion Musica home"><img src="/assets/label-logo.jpg" alt="" width="40" height="40"><span>Dandelion<br>Musica</span></a>
    <nav class="nav" aria-label="Main"><a href="/#releases">Releases</a><a href="/#artists">Artists</a><a href="/#news">News</a><a href="/#about">About</a></nav>
    <a class="btn btn-teal btn-sm join-link" href="https://hypeddit.com/dandelionmusica" target="_blank" rel="noopener">Join the list</a>
  </div>
</header>
<main id="main" tabindex="-1">
  <section class="section rp">
    <div class="wrap rp-in">
      <img class="rp-cover" src="/{e(r['cover'])}" alt="{e(r['title'])} by {e(r['artists'])}, cover art" width="600" height="600">
      <div class="rp-copy">
        <p class="chip chip-clay">{e(chip)}</p>
        <h1>{e(r['title'])}</h1>
        <p class="hero-artist">{e(r['artists'])}</p>
        <p class="rp-desc">{e(desc)}</p>
        <div class="actions">{btns}</div>
        {audio}
        <p class="rp-small"><a href="/#releases">← All Dandelion Musica releases</a></p>
      </div>
    </div>
  </section>
</main>
<footer class="foot"><div class="wrap foot-in"><div class="foot-brand"><div class="foot-brand-row"><img src="/assets/label-logo.jpg" alt="" width="56" height="56"><p>© {today[:4]} Dandelion Musica · Danny Deleon LLC</p></div></div></div></footer>
<script>if(location.hostname.indexOf("dandelionmusica.com")>-1){{!function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","6256459517799445");fbq("track","PageView");fbq("track","ViewContent",{{content_name:{json.dumps(r['title'])}}});}}</script>
</body>
</html>
"""

def main():
    today = datetime.date.today().isoformat()
    rel = json.load(open(os.path.join(ROOT, "data/releases.json")))["releases"]
    urls = [(SITE + "/", today)]
    for r in rel:
        s, doc = page(r, today)
        d = os.path.join(ROOT, "music", s); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w").write(doc)
        urls.append((f"{SITE}/music/{s}/", today))
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
         "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls) + "</urlset>\n"
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(sm)
    open(os.path.join(ROOT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    print(f"built {len(rel)} release pages + sitemap.xml + robots.txt")

if __name__ == "__main__": main()
