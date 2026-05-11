// ─────────────────────────────────────────────────────────────────────────────
// Country list with capital lat/lng — used by:
//   - onboarding page country picker
//   - CommunityGlobe component (pin coordinates)
//
// ISO 3166-1 alpha-2 codes. Coordinates are approximate country capitals
// (degrees), used only for visualization, not navigation.
// ─────────────────────────────────────────────────────────────────────────────

export interface Country {
  code: string;       // ISO 3166-1 alpha-2 (e.g. "ID")
  name: string;       // Display name
  flag: string;       // Emoji flag
  lat: number;
  lng: number;
}

export const COUNTRIES: Country[] = [
  { code: "ID", name: "Indonesia",          flag: "🇮🇩", lat: -6.21,  lng: 106.85 },
  { code: "MY", name: "Malaysia",           flag: "🇲🇾", lat: 3.14,   lng: 101.69 },
  { code: "SG", name: "Singapore",          flag: "🇸🇬", lat: 1.35,   lng: 103.82 },
  { code: "TH", name: "Thailand",           flag: "🇹🇭", lat: 13.76,  lng: 100.50 },
  { code: "VN", name: "Vietnam",            flag: "🇻🇳", lat: 21.03,  lng: 105.85 },
  { code: "PH", name: "Philippines",        flag: "🇵🇭", lat: 14.60,  lng: 120.98 },
  { code: "IN", name: "India",              flag: "🇮🇳", lat: 28.61,  lng: 77.21  },
  { code: "PK", name: "Pakistan",           flag: "🇵🇰", lat: 33.69,  lng: 73.05  },
  { code: "BD", name: "Bangladesh",         flag: "🇧🇩", lat: 23.81,  lng: 90.41  },
  { code: "JP", name: "Japan",              flag: "🇯🇵", lat: 35.68,  lng: 139.69 },
  { code: "KR", name: "South Korea",        flag: "🇰🇷", lat: 37.57,  lng: 126.98 },
  { code: "CN", name: "China",              flag: "🇨🇳", lat: 39.90,  lng: 116.41 },
  { code: "HK", name: "Hong Kong",          flag: "🇭🇰", lat: 22.32,  lng: 114.17 },
  { code: "TW", name: "Taiwan",             flag: "🇹🇼", lat: 25.04,  lng: 121.56 },
  { code: "AU", name: "Australia",          flag: "🇦🇺", lat: -35.28, lng: 149.13 },
  { code: "NZ", name: "New Zealand",        flag: "🇳🇿", lat: -41.29, lng: 174.78 },

  { code: "US", name: "United States",      flag: "🇺🇸", lat: 38.91,  lng: -77.04 },
  { code: "CA", name: "Canada",             flag: "🇨🇦", lat: 45.42,  lng: -75.70 },
  { code: "MX", name: "Mexico",             flag: "🇲🇽", lat: 19.43,  lng: -99.13 },
  { code: "BR", name: "Brazil",             flag: "🇧🇷", lat: -15.79, lng: -47.88 },
  { code: "AR", name: "Argentina",          flag: "🇦🇷", lat: -34.60, lng: -58.38 },
  { code: "CL", name: "Chile",              flag: "🇨🇱", lat: -33.45, lng: -70.66 },
  { code: "CO", name: "Colombia",           flag: "🇨🇴", lat: 4.71,   lng: -74.07 },
  { code: "PE", name: "Peru",               flag: "🇵🇪", lat: -12.05, lng: -77.04 },

  { code: "GB", name: "United Kingdom",     flag: "🇬🇧", lat: 51.51,  lng: -0.13  },
  { code: "IE", name: "Ireland",            flag: "🇮🇪", lat: 53.35,  lng: -6.26  },
  { code: "FR", name: "France",             flag: "🇫🇷", lat: 48.86,  lng: 2.35   },
  { code: "DE", name: "Germany",            flag: "🇩🇪", lat: 52.52,  lng: 13.40  },
  { code: "ES", name: "Spain",              flag: "🇪🇸", lat: 40.42,  lng: -3.70  },
  { code: "PT", name: "Portugal",           flag: "🇵🇹", lat: 38.72,  lng: -9.14  },
  { code: "IT", name: "Italy",              flag: "🇮🇹", lat: 41.90,  lng: 12.50  },
  { code: "NL", name: "Netherlands",        flag: "🇳🇱", lat: 52.37,  lng: 4.90   },
  { code: "BE", name: "Belgium",            flag: "🇧🇪", lat: 50.85,  lng: 4.35   },
  { code: "CH", name: "Switzerland",        flag: "🇨🇭", lat: 46.95,  lng: 7.45   },
  { code: "AT", name: "Austria",            flag: "🇦🇹", lat: 48.21,  lng: 16.37  },
  { code: "SE", name: "Sweden",             flag: "🇸🇪", lat: 59.33,  lng: 18.07  },
  { code: "NO", name: "Norway",             flag: "🇳🇴", lat: 59.91,  lng: 10.75  },
  { code: "DK", name: "Denmark",            flag: "🇩🇰", lat: 55.68,  lng: 12.57  },
  { code: "FI", name: "Finland",            flag: "🇫🇮", lat: 60.17,  lng: 24.94  },
  { code: "IS", name: "Iceland",            flag: "🇮🇸", lat: 64.13,  lng: -21.82 },
  { code: "PL", name: "Poland",             flag: "🇵🇱", lat: 52.23,  lng: 21.01  },
  { code: "CZ", name: "Czechia",            flag: "🇨🇿", lat: 50.08,  lng: 14.44  },
  { code: "RO", name: "Romania",            flag: "🇷🇴", lat: 44.43,  lng: 26.10  },
  { code: "GR", name: "Greece",             flag: "🇬🇷", lat: 37.98,  lng: 23.73  },
  { code: "UA", name: "Ukraine",            flag: "🇺🇦", lat: 50.45,  lng: 30.52  },
  { code: "RU", name: "Russia",             flag: "🇷🇺", lat: 55.75,  lng: 37.62  },
  { code: "TR", name: "Türkiye",            flag: "🇹🇷", lat: 39.93,  lng: 32.86  },

  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", lat: 24.45, lng: 54.38 },
  { code: "SA", name: "Saudi Arabia",       flag: "🇸🇦", lat: 24.71,  lng: 46.68  },
  { code: "QA", name: "Qatar",              flag: "🇶🇦", lat: 25.29,  lng: 51.53  },
  { code: "KW", name: "Kuwait",             flag: "🇰🇼", lat: 29.38,  lng: 47.99  },
  { code: "IL", name: "Israel",             flag: "🇮🇱", lat: 31.77,  lng: 35.21  },
  { code: "EG", name: "Egypt",              flag: "🇪🇬", lat: 30.04,  lng: 31.24  },
  { code: "ZA", name: "South Africa",       flag: "🇿🇦", lat: -25.75, lng: 28.19  },
  { code: "NG", name: "Nigeria",            flag: "🇳🇬", lat: 9.08,   lng: 7.40   },
  { code: "KE", name: "Kenya",              flag: "🇰🇪", lat: -1.29,  lng: 36.82  },
  { code: "MA", name: "Morocco",            flag: "🇲🇦", lat: 33.97,  lng: -6.84  },
  { code: "GH", name: "Ghana",              flag: "🇬🇭", lat: 5.61,   lng: -0.21  },

  { code: "OT", name: "Other / Prefer not to say", flag: "🌐", lat: 0, lng: 0 },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export const COUNTRIES_BY_CODE: Record<string, Country> = COUNTRIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<string, Country>,
);
