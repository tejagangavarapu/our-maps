import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  HOME,
  getMinutes,
  type Coordinate,
  type Place,
  type RouteData,
  type TravelMode,
} from "../data/places";

export interface MapActions {
  zoomIn: () => void;
  zoomOut: () => void;
  recenter: () => void;
}

interface Props {
  destination: Place;
  routes: RouteData[];
  selected: number;
  mode: TravelMode;
  reversed: boolean;
  nearby: Place[];
  onPlaceSelect: (place: Place) => void;
  onRouteSelect: (index: number) => void;
  navigating: boolean;
  step: number;
  satellite: boolean;
}

function isBundled(coords: L.Coords) {
  return (
    (coords.z === 14 &&
      coords.x >= 2617 &&
      coords.x <= 2623 &&
      coords.y >= 6329 &&
      coords.y <= 6335) ||
    (coords.z === 15 &&
      coords.x >= 5238 &&
      coords.x <= 5244 &&
      coords.y >= 12661 &&
      coords.y <= 12665)
  );
}

class CachedBasemap extends L.TileLayer {
  getTileUrl(coords: L.Coords) {
    return isBundled(coords)
      ? `${import.meta.env.BASE_URL}tiles/${coords.z}/${coords.x}/${coords.y}.png`
      : `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
  }
}

class ReferenceLabels extends L.TileLayer {
  getTileUrl(coords: L.Coords) {
    return isBundled(coords)
      ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
      : `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
  }
}

const pinSvg =
  '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const carSvg =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 7 2-4h10l2 4 2 3v8H3v-8l2-3Z"/><path d="M3 10h18M7 14h1m8 0h1M5 18v3m14-3v3"/></svg>';
const modeSvgs = {
  drive: carSvg,
  transit:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M8 18l-2 3m10-3 2 3M9 14h.01M15 14h.01"/></svg>',
  walk: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="13" cy="4" r="2"/><path d="m7 10 4-3 4 4 4 1M11 7l-1 8-4 6m4-6 5 2 1 5"/></svg>',
  bike: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-9 5 9h-10m4-9h7l3 9M8 5h4m3-2h3l2 4"/></svg>',
};

export const MapView = forwardRef<MapActions, Props>(
  function MapView(props, ref) {
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const routeLayer = useRef<L.LayerGroup | null>(null);
    const poiLayer = useRef<L.LayerGroup | null>(null);
    const currentMarker = useRef<L.Marker | null>(null);
    const basemap = useRef<L.TileLayer | null>(null);
    const satelliteLayer = useRef<L.TileLayer | null>(null);
    const currentProps = useRef(props);
    currentProps.current = props;

    function recenter(
      animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ) {
      const route = currentProps.current.routes[currentProps.current.selected];
      if (map.current && route) {
        const isSmall = window.innerWidth < 760;
        map.current.fitBounds(L.latLngBounds(route.coordinates), {
          paddingTopLeft: isSmall ? [45, 90] : [90, 150],
          paddingBottomRight: isSmall ? [45, 65] : [115, 220],
          maxZoom: 15,
          animate,
          duration: 0.8,
        });
      }
    }

    useImperativeHandle(ref, () => ({
      zoomIn: () => map.current?.zoomIn(),
      zoomOut: () => map.current?.zoomOut(),
      recenter,
    }));

    useEffect(() => {
      if (!container.current) return;
      const instance = L.map(container.current, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        minZoom: 11,
        maxZoom: 18,
        zoomAnimation: !window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
        fadeAnimation: !window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      }).setView([37.796, -122.414], 14.5);
      map.current = instance;
      basemap.current = new CachedBasemap("", { maxZoom: 18, zIndex: 0 }).addTo(
        instance,
      );
      new ReferenceLabels("", { maxZoom: 18, zIndex: 1 }).addTo(instance);
      L.control
        .scale({
          imperial: false,
          metric: true,
          maxWidth: 70,
          position: "bottomleft",
        })
        .addTo(instance);
      const neighborhoods: {
        name: string;
        position: Coordinate;
        bay?: boolean;
      }[] = [
        { name: "PACIFIC HEIGHTS", position: [37.7952, -122.4377] },
        { name: "RUSSIAN HILL", position: [37.8003, -122.422] },
        { name: "NOB HILL", position: [37.7928, -122.416] },
        { name: "NORTH BEACH", position: [37.801, -122.407] },
        { name: "FINANCIAL DISTRICT", position: [37.7908, -122.4009] },
        { name: "San Francisco Bay", position: [37.8054, -122.391], bay: true },
      ];
      neighborhoods.forEach((item) =>
        L.marker(item.position, {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: `neighborhood-label ${item.bay ? "bay-label" : ""}`,
            html: `<span>${item.name}</span>`,
            iconSize: [160, 20],
            iconAnchor: [80, 10],
          }),
        }).addTo(instance),
      );
      routeLayer.current = L.layerGroup().addTo(instance);
      poiLayer.current = L.layerGroup().addTo(instance);
      let lastWidth = container.current.clientWidth;
      let resizeTimer: ReturnType<typeof setTimeout>;
      const resize = new ResizeObserver(() => {
        instance.invalidateSize();
        const width = container.current?.clientWidth || lastWidth;
        if (width !== lastWidth) {
          lastWidth = width;
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (!currentProps.current.navigating) recenter(false);
          }, 120);
        }
      });
      resize.observe(container.current);
      return () => {
        resize.disconnect();
        clearTimeout(resizeTimer);
        instance.remove();
        map.current = null;
      };
    }, []);

    useEffect(() => {
      const instance = map.current;
      const layer = routeLayer.current;
      if (!instance || !layer || !props.routes.length) return;
      layer.clearLayers();
      const ordered = props.routes
        .map((route, index) => ({ route, index }))
        .sort((a) => (a.index === props.selected ? 1 : -1));
      ordered.forEach(({ route, index }) => {
        const coordinates = props.reversed
          ? [...route.coordinates].reverse()
          : route.coordinates;
        const active = index === props.selected;
        L.polyline(coordinates, {
          color: "#fff",
          weight: active ? 12 : 10,
          opacity: 0.98,
          lineCap: "round",
        }).addTo(layer);
        L.polyline(coordinates, {
          color: active ? "#668838" : "#9aa7a4",
          weight: active ? 6.5 : 5,
          opacity: 1,
          lineCap: "round",
          className: active ? "active-route-path" : "alternate-route-path",
        })
          .on("click", () => currentProps.current.onRouteSelect(index))
          .addTo(layer);
        if (active) {
          L.polyline(coordinates, {
            color: "#b9df74",
            weight: 2,
            opacity: 0.75,
            interactive: false,
          }).addTo(layer);
        }
        const labelPosition =
          coordinates[Math.floor(coordinates.length * (active ? 0.42 : 0.5))];
        L.marker(labelPosition, {
          zIndexOffset: active ? 100 : 0,
          keyboard: false,
          icon: L.divIcon({
            className: "route-time-marker",
            html: `<button class="map-time-label ${active ? "selected" : ""}" aria-label="Select ${getMinutes(route, props.mode)} minute route">${modeSvgs[props.mode]}<span>${getMinutes(route, props.mode)} min</span>${active ? "<i></i>" : ""}</button>`,
            iconSize: [110, 38],
            iconAnchor: [55, active ? 53 : -12],
          }),
        })
          .on("click", () => currentProps.current.onRouteSelect(index))
          .addTo(layer);
      });
      const route = props.routes[props.selected];
      const points = props.reversed
        ? [...route.coordinates].reverse()
        : route.coordinates;
      currentMarker.current = L.marker(points[0] || HOME, {
        zIndexOffset: 500,
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "origin-marker",
          html: '<span class="origin-pulse"></span><span class="origin-center"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 8 17-8-4-8 4L12 3Z"/></svg></span><span class="origin-caption">You are here</span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      }).addTo(layer);
      L.marker(points[points.length - 1] || props.destination.coordinates, {
        zIndexOffset: 450,
        title: props.reversed
          ? "Pacific Heights, route destination"
          : `${props.destination.name}, route destination`,
        icon: L.divIcon({
          className: "destination-marker",
          html: `<span class="destination-pin">${pinSvg}</span><span class="destination-caption">${props.reversed ? "Pacific Heights" : props.destination.name}</span>`,
          iconSize: [42, 49],
          iconAnchor: [21, 44],
        }),
      })
        .on("click", () =>
          currentProps.current.onPlaceSelect(props.destination),
        )
        .addTo(layer);
    }, [
      props.routes,
      props.selected,
      props.reversed,
      props.destination,
      props.mode,
    ]);

    useEffect(() => {
      recenter();
    }, [props.destination.id, props.reversed]);

    useEffect(() => {
      const instance = map.current;
      if (!instance) return;
      // Preserve Leaflet's runtime classes when changing the presentation layer.
      container.current?.classList.toggle("satellite-map", props.satellite);
      if (props.satellite) {
        satelliteLayer.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 18 },
        ).addTo(instance);
        satelliteLayer.current.setZIndex(2);
      } else {
        satelliteLayer.current?.remove();
        satelliteLayer.current = null;
      }
    }, [props.satellite]);

    useEffect(() => {
      const layer = poiLayer.current;
      if (!layer) return;
      layer.clearLayers();
      props.nearby.forEach((place) => {
        L.marker(place.coordinates, {
          icon: L.divIcon({
            className: "nearby-marker",
            html: `<button aria-label="Route to ${place.name}">${pinSvg}<span>${place.name}</span></button>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          }),
        })
          .on("click", () => currentProps.current.onPlaceSelect(place))
          .addTo(layer);
      });
      if (props.nearby.length) {
        map.current?.fitBounds(
          L.latLngBounds([HOME, ...props.nearby.map((p) => p.coordinates)]),
          { padding: [95, 110], maxZoom: 14.75 },
        );
      }
    }, [props.nearby]);

    useEffect(() => {
      if (!currentMarker.current) return;
      const route = props.routes[props.selected];
      if (!props.navigating) {
        currentMarker.current.setLatLng(
          props.reversed
            ? route.coordinates[route.coordinates.length - 1]
            : route.coordinates[0],
        );
        return;
      }
      const steps = props.reversed ? [...route.steps].reverse() : route.steps;
      const location: Coordinate = steps[props.step]?.location || HOME;
      currentMarker.current.setLatLng(location);
      map.current?.panTo(location, { animate: true, duration: 0.7 });
    }, [
      props.step,
      props.navigating,
      props.reversed,
      props.routes,
      props.selected,
    ]);

    return (
      <div
        className="map-canvas"
        ref={container}
        role="region"
        aria-label="Interactive San Francisco route map"
      />
    );
  },
);
