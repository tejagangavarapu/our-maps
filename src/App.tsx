import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bike,
  Bookmark,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudSun,
  Coffee,
  Compass,
  CornerDownLeft,
  CornerDownRight,
  Footprints,
  Heart,
  History,
  Layers2,
  Leaf,
  Link,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Route,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TrainFront,
  Trees,
  Utensils,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Brand } from "./components/Brand";
import { MapView, type MapActions } from "./components/MapView";
import { Modal, PlaceIcon, Toggle, useStoredState } from "./components/UI";
import {
  formatDistance,
  getMinutes,
  modes,
  places,
  stepInstruction,
  type Place,
  type RouteData,
  type TravelMode,
} from "./data/places";
import routesJson from "./data/routes.json";

const routeLibrary = routesJson as unknown as Record<string, RouteData[]>;
const modeIcons = {
  drive: CarFront,
  transit: TrainFront,
  walk: Footprints,
  bike: Bike,
};
type Tab = "explore" | "saved" | "trips";
type Dialog = "help" | "settings" | "share" | "place" | "insight" | null;
type Category = "Coffee" | "Food" | "Parks" | null;
interface Preferences {
  metric: boolean;
  avoidTolls: boolean;
  avoidHighways: boolean;
  eco: boolean;
}
interface Trip {
  id: string;
  placeId: string;
  date: string;
  mode: TravelMode;
  minutes: number;
  reversed?: boolean;
}

export default function App() {
  const initialParams = useRef(new URLSearchParams(window.location.search));
  const [tab, setTab] = useState<Tab>("explore");
  const [destination, setDestination] = useState<Place>(
    () =>
      places.find((p) => p.id === initialParams.current.get("destination")) ||
      places[0],
  );
  const [mode, setMode] = useState<TravelMode>(
    () =>
      modes.find((m) => m.id === initialParams.current.get("mode"))?.id ||
      "drive",
  );
  const [selected, setSelected] = useState(() =>
    Math.min(
      Math.max(Math.floor(Number(initialParams.current.get("route")) || 0), 0),
      (routeLibrary[destination.id]?.length || 1) - 1,
    ),
  );
  const [query, setQuery] = useState(destination.name);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [reversed, setReversed] = useState(
    initialParams.current.get("reverse") === "1",
  );
  const [category, setCategory] = useState<Category>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [departure, setDeparture] = useState("Leave now");
  const [satellite, setSatellite] = useState(false);
  const [toast, setToast] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [navStep, setNavStep] = useState(0);
  const [sound, setSound] = useState(false);
  const [mobileMap, setMobileMap] = useState(false);
  const [copied, setCopied] = useState(false);
  // Keep storage keys stable so saved journeys survive the name change.
  const [saved, setSaved] = useStoredState<string[]>("tina-saved", [
    "ferry",
    "palace",
    "dolores",
  ]);
  const [trips, setTrips] = useStoredState<Trip[]>("tina-trips", []);
  const [preferences, setPreferences] = useStoredState<Preferences>(
    "tina-preferences",
    { metric: false, avoidTolls: true, avoidHighways: false, eco: true },
  );
  const mapRef = useRef<MapActions>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainer = useRef<HTMLDivElement>(null);
  const profileContainer = useRef<HTMLDivElement>(null);
  const departureContainer = useRef<HTMLDivElement>(null);

  const routes = useMemo(
    () => routeLibrary[destination.id] || routeLibrary.ferry,
    [destination.id],
  );
  const activeRoute = routes[selected] || routes[0];
  const minutes = getMinutes(activeRoute, mode);
  const arrival = new Date(
    Date.now() +
      (minutes +
        (departure === "In 30 minutes"
          ? 30
          : departure === "In 1 hour"
            ? 60
            : 0)) *
        60000,
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  const searchResults = places
    .filter((p) =>
      `${p.name} ${p.neighborhood} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 5);
  const shownResults =
    !query || query === destination.name ? places.slice(0, 5) : searchResults;
  const nearby = useMemo(
    () =>
      category
        ? places.filter((p) =>
            category === "Parks"
              ? p.category === "Park" || p.id === "palace"
              : p.category === category,
          )
        : [],
    [category],
  );
  const steps = useMemo(
    () =>
      reversed
        ? [...activeRoute.steps]
            .reverse()
            .map((s, i, list) => ({
              ...s,
              type:
                i === list.length - 1
                  ? "arrive"
                  : i === 0
                    ? "depart"
                    : "continue",
            }))
        : activeRoute.steps,
    [activeRoute, reversed],
  );
  const currentStep = steps[navStep] || steps[0];
  const isLastStep = navStep >= steps.length - 1;
  const shareUrl = `${window.location.origin}${window.location.pathname}?destination=${destination.id}&mode=${mode}&route=${selected}${reversed ? "&reverse=1" : ""}`;

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!searchContainer.current?.contains(event.target as Node)) {
        setSearchOpen(false);
        setQuery(destination.name);
      }
      if (!profileContainer.current?.contains(event.target as Node))
        setProfileOpen(false);
      if (!departureContainer.current?.contains(event.target as Node))
        setDepartureOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [destination.name]);

  useEffect(() => {
    if (sound && navigating && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          stepInstruction(currentStep, navStep === 0),
        ),
      );
    }
    return () => window.speechSynthesis?.cancel();
  }, [navStep, sound, navigating, currentStep]);

  function choosePlace(place: Place) {
    setDestination(place);
    setQuery(place.name);
    setSelected(0);
    setSearchOpen(false);
    setCategory(null);
    setReversed(false);
    setTab("explore");
    setNavigating(false);
    setNavStep(0);
  }
  function toggleSaved(place: Place) {
    const already = saved.includes(place.id);
    setSaved((previous) =>
      already
        ? previous.filter((id) => id !== place.id)
        : [...previous, place.id],
    );
    setToast(
      already
        ? `${place.name} removed from saved places.`
        : `${place.name} saved for another good day.`,
    );
  }
  function changeTab(next: Tab) {
    setTab(next);
    setProfileOpen(false);
    setMobileMap(false);
    setSearchOpen(false);
  }
  function selectRoute(index: number) {
    setSelected(index);
    setNavStep(0);
  }
  function startNavigation() {
    setNavStep(0);
    setNavigating(true);
    setTab("explore");
    setCategory(null);
    setToast(
      "Navigation preview started. Use Next turn to explore your route.",
    );
  }
  function finishNavigation() {
    setTrips((previous) =>
      [
        {
          id: String(Date.now()),
          placeId: destination.id,
          date: new Date().toISOString(),
          mode,
          minutes,
          reversed,
        },
        ...previous,
      ].slice(0, 20),
    );
    setNavigating(false);
    setNavStep(0);
    setToast("You made it. A little more of the world, explored.");
    mapRef.current?.recenter();
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setToast("Route link copied. Good journeys are better shared.");
    } catch {
      setToast("Select and copy the route link below.");
    }
  }
  function addPlace() {
    setTab("explore");
    setQuery("");
    setSearchOpen(true);
    window.setTimeout(() => searchRef.current?.focus(), 250);
  }

  const routePlanner = (
    <>
      <div className="planner-content">
        <motion.div
          className="planner-intro"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="eyebrow">
            <span />
            YOUR EVERYDAY CO-PILOT
          </div>
          <h1>
            Where are
            <br />
            we headed<span className="question-mark">?</span>
            <ArrowUpRight
              className="heading-arrow"
              size={34}
              strokeWidth={1.5}
            />
          </h1>
          <p>A better journey starts here.</p>
        </motion.div>
        <div className="travel-modes" aria-label="Travel mode">
          {modes.map((item) => {
            const Icon = modeIcons[item.id];
            return (
              <button
                key={item.id}
                className={mode === item.id ? "active" : ""}
                aria-label={item.label}
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{item.short}</span>
              </button>
            );
          })}
        </div>
        <div className="journey-inputs" ref={searchContainer}>
          <div className="location-connector" />
          <button
            className="location-field origin-field"
            onClick={() =>
              setToast(
                reversed
                  ? `Starting from ${destination.name}. Swap to use your demo location.`
                  : "Starting at Pacific Heights, San Francisco. This is your demo location.",
              )
            }
            aria-label={`Starting point: ${reversed ? destination.name : "Your location, Pacific Heights"}`}
          >
            <span className="field-marker origin-dot">
              <span />
            </span>
            <span className="field-copy">
              <span className="field-label">FROM</span>
              <span className="field-value">
                {reversed ? destination.name : "Your location"}
              </span>
            </span>
            <LocateFixed size={17} className="field-end-icon" />
          </button>
          <div
            className={`location-field destination-field ${searchOpen ? "focused" : ""}`}
          >
            <MapPin size={20} strokeWidth={1.8} className="field-marker" />
            <label className="field-copy" htmlFor="destination-search">
              <span className="field-label">TO</span>
              <input
                id="destination-search"
                ref={searchRef}
                value={reversed ? "Pacific Heights" : query}
                autoComplete="off"
                placeholder="Where do you want to go?"
                role="combobox"
                aria-label="Destination"
                aria-expanded={searchOpen}
                aria-controls="destination-results"
                aria-autocomplete="list"
                aria-activedescendant={
                  searchOpen && shownResults[searchIndex]
                    ? `result-${shownResults[searchIndex].id}`
                    : undefined
                }
                onFocus={(event) => {
                  if (reversed) setReversed(false);
                  setSearchOpen(true);
                  setSearchIndex(0);
                  event.target.select();
                }}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                  setSearchIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setQuery(destination.name);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSearchIndex((i) =>
                      Math.min(i + 1, shownResults.length - 1),
                    );
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSearchIndex((i) => Math.max(i - 1, 0));
                  }
                  if (event.key === "Enter" && shownResults[searchIndex]) {
                    event.preventDefault();
                    choosePlace(shownResults[searchIndex]);
                    searchRef.current?.blur();
                  }
                }}
              />
            </label>
            {searchOpen && (
              <button
                className="clear-search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear destination"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            className="swap-button"
            aria-label="Swap starting point and destination"
            onClick={() => {
              setReversed((value) => !value);
              setSearchOpen(false);
            }}
          >
            <ArrowDownUp size={16} />
          </button>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                className="search-results"
                id="destination-results"
                role="listbox"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <div className="search-caption">
                  {query && query !== destination.name
                    ? "PLACES IN SAN FRANCISCO"
                    : "A FEW GOOD PLACES"}
                </div>
                {shownResults.length ? (
                  shownResults.map((place, index) => (
                    <button
                      id={`result-${place.id}`}
                      role="option"
                      aria-selected={searchIndex === index}
                      className={searchIndex === index ? "highlighted" : ""}
                      key={place.id}
                      onClick={() => choosePlace(place)}
                      onMouseEnter={() => setSearchIndex(index)}
                    >
                      <span className="search-result-icon">
                        <PlaceIcon place={place} size={18} />
                      </span>
                      <span>
                        <strong>{place.name}</strong>
                        <small>{place.neighborhood}, San Francisco</small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))
                ) : (
                  <div className="no-results">
                    <Search size={24} />
                    <strong>No places found just yet.</strong>
                    <p>
                      Try Ferry Building, coffee, a park, or a San Francisco
                      neighborhood.
                    </p>
                  </div>
                )}
                <div className="search-footer">
                  <MapPin size={12} />
                  Exploring San Francisco, one good stop at a time.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="departure-row">
          <div className="departure-control" ref={departureContainer}>
            <button
              onClick={() => setDepartureOpen((open) => !open)}
              aria-expanded={departureOpen}
            >
              <Clock3 size={14} />
              {departure}
              <ChevronDown size={13} />
            </button>
            {departureOpen && (
              <div className="departure-menu">
                {["Leave now", "In 30 minutes", "In 1 hour"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setDeparture(option);
                      setDepartureOpen(false);
                    }}
                  >
                    {option}
                    {departure === option && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="text-button options-button"
            onClick={() => setDialog("settings")}
          >
            <Settings2 size={14} />
            Options
          </button>
        </div>
        <div className="routes-heading">
          <h2>Your route, your way.</h2>
          <span>
            {routes.length} {routes.length === 1 ? "route" : "routes"}
          </span>
        </div>
        <div className="route-options">
          {routes.map((route, index) => (
            <button
              key={`${destination.id}-${index}`}
              className={`route-option ${selected === index ? "selected" : ""}`}
              aria-pressed={selected === index}
              aria-label={`${index === 0 ? "Recommended" : "Alternative"} route, ${getMinutes(route, mode)} minutes via ${route.summary}`}
              onClick={() => setSelected(index)}
            >
              <div className="route-option-top">
                <span className="route-radio">
                  {selected === index && <span />}
                </span>
                <span className="route-duration">
                  {getMinutes(route, mode)} <small>min</small>
                </span>
                <span
                  className={`route-tag ${index === 0 ? "recommended" : ""}`}
                >
                  {index === 0 ? (
                    <>
                      <Sparkles size={11} />
                      Recommended
                    </>
                  ) : (
                    "A different way"
                  )}
                </span>
              </div>
              <div className="route-description">
                <span>
                  {formatDistance(route.distance, preferences.metric)}
                </span>
                <i />
                via {route.summary.split(",")[0] || "local streets"}
              </div>
              {selected === index && (
                <div className="route-benefit">
                  <Leaf size={12} />
                  <span>
                    {mode === "walk"
                      ? "A little fresh air goes a long way"
                      : mode === "bike"
                        ? "A lighter way to get there"
                        : index === 0
                          ? "Less traffic. A little more you time."
                          : "Familiar streets. A change of scenery."}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="route-estimate-note">
          <span className="traffic-dot" />
          {mode === "drive"
            ? "Typical traffic · A smooth ride ahead"
            : "Route preview · Travel times are estimates"}
        </div>
      </div>
      <div className="planner-action">
        <button
          className="primary-button start-button"
          onClick={startNavigation}
        >
          <Navigation size={18} fill="currentColor" strokeWidth={1.5} />
          <span>Let's go</span>
          <ArrowRight size={20} />
        </button>
        <div className="arrival-line">
          A little closer to your day.<span>Arrive {arrival}</span>
        </div>
      </div>
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <header className="app-header">
          <button
            className="brand-home"
            onClick={() => {
              changeTab("explore");
              setNavigating(false);
              mapRef.current?.recenter();
            }}
            aria-label="OUR home"
          >
            <Brand />
            <span className="brand-descriptor">A little more possibility.</span>
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              aria-label="Explore"
              className={tab === "explore" ? "active" : ""}
              onClick={() => changeTab("explore")}
            >
              <Compass size={17} />
              <span>Explore</span>
            </button>
            <button
              aria-label="Saved places"
              className={tab === "saved" ? "active" : ""}
              onClick={() => changeTab("saved")}
            >
              <Bookmark size={17} />
              <span>Saved places</span>
              <span className="nav-count">{saved.length}</span>
            </button>
            <button
              aria-label="My trips"
              className={tab === "trips" ? "active" : ""}
              onClick={() => changeTab("trips")}
            >
              <History size={17} />
              <span>My trips</span>
            </button>
          </nav>
          <div className="header-right">
            <div
              className="weather"
              title="Demo weather: partly cloudy, 17 degrees Celsius"
            >
              <CloudSun size={22} strokeWidth={1.45} />
              <span>
                17<span className="degree">°</span>
              </span>
            </div>
            <span className="header-divider" />
            <div className="city-label">
              <span className="city-dot" />
              San Francisco, CA
            </div>
            <button
              className="icon-button help-button"
              aria-label="Help and information"
              onClick={() => setDialog("help")}
            >
              <CircleHelp size={19} strokeWidth={1.6} />
            </button>
            <div className="profile-container" ref={profileContainer}>
              <button
                className="avatar"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open Alex's profile"
              >
                A<span />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="profile-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="profile-summary">
                      <span className="avatar large">A</span>
                      <span>
                        <strong>Alex Morgan</strong>
                        <small>Always taking the good way.</small>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setDialog("settings");
                        setProfileOpen(false);
                      }}
                    >
                      <Settings2 size={17} />
                      Navigation preferences
                      <ChevronRight size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setDialog("help");
                        setProfileOpen(false);
                      }}
                    >
                      <CircleHelp size={17} />
                      Meet your co-pilot
                      <ChevronRight size={15} />
                    </button>
                    <div className="profile-footer">
                      <span className="city-dot" />
                      San Francisco demo workspace
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className={`workspace ${mobileMap ? "show-mobile-map" : ""}`}>
          <aside className="planner-panel" aria-label="Journey planner">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="panel-view"
                key={navigating && tab === "explore" ? "navigation" : tab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "explore" && !navigating && routePlanner}
                {tab === "explore" && navigating && (
                  <>
                    <div className="planner-content navigation-content">
                      <button
                        className="back-link"
                        onClick={() => {
                          setNavigating(false);
                          mapRef.current?.recenter();
                        }}
                      >
                        <ArrowLeft size={16} />
                        Back to your route
                      </button>
                      <div className="eyebrow navigation-eyebrow">
                        <span />
                        NAVIGATION PREVIEW
                      </div>
                      <h1 className="section-title">
                        Enjoy the
                        <br />
                        journey.
                      </h1>
                      <p className="section-description">
                        On your way to{" "}
                        {reversed ? "Pacific Heights" : destination.name}.
                      </p>
                      <div className="navigation-progress">
                        <div
                          style={{
                            width: `${((navStep + 1) / steps.length) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="current-direction">
                        <span className="turn-icon">
                          {isLastStep ? (
                            <MapPin size={30} />
                          ) : currentStep.modifier?.includes("left") ? (
                            <CornerDownLeft size={30} />
                          ) : currentStep.modifier?.includes("right") ? (
                            <CornerDownRight size={30} />
                          ) : (
                            <ArrowUp size={30} />
                          )}
                        </span>
                        <span>
                          <small>
                            {isLastStep
                              ? "YOU MADE IT"
                              : `TURN ${navStep + 1} OF ${steps.length}`}
                          </small>
                          <strong>
                            {stepInstruction(currentStep, navStep === 0)}
                          </strong>
                          <span>
                            {isLastStep
                              ? "Your next good stop."
                              : formatDistance(
                                  currentStep.distance,
                                  preferences.metric,
                                )}
                          </span>
                        </span>
                      </div>
                      <div className="directions-heading">
                        <h2>The way ahead</h2>
                        <button
                          className="icon-button"
                          onClick={() => setSound((value) => !value)}
                          aria-label={
                            sound
                              ? "Mute voice directions"
                              : "Enable voice directions"
                          }
                        >
                          {sound ? (
                            <Volume2 size={18} />
                          ) : (
                            <VolumeX size={18} />
                          )}
                        </button>
                      </div>
                      <ol className="direction-list">
                        {steps.map((step, index) => (
                          <li
                            className={`${index === navStep ? "current" : ""} ${index < navStep ? "complete" : ""}`}
                            key={index}
                          >
                            <span className="step-number">
                              {index < navStep ? (
                                <Check size={13} />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span>
                              <strong>
                                {stepInstruction(step, index === 0)}
                              </strong>
                              <small>
                                {step.type === "arrive"
                                  ? destination.name
                                  : formatDistance(
                                      step.distance,
                                      preferences.metric,
                                    )}
                              </small>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="planner-action">
                      <button
                        className="primary-button"
                        onClick={() =>
                          isLastStep
                            ? finishNavigation()
                            : setNavStep((i) => i + 1)
                        }
                      >
                        {isLastStep ? (
                          <Check size={19} />
                        ) : (
                          <Navigation size={17} />
                        )}
                        <span>
                          {isLastStep ? "Finish journey" : "Next turn"}
                        </span>
                        <ArrowRight size={20} />
                      </button>
                      <div className="arrival-line">
                        Interactive route preview
                        <span>
                          {minutes} min · {arrival}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {tab === "saved" && (
                  <>
                    <div className="planner-content collection-content">
                      <div className="eyebrow">
                        <span />
                        GOOD PLACES, KEPT CLOSE
                      </div>
                      <h1 className="section-title">
                        Your kind
                        <br />
                        of places.
                      </h1>
                      <p className="section-description">
                        Some places are worth coming back to.
                      </p>
                      <div className="collection-heading">
                        <h2>Saved places</h2>
                        <span>{saved.length} places</span>
                      </div>
                      <div className="saved-list">
                        {places
                          .filter((p) => saved.includes(p.id))
                          .map((place) => (
                            <div className="saved-place" key={place.id}>
                              <button
                                className="saved-place-main"
                                onClick={() => choosePlace(place)}
                              >
                                <span className="saved-icon">
                                  {place.image ? (
                                    <img src={place.image} alt="" />
                                  ) : (
                                    <PlaceIcon place={place} />
                                  )}
                                </span>
                                <span>
                                  <strong>{place.name}</strong>
                                  <small>{place.neighborhood}</small>
                                  <span className="place-category">
                                    {place.category}
                                  </span>
                                </span>
                                <ArrowUpRight size={18} />
                              </button>
                              <button
                                className="unsave-button"
                                aria-label={`Remove ${place.name} from saved places`}
                                onClick={() => toggleSaved(place)}
                              >
                                <Bookmark size={15} fill="currentColor" />
                              </button>
                            </div>
                          ))}
                      </div>
                      {!saved.length && (
                        <div className="empty-state">
                          <Bookmark size={32} />
                          <h3>A good place to start.</h3>
                          <p>
                            Save a destination using its bookmark. It'll be
                            right here when you need it.
                          </p>
                        </div>
                      )}
                      <button className="add-place-button" onClick={addPlace}>
                        <Plus size={18} />
                        Find a new favorite
                      </button>
                    </div>
                    <div className="collection-footer">
                      <Heart size={15} />A little collection of your world.
                    </div>
                  </>
                )}
                {tab === "trips" && (
                  <>
                    <div className="planner-content collection-content">
                      <div className="eyebrow">
                        <span />
                        EVERY JOURNEY ADDS UP
                      </div>
                      <h1 className="section-title">
                        Look where
                        <br />
                        you've been.
                      </h1>
                      <p className="section-description">
                        Good journeys make good memories.
                      </p>
                      <div className="collection-heading">
                        <h2>Your recent trips</h2>
                        {trips.length > 0 && (
                          <button
                            className="text-button"
                            onClick={() => {
                              setTrips([]);
                              setToast("Your trip history has been cleared.");
                            }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      {trips.length ? (
                        <div className="trip-list">
                          {trips.map((trip) => {
                            const place =
                              places.find((p) => p.id === trip.placeId) ||
                              places[0];
                            const Icon = modeIcons[trip.mode];
                            return (
                              <button
                                className="trip-item"
                                key={trip.id}
                                onClick={() => {
                                  choosePlace(place);
                                  setMode(trip.mode);
                                  setReversed(!!trip.reversed);
                                }}
                              >
                                <span className="trip-mode">
                                  <Icon size={20} />
                                </span>
                                <span>
                                  <strong>
                                    {trip.reversed
                                      ? "Pacific Heights"
                                      : place.name}
                                  </strong>
                                  <small>
                                    {new Date(trip.date).toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" },
                                    )}{" "}
                                    · {trip.minutes} min journey
                                  </small>
                                </span>
                                <ArrowUpRight size={17} />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state trips-empty">
                          <span className="empty-route">
                            <Route size={45} strokeWidth={1.25} />
                          </span>
                          <h3>Your next chapter is out there.</h3>
                          <p>
                            Finish a navigation preview and your journey will
                            appear here. Let's make the first one a good one.
                          </p>
                          <button
                            className="primary-button"
                            onClick={() => changeTab("explore")}
                          >
                            Plan a journey
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="collection-footer">
                      <ShieldCheck size={16} />
                      Your journeys stay on this device.
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
          <section className="map-workspace" aria-label="Map and nearby places">
            <MapView
              ref={mapRef}
              destination={destination}
              routes={routes}
              selected={selected}
              mode={mode}
              reversed={reversed}
              nearby={nearby}
              onPlaceSelect={choosePlace}
              onRouteSelect={selectRoute}
              navigating={navigating}
              step={navStep}
              satellite={satellite}
            />
            <motion.div
              className="map-topbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="nearby-filters">
                <span className="nearby-label">A little detour?</span>
                {(
                  [
                    { label: "Coffee", Icon: Coffee },
                    { label: "Food", Icon: Utensils },
                    { label: "Parks", Icon: Trees },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.label}
                    className={category === item.label ? "selected" : ""}
                    aria-pressed={category === item.label}
                    onClick={() => {
                      setCategory((value) =>
                        value === item.label ? null : item.label,
                      );
                      if (category === item.label) mapRef.current?.recenter();
                    }}
                  >
                    <item.Icon size={16} strokeWidth={1.7} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="map-square share-map"
                aria-label="Share route"
                onClick={() => {
                  setCopied(false);
                  setDialog("share");
                }}
              >
                <Share2 size={18} strokeWidth={1.7} />
              </button>
            </motion.div>
            <AnimatePresence>
              {category && (
                <motion.div
                  className="nearby-results"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="nearby-results-title">
                    <span>
                      {category === "Parks"
                        ? "A little room to breathe."
                        : category === "Coffee"
                          ? "A good cup is on the way."
                          : "Something good is cooking."}
                    </span>
                    <button
                      aria-label="Close nearby places"
                      onClick={() => {
                        setCategory(null);
                        mapRef.current?.recenter();
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {nearby.map((place) => (
                    <button
                      className="nearby-result"
                      key={place.id}
                      onClick={() => choosePlace(place)}
                    >
                      <PlaceIcon place={place} size={18} />
                      <span>
                        <strong>{place.name}</strong>
                        <small>{place.neighborhood}</small>
                      </span>
                      <span className="nearby-rating">
                        <Star size={11} fill="currentColor" />
                        {place.rating}
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="map-side-controls">
              <button
                className="compass-control"
                aria-label="Reset map orientation and view"
                onClick={() => mapRef.current?.recenter()}
              >
                <span>N</span>
                <Navigation size={20} fill="currentColor" strokeWidth={1.2} />
              </button>
              <div className="zoom-controls">
                <button
                  aria-label="Zoom in"
                  onClick={() => mapRef.current?.zoomIn()}
                >
                  <Plus size={20} strokeWidth={1.5} />
                </button>
                <span />
                <button
                  aria-label="Zoom out"
                  onClick={() => mapRef.current?.zoomOut()}
                >
                  <Minus size={20} strokeWidth={1.5} />
                </button>
              </div>
              <button
                className="map-square locate-control"
                aria-label="Recenter on your route"
                onClick={() => mapRef.current?.recenter()}
              >
                <LocateFixed size={19} strokeWidth={1.7} />
              </button>
            </div>
            <motion.button
              className="map-insight"
              onClick={() => setDialog("insight")}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="insight-symbol">
                <Sparkles size={21} strokeWidth={1.5} />
              </span>
              <span>
                <span className="insight-label">
                  A LITTLE HEADS-UP FROM OUR
                </span>
                <strong>
                  {mode === "walk" || mode === "bike"
                    ? "Fresh air looks good on you."
                    : "The good way is the easy way."}
                </strong>
                <small>
                  {mode === "drive"
                    ? "Fewer busy roads. More peace of mind."
                    : "A lighter journey, at your own pace."}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </motion.button>
            <motion.div
              className="destination-preview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <button
                className="destination-image-button"
                onClick={() => setDialog("place")}
                aria-label={`Explore ${destination.name}`}
              >
                {destination.image ? (
                  <img src={destination.image} alt={destination.name} />
                ) : (
                  <div className="destination-image-placeholder">
                    <PlaceIcon place={destination} size={46} />
                    <span>San Francisco, California</span>
                  </div>
                )}
                <span className="destination-image-shade" />
                <span className="image-caption">YOUR NEXT GOOD STOP</span>
              </button>
              <button
                className={`save-place ${saved.includes(destination.id) ? "saved" : ""}`}
                aria-label={
                  saved.includes(destination.id)
                    ? `Unsave ${destination.name}`
                    : `Save ${destination.name}`
                }
                onClick={() => toggleSaved(destination)}
              >
                <Bookmark
                  size={16}
                  fill={
                    saved.includes(destination.id) ? "currentColor" : "none"
                  }
                  strokeWidth={1.7}
                />
              </button>
              <button
                className="destination-preview-copy"
                onClick={() => setDialog("place")}
              >
                <span>
                  <strong>{destination.name}</strong>
                  <small>
                    <Star size={11} fill="currentColor" />
                    {destination.rating}
                    <i />
                    {destination.category}
                    <i />
                    {destination.neighborhood}
                  </small>
                </span>
                <span className="destination-detail-arrow">
                  <ArrowUpRight size={18} strokeWidth={1.6} />
                </span>
              </button>
            </motion.div>
            <button
              className={`map-style-button ${satellite ? "is-satellite" : ""}`}
              onClick={() => setSatellite((value) => !value)}
              aria-label={
                satellite ? "Switch to street map" : "Switch to satellite map"
              }
            >
              <span className="map-style-thumbnail">
                <Layers2 size={19} />
              </span>
              <span>{satellite ? "Street map" : "Layers"}</span>
            </button>
            <div className="map-attribution">
              <a href="https://www.esri.com/" target="_blank" rel="noreferrer">
                Esri
              </a>
              <span>·</span>Esri, HERE, Garmin, © OpenStreetMap contributors
            </div>
            {navigating && (
              <div className="preview-indicator">
                <span />
                NAVIGATION PREVIEW
              </div>
            )}
          </section>
          <button
            className="mobile-view-toggle"
            onClick={() => setMobileMap((value) => !value)}
          >
            {mobileMap ? <Route size={17} /> : <Compass size={17} />}
            {mobileMap ? "Your route" : "View map"}
          </button>
        </main>
        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
              role="status"
              style={{ x: "-50%" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <span className="toast-check">
                <Check size={15} />
              </span>
              <span>{toast}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => setToast("")}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {dialog && (
            <Modal
              title={
                dialog === "settings"
                  ? "Your journey, your rules."
                  : dialog === "share"
                    ? "Good journeys are better shared."
                    : dialog === "place"
                      ? destination.name
                      : dialog === "insight"
                        ? "A little local knowledge."
                        : "Meet your everyday co-pilot."
              }
              onClose={() => setDialog(null)}
              className={dialog === "place" ? "place-modal" : ""}
            >
              {dialog === "help" && (
                <div className="help-content">
                  <Brand />
                  <p className="modal-lead">
                    Less time figuring it out.
                    <br />
                    More time getting out there.
                  </p>
                  <p>
                    OUR is your Intelligent Navigation Assistant. Explore San
                    Francisco, compare routes, and keep your favorite corners of
                    the city close.
                  </p>
                  <div className="help-feature">
                    <Search size={19} />
                    <span>
                      <strong>Find your next good stop</strong>Search our
                      curated San Francisco destinations, or explore nearby
                      coffee, food, and parks.
                    </span>
                  </div>
                  <div className="help-feature">
                    <Route size={19} />
                    <span>
                      <strong>Take the way that works for you</strong>Compare
                      driving route previews and estimated travel times for four
                      ways to move.
                    </span>
                  </div>
                  <div className="demo-note">
                    <ShieldCheck size={18} />
                    <p>
                      This is an interactive demo with real street geometry.
                      Travel times are estimates, not live traffic. Walking,
                      cycling, and transit are road-based previews. Navigation
                      is a step-by-step simulation, not GPS guidance. Saved
                      places and trips stay on your device.
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => setDialog(null)}
                  >
                    Let's find your way
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              {dialog === "settings" && (
                <div className="settings-content">
                  <p className="modal-description">
                    The little preferences that make a journey feel more like
                    you.
                  </p>
                  {(
                    [
                      {
                        key: "avoidTolls",
                        title: "Skip the tolls",
                        description: "Keep a little more for the good stuff.",
                      },
                      {
                        key: "avoidHighways",
                        title: "Take the local roads",
                        description: "A calmer pace, closer to the city.",
                      },
                      {
                        key: "eco",
                        title: "A lighter footprint",
                        description: "Prefer the more efficient way there.",
                      },
                      {
                        key: "metric",
                        title: "Use kilometers",
                        description: "Distances, just the way you like them.",
                      },
                    ] as const
                  ).map((item) => (
                    <div className="setting-row" key={item.key}>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <Toggle
                        checked={preferences[item.key]}
                        onChange={() =>
                          setPreferences((old) => ({
                            ...old,
                            [item.key]: !old[item.key],
                          }))
                        }
                        label={item.title}
                      />
                    </div>
                  ))}
                  <div className="settings-note">
                    <Leaf size={16} />
                    <span>
                      Preferences are saved on this device. These curated
                      previews use a fixed road network, so avoidance settings
                      do not change the preview geometry.
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setDialog(null);
                      setToast(
                        "Your preferences are saved. The good way, your way.",
                      );
                    }}
                  >
                    All set
                    <Check size={18} />
                  </button>
                </div>
              )}
              {dialog === "share" && (
                <div className="share-content">
                  <p className="modal-description">
                    Send a little possibility someone's way.
                  </p>
                  <div className="share-route-summary">
                    <span className="share-route-icon">
                      <Navigation size={23} />
                    </span>
                    <span>
                      <small>
                        {reversed
                          ? `FROM ${destination.name.toUpperCase()} TO`
                          : "FROM PACIFIC HEIGHTS TO"}
                      </small>
                      <strong>
                        {reversed ? "Pacific Heights" : destination.name}
                      </strong>
                      <span>
                        {minutes} min ·{" "}
                        {formatDistance(
                          activeRoute.distance,
                          preferences.metric,
                        )}{" "}
                        · {modes.find((m) => m.id === mode)?.short}
                      </span>
                    </span>
                  </div>
                  <label className="share-label" htmlFor="share-link">
                    YOUR ROUTE LINK
                  </label>
                  <div className="share-link-field">
                    <Link size={17} />
                    <input
                      id="share-link"
                      value={shareUrl}
                      readOnly
                      onClick={(event) => event.currentTarget.select()}
                    />
                  </div>
                  <button className="primary-button" onClick={copyLink}>
                    {copied ? <Check size={18} /> : <Link size={18} />}
                    {copied ? "Link copied" : "Copy route link"}
                    <ArrowUpRight size={18} />
                  </button>
                  <p className="share-note">
                    Anyone with this link can preview your destination. No
                    account needed.
                  </p>
                </div>
              )}
              {dialog === "place" && (
                <div className="place-detail-content">
                  {destination.image && (
                    <img
                      className="place-detail-image"
                      src={destination.image}
                      alt={destination.name}
                    />
                  )}
                  <div className="place-detail-meta">
                    <span>
                      <Star size={15} fill="currentColor" />
                      {destination.rating}
                      <i />
                      {destination.category}
                    </span>
                    <button
                      className={`text-button ${saved.includes(destination.id) ? "is-saved" : ""}`}
                      onClick={() => toggleSaved(destination)}
                    >
                      <Bookmark
                        size={16}
                        fill={
                          saved.includes(destination.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {saved.includes(destination.id) ? "Saved" : "Save place"}
                    </button>
                  </div>
                  <p className="place-detail-description">
                    {destination.description}
                  </p>
                  <div className="place-detail-address">
                    <MapPin size={17} />
                    <span>
                      {destination.address}
                      <small>{destination.neighborhood}, California</small>
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setDialog(null);
                      setMobileMap(false);
                      startNavigation();
                    }}
                  >
                    <Navigation size={18} />
                    Let's go there
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              {dialog === "insight" && (
                <div className="insight-content">
                  <span className="large-sparkle">
                    <Sparkles size={32} strokeWidth={1.3} />
                  </span>
                  <h3>
                    The journey can be
                    <br />
                    the good part, too.
                  </h3>
                  <p>
                    Your recommended route follows{" "}
                    {activeRoute.summary || "local streets"}, keeping you
                    connected to the neighborhoods that make San Francisco
                    special.
                  </p>
                  <div className="insight-detail">
                    <Leaf size={20} />
                    <span>
                      <strong>A little lighter on the planet.</strong>Walking or
                      cycling this journey means one less car on the road. Every
                      little bit is a good thing.
                    </span>
                  </div>
                  <div className="insight-detail">
                    <Coffee size={20} />
                    <span>
                      <strong>Make room for a little detour.</strong>The Ferry
                      Building's local coffee and waterfront views are always
                      worth a moment.
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setDialog(null);
                      setCategory("Coffee");
                    }}
                  >
                    Find a good coffee
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
