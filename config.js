/*
  Google Sheets CSV links for each family member.
  Expected columns in each sheet:
  id, navn, pris, butik, prioritet, kategori, ikon, link, billede_url, aktiv, note

  Leave a value empty to fall back to the built-in demo data for that person.
*/
window.WISH_CONFIG = {
  sheetSources: {
    Allan: "https://sheet-proxy.allangraver.workers.dev/Allan",
    Anne: "https://sheet-proxy.allangraver.workers.dev/Anne",
    Lukas: "https://sheet-proxy.allangraver.workers.dev/Lukas",
    Daniel: "https://sheet-proxy.allangraver.workers.dev/Daniel"
  }
};
