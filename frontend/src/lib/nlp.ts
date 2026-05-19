export interface ParsedSignals {
  city: string;
  price_range: "budget" | "mid" | "premium";
  preferred_food: string;
}

const CITIES: Record<string, string> = {
  lagos: "Lagos",
  abuja: "Abuja",
  "port harcourt": "Port Harcourt",
  ph: "Port Harcourt",
  ibadan: "Ibadan",
  kano: "Kano",
  lekki: "Lagos",
  vi: "Lagos",
  ikeja: "Lagos",
  surulere: "Lagos",
  enugu: "Enugu",
  warri: "Warri",
  benin: "Benin City",
};

const PRICE_SIGNALS: Record<string, "budget" | "mid" | "premium"> = {
  cheap: "budget",
  budget: "budget",
  affordable: "budget",
  "small money": "budget",
  free: "budget",
  baller: "premium",
  expensive: "premium",
  "fine dining": "premium",
  luxury: "premium",
  premium: "premium",
  mid: "mid",
  moderate: "mid",
};

const FOODS = [
  "jollof",
  "suya",
  "amala",
  "egusi",
  "pounded yam",
  "pepper soup",
  "shawarma",
  "eba",
  "akara",
  "moi moi",
  "nkwobi",
  "isi ewu",
  "boli",
  "swallow",
  "grills",
  "seafood",
  "rice",
  "chicken",
  "goat meat",
];

export function parseMessage(msg: string): ParsedSignals {
  const lower = msg.toLowerCase();

  let city = "Lagos";
  for (const [key, val] of Object.entries(CITIES)) {
    if (lower.includes(key)) {
      city = val;
      break;
    }
  }

  let price_range: "budget" | "mid" | "premium" = "budget";
  for (const [key, val] of Object.entries(PRICE_SIGNALS)) {
    if (lower.includes(key)) {
      price_range = val;
      break;
    }
  }

  let preferred_food = "local Nigerian food";
  for (const food of FOODS) {
    if (lower.includes(food)) {
      preferred_food = food;
      break;
    }
  }
  if (lower.includes("buka") || lower.includes("local")) {
    preferred_food = "local Nigerian buka food";
  }

  return { city, price_range, preferred_food };
}
