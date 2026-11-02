# Familiens ønskelister

Live side: https://allangraver.github.io/onskelister/

Dette repo indeholder en enkel hjemmeside til familiernes ønskelister, hvor hver person kan have sin egen liste i Google Sheets.

Upload filerne i denne pakke til roden af dit GitHub repository, fx `onsker`.

## Filen du skal redigere
**config.js**

Indsaet hvert publiceret Google Sheet CSV-link her:

```js
window.WISH_CONFIG = {
  sheetSources: {
    Allan: "INDSAET_ALLANS_CSV_LINK_HER",
    Anne: "INDSAET_ANNES_CSV_LINK_HER",
    Lukas: "INDSAET_LUKAS_CSV_LINK_HER",
    Daniel: "INDSAET_DANIELS_CSV_LINK_HER"
  }
};
```

Hvis et link er tomt, viser siden fallback-oensker for den person.

## Forventede kolonner i Google Sheet
`id, navn, pris, butik, prioritet, kategori, ikon, link, billede_url, aktiv, note`

`prioritet` maa gerne vaere tom. Hvis den er tom, vises ingen prioritet paa siden.
`aktiv = Nej` skjuler et oenske.

## GitHub Pages
1. Opret repository, fx `onsker`.
2. Upload `index.html`, `style.css`, `app.js`, `config.js` og `README.md` til repository-roden.
3. I repository: Settings > Pages.
4. Vaelg deployment fra main-branch og `/ (root)`.
5. Gem. GitHub viser derefter Pages-adressen i Pages-indstillingerne.

Live side: https://allangraver.github.io/onskelister/
