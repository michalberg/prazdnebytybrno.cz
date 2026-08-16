# prazdnebytybrno.cz

Landing page mikrokampaně „Otevíráme prázdné byty v Brně" (Zelené Brno).
Čistě statický web (HTML/CSS/JS bez buildu), hostovaný na GitHub Pages.
Zadání: viz interní dokument `zadani-prazdne-byty-brno.md` (není součástí
tohoto repozitáře, protože je veřejné — obsahuje interní poznámky ke
kampani).

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
- `images/` — fotka Kristýny Fuchsové, favicony

## DNS / GitHub Pages

Primární doména je nastavena v souboru `CNAME` na `www.prazdnebytybrno.cz`.
Aby fungovala i holá doména a přesměrování zachovávalo query string (kvůli
UTM parametrům), je potřeba v DNS nastavit:

- `www` → `CNAME` záznam na `<github-username>.github.io.`
- apex (`prazdnebytybrno.cz`) → 4× `A` záznam na GitHub Pages IP adresy:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

Po nastavení DNS je potřeba v repozitáři: Settings → Pages → Custom domain
zadat `www.prazdnebytybrno.cz` a počkat na vystavení certifikátu, pak
zaškrtnout „Enforce HTTPS". GitHub Pages pak automaticky přesměruje apex i
`http://` variantu na `https://www...`.

**Nutno ověřit** (viz zadání sekce 7): že tohle přesměrování skutečně
zachovává query string s UTM parametry — otestovat až doména poběží,
zkusit `http://prazdnebytybrno.cz/?utm_source=test` a zkontrolovat, že
parametr dorazí až na cílovou stránku.

## Otevřené položky

- **OG náhledový obrázek** — zatím placeholder (`favicon-512.png`), potřeba
  nahradit designovým obrázkem 1200×630.
- **Refrén „PROTOŽE BRNO MÁ NA VÍC"** — v patičce zatím sázen živým textem
  ve stejném fontu, ne finální vektorovou grafikou v křivkách.
- **Umami** — v `index.html` je placeholder `data-website-id`, doplnit po
  založení účtu.
- **Font pro běžný text** — zadání ho neurčuje, zatím systémový font stack.
- **Share texty** — texty pro sdílení (`js/script.js`, `wireShareButton`)
  jsou pracovní návrh, ne finální kampaňové texty.
- **Legal text na visačce klíče** — potvrdit s právničkou koalice, viz
  zadání sekce 4 (týká se výroby visačky, ne tohoto webu).
