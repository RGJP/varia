(() => {
  "use strict";

  const DATA_URL = "https://regieessencequebec.ca/stations.geojson.gz";
  const QUEBEC_CENTER = [47.75, -71.85];
  const QUEBEC_ZOOM = 6;
  const USER_LOCATION_ZOOM = 15;
  const LOCAL_PRICE_RADIUS_KM = 50;
  const MIN_COMPARABLE_PRICES = 4;
  const EARTH_RADIUS_KM = 6371.0088;
  const DISTANCE_RERENDER_DELTA_KM = 0.025;
  const DISTANCE_RERENDER_MS = 15000;

  const FUEL_KEYS = ["regular", "diesel"];
  const FUEL_ALIASES = {
    regular: ["regulier", "regular"],
    diesel: ["diesel"],
  };

  const I18N = {
    fr: {
      brandName: "Gas Québec",
      locate: "📍 Localiser",
      loadingData: "Chargement des stations...",
      dataReady: "Stations chargees",
      dataError: "Impossible de charger les donnees",
      locationWaiting: "Recherche de votre position...",
      locationActive: "Position active",
      locationDenied: "Geolocalisation refusee",
      locationUnavailable: "Position indisponible",
      locationUnsupported: "Geolocalisation non prise en charge",
      postalTitle: "Position par code postal",
      postalPlaceholder: "*** ***",
      postalUse: "Utiliser",
      postalHint: "Estimation locale avec les codes postaux des stations.",
      postalNeedCode: "Entrez au moins les trois premiers caracteres du code postal.",
      postalWaitingData: "Chargement des stations avant l'estimation.",
      postalNoStations: "Les donnees des stations ne sont pas disponibles.",
      postalNoMatch: "Aucune station avec un code postal similaire.",
      postalEstimateActive: "Position estimee par code postal",
      visibleCount: "{visible} visibles / {total} stations",
      legendBest: "Bas",
      legendAverage: "Moyen",
      legendHigh: "Haut",
      nav: "NAV",
      navTo: "Navigation vers {station}",
      distance: "DIST",
      unknownDistance: "-- km",
      noPrice: "--",
      userLocation: "Votre position",
    },
    en: {
      brandName: "Gas Quebec",
      locate: "📍 Locate",
      loadingData: "Loading stations...",
      dataReady: "Stations loaded",
      dataError: "Unable to load data",
      locationWaiting: "Finding your position...",
      locationActive: "Location active",
      locationDenied: "Geolocation denied",
      locationUnavailable: "Location unavailable",
      locationUnsupported: "Geolocation is not supported",
      postalTitle: "Postal code location",
      postalPlaceholder: "*** ***",
      postalUse: "Use",
      postalHint: "Local estimate using station postal codes.",
      postalNeedCode: "Enter at least the first three postal-code characters.",
      postalWaitingData: "Loading stations before estimating.",
      postalNoStations: "Station data is not available.",
      postalNoMatch: "No stations with a similar postal code.",
      postalEstimateActive: "Location estimated by postal code",
      visibleCount: "{visible} visible / {total} stations",
      legendBest: "Low",
      legendAverage: "Mid",
      legendHigh: "High",
      nav: "NAV",
      navTo: "Navigate to {station}",
      distance: "DIST",
      unknownDistance: "-- km",
      noPrice: "--",
      userLocation: "Your location",
    },
  };

  const state = {
    lang: savedLanguage(),
    map: null,
    stationLayer: null,
    stations: [],
    userLocation: null,
    lastDistanceRender: null,
    watchId: null,
    followUser: true,
    statusKey: "loadingData",
    pendingPostalCode: "",
    userMarker: null,
    accuracyCircle: null,
  };

  const els = {
    statusText: document.getElementById("statusText"),
    visibleText: document.getElementById("visibleText"),
    locateButton: document.getElementById("locateButton"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    postalPrompt: document.getElementById("postalPrompt"),
    postalInput: document.getElementById("postalInput"),
    postalError: document.getElementById("postalError"),
    langButtons: Array.from(document.querySelectorAll("[data-lang]")),
    i18n: Array.from(document.querySelectorAll("[data-i18n]")),
    i18nPlaceholders: Array.from(document.querySelectorAll("[data-i18n-placeholder]")),
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.documentElement.lang = state.lang;
    applyTranslations();
    initMap();
    bindUi();
    requestLocation();
    loadStations();
  }

  function initMap() {
    state.map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      worldCopyJump: false,
    }).setView(QUEBEC_CENTER, QUEBEC_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(state.map);

    state.stationLayer = new StationLabelLayer({
      onVisibleChange: updateVisibleText,
      onNavigate: openNavigation,
    });
    state.stationLayer.addTo(state.map);

    state.map.on("dragstart zoomstart", () => {
      state.followUser = false;
    });
  }

  function bindUi() {
    els.locateButton.addEventListener("click", () => {
      state.followUser = true;
      if (state.userLocation) {
        state.map.setView([state.userLocation.lat, state.userLocation.lng], Math.max(state.map.getZoom(), USER_LOCATION_ZOOM));
      } else {
        requestLocation();
      }
    });

    els.langButtons.forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    els.postalPrompt?.addEventListener("submit", handlePostalSubmit);
    els.postalInput?.addEventListener("input", () => setPostalError(""));
  }

  async function loadStations() {
    setStatus("loadingData");
    setLoading(true);
    try {
      const geojson = await fetchCompressedGeoJson(DATA_URL);
      state.stations = normalizeStations(geojson);
      computePriceRanks(state.stations);
      updateDistances(true);
      state.stationLayer.setStations(state.stations);
      if (!applyPendingPostalCode()) {
        setStatus("dataReady");
      }
    } catch (error) {
      console.error(error);
      setStatus("dataError");
      if (state.pendingPostalCode) {
        setPostalError("postalNoStations");
        showPostalPrompt();
      }
      updateVisibleText(0, 0);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompressedGeoJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Station data request failed with HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
    const text = isGzip ? await decompressGzip(buffer) : new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(text);
  }

  async function decompressGzip(buffer) {
    if ("DecompressionStream" in window) {
      const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).text();
    }

    if (window.pako?.ungzip) {
      const inflated = window.pako.ungzip(new Uint8Array(buffer));
      return new TextDecoder("utf-8").decode(inflated);
    }

    throw new Error("This browser cannot decompress gzip data.");
  }

  function normalizeStations(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON feature collection.");
    }

    return geojson.features
      .map((feature, index) => normalizeStation(feature, index))
      .filter(Boolean);
  }

  function normalizeStation(feature, index) {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }

    const properties = feature.properties || {};
    const fuels = createEmptyFuelState();
    const prices = Array.isArray(properties.Prices) ? properties.Prices : [];

    prices.forEach((price) => {
      const key = fuelKeyFromName(price?.GasType);
      if (!key || price?.IsAvailable === false) {
        return;
      }

      const cents = parsePriceCents(price.Price);
      if (!Number.isFinite(cents)) {
        return;
      }

      fuels[key] = {
        cents,
        raw: String(price.Price || ""),
        rank: "unknown",
      };
    });

    const brand = cleanText(properties.brand);
    const name = cleanText(properties.Name);
    const stationName = brand || name || "Station";

    return {
      id: `station-${index}`,
      lat,
      lng,
      name,
      brand,
      label: stationName,
      address: cleanText(properties.Address),
      region: cleanText(properties.Region),
      postalCode: cleanText(properties.PostalCode),
      status: cleanText(properties.Status),
      fuels,
      distanceKm: null,
    };
  }

  function createEmptyFuelState() {
    return FUEL_KEYS.reduce((result, key) => {
      result[key] = { cents: null, raw: "", rank: "unknown" };
      return result;
    }, {});
  }

  function fuelKeyFromName(value) {
    const normalized = normalizeToken(value);
    return FUEL_KEYS.find((key) => FUEL_ALIASES[key].some((alias) => normalized.includes(alias)));
  }

  function parsePriceCents(value) {
    if (value == null) {
      return null;
    }

    const text = String(value).replace(",", ".");
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return null;
    }

    const numeric = Number(match[1]);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return text.includes("$") && numeric < 10 ? numeric * 100 : numeric;
  }

  function computePriceRanks(stations) {
    const cellSize = 0.5;

    FUEL_KEYS.forEach((fuelKey) => {
      const grid = new Map();
      const pricedStations = stations.filter((station) => Number.isFinite(station.fuels[fuelKey].cents));

      pricedStations.forEach((station) => {
        const key = gridKey(station.lat, station.lng, cellSize);
        if (!grid.has(key)) {
          grid.set(key, []);
        }
        grid.get(key).push(station);
      });

      pricedStations.forEach((station) => {
        const nearby = nearbyPricedStations(station, grid, cellSize, fuelKey);
        const prices = nearby.map((candidate) => candidate.fuels[fuelKey].cents).filter(Number.isFinite);
        station.fuels[fuelKey].rank = rankPrice(station.fuels[fuelKey].cents, prices);
      });
    });
  }

  function nearbyPricedStations(station, grid, cellSize, fuelKey) {
    const latCell = Math.floor(station.lat / cellSize);
    const lngCell = Math.floor(station.lng / cellSize);
    const latRange = Math.ceil((LOCAL_PRICE_RADIUS_KM / 111) / cellSize) + 1;
    const cosLat = Math.max(0.35, Math.cos(toRadians(station.lat)));
    const lngRange = Math.ceil((LOCAL_PRICE_RADIUS_KM / (111 * cosLat)) / cellSize) + 1;
    const result = [];

    for (let latOffset = -latRange; latOffset <= latRange; latOffset += 1) {
      for (let lngOffset = -lngRange; lngOffset <= lngRange; lngOffset += 1) {
        const bucket = grid.get(`${latCell + latOffset}:${lngCell + lngOffset}`);
        if (!bucket) {
          continue;
        }

        bucket.forEach((candidate) => {
          if (
            Number.isFinite(candidate.fuels[fuelKey].cents) &&
            haversineKm(station.lat, station.lng, candidate.lat, candidate.lng) <= LOCAL_PRICE_RADIUS_KM
          ) {
            result.push(candidate);
          }
        });
      }
    }

    return result;
  }

  function rankPrice(price, prices) {
    if (!Number.isFinite(price) || prices.length < MIN_COMPARABLE_PRICES) {
      return "unknown";
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (max - min < 0.2) {
      return "average";
    }

    const sorted = prices.slice().sort((a, b) => a - b);
    const lowerCount = sorted.filter((value) => value < price).length;
    const equalCount = sorted.filter((value) => value === price).length;
    const percentile = (lowerCount + equalCount / 2) / sorted.length;

    if (percentile <= 0.34) {
      return "best";
    }

    if (percentile >= 0.67) {
      return "high";
    }

    return "average";
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("locationUnsupported");
      showPostalPrompt();
      return;
    }

    setStatus("locationWaiting");

    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
    }

    state.watchId = navigator.geolocation.watchPosition(
      handleLocation,
      handleLocationError,
      {
        enableHighAccuracy: false,
        maximumAge: 20000,
        timeout: 12000,
      },
    );
  }

  function handleLocation(position) {
    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const next = {
      lat: latitude,
      lng: longitude,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      timestamp: Date.now(),
    };

    const previous = state.userLocation;
    state.userLocation = next;
    state.pendingPostalCode = "";
    hidePostalPrompt();
    updateUserMarker(next);

    const movedKm = previous ? haversineKm(previous.lat, previous.lng, next.lat, next.lng) : Infinity;
    const lastRenderedAt = state.lastDistanceRender?.timestamp || 0;
    const shouldRerender =
      movedKm >= DISTANCE_RERENDER_DELTA_KM ||
      Date.now() - lastRenderedAt >= DISTANCE_RERENDER_MS ||
      !state.lastDistanceRender;

    if (shouldRerender) {
      updateDistances(true);
    }

    if (state.followUser) {
      state.map.setView([next.lat, next.lng], Math.max(state.map.getZoom(), USER_LOCATION_ZOOM), { animate: true });
      state.followUser = false;
    }

    setStatus("locationActive");
  }

  function handleLocationError(error) {
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }

    if (error?.code === error.PERMISSION_DENIED) {
      setStatus("locationDenied");
      showPostalPrompt();
      return;
    }

    setStatus("locationUnavailable");
    showPostalPrompt();
  }

  function handlePostalSubmit(event) {
    event.preventDefault();
    const code = normalizePostalCode(els.postalInput?.value || "");

    if (code.length < 3) {
      setPostalError("postalNeedCode");
      return;
    }

    if (!state.stations.length) {
      state.pendingPostalCode = code;
      setPostalError(state.statusKey === "dataError" ? "postalNoStations" : "postalWaitingData");
      return;
    }

    applyPostalCode(code);
  }

  function applyPendingPostalCode() {
    if (!state.pendingPostalCode) {
      return false;
    }

    const code = state.pendingPostalCode;
    state.pendingPostalCode = "";
    return applyPostalCode(code);
  }

  function applyPostalCode(code) {
    const estimate = estimateLocationFromPostalCode(code);
    if (!estimate) {
      setPostalError("postalNoMatch");
      showPostalPrompt();
      return false;
    }

    state.userLocation = {
      lat: estimate.lat,
      lng: estimate.lng,
      accuracy: estimate.accuracyMeters,
      timestamp: Date.now(),
      source: "postal",
      postalCode: code,
    };
    state.followUser = false;
    hidePostalPrompt();
    updateUserMarker(state.userLocation);
    updateDistances(true);
    state.map.setView([estimate.lat, estimate.lng], Math.max(state.map.getZoom(), USER_LOCATION_ZOOM), { animate: true });
    setStatus("postalEstimateActive");
    return true;
  }

  function estimateLocationFromPostalCode(code) {
    const stationsWithPostalCodes = state.stations
      .map((station) => ({
        station,
        postalCode: normalizePostalCode(station.postalCode),
      }))
      .filter(({ postalCode }) => postalCode.length >= 3);

    if (!stationsWithPostalCodes.length) {
      return null;
    }

    const maxPrefix = Math.min(code.length, 6);
    const prefixLengths = [];
    for (let length = maxPrefix; length >= 3; length -= 1) {
      prefixLengths.push(length);
    }
    prefixLengths.push(2);

    for (const length of prefixLengths) {
      const prefix = code.slice(0, length);
      const matches = stationsWithPostalCodes.filter(({ postalCode }) => postalCode.startsWith(prefix));
      if (matches.length) {
        return estimateCenter(matches.map(({ station }) => station));
      }
    }

    return null;
  }

  function estimateCenter(stations) {
    const lat = average(stations.map((station) => station.lat));
    const lng = average(stations.map((station) => station.lng));
    const distances = stations.map((station) => haversineKm(lat, lng, station.lat, station.lng));
    const averageSpreadKm = average(distances);
    const accuracyMeters = Math.round(Math.max(1200, Math.min(25000, averageSpreadKm * 1000 || 1200)));

    return { lat, lng, accuracyMeters };
  }

  function showPostalPrompt() {
    if (!els.postalPrompt) {
      return;
    }

    els.postalPrompt.classList.remove("is-hidden");
    els.postalPrompt.setAttribute("aria-hidden", "false");
  }

  function hidePostalPrompt() {
    if (!els.postalPrompt) {
      return;
    }

    els.postalPrompt.classList.add("is-hidden");
    els.postalPrompt.setAttribute("aria-hidden", "true");
    state.pendingPostalCode = "";
    setPostalError("");
  }

  function setPostalError(key) {
    if (!els.postalError) {
      return;
    }

    els.postalError.textContent = key ? t(key) : "";
  }

  function updateUserMarker(location) {
    const latLng = [location.lat, location.lng];
    const icon = L.divIcon({
      className: "",
      html: `<div class="user-position${location.source === "postal" ? " is-estimated" : ""}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    if (!state.userMarker) {
      state.userMarker = L.marker(latLng, {
        interactive: false,
        icon,
        zIndexOffset: 1000,
      }).addTo(state.map);
    } else {
      state.userMarker.setLatLng(latLng);
      state.userMarker.setIcon(icon);
    }

    if (Number.isFinite(location.accuracy)) {
      if (!state.accuracyCircle) {
        state.accuracyCircle = L.circle(latLng, {
          radius: location.accuracy,
          interactive: false,
          stroke: false,
          fillColor: "#0f8b8d",
          fillOpacity: 0.12,
        }).addTo(state.map);
      } else {
        state.accuracyCircle.setLatLng(latLng);
        state.accuracyCircle.setRadius(location.accuracy);
      }
    } else if (state.accuracyCircle) {
      state.accuracyCircle.remove();
      state.accuracyCircle = null;
    }
  }

  function updateDistances(render) {
    if (!state.userLocation) {
      return;
    }

    state.stations.forEach((station) => {
      station.distanceKm = haversineKm(state.userLocation.lat, state.userLocation.lng, station.lat, station.lng);
    });

    state.lastDistanceRender = {
      lat: state.userLocation.lat,
      lng: state.userLocation.lng,
      timestamp: Date.now(),
    };

    if (render) {
      state.stationLayer.requestRender();
    }
  }

  function openNavigation(station) {
    const params = new URLSearchParams({
      api: "1",
      destination: `${station.lat},${station.lng}`,
      travelmode: "driving",
      dir_action: "navigate",
    });

    if (state.userLocation) {
      params.set("origin", `${state.userLocation.lat},${state.userLocation.lng}`);
    }

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener");
  }

  function setLanguage(lang) {
    if (!I18N[lang] || lang === state.lang) {
      return;
    }

    state.lang = lang;
    localStorage.setItem("gas-quebec-lang", lang);
    document.documentElement.lang = lang;
    applyTranslations();
    setStatus(state.statusKey);
    state.stationLayer.requestRender();
  }

  function applyTranslations() {
    els.i18n.forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });

    els.i18nPlaceholders.forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      element.setAttribute("placeholder", t(key));
    });

    els.langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === state.lang);
      button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
    });
  }

  function setStatus(key) {
    state.statusKey = key;
    els.statusText.textContent = t(key);
  }

  function setLoading(isLoading) {
    if (!els.loadingOverlay) {
      return;
    }

    els.loadingOverlay.classList.toggle("is-hidden", !isLoading);
    els.loadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  }

  function updateVisibleText(visible, total) {
    els.visibleText.textContent = t("visibleCount", { visible, total });
  }

  function t(key, values = {}) {
    const dictionary = I18N[state.lang] || I18N.fr;
    let text = dictionary[key] || I18N.fr[key] || key;
    Object.entries(values).forEach(([name, value]) => {
      text = text.replace(`{${name}}`, String(value));
    });
    return text;
  }

  function savedLanguage() {
    const lang = localStorage.getItem("gas-quebec-lang");
    return I18N[lang] ? lang : "fr";
  }

  class StationLabelLayer extends L.Layer {
    constructor(options) {
      super();
      this.options = options;
      this.stations = [];
      this.container = null;
      this.renderFrame = 0;
      this.visibleCount = 0;
      this.totalCount = 0;
      this.selectedStationId = null;
      this.handleMapUpdate = this.requestRender.bind(this);
      this.handleClick = this.handleClick.bind(this);
    }

    onAdd(map) {
      this.map = map;
      this.container = L.DomUtil.create("div", "station-label-layer");
      this.pane = map.getPane("stationLabelPane") || map.createPane("stationLabelPane");
      this.pane.classList.add("station-label-pane");
      this.pane.appendChild(this.container);
      this.container.addEventListener("click", this.handleClick);
      map.on("moveend zoomend resize", this.handleMapUpdate);
      this.requestRender();
    }

    onRemove(map) {
      map.off("moveend zoomend resize", this.handleMapUpdate);
      this.container?.removeEventListener("click", this.handleClick);
      L.DomUtil.remove(this.container);
      this.container = null;
      this.pane = null;
      this.map = null;
    }

    setStations(stations) {
      this.stations = stations;
      this.totalCount = stations.length;
      this.requestRender();
    }

    requestRender() {
      if (!this.map || !this.container || this.renderFrame) {
        return;
      }

      this.renderFrame = requestAnimationFrame(() => {
        this.renderFrame = 0;
        this.render();
      });
    }

    render() {
      if (!this.map || !this.container) {
        return;
      }

      const size = this.map.getSize();
      const zoom = this.map.getZoom();
      const bounds = this.map.getBounds().pad(0.08);
      const labelSize = getLabelSize();
      const maxLabels = getMaxLabels(zoom, size.x);
      const center = this.map.getCenter();
      this.container.style.width = `${size.x}px`;
      this.container.style.height = `${size.y}px`;
      const candidates = this.stations
        .filter((station) => bounds.contains([station.lat, station.lng]))
        .map((station) => ({
          station,
          containerPoint: this.map.latLngToContainerPoint([station.lat, station.lng]),
          layerPoint: this.map.latLngToLayerPoint([station.lat, station.lng]),
          priority: Number.isFinite(station.distanceKm)
            ? station.distanceKm
            : haversineKm(center.lat, center.lng, station.lat, station.lng),
        }))
        .sort((a, b) => a.priority - b.priority);

      const accepted = [];
      const collision = new CollisionGrid(70);

      for (const candidate of candidates) {
        if (accepted.length >= maxLabels) {
          break;
        }

        const rect = {
          left: candidate.containerPoint.x - labelSize.width / 2,
          right: candidate.containerPoint.x + labelSize.width / 2,
          top: candidate.containerPoint.y - labelSize.height - 9,
          bottom: candidate.containerPoint.y - 4,
        };

        if (rect.right < -labelSize.width || rect.left > size.x + labelSize.width) {
          continue;
        }

        if (rect.bottom < -labelSize.height || rect.top > size.y + labelSize.height) {
          continue;
        }

        if (collision.hasCollision(rect)) {
          continue;
        }

        collision.insert(rect);
        accepted.push(candidate);
      }

      const fragment = document.createDocumentFragment();
      const acceptedIds = new Set(accepted.map(({ station }) => station.id));

      candidates.forEach(({ station, layerPoint }) => {
        fragment.appendChild(renderStationPoint(station, layerPoint, acceptedIds.has(station.id)));
      });

      accepted.forEach(({ station, layerPoint }) => {
        fragment.appendChild(renderStationLabel(station, layerPoint));
      });

      if (this.selectedStationId && !acceptedIds.has(this.selectedStationId)) {
        const selected = candidates.find(({ station }) => station.id === this.selectedStationId);
        if (selected) {
          fragment.appendChild(renderStationLabel(selected.station, selected.layerPoint, true));
        }
      }

      this.container.replaceChildren(fragment);
      this.visibleCount = candidates.length;
      this.options.onVisibleChange?.(candidates.length, this.totalCount);
    }

    handleClick(event) {
      const button = event.target.closest("[data-nav-id]");
      if (!button) {
        const point = event.target.closest("[data-station-id]");
        if (point) {
          event.preventDefault();
          event.stopPropagation();
          this.selectedStationId = point.dataset.stationId;
          this.requestRender();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const station = this.stations.find((candidate) => candidate.id === button.dataset.navId);
      if (station) {
        this.options.onNavigate?.(station);
      }
    }
  }

  class CollisionGrid {
    constructor(cellSize) {
      this.cellSize = cellSize;
      this.cells = new Map();
    }

    hasCollision(rect) {
      const keys = this.keysForRect(rect);
      return keys.some((key) => (this.cells.get(key) || []).some((candidate) => intersects(rect, candidate)));
    }

    insert(rect) {
      this.keysForRect(rect).forEach((key) => {
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key).push(rect);
      });
    }

    keysForRect(rect) {
      const keys = [];
      const left = Math.floor(rect.left / this.cellSize);
      const right = Math.floor(rect.right / this.cellSize);
      const top = Math.floor(rect.top / this.cellSize);
      const bottom = Math.floor(rect.bottom / this.cellSize);

      for (let x = left; x <= right; x += 1) {
        for (let y = top; y <= bottom; y += 1) {
          keys.push(`${x}:${y}`);
        }
      }

      return keys;
    }
  }

  function renderStationPoint(station, point, hasLabel) {
    const pointEl = document.createElement("button");
    pointEl.className = `station-point${hasLabel ? " has-label" : ""}`;
    pointEl.type = "button";
    pointEl.dataset.stationId = station.id;
    pointEl.style.left = `${point.x}px`;
    pointEl.style.top = `${point.y}px`;
    pointEl.setAttribute("aria-label", station.label);
    pointEl.title = station.label;
    return pointEl;
  }

  function renderStationLabel(station, point, selected = false) {
    const wrapper = document.createElement("article");
    wrapper.className = selected ? "station-label is-selected" : "station-label";
    wrapper.style.left = `${point.x}px`;
    wrapper.style.top = `${point.y}px`;
    wrapper.setAttribute("aria-label", station.label);

    const title = document.createElement("h2");
    title.className = "station-title";
    title.textContent = station.label;
    wrapper.appendChild(title);

    wrapper.appendChild(renderFuelRow("REG", station.fuels.regular));
    wrapper.appendChild(renderFuelRow("DSL", station.fuels.diesel));

    const footer = document.createElement("div");
    footer.className = "station-footer";

    const distance = document.createElement("span");
    distance.className = "station-distance";
    distance.textContent = `${t("distance")}: ${formatDistance(station.distanceKm)}`;

    const nav = document.createElement("button");
    nav.className = "station-nav";
    nav.type = "button";
    nav.dataset.navId = station.id;
    nav.textContent = t("nav");
    nav.setAttribute("aria-label", t("navTo", { station: station.label }));

    footer.append(distance, nav);
    wrapper.appendChild(footer);

    return wrapper;
  }

  function renderFuelRow(label, fuel) {
    const row = document.createElement("div");
    row.className = `fuel-row rank-${fuel.rank || "unknown"}`;

    const fuelLabel = document.createElement("span");
    fuelLabel.textContent = label;

    const price = document.createElement("strong");
    price.textContent = formatPrice(fuel.cents);

    row.append(fuelLabel, price);
    return row;
  }

  function formatPrice(cents) {
    if (!Number.isFinite(cents)) {
      return t("noPrice");
    }

    const dollars = cents / 100;
    const formatted = new Intl.NumberFormat(state.lang === "fr" ? "fr-CA" : "en-CA", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(dollars);

    return state.lang === "fr" ? `${formatted} $` : `$${formatted}`;
  }

  function formatDistance(distanceKm) {
    if (!Number.isFinite(distanceKm)) {
      return t("unknownDistance");
    }

    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  function getLabelSize() {
    return window.innerWidth < 720
      ? { width: 116, height: 82 }
      : { width: 126, height: 86 };
  }

  function getMaxLabels(zoom, width) {
    const desktopBoost = width >= 720 ? 1.5 : 1;
    if (zoom < 7) {
      return Math.round(45 * desktopBoost);
    }
    if (zoom < 9) {
      return Math.round(100 * desktopBoost);
    }
    if (zoom < 11) {
      return Math.round(220 * desktopBoost);
    }
    if (zoom < 13) {
      return Math.round(360 * desktopBoost);
    }
    return Math.round(520 * desktopBoost);
  }

  function updateVisibleCountOnly() {
    state.stationLayer?.options.onVisibleChange?.(state.stationLayer.visibleCount, state.stationLayer.totalCount);
  }

  function average(values) {
    const numbers = values.filter(Number.isFinite);
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  function normalizePostalCode(value) {
    return cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }

  function cleanText(value) {
    return value == null ? "" : String(value).trim();
  }

  function normalizeToken(value) {
    return cleanText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function gridKey(lat, lng, cellSize) {
    return `${Math.floor(lat / cellSize)}:${Math.floor(lng / cellSize)}`;
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  window.addEventListener("resize", () => {
    state.stationLayer?.requestRender();
    updateVisibleCountOnly();
  });
})();
