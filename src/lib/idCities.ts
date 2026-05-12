// ─────────────────────────────────────────────────────────────────────────────
// Indonesian cities / kabupaten with lat/lng — used when onboarding picks
// country = ID to give Indonesian signups precise coordinates instead of
// clustering everyone on Jakarta's centroid.
//
// Coverage: 30 most populous cities/kabupaten that align with where PT
// partners are likely to recruit from (Jakarta + Greater Bandung +
// Surabaya/Sidoarjo + Bali + major Sumatra/Sulawesi/Kalimantan capitals).
// Add more as needed — kecamatan is a free-text field anyway, so users in
// uncovered cities still register cleanly with a country-centroid fallback.
// ─────────────────────────────────────────────────────────────────────────────

export interface IdCity {
  name:     string;  // Display name (Indonesian)
  province: string;  // Province name
  lat:      number;
  lng:      number;
}

export const ID_CITIES: IdCity[] = [
  // Greater Jakarta + West Java
  { name: "Jakarta",            province: "DKI Jakarta",      lat: -6.2088, lng: 106.8456 },
  { name: "Bekasi",             province: "Jawa Barat",        lat: -6.2349, lng: 106.9896 },
  { name: "Depok",              province: "Jawa Barat",        lat: -6.4025, lng: 106.7942 },
  { name: "Tangerang",          province: "Banten",            lat: -6.1783, lng: 106.6319 },
  { name: "Tangerang Selatan",  province: "Banten",            lat: -6.3022, lng: 106.6644 },
  { name: "Bogor",              province: "Jawa Barat",        lat: -6.5944, lng: 106.7892 },
  { name: "Bandung",            province: "Jawa Barat",        lat: -6.9175, lng: 107.6191 },
  { name: "Cimahi",             province: "Jawa Barat",        lat: -6.8722, lng: 107.5424 },
  { name: "Cirebon",            province: "Jawa Barat",        lat: -6.7320, lng: 108.5523 },
  // Central + East Java
  { name: "Semarang",           province: "Jawa Tengah",       lat: -6.9667, lng: 110.4167 },
  { name: "Yogyakarta",         province: "DI Yogyakarta",     lat: -7.7956, lng: 110.3695 },
  { name: "Surakarta (Solo)",   province: "Jawa Tengah",       lat: -7.5666, lng: 110.8167 },
  { name: "Surabaya",           province: "Jawa Timur",        lat: -7.2575, lng: 112.7521 },
  { name: "Sidoarjo",           province: "Jawa Timur",        lat: -7.4478, lng: 112.7184 },
  { name: "Malang",             province: "Jawa Timur",        lat: -7.9839, lng: 112.6214 },
  // Bali + Nusa Tenggara
  { name: "Denpasar",           province: "Bali",              lat: -8.6705, lng: 115.2126 },
  { name: "Mataram",            province: "Nusa Tenggara Barat", lat: -8.5833, lng: 116.1167 },
  // Sumatra
  { name: "Medan",              province: "Sumatera Utara",    lat: 3.5952,  lng: 98.6722  },
  { name: "Palembang",          province: "Sumatera Selatan",  lat: -2.9909, lng: 104.7566 },
  { name: "Padang",             province: "Sumatera Barat",    lat: -0.9492, lng: 100.3543 },
  { name: "Pekanbaru",          province: "Riau",              lat: 0.5333,  lng: 101.4500 },
  { name: "Bandar Lampung",     province: "Lampung",           lat: -5.4292, lng: 105.2610 },
  { name: "Batam",              province: "Kepulauan Riau",    lat: 1.0456,  lng: 104.0305 },
  // Kalimantan
  { name: "Pontianak",          province: "Kalimantan Barat",  lat: -0.0263, lng: 109.3425 },
  { name: "Banjarmasin",        province: "Kalimantan Selatan", lat: -3.3186, lng: 114.5944 },
  { name: "Balikpapan",         province: "Kalimantan Timur",  lat: -1.2654, lng: 116.8312 },
  { name: "Samarinda",          province: "Kalimantan Timur",  lat: -0.5022, lng: 117.1536 },
  // Sulawesi
  { name: "Makassar",           province: "Sulawesi Selatan",  lat: -5.1477, lng: 119.4327 },
  { name: "Manado",             province: "Sulawesi Utara",    lat: 1.4748,  lng: 124.8421 },
  { name: "Palu",               province: "Sulawesi Tengah",   lat: -0.9003, lng: 119.8779 },
  // Papua + Maluku
  { name: "Jayapura",           province: "Papua",             lat: -2.5333, lng: 140.7167 },
  { name: "Ambon",              province: "Maluku",            lat: -3.6954, lng: 128.1814 },
];

export const ID_CITIES_BY_NAME: Record<string, IdCity> = Object.fromEntries(
  ID_CITIES.map(c => [c.name.toLowerCase(), c]),
);

/** Looks up a city by case-insensitive name. Trims + normalizes whitespace. */
export function findIdCity(name: string | null | undefined): IdCity | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return ID_CITIES_BY_NAME[key] ?? null;
}
