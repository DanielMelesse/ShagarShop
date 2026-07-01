export interface EthiopiaRegion {
  id: string;
  label: string;
  postalCode: string;
}

export interface EthiopiaLocation {
  id: string;
  label: string;
  regionId: string;
  lat: number;
  lng: number;
}

/** Ethiopia map framing */
export const ETHIOPIA_CENTER = { lat: 9.145, lng: 40.49 };
export const ETHIOPIA_DEFAULT_ZOOM = 6;
export const ETHIOPIA_LOCATION_ZOOM = 13;
export const ETHIOPIA_BOUNDS: [[number, number], [number, number]] = [
  [3.4, 33.0],
  [14.9, 48.0],
];

export const ETHIOPIA_REGIONS: EthiopiaRegion[] = [
  { id: "addis-ababa", label: "Addis Ababa", postalCode: "1000" },
  { id: "dire-dawa", label: "Dire Dawa", postalCode: "3000" },
  { id: "afar", label: "Afar", postalCode: "1000" },
  { id: "amhara", label: "Amhara", postalCode: "1000" },
  { id: "benishangul-gumuz", label: "Benishangul-Gumuz", postalCode: "1000" },
  { id: "central-ethiopia", label: "Central Ethiopia", postalCode: "1000" },
  { id: "gambela", label: "Gambela", postalCode: "1000" },
  { id: "harari", label: "Harari", postalCode: "3100" },
  { id: "oromia", label: "Oromia", postalCode: "1000" },
  { id: "sidama", label: "Sidama", postalCode: "1000" },
  { id: "somali", label: "Somali", postalCode: "1000" },
  { id: "south-ethiopia", label: "South Ethiopia", postalCode: "1000" },
  { id: "southwest-ethiopia", label: "Southwest Ethiopia", postalCode: "1000" },
  { id: "tigray", label: "Tigray", postalCode: "1000" },
];

export const ETHIOPIA_LOCATIONS: EthiopiaLocation[] = [
  // Addis Ababa — sub-cities
  { id: "aa-bole", label: "Bole", regionId: "addis-ababa", lat: 8.997, lng: 38.789 },
  { id: "aa-kirkos", label: "Kirkos", regionId: "addis-ababa", lat: 9.012, lng: 38.754 },
  { id: "aa-yeka", label: "Yeka", regionId: "addis-ababa", lat: 9.045, lng: 38.802 },
  { id: "aa-lideta", label: "Lideta", regionId: "addis-ababa", lat: 9.024, lng: 38.732 },
  { id: "aa-arada", label: "Arada", regionId: "addis-ababa", lat: 9.032, lng: 38.747 },
  { id: "aa-gullele", label: "Gullele", regionId: "addis-ababa", lat: 9.055, lng: 38.724 },
  { id: "aa-kolfe", label: "Kolfe Keranio", regionId: "addis-ababa", lat: 9.01, lng: 38.695 },
  { id: "aa-nifas", label: "Nifas Silk-Lafto", regionId: "addis-ababa", lat: 8.978, lng: 38.728 },
  { id: "aa-akaki", label: "Akaki Kality", regionId: "addis-ababa", lat: 8.862, lng: 38.78 },
  { id: "aa-addis-ketema", label: "Addis Ketema", regionId: "addis-ababa", lat: 9.034, lng: 38.715 },
  { id: "aa-lemi-kura", label: "Lemi Kura", regionId: "addis-ababa", lat: 8.945, lng: 38.81 },

  // Addis Ababa — popular areas & neighborhoods
  { id: "aa-megenagna", label: "Megenagna", regionId: "addis-ababa", lat: 9.012, lng: 38.802 },
  { id: "aa-cmc", label: "CMC", regionId: "addis-ababa", lat: 9.038, lng: 38.815 },
  { id: "aa-ayat", label: "Ayat", regionId: "addis-ababa", lat: 8.995, lng: 38.845 },
  { id: "aa-summit", label: "Summit", regionId: "addis-ababa", lat: 9.018, lng: 38.828 },
  { id: "aa-gerji", label: "Gerji", regionId: "addis-ababa", lat: 8.988, lng: 38.805 },
  { id: "aa-bole-michael", label: "Bole Michael", regionId: "addis-ababa", lat: 8.985, lng: 38.778 },
  { id: "aa-bole-bulbula", label: "Bole Bulbula", regionId: "addis-ababa", lat: 8.972, lng: 38.792 },
  { id: "aa-kazanchis", label: "Kazanchis", regionId: "addis-ababa", lat: 9.018, lng: 38.762 },
  { id: "aa-piassa", label: "Piassa", regionId: "addis-ababa", lat: 9.034, lng: 38.752 },
  { id: "aa-merkato", label: "Merkato", regionId: "addis-ababa", lat: 9.03, lng: 38.738 },
  { id: "aa-mexico", label: "Mexico", regionId: "addis-ababa", lat: 9.008, lng: 38.745 },
  { id: "aa-gotera", label: "Gotera", regionId: "addis-ababa", lat: 8.992, lng: 38.748 },
  { id: "aa-saris", label: "Saris", regionId: "addis-ababa", lat: 8.955, lng: 38.765 },
  { id: "aa-tafo", label: "Tafo", regionId: "addis-ababa", lat: 8.978, lng: 38.835 },
  { id: "aa-jemo", label: "Jemo", regionId: "addis-ababa", lat: 8.965, lng: 38.718 },
  { id: "aa-tor-hailoch", label: "Tor Hailoch", regionId: "addis-ababa", lat: 8.988, lng: 38.712 },
  { id: "aa-sar-bet", label: "Sar Bet", regionId: "addis-ababa", lat: 9.005, lng: 38.718 },
  { id: "aa-kality", label: "Kality", regionId: "addis-ababa", lat: 8.878, lng: 38.798 },
  { id: "aa-lafto", label: "Lafto", regionId: "addis-ababa", lat: 8.968, lng: 38.722 },
  { id: "aa-aware", label: "Aware", regionId: "addis-ababa", lat: 9.048, lng: 38.788 },
  { id: "aa-friendship", label: "Friendship", regionId: "addis-ababa", lat: 9.005, lng: 38.795 },
  { id: "aa-4-kilo", label: "4 Kilo", regionId: "addis-ababa", lat: 9.042, lng: 38.762 },
  { id: "aa-6-kilo", label: "6 Kilo", regionId: "addis-ababa", lat: 9.048, lng: 38.758 },
  { id: "aa-bambis", label: "Bambis", regionId: "addis-ababa", lat: 9.028, lng: 38.758 },
  { id: "aa-lebu", label: "Lebu", regionId: "addis-ababa", lat: 8.948, lng: 38.705 },
  { id: "aa-gofa", label: "Gofa", regionId: "addis-ababa", lat: 8.995, lng: 38.728 },
  { id: "aa-kera", label: "Kera", regionId: "addis-ababa", lat: 8.982, lng: 38.735 },
  { id: "aa-meskel-square", label: "Meskel Square", regionId: "addis-ababa", lat: 9.01, lng: 38.761 },
  { id: "aa-bole-airport", label: "Bole Airport Area", regionId: "addis-ababa", lat: 8.978, lng: 38.799 },

  // Dire Dawa
  { id: "dd-city", label: "Dire Dawa City", regionId: "dire-dawa", lat: 9.6, lng: 41.866 },
  { id: "dd-kezira", label: "Kezira", regionId: "dire-dawa", lat: 9.593, lng: 41.862 },
  { id: "dd-sabian", label: "Sabian", regionId: "dire-dawa", lat: 9.608, lng: 41.878 },
  { id: "dd-gende-bel", label: "Gende Bel", regionId: "dire-dawa", lat: 9.585, lng: 41.855 },
  { id: "dd-melka-jebdu", label: "Melka Jebdu", regionId: "dire-dawa", lat: 9.615, lng: 41.848 },

  // Oromia
  { id: "or-adama", label: "Adama (Nazret)", regionId: "oromia", lat: 8.54, lng: 39.27 },
  { id: "or-jimma", label: "Jimma", regionId: "oromia", lat: 7.667, lng: 36.833 },
  { id: "or-bishoftu", label: "Bishoftu (Debre Zeit)", regionId: "oromia", lat: 8.752, lng: 38.978 },
  { id: "or-shashamane", label: "Shashamane", regionId: "oromia", lat: 7.2, lng: 38.6 },
  { id: "or-ambo", label: "Ambo", regionId: "oromia", lat: 8.983, lng: 37.85 },
  { id: "or-negele", label: "Negele Borana", regionId: "oromia", lat: 5.317, lng: 39.583 },
  { id: "or-sebeta", label: "Sebeta", regionId: "oromia", lat: 8.917, lng: 38.617 },
  { id: "or-holeta", label: "Holeta", regionId: "oromia", lat: 8.983, lng: 38.633 },
  { id: "or-burayu", label: "Burayu", regionId: "oromia", lat: 9.067, lng: 38.667 },
  { id: "or-sululta", label: "Sululta", regionId: "oromia", lat: 9.183, lng: 38.733 },
  { id: "or-sendafa", label: "Sendafa", regionId: "oromia", lat: 9.083, lng: 38.783 },
  { id: "or-mojo", label: "Mojo", regionId: "oromia", lat: 8.6, lng: 39.133 },
  { id: "or-modjo", label: "Modjo", regionId: "oromia", lat: 8.6, lng: 39.133 },
  { id: "or-welkite", label: "Welkite", regionId: "oromia", lat: 8.283, lng: 37.783 },
  { id: "or-nekemte", label: "Nekemte", regionId: "oromia", lat: 9.083, lng: 36.55 },
  { id: "or-asella", label: "Asella", regionId: "oromia", lat: 7.967, lng: 39.117 },
  { id: "or-bale-robe", label: "Bale Robe", regionId: "oromia", lat: 7.133, lng: 40.0 },
  { id: "or-ghimbi", label: "Ghimbi", regionId: "oromia", lat: 9.283, lng: 35.833 },
  { id: "or-dembi-dolo", label: "Dembi Dolo", regionId: "oromia", lat: 8.533, lng: 34.8 },
  { id: "or-ghinchi", label: "Ghinchi", regionId: "oromia", lat: 9.067, lng: 37.867 },
  { id: "or-fiche", label: "Fiche", regionId: "oromia", lat: 9.8, lng: 38.733 },
  { id: "or-moyale", label: "Moyale", regionId: "oromia", lat: 3.517, lng: 39.05 },
  { id: "or-ziway", label: "Ziway (Batu)", regionId: "oromia", lat: 7.933, lng: 38.717 },
  { id: "or-shashemene", label: "Shashemene", regionId: "oromia", lat: 7.2, lng: 38.6 },
  { id: "or-woliso", label: "Woliso", regionId: "oromia", lat: 8.533, lng: 37.967 },
  { id: "or-ghion", label: "Ghion", regionId: "oromia", lat: 9.017, lng: 38.75 },
  { id: "or-burqa-jato", label: "Burqa Jato", regionId: "oromia", lat: 9.05, lng: 38.7 },
  { id: "or-chancho", label: "Chancho", regionId: "oromia", lat: 9.133, lng: 38.817 },
  { id: "or-dukem", label: "Dukem", regionId: "oromia", lat: 8.8, lng: 38.883 },
  { id: "or-gelan", label: "Gelan", regionId: "oromia", lat: 8.833, lng: 38.917 },
  { id: "or-aleltu", label: "Aleltu", regionId: "oromia", lat: 9.15, lng: 38.75 },
  { id: "or-sululta-town", label: "Sululta Town", regionId: "oromia", lat: 9.183, lng: 38.733 },
  { id: "or-meki", label: "Meki", regionId: "oromia", lat: 8.15, lng: 38.783 },
  { id: "or-waliso", label: "Waliso", regionId: "oromia", lat: 8.533, lng: 37.967 },
  { id: "or-abebech-gobena", label: "Abebech Gobena", regionId: "oromia", lat: 8.95, lng: 38.65 },

  // Amhara
  { id: "am-bahir-dar", label: "Bahir Dar", regionId: "amhara", lat: 11.594, lng: 37.391 },
  { id: "am-gondar", label: "Gondar", regionId: "amhara", lat: 12.6, lng: 37.467 },
  { id: "am-dessie", label: "Dessie", regionId: "amhara", lat: 11.133, lng: 39.633 },
  { id: "am-debre-markos", label: "Debre Markos", regionId: "amhara", lat: 10.35, lng: 37.733 },
  { id: "am-debre-berhan", label: "Debre Berhan", regionId: "amhara", lat: 9.683, lng: 39.533 },
  { id: "am-lalibela", label: "Lalibela", regionId: "amhara", lat: 12.031, lng: 39.047 },
  { id: "am-kombolcha", label: "Kombolcha", regionId: "amhara", lat: 11.083, lng: 39.733 },
  { id: "am-woldia", label: "Woldia", regionId: "amhara", lat: 11.833, lng: 39.6 },
  { id: "am-debre-tabor", label: "Debre Tabor", regionId: "amhara", lat: 11.85, lng: 38.017 },
  { id: "am-debre-sina", label: "Debre Sina", regionId: "amhara", lat: 9.683, lng: 38.733 },
  { id: "am-kemise", label: "Kemise", regionId: "amhara", lat: 10.717, lng: 39.867 },
  { id: "am-woini", label: "Woini", regionId: "amhara", lat: 11.5, lng: 39.5 },
  { id: "am-finote-selam", label: "Finote Selam", regionId: "amhara", lat: 10.7, lng: 37.883 },
  { id: "am-motta", label: "Motta", regionId: "amhara", lat: 11.083, lng: 37.867 },
  { id: "am-bure", label: "Bure", regionId: "amhara", lat: 10.7, lng: 37.067 },
  { id: "am-debre-werk", label: "Debre Werk", regionId: "amhara", lat: 12.033, lng: 38.167 },
  { id: "am-rob", label: "Rob Gebeya", regionId: "amhara", lat: 12.017, lng: 39.633 },
  { id: "am-sekota", label: "Sekota", regionId: "amhara", lat: 12.633, lng: 38.967 },
  { id: "am-wereta", label: "Wereta", regionId: "amhara", lat: 11.917, lng: 37.167 },
  { id: "am-dangila", label: "Dangila", regionId: "amhara", lat: 11.267, lng: 36.833 },
  { id: "am-enjibara", label: "Enjibara", regionId: "amhara", lat: 11.183, lng: 36.933 },
  { id: "am-ayikel", label: "Ayikel", regionId: "amhara", lat: 12.433, lng: 37.783 },
  { id: "am-quara", label: "Quara", regionId: "amhara", lat: 12.733, lng: 36.167 },
  { id: "am-metema", label: "Metema", regionId: "amhara", lat: 12.967, lng: 36.183 },
  { id: "am-awash", label: "Awash", regionId: "amhara", lat: 9.017, lng: 40.167 },
  { id: "am-ati", label: "Ati", regionId: "amhara", lat: 11.55, lng: 39.717 },

  // Tigray
  { id: "ti-mekelle", label: "Mekelle", regionId: "tigray", lat: 13.497, lng: 39.475 },
  { id: "ti-adigrat", label: "Adigrat", regionId: "tigray", lat: 14.277, lng: 39.462 },
  { id: "ti-axum", label: "Axum", regionId: "tigray", lat: 14.121, lng: 38.725 },
  { id: "ti-shire", label: "Shire (Inda Selassie)", regionId: "tigray", lat: 14.1, lng: 38.283 },
  { id: "ti-adwa", label: "Adwa", regionId: "tigray", lat: 14.167, lng: 38.9 },
  { id: "ti-wukro", label: "Wukro", regionId: "tigray", lat: 13.783, lng: 39.6 },
  { id: "ti-alamata", label: "Alamata", regionId: "tigray", lat: 12.017, lng: 39.033 },
  { id: "ti-humera", label: "Humera", regionId: "tigray", lat: 14.3, lng: 36.617 },
  { id: "ti-maychew", label: "Maychew", regionId: "tigray", lat: 12.783, lng: 39.533 },
  { id: "ti-abiy-addi", label: "Abiy Addi", regionId: "tigray", lat: 13.633, lng: 39.017 },
  { id: "ti-korem", label: "Korem", regionId: "tigray", lat: 12.5, lng: 39.517 },
  { id: "ti-enda-selassie", label: "Enda Selassie", regionId: "tigray", lat: 14.1, lng: 38.283 },
  { id: "ti-hawzen", label: "Hawzen", regionId: "tigray", lat: 14.133, lng: 39.45 },

  // Sidama
  { id: "si-hawassa", label: "Hawassa", regionId: "sidama", lat: 7.062, lng: 38.476 },
  { id: "si-yirgalem", label: "Yirgalem", regionId: "sidama", lat: 6.75, lng: 38.417 },
  { id: "si-alesha", label: "Alesha", regionId: "sidama", lat: 7.0, lng: 38.5 },
  { id: "si-daye", label: "Daye", regionId: "sidama", lat: 7.15, lng: 38.55 },
  { id: "si-bona", label: "Bona", regionId: "sidama", lat: 6.6, lng: 38.233 },
  { id: "si-chuko", label: "Chuko", regionId: "sidama", lat: 7.083, lng: 38.45 },
  { id: "si-hawassa-tabor", label: "Hawassa Tabor", regionId: "sidama", lat: 7.055, lng: 38.49 },
  { id: "si-hawassa-piassa", label: "Hawassa Piassa", regionId: "sidama", lat: 7.068, lng: 38.482 },

  // South Ethiopia
  { id: "se-arba-minch", label: "Arba Minch", regionId: "south-ethiopia", lat: 6.033, lng: 37.55 },
  { id: "se-sodo", label: "Wolaita Sodo", regionId: "south-ethiopia", lat: 6.85, lng: 37.767 },
  { id: "se-dilla", label: "Dilla", regionId: "south-ethiopia", lat: 6.417, lng: 38.317 },
  { id: "se-hosaena", label: "Hosaena", regionId: "south-ethiopia", lat: 7.55, lng: 37.85 },
  { id: "se-boditi", label: "Boditi", regionId: "south-ethiopia", lat: 6.967, lng: 37.867 },
  { id: "se-sawla", label: "Sawla", regionId: "south-ethiopia", lat: 6.0, lng: 36.75 },
  { id: "se-jinka", label: "Jinka", regionId: "south-ethiopia", lat: 5.65, lng: 36.65 },
  { id: "se-konso", label: "Konso", regionId: "south-ethiopia", lat: 5.3, lng: 37.483 },
  { id: "se-durame", label: "Durame", regionId: "south-ethiopia", lat: 7.233, lng: 37.917 },
  { id: "se-bonga", label: "Bonga", regionId: "south-ethiopia", lat: 7.283, lng: 36.233 },
  { id: "se-areka", label: "Areka", regionId: "south-ethiopia", lat: 7.067, lng: 37.7 },
  { id: "se-gidole", label: "Gidole", regionId: "south-ethiopia", lat: 5.65, lng: 37.367 },
  { id: "se-bench-maji", label: "Bench Maji", regionId: "south-ethiopia", lat: 6.467, lng: 35.583 },
  { id: "se-chencha", label: "Chencha", regionId: "south-ethiopia", lat: 6.25, lng: 37.567 },
  { id: "se-shebedino", label: "Shebedino", regionId: "south-ethiopia", lat: 6.733, lng: 38.233 },

  // Southwest Ethiopia
  { id: "sw-bonga", label: "Bonga", regionId: "southwest-ethiopia", lat: 7.283, lng: 36.233 },
  { id: "sw-mizan", label: "Mizan Teferi", regionId: "southwest-ethiopia", lat: 6.983, lng: 35.583 },
  { id: "sw-tepi", label: "Tepi", regionId: "southwest-ethiopia", lat: 7.2, lng: 35.45 },
  { id: "sw-gore", label: "Gore", regionId: "southwest-ethiopia", lat: 8.15, lng: 35.533 },
  { id: "sw-bechaji", label: "Bechaji", regionId: "southwest-ethiopia", lat: 7.35, lng: 36.1 },
  { id: "sw-dawro", label: "Tarcha (Dawro)", regionId: "southwest-ethiopia", lat: 6.55, lng: 37.083 },
  { id: "sw-konta", label: "Konta", regionId: "southwest-ethiopia", lat: 7.0, lng: 36.5 },
  { id: "sw-bench", label: "Bench", regionId: "southwest-ethiopia", lat: 6.5, lng: 35.5 },
  { id: "sw-maji", label: "Maji", regionId: "southwest-ethiopia", lat: 5.8, lng: 35.5 },

  // Harari
  { id: "ha-harar", label: "Harar", regionId: "harari", lat: 9.313, lng: 42.117 },
  { id: "ha-jegol", label: "Jegol (Old City)", regionId: "harari", lat: 9.31, lng: 42.12 },
  { id: "ha-sofi", label: "Sofi", regionId: "harari", lat: 9.32, lng: 42.11 },
  { id: "ha-abadir", label: "Abadir", regionId: "harari", lat: 9.305, lng: 42.125 },

  // Somali
  { id: "so-jijiga", label: "Jijiga", regionId: "somali", lat: 9.35, lng: 42.8 },
  { id: "so-gode", label: "Gode", regionId: "somali", lat: 5.95, lng: 43.583 },
  { id: "so-dire-dawa-out", label: "Dire Dawa (Somali Zone)", regionId: "somali", lat: 9.6, lng: 41.87 },
  { id: "so-degehabur", label: "Degehabur", regionId: "somali", lat: 8.217, lng: 43.583 },
  { id: "so-kebri-dehar", label: "Kebri Dehar", regionId: "somali", lat: 6.733, lng: 44.283 },
  { id: "so-warder", label: "Warder", regionId: "somali", lat: 6.967, lng: 45.333 },
  { id: "so-shinile", label: "Shinile", regionId: "somali", lat: 9.7, lng: 41.85 },
  { id: "so-ayisha", label: "Ayisha", regionId: "somali", lat: 9.5, lng: 42.5 },
  { id: "so-hartisheik", label: "Hartisheik", regionId: "somali", lat: 9.45, lng: 42.65 },
  { id: "so-fik", label: "Fik", regionId: "somali", lat: 8.15, lng: 42.3 },

  // Afar
  { id: "af-semera", label: "Semera", regionId: "afar", lat: 11.793, lng: 41.014 },
  { id: "af-assaita", label: "Assaita", regionId: "afar", lat: 11.667, lng: 41.433 },
  { id: "af-logia", label: "Logia", regionId: "afar", lat: 11.983, lng: 40.983 },
  { id: "af-dubti", label: "Dubti", regionId: "afar", lat: 11.733, lng: 41.083 },
  { id: "af-asayita", label: "Asayita", regionId: "afar", lat: 11.667, lng: 41.433 },
  { id: "af-awash", label: "Awash Sebat Kilo", regionId: "afar", lat: 9.017, lng: 40.167 },
  { id: "af-mile", label: "Mile", regionId: "afar", lat: 11.417, lng: 40.75 },
  { id: "af-chifra", label: "Chifra", regionId: "afar", lat: 11.5, lng: 41.0 },
  { id: "af-gewane", label: "Gewane", regionId: "afar", lat: 10.167, lng: 40.65 },
  { id: "af-elidar", label: "Elidar", regionId: "afar", lat: 12.0, lng: 41.5 },

  // Gambela
  { id: "ga-gambela", label: "Gambela Town", regionId: "gambela", lat: 8.25, lng: 34.583 },
  { id: "ga-itang", label: "Itang", regionId: "gambela", lat: 8.083, lng: 34.983 },
  { id: "ga-abobo", label: "Abobo", regionId: "gambela", lat: 7.85, lng: 34.55 },
  { id: "ga-pugnido", label: "Pugnido", regionId: "gambela", lat: 7.633, lng: 34.283 },
  { id: "ga-mengesh", label: "Mengesh", regionId: "gambela", lat: 8.15, lng: 34.45 },

  // Benishangul-Gumuz
  { id: "bg-assosa", label: "Assosa", regionId: "benishangul-gumuz", lat: 10.067, lng: 34.533 },
  { id: "bg-pawe", label: "Pawe", regionId: "benishangul-gumuz", lat: 11.333, lng: 36.417 },
  { id: "bg-menge", label: "Menge", regionId: "benishangul-gumuz", lat: 10.5, lng: 35.0 },
  { id: "bg-kurmuk", label: "Kurmuk", regionId: "benishangul-gumuz", lat: 10.55, lng: 34.283 },
  { id: "bg-guba", label: "Guba", regionId: "benishangul-gumuz", lat: 11.0, lng: 35.5 },
  { id: "bg-sherkole", label: "Sherkole", regionId: "benishangul-gumuz", lat: 10.7, lng: 34.8 },

  // Central Ethiopia
  { id: "ce-hosaena", label: "Hosaena", regionId: "central-ethiopia", lat: 7.55, lng: 37.85 },
  { id: "ce-hosanna", label: "Hosanna", regionId: "central-ethiopia", lat: 7.55, lng: 37.85 },
  { id: "ce-shone", label: "Shone", regionId: "central-ethiopia", lat: 7.45, lng: 37.783 },
  { id: "ce-hadero", label: "Hadero", regionId: "central-ethiopia", lat: 7.35, lng: 37.9 },
  { id: "ce-durame", label: "Durame", regionId: "central-ethiopia", lat: 7.233, lng: 37.917 },
  { id: "ce-kembata", label: "Kembata Tembaro", regionId: "central-ethiopia", lat: 7.4, lng: 37.85 },
  { id: "ce-hadero-tembaro", label: "Hadero Tembaro", regionId: "central-ethiopia", lat: 7.35, lng: 37.9 },
  { id: "ce-alaba", label: "Alaba Kulito", regionId: "central-ethiopia", lat: 7.317, lng: 38.217 },
  { id: "ce-halaba", label: "Halaba Kulito", regionId: "central-ethiopia", lat: 7.317, lng: 38.217 },
  { id: "ce-silti", label: "Silti", regionId: "central-ethiopia", lat: 8.25, lng: 38.0 },
  { id: "ce-butajira", label: "Butajira", regionId: "central-ethiopia", lat: 8.117, lng: 38.317 },
  { id: "ce-gurage", label: "Wolkite (Gurage)", regionId: "central-ethiopia", lat: 8.283, lng: 37.783 },
];

const regionById = new Map(ETHIOPIA_REGIONS.map((r) => [r.id, r]));
const locationByLabel = new Map(
  ETHIOPIA_LOCATIONS.map((l) => [`${l.regionId}:${l.label.toLowerCase()}`, l]),
);

export function getEthiopiaRegion(id: string): EthiopiaRegion | undefined {
  return regionById.get(id);
}

export function getLocationsForRegion(regionId: string): EthiopiaLocation[] {
  return ETHIOPIA_LOCATIONS.filter((l) => l.regionId === regionId);
}

export function findLocationInRegion(
  regionId: string,
  label: string,
): EthiopiaLocation | undefined {
  const key = `${regionId}:${label.trim().toLowerCase()}`;
  return locationByLabel.get(key);
}
