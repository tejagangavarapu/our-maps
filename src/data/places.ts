export type Coordinate = [number, number];
export type TravelMode = "drive" | "transit" | "walk" | "bike";

export interface Place {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  category: "Landmark" | "Park" | "Coffee" | "Food" | "Culture" | "Office";
  coordinates: Coordinate;
  rating: string;
  description: string;
  image?: string;
}

export interface RouteStep {
  name: string;
  distance: number;
  type: string;
  modifier?: string;
  location: Coordinate;
}

export interface RouteData {
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  summary: string;
  steps: RouteStep[];
}

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const HOME: Coordinate = [37.7904, -122.4331];

export const places: Place[] = [
  {
    id: "ferry",
    name: "Ferry Building",
    address: "1 Ferry Building, San Francisco",
    neighborhood: "Embarcadero",
    category: "Landmark",
    coordinates: [37.7955, -122.3937],
    rating: "4.7",
    description:
      "A little taste of San Francisco. Discover local makers, great coffee, and the best of the waterfront.",
    image: withBase("images/ferry-building.jpg"),
  },
  {
    id: "palace",
    name: "Palace of Fine Arts",
    address: "3601 Lyon St, San Francisco",
    neighborhood: "Marina District",
    category: "Landmark",
    coordinates: [37.8029, -122.4485],
    rating: "4.8",
    description:
      "Slow down by the lagoon and take in one of the city's most beautiful places.",
    image: withBase("images/palace.jpg"),
  },
  {
    id: "dolores",
    name: "Mission Dolores Park",
    address: "Dolores St & 19th St, San Francisco",
    neighborhood: "Mission District",
    category: "Park",
    coordinates: [37.7598, -122.427],
    rating: "4.8",
    description:
      "A sunny patch of green, a skyline view, and a perfect spot to stay a little longer.",
    image: withBase("images/park.jpg"),
  },
  {
    id: "sfmoma",
    name: "SFMOMA",
    address: "151 3rd St, San Francisco",
    neighborhood: "SoMa",
    category: "Culture",
    coordinates: [37.7857, -122.4009],
    rating: "4.6",
    description:
      "Find a fresh perspective in seven floors of extraordinary modern and contemporary art.",
  },
  {
    id: "golden",
    name: "Golden Gate Bridge",
    address: "Golden Gate Bridge Welcome Center",
    neighborhood: "Presidio",
    category: "Landmark",
    coordinates: [37.8077, -122.475],
    rating: "4.9",
    description:
      "That never-gets-old view. Meet the Pacific breeze at San Francisco's most iconic landmark.",
  },
  {
    id: "bluebottle",
    name: "Blue Bottle Coffee",
    address: "1 Ferry Building, Suite 7",
    neighborhood: "Embarcadero",
    category: "Coffee",
    coordinates: [37.7954, -122.3942],
    rating: "4.5",
    description:
      "Thoughtfully brewed coffee and a little pause by the bay. Your next favorite ritual.",
    image: withBase("images/coffee.jpg"),
  },
  {
    id: "tartine",
    name: "Tartine Bakery",
    address: "600 Guerrero St, San Francisco",
    neighborhood: "Mission District",
    category: "Food",
    coordinates: [37.7614, -122.4241],
    rating: "4.6",
    description:
      "Follow the smell of fresh sourdough. A neighborhood institution worth the journey.",
    image: withBase("images/coffee.jpg"),
  },
  {
    id: "work",
    name: "Work",
    address: "101 California St, San Francisco",
    neighborhood: "Financial District",
    category: "Office",
    coordinates: [37.7924, -122.3987],
    rating: "4.5",
    description:
      "Your downtown destination. Let's make the commute the easy part of your day.",
  },
];

export const modes: { id: TravelMode; label: string; short: string }[] = [
  { id: "drive", label: "Driving", short: "Drive" },
  { id: "transit", label: "Public transit", short: "Transit" },
  { id: "walk", label: "Walking", short: "Walk" },
  { id: "bike", label: "Cycling", short: "Cycle" },
];

export function getMinutes(route: RouteData, mode: TravelMode) {
  if (mode === "walk") return Math.max(1, Math.round(route.distance / 79));
  if (mode === "bike") return Math.max(1, Math.round(route.distance / 245));
  if (mode === "transit") return Math.round((route.duration / 60) * 1.8 + 12);
  return Math.round((route.duration / 60) * 1.8 + 4);
}

export function formatDistance(meters: number, metric = false) {
  return metric
    ? `${(meters / 1000).toFixed(1)} km`
    : `${(meters / 1609.34).toFixed(1)} mi`;
}

export function stepInstruction(step: RouteStep, first = false) {
  if (step.type === "arrive") return "You have arrived. Enjoy the good stuff.";
  if (first || step.type === "depart")
    return `Head toward ${step.name || "Clay Street"}`;
  if (step.modifier?.includes("left"))
    return `Turn left onto ${step.name || "the next street"}`;
  if (step.modifier?.includes("right"))
    return `Turn right onto ${step.name || "the next street"}`;
  return `Continue on ${step.name || "your route"}`;
}
