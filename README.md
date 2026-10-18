# dandelionmusica.com — how the site updates

The site is built from four data files. A release is added by editing data, never the design.

## Per release (part of the roll-out calendar)
| When | Site step | File |
|---|---|---|
| R-21 (pre-save live) | Add the release at the top with status "upcoming", date, preorderDate, presave link. Drop the cover (600x600 JPG) in /covers. It becomes the homepage hero automatically. | data/releases.json |
| R-21 | News item: "Pre-save <Title>, out <date>" | data/news.json |
| R-14 (Traxsource exclusive) | Add the Traxsource release link. News item: "Traxsource exclusive pre-order opens". | releases.json, news.json |
| R (release day) | Set status "out"; add spotify, apple, beatport, smartlink links. News item: "Out now everywhere". The hero switches to Listen/Buy on its own once the date passes, even if this step is late. | releases.json, news.json |
| Any time | New artist signed: add name, photo, Spotify ID, livePhoto true. Their current Spotify photo loads automatically. | data/artists.json |
| Chart news | One news item with the chart position. | news.json |

## Release entry template
{"title": "", "artists": "", "genre": "", "status": "upcoming", "date": "YYYY-MM-DD", "preorderDate": "YYYY-MM-DD",
 "cover": "covers/<slug>.jpg",
 "links": {"presave": "", "traxsource": "", "beatport": "", "spotify": "", "apple": "", "smartlink": ""}}

Link keys shown as buttons: presave, traxsource, beatport, spotify, apple, youtube, soundcloud, bandcamp.

## Settings
data/site.json: demo form URL, demo email, join-the-list link, label playlist ID, social links.

## Brand
Day theme (light) from the Dandelion Musica brand system: Cloud Dancer ground, deep gold, Transformative Teal buttons, Divine Damson band. Fonts: Syne, Manrope, IBM Plex Mono.
