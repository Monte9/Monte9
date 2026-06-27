// Countries Monte has visited. Single source of truth for the /travel globe
// pins and the legend. Add new destinations here.
export type VisitedCountry = {
  name: string;
  flag: string;
  lat: number;
  lng: number;
  visited: string; // human-readable, shown in UI
  sort: string; // YYYY-MM, for newest-first ordering
};

export const VISITED_COUNTRIES: VisitedCountry[] = [
  { name: "Italy", flag: "🇮🇹", lat: 41.9, lng: 12.5, visited: "October 2025", sort: "2025-10" },
  { name: "France", flag: "🇫🇷", lat: 46.6, lng: 2.2, visited: "October 2025", sort: "2025-10b" },
  { name: "Japan", flag: "🇯🇵", lat: 36.2, lng: 138.2, visited: "May 2024", sort: "2024-05" },
  { name: "Croatia", flag: "🇭🇷", lat: 45.1, lng: 15.2, visited: "August 2023", sort: "2023-08" },
  { name: "Tanzania", flag: "🇹🇿", lat: -6.4, lng: 34.9, visited: "March 2023", sort: "2023-03" },
  { name: "Costa Rica", flag: "🇨🇷", lat: 9.7, lng: -83.8, visited: "November 2022", sort: "2022-11" },
  { name: "Turkey", flag: "🇹🇷", lat: 39.0, lng: 35.2, visited: "July 2013", sort: "2013-07" },
];

// Newest first.
export const VISITED_NEWEST_FIRST = [...VISITED_COUNTRIES].sort((a, b) =>
  a.sort < b.sort ? 1 : -1
);
