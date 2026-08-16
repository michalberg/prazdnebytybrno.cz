# prazdnebytybrno.cz

Landing page mikrokampaně „Otevíráme prázdné byty v Brně" (Zelené Brno).
Čistě statický web (HTML/CSS/JS bez buildu), hostovaný na GitHub Pages.

Zadání kampaně se udržuje mimo tento repozitář, protože je veřejný.

## Lokální náhled

Stránka nepotřebuje build krok, stačí ji servírovat jako statické soubory,
např.:

```
python3 -m http.server 8000
```

a otevřít `http://localhost:8000/`. Varianty podle nosiče jde otestovat
parametrem v adrese, např. `http://localhost:8000/?utm_source=mhd`.

## Struktura

- `index.html` — jediná stránka, obsahuje všechny varianty hlavy (přepínají
  se v prohlížeči podle `utm_source`)
- `css/style.css` — barvy a fonty dle grafického manuálu Zelené Brno 2026
- `js/script.js` — výběr varianty, formulář (Action Network), kvíz, sdílení
- `fonts/` — Tusker Grotesk 5700 Bold, Urban Grotesk Black
- `images/` — fotka Kristýny Fuchsové, náhledový obrázek pro sdílení

## Varianty podle nosiče

Hodnota `utm_source` se čte z adresy při načtení stránky, převede se na malá
písmena a porovná s pevným seznamem. Neznámá nebo chybějící hodnota spadne na
`default`.

| `utm_source` | Hlava | Formulář |
|---|---|---|
| bez parametru, `ig`, `fb`, `manychat`, `share`, `mhd`, `letak` | výchozí | nahoře i dole |
| `plakat` | otázka bez návodu | jen dole |
| `klic` | kvíz s odhalením značky | jen dole |

## Měření

Umami Cloud, bez cookies. Události vznikají automaticky při prvním odeslání,
v Umami se nic nezakládá předem:

- `lead_submitted` — po úspěšné odpovědi Action Network, vlastnost `source`
- `share_click` — při kliknutí na sdílení, vlastnost `method`
- `quiz_guess` — tip v kvízu u varianty s klíčem, vlastnost `guess`

Kliknutí na odkaz ke stažení návodu v e-mailu měřicí skript nezachytí. Pokud
se má měřit, musí odkaz vést přes sledovaný odkaz z Umami (Links), který
kliknutí zaznamená serverovým přesměrováním.

## Provoz

GitHub Pages, větev `main`, kořenová složka. Doména je v souboru `CNAME`.

DNS (Webglobe):

- `www` → CNAME na `michalberg.github.io.`
- apex → 4× A na `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153`

Ověřeno, že přesměrování z apexu na `www` zachovává query string, takže se
UTM parametry cestou neztratí.

## Otevřené položky

- **Enforce HTTPS** — zapnout v Settings → Pages, jakmile GitHub vystaví
  certifikát pro doménu.
- **Logo Zelené Brno** — chybí hlavička stránky se značkou, potřeba dodat SVG.
- **Refrén „PROTOŽE BRNO MÁ NA VÍC"** — v patičce zatím sázen živým textem,
  má být hotová vektorová grafika v křivkách.
- **Font pro běžný text** — grafický manuál ho neurčuje, zatím systémový
  font stack.
- **Texty pro sdílení** — v `js/script.js` (`wireShareButton`) je pracovní
  návrh, ne finální kampaňové znění.
