// "The Journey" — the cities of Monte's life and career, in chronological
// order. Drives the scroll-driven storytelling globe at /lab/journey: each
// stop is a caption section and a target orientation the globe flies to.
//
// lat/lng are city coordinates and feed `latLngToVec3` (shared globe math),
// so the marker and the camera framing line up exactly with the existing
// /travel globe.

export type JourneyStop = {
  id: string;
  city: string;
  country: string;
  /** Approximate years at this stop; omit/keep loose if unsure. */
  period: string;
  /** One-line role / what happened here. */
  blurb: string;
  lat: number;
  lng: number;
};

export const JOURNEY_STOPS: JourneyStop[] = [
  {
    id: "bangalore",
    city: "Bangalore",
    country: "India",
    period: "First 18 years",
    blurb: "Born & raised. Home for my first 18 years.",
    lat: 12.97,
    lng: 77.59,
  },
  {
    id: "san-francisco",
    city: "San Francisco",
    country: "USA",
    period: "Age 18 →",
    blurb:
      "Moved at 18 for CS at SF State; first job at Pillow (acquired by Expedia, 2018).",
    lat: 37.77,
    lng: -122.42,
  },
  {
    id: "austin",
    city: "Austin",
    country: "USA",
    period: "→ 2022",
    blurb:
      "Senior Software Engineer at Expedia/Vrbo; then Curio (web3).",
    lat: 30.27,
    lng: -97.74,
  },
  {
    id: "los-angeles",
    city: "Los Angeles",
    country: "USA",
    period: "Now",
    blurb:
      "Founding engineer at Rosebud, the AI journaling startup. Currently here.",
    lat: 34.05,
    lng: -118.24,
  },
];
