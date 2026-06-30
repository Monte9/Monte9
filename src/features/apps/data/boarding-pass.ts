// "Boarding Pass" — Monte's immigration-and-career arc, reframed as a stack of
// airline tickets. Each leg is one boarding pass: where he flew from/to, the
// year, the role he "flew in for", and a flavor of flight metadata. The /apps
// /boarding-pass experiment renders these as draggable, flippable, tearable
// perforated cards drawn with CSS 3D + canvas (no WebGL).
//
// The framing is deliberate: his real journey is travel-shaped (India → US,
// and a stint building Vrbo, literally a travel company), so handing you the
// arc as physical tickets you can pick up is the whole point.

export type BoardingPass = {
  id: string;
  /** IATA-style origin code (BLR, SFO, …). */
  fromCode: string;
  fromCity: string;
  /** IATA-style destination code. */
  toCode: string;
  toCity: string;
  /** Two-letter "airline" + flight number — themed to the chapter. */
  carrier: string;
  flightNo: string;
  /** Year of the move (drives the "date" line). */
  year: string;
  /** The role he flew in for. */
  role: string;
  /** Where that role lived (company / school). */
  org: string;
  /** Seat — a small human detail per leg. */
  seat: string;
  /** Gate — themed. */
  gate: string;
  /** Boarding group / class. */
  cabin: string;
  /** One-line story on the back of the card (revealed on flip). */
  story: string;
  /** Accent hue (degrees) used for the per-card stripe + barcode tint, so the
   *  stack reads as four distinct tickets while still tracking the theme. */
  hue: number;
};

export const BOARDING_PASSES: BoardingPass[] = [
  {
    id: "blr-sfo",
    fromCode: "BLR",
    fromCity: "Bangalore",
    toCode: "SFO",
    toCity: "San Francisco",
    carrier: "MT",
    flightNo: "2013",
    year: "2013",
    role: "Computer Science",
    org: "San Francisco State",
    seat: "18A",
    gate: "A1",
    cabin: "ONE WAY",
    story:
      "Left Bangalore at 18 with two suitcases for a CS degree at SF State. The leg that started everything.",
    hue: 18,
  },
  {
    id: "sfo-sfo",
    fromCode: "SFO",
    fromCity: "San Francisco",
    toCode: "SFO",
    toCity: "San Francisco",
    carrier: "EX",
    flightNo: "2017",
    year: "2017",
    role: "Software Engineer",
    org: "Pillow → Expedia",
    seat: "9C",
    gate: "B4",
    cabin: "FIRST JOB",
    story:
      "First engineering job at Pillow — acquired by Expedia in 2018. Shipping real product in the city I'd just moved to.",
    hue: 205,
  },
  {
    id: "sfo-aus",
    fromCode: "SFO",
    fromCity: "San Francisco",
    toCode: "AUS",
    toCity: "Austin",
    carrier: "VR",
    flightNo: "2019",
    year: "2019",
    role: "Senior Engineer",
    org: "Vrbo · then Curio",
    seat: "4D",
    gate: "C7",
    cabin: "BUSINESS",
    story:
      "To Austin for Senior Software Engineer at Expedia/Vrbo — building travel itself — then on to Curio in web3.",
    hue: 150,
  },
  {
    id: "aus-lax",
    fromCode: "AUS",
    fromCity: "Austin",
    toCode: "LAX",
    toCity: "Los Angeles",
    carrier: "RB",
    flightNo: "2024",
    year: "2024",
    role: "Founding Engineer",
    org: "Rosebud",
    seat: "1A",
    gate: "D1",
    cabin: "FOUNDING",
    story:
      "Wheels down in LA as founding engineer at Rosebud, the AI journaling startup. Currently boarding the next leg.",
    hue: 268,
  },
];

// Format a passenger name the way a real ticket would: SURNAME/FIRST.
export const PASSENGER = "THAKKAR/MONTE";
