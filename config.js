/*
  Google Sheets CSV links for each family member.
  Expected columns in each sheet:
  id, navn, pris, butik, prioritet, kategori, ikon, link, billede_url, aktiv, note

  Leave a value empty to fall back to the built-in demo data for that person.
*/
window.WISH_CONFIG = {
  sheetSources: {
    Allan: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1Tywb5jTQLEOqeo2xsWfPuZZJRz57GYVMexTvRz7F33IaQw6HRkXeSWbybmdzSw/pub?gid=1202622531&single=true&output=csv",
    Anne: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLZOTPBUiEu1xtZo-XI4jDJ7uJel78yQdN6yNIQ8ilMHiLhWIno7_Al2Qo37JSAA/pub?gid=1534758511&single=true&output=csv",
    Lukas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTsr35_tWAkU_0xRlkmV22ppEqxuoFnTyYprMfqcmMFcPThgeQOnEgcIhFNtpbH_A/pub?gid=1835202134&single=true&output=csv",
    Daniel: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpAkUeWYIJmlaqbiYLYPgssP4gvoZ0Ob9mTqv61VTgBH0eFZQORyC4tEfXYWTw9g/pub?gid=877173825&single=true&output=csv"
  }
};
