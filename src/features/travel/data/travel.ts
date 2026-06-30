// Places Monte has lived in or visited. Drives the /travel globe fills,
// the rich-info surface, and the legend. `atlasName` matches the country's
// `properties.name` in world-atlas/countries-110m.
export type Category = "home" | "lived" | "visited";

export type TravelCountry = {
  name: string; // display name
  flag: string;
  atlasName: string; // world-atlas properties.name (for the fill polygon)
  category: Category;
  detail: string; // "May 2024" (visited) or "~18 years" (home/lived)
  blurb: string;
  lat: number;
  lng: number;
  sort: string; // ordering: home/lived first, then visited newest-first
};

export const CATEGORY_LABELS: Record<Category, string> = {
  home: "Home",
  lived: "Lived",
  visited: "Visited",
};

export const TRAVEL_COUNTRIES: TravelCountry[] = [
  {
    name: "India",
    flag: "🇮🇳",
    atlasName: "India",
    category: "home",
    detail: "Grew up here — ~18 years",
    blurb: "Born and raised in Bangalore. Home for my first 18 years.",
    lat: 22,
    lng: 79,
    sort: "0-home",
  },
  {
    name: "United States",
    flag: "🇺🇸",
    atlasName: "United States of America",
    category: "lived",
    detail: "Lived here — ~13 years",
    blurb: "San Francisco, Austin, and now Los Angeles.",
    lat: 39,
    lng: -98,
    sort: "1-lived",
  },
  { name: "Italy", flag: "🇮🇹", atlasName: "Italy", category: "visited", detail: "October 2025", blurb: "", lat: 41.9, lng: 12.5, sort: "2025-10" },
  { name: "France", flag: "🇫🇷", atlasName: "France", category: "visited", detail: "October 2025", blurb: "", lat: 46.6, lng: 2.2, sort: "2025-10b" },
  { name: "Japan", flag: "🇯🇵", atlasName: "Japan", category: "visited", detail: "May 2024", blurb: "", lat: 36.2, lng: 138.2, sort: "2024-05" },
  { name: "Croatia", flag: "🇭🇷", atlasName: "Croatia", category: "visited", detail: "August 2023", blurb: "", lat: 45.1, lng: 15.2, sort: "2023-08" },
  { name: "Tanzania", flag: "🇹🇿", atlasName: "Tanzania", category: "visited", detail: "March 2023", blurb: "", lat: -6.4, lng: 34.9, sort: "2023-03" },
  { name: "Costa Rica", flag: "🇨🇷", atlasName: "Costa Rica", category: "visited", detail: "November 2022", blurb: "", lat: 9.7, lng: -83.8, sort: "2022-11" },
  { name: "Turkey", flag: "🇹🇷", atlasName: "Turkey", category: "visited", detail: "July 2013", blurb: "", lat: 39.0, lng: 35.2, sort: "2013-07" },
];

// Kept for any remaining list usage; visited only, newest first.
export const VISITED_NEWEST_FIRST = TRAVEL_COUNTRIES.filter(
  (c) => c.category === "visited"
).sort((a, b) => (a.sort < b.sort ? 1 : -1));
