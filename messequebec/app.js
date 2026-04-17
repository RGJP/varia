(() => {
  "use strict";

  const QUEBEC_CENTER = [46.8538, -71.2714];
  const QUEBEC_ZOOM = 13;
  const USER_LOCATION_ZOOM = 14;
  const EARTH_RADIUS_KM = 6371.0088;
  const DISTANCE_RERENDER_DELTA_KM = 0.025;
  const DISTANCE_RERENDER_MS = 15000;

  const CHURCHES = [
    {
      id: "eglise-saint-rodrigue",
      name: "St-Rodrigue",
      lat: 46.8460172,
      lng: -71.2516243,
      schedule: [
        { day: "Lundi", time: "16h" },
        { day: "Dimanche", time: "9h30" },
        { day: "Dimanche", time: "11h" },
      ],
    },
    {
      id: "eglise-st-charles-borromee",
      name: "St-Charles Borromée",
      lat: 46.86099749574595,
      lng: -71.26973140913687,
      schedule: [
        { day: "Mardi", time: "8h30" },
        { day: "Vendredi", time: "8h30" },
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "10h30" },
      ],
    },
    {
      id: "eglise-ste-cecile",
      name: "Ste-Cécile",
      lat: 46.86415368414262,
      lng: -71.28117327724678,
      schedule: [
        { day: "Mercredi", time: "8h30" },
        { day: "Dimanche", time: "9h" },
      ],
    },
    {
      id: "eglise-st-jerome",
      name: "St-Jérôme",
      lat: 46.855039242598345,
      lng: -71.25507103677113,
      schedule: [
        { day: "Jeudi", time: "16h" },
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "10h" },
      ],
    },
    {
      id: "notre-dame-de-quebec",
      name: "BC Notre-Dame",
      lat: 46.813331,
      lng: -71.205981,
      schedule: [
        { day: "Lun-Ven", time: "8h00, 12h10" },
        { day: "Samedi", time: "8h00" },
        { day: "Dimanche", time: "9h30" },
      ],
    },
    {
      id: "eglise-st-ambroise",
      name: "St-Ambroise",
      lat: 46.85180218426283,
      lng: -71.35787970471365,
      schedule: [
        { day: "Dimanche", time: "8h30" },
        { day: "Dimanche", time: "10h45" },
        { day: "Lundi", time: "8h30" },
        { day: "Mercredi", time: "8h30" },
      ],
    },
    {
      id: "eglise-st-andre",
      name: "St-André",
      lat: 46.85663866782628,
      lng: -71.33528285600016,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Mardi", time: "8h30" },
      ],
    },
    {
      id: "eglise-st-emile",
      name: "St-Émile",
      lat: 46.869888472904464,
      lng: -71.33669679091805,
      schedule: [
        { day: "Dimanche", time: "11h" },
        { day: "Mercredi", time: "9h" },
      ],
    },
    {
      id: "eglise-st-gerard-majella",
      name: "St-Gérard-Majella",
      lat: 46.84180671598703,
      lng: -71.43174770811653,
      schedule: [
        { day: "Dimanche", time: "10h45" },
        { day: "Vendredi", time: "9h" },
      ],
    },
    {
      id: "eglise-notre-dame-annonc",
      name: "Notre-Dame-Annonc.",
      lat: 46.800223034066065,
      lng: -71.35844817372664,
      schedule: [
        { day: "Dimanche", time: "9h" },
        { day: "Dimanche", time: "10h45" },
        { day: "Lundi", time: "16h" },
      ],
    },
    {
      id: "eglise-ste-monique",
      name: "Ste-Monique",
      lat: 46.81166551325594,
      lng: -71.3207605946268,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Mercredi", time: "16h" },
      ],
    },
    {
      id: "eglise-st-francois-xavier",
      name: "St-François-Xavier",
      lat: 46.81279265361038,
      lng: -71.29661129885727,
      schedule: [
        { day: "Dimanche", time: "10h" },
        { day: "Mardi", time: "16h" },
      ],
    },
    {
      id: "eglise-ste-francoise-cabrini",
      name: "Ste-Françoise-Cabrini",
      lat: 46.90860258819331,
      lng: -71.37338876731937,
      schedule: [
        { day: "Dimanche", time: "9h" },
        { day: "Jeudi", time: "8h30" },
      ],
    },
    {
      id: "eglise-notre-dame-des-laurentides",
      name: "Notre-Dame-des-Laurentides",
      lat: 46.91153338901198,
      lng: -71.34087251412801,
      schedule: [
        { day: "Dimanche", time: "11h" },
        { day: "Mardi", time: "19h" },
      ],
    },
    {
      id: "eglise-st-pierre-aux-liens",
      name: "St-Pierre-aux-Liens",
      lat: 46.88161902202593,
      lng: -71.28652928528763,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "9h30" },
        { day: "Lundi", time: "19h" },
        { day: "Mercredi", time: "19h" },
      ],
    },
    {
      id: "eglise-st-martyrs-can",
      name: "St-Martyrs-Can.",
      lat: 46.798760319119936,
      lng: -71.23724558280337,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "9h30" },
        { day: "Mardi", time: "16h" },
        { day: "Jeudi", time: "16h" },
      ],
    },
    {
      id: "eglise-st-dominique",
      name: "St-Dominique",
      lat: 46.80132575557902,
      lng: -71.2245649099717,
      schedule: [
        { day: "Dimanche", time: "10h30" },
        { day: "Lun-Ven", time: "11h45" },
      ],
    },
    {
      id: "eglise-notre-dame-garde",
      name: "Notre-Dame-Garde",
      lat: 46.79895820659867,
      lng: -71.21647426208722,
      schedule: [
        { day: "Dimanche", time: "9h30" },
      ],
    },
    {
      id: "eglise-notre-dame-victoires",
      name: "Notre-Dame-Victoires",
      lat: 46.81301322058945,
      lng: -71.20262732178475,
      schedule: [
        { day: "Dimanche", time: "11h" },
      ],
    },
    {
      id: "chapelle-jesuites",
      name: "Chapelle-Jésuites",
      lat: 46.81225493954801,
      lng: -71.21200431062599,
      schedule: [
        { day: "Dimanche", time: "17h" },
      ],
    },
    {
      id: "eglise-st-louis-courville",
      name: "St-Louis-Courville",
      lat: 46.885274586748935,
      lng: -71.1586831807623,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "11h" },
        { day: "Mardi", time: "19h" },
        { day: "Vendredi", time: "16h" },
      ],
    },
    {
      id: "eglise-notre-dame-recouvrance",
      name: "Notre-Dame-Recouvrance",
      lat: 46.81643434565516,
      lng: -71.25733004303723,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "9h30" },
        { day: "Lundi", time: "16h30" },
        { day: "Mercredi", time: "16h30" },
      ],
    },
    {
      id: "eglise-st-fidele",
      name: "St-Fidèle",
      lat: 46.829224598551974,
      lng: -71.22867389462553,
      schedule: [
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "10h30" },
        { day: "Dimanche", time: "19h" },
        { day: "Lundi", time: "8h" },
        { day: "Mardi", time: "16h30" },
        { day: "Mercredi", time: "19h" },
        { day: "Jeudi", time: "8h" },
        { day: "Vendredi", time: "8h" },
      ],
    },
    {
      id: "eglise-st-pascal",
      name: "St-Pascal",
      lat: 46.83959198306098,
      lng: -71.22180135229684,
      schedule: [
        { day: "Dimanche", time: "10h" },
        { day: "Lundi", time: "16h30" },
      ],
    },
    {
      id: "eglise-st-roch",
      name: "St-Roch",
      lat: 46.81542385939474,
      lng: -71.221810419758,
      schedule: [
        { day: "Mardi", time: "11h50" },
        { day: "Dimanche", time: "11h" },
      ],
    },
    {
      id: "oratoire-st-joseph",
      name: "Oratoire St-Joseph",
      lat: 46.80320893846324,
      lng: -71.23644009773946,
      schedule: [
        { day: "Lun-Sam", time: "8h30" },
        { day: "Samedi", time: "16h" },
        { day: "Dimanche", time: "10h" },
      ],
    },
    {
      id: "eglise-st-charles-garnier",
      name: "St-Charles-Garnier",
      lat: 46.78652053475747,
      lng: -71.25057312161238,
      schedule: [
        { day: "Samedi", time: "16h30" },
        { day: "Mardi", time: "16h30" },
        { day: "Jeudi", time: "16h30" },
      ],
    },
    {
      id: "eglise-st-michel-sillery",
      name: "St-Michel-Sillery",
      lat: 46.774490541472474,
      lng: -71.24337917002397,
      schedule: [
        { day: "Dimanche", time: "11h" },
        { day: "Mercredi", time: "16h30" },
        { day: "Vendredi", time: "17h15" },
      ],
    },
    {
      id: "eglise-st-thomas-daquin",
      name: "St-Thomas-d'Aquin",
      lat: 46.78837379093458,
      lng: -71.26818192346445,
      schedule: [
        { day: "Lundi", time: "9h00" },
        { day: "Mardi", time: "17h15" },
        { day: "Mercredi", time: "17h15" },
        { day: "Jeudi", time: "17h15" },
        { day: "Vendredi", time: "9h00" },
        { day: "Samedi", time: "9h00" },
        { day: "Dimanche", time: "10h30" },
        { day: "Dimanche", time: "19h" },
      ],
    },
  ];

  const COPY = {
    loadingData: "Chargement des messes...",
    locationWaiting: "Recherche de votre position...",
    locationActive: "Position active",
    locationDenied: "Géolocalisation refusée",
    locationUnavailable: "Position indisponible",
    locationUnsupported: "Géolocalisation non prise en charge",
    unknownDistance: "-- km",
    massTimes: "Messes",
  };

  const state = {
    map: null,
    churchLayer: null,
    churches: [],
    userLocation: null,
    lastDistanceRender: null,
    watchId: null,
    followUser: false,
    statusKey: "loadingData",
    userMarker: null,
    accuracyCircle: null,
  };

  const els = {
    statusText: document.getElementById("statusText"),
    visibleText: document.getElementById("visibleText"),
    locateButton: document.getElementById("locateButton"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    resourceSelect: document.getElementById("resourceSelect"),
    todayMassesButton: document.getElementById("todayMassesButton"),
    todayMassesOverlay: document.getElementById("todayMassesOverlay"),
    todayMassesClose: document.getElementById("todayMassesClose"),
    todayMassesTitle: document.getElementById("todayMassesTitle"),
    todayMassesList: document.getElementById("todayMassesList"),
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initMap();
    bindUi();
    loadChurches();
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

    state.churchLayer = new ChurchLabelLayer({
      onVisibleChange: updateVisibleText,
      onNavigate: openNavigation,
    });
    state.churchLayer.addTo(state.map);

    state.map.on("dragstart zoomstart", () => {
      state.followUser = false;
    });
  }

  function bindUi() {
    els.locateButton.addEventListener("click", () => {
      state.followUser = true;
      if (state.userLocation) {
        state.map.setView(
          [state.userLocation.lat, state.userLocation.lng],
          Math.max(state.map.getZoom(), USER_LOCATION_ZOOM),
        );
      } else {
        requestLocation();
      }
    });

    els.resourceSelect?.addEventListener("change", handleResourceSelect);
    els.todayMassesButton?.addEventListener("click", openTodayMasses);
    els.todayMassesClose?.addEventListener("click", closeTodayMasses);
    els.todayMassesOverlay?.addEventListener("click", (event) => {
      const focusButton = event.target.closest("[data-focus-church-id]");
      if (focusButton) {
        focusChurch(focusButton.dataset.focusChurchId);
        return;
      }

      if (event.target === els.todayMassesOverlay) {
        closeTodayMasses();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeTodayMasses();
      }
    });
  }

  function loadChurches() {
    setStatus("loadingData");
    setLoading(true);

    state.churches = CHURCHES.map((church) => ({
      ...church,
      label: church.name,
      distanceKm: null,
    }));

    updateDistances(false);
    state.churchLayer.setChurches(state.churches);
    setDataReadyStatus();
    setLoading(false);
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("locationUnsupported");
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
      return;
    }

    setStatus("locationUnavailable");
  }

  function updateUserMarker(location) {
    const latLng = [location.lat, location.lng];
    const icon = L.divIcon({
      className: "",
      html: '<div class="user-position"></div>',
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
          fillColor: "#256f63",
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

    state.churches.forEach((church) => {
      church.distanceKm = haversineKm(state.userLocation.lat, state.userLocation.lng, church.lat, church.lng);
    });

    state.lastDistanceRender = {
      lat: state.userLocation.lat,
      lng: state.userLocation.lng,
      timestamp: Date.now(),
    };

    if (render) {
      state.churchLayer.requestRender();
    }
  }

  function openNavigation(church) {
    const params = new URLSearchParams({
      api: "1",
      destination: `${church.lat},${church.lng}`,
      travelmode: "driving",
      dir_action: "navigate",
    });

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener");
  }

  function handleResourceSelect(event) {
    const value = event.target.value;
    event.target.value = "";

    if (!value) {
      return;
    }

    window.open(value, "_blank", "noopener");
  }

  function openTodayMasses() {
    if (!els.todayMassesOverlay || !els.todayMassesList || !els.todayMassesTitle) {
      return;
    }

    const today = new Date();
    const title = formatTodayTitle(today);
    const masses = todayMasses(today);
    els.todayMassesTitle.textContent = title;
    els.todayMassesList.replaceChildren(renderTodayMassesContent(masses));
    els.todayMassesOverlay.classList.remove("is-hidden");
    els.todayMassesOverlay.setAttribute("aria-hidden", "false");
  }

  function closeTodayMasses() {
    if (!els.todayMassesOverlay) {
      return;
    }

    els.todayMassesOverlay.classList.add("is-hidden");
    els.todayMassesOverlay.setAttribute("aria-hidden", "true");
  }

  function renderTodayMassesContent(masses) {
    if (!masses.length) {
      const empty = document.createElement("p");
      empty.className = "today-masses-empty";
      empty.textContent = "Aucune messe aujourd'hui dans les données.";
      return empty;
    }

    const list = document.createElement("ol");
    list.className = "today-masses-items";

    masses.forEach((mass) => {
      const item = document.createElement("li");

      const time = document.createElement("strong");
      time.textContent = mass.time;

      const church = document.createElement("span");
      const churchButton = document.createElement("button");
      churchButton.className = "today-mass-church";
      churchButton.type = "button";
      churchButton.dataset.focusChurchId = mass.church.id;
      churchButton.textContent = mass.church.name;
      church.appendChild(churchButton);

      item.append(time, church);
      list.appendChild(item);
    });

    return list;
  }

  function focusChurch(churchId) {
    const church = state.churches.find((candidate) => candidate.id === churchId);
    if (!church) {
      return;
    }

    closeTodayMasses();
    state.followUser = false;
    state.churchLayer.selectedChurchId = church.id;
    state.map.setView([church.lat, church.lng], Math.max(state.map.getZoom(), 15), { animate: true });
    state.churchLayer.requestRender();
  }

  function todayMasses(date) {
    const day = jsDayToWeekOrder(date.getDay());
    const result = [];

    state.churches.forEach((church) => {
      church.schedule.forEach((mass) => {
        if (!scheduleAppliesToDay(mass.day, day)) {
          return;
        }

        splitMassTimes(mass.time).forEach((time) => {
          result.push({
            church,
            time,
            minutes: timeMinutes(time),
          });
        });
      });
    });

    return result.sort((a, b) => a.minutes - b.minutes || a.church.name.localeCompare(b.church.name, "fr"));
  }

  function scheduleAppliesToDay(day, targetDay) {
    const normalized = normalizeToken(day);
    const range = normalized.match(/^([a-z]+)\s*(?:-|a(?:u)?)\s*([a-z]+)/);

    if (range) {
      const start = dayOrder(range[1]);
      const end = dayOrder(range[2]);
      if (start === 99 || end === 99) {
        return false;
      }
      return start <= end
        ? targetDay >= start && targetDay <= end
        : targetDay >= start || targetDay <= end;
    }

    return dayOrder(day) === targetDay;
  }

  function splitMassTimes(value) {
    return String(value)
      .split(",")
      .map((time) => time.trim())
      .filter(Boolean);
  }

  function timeMinutes(value) {
    const match = String(value).match(/(\d{1,2})h(?:(\d{2}))?/);
    if (!match) {
      return Number.MAX_SAFE_INTEGER;
    }

    return Number(match[1]) * 60 + Number(match[2] || 0);
  }

  function jsDayToWeekOrder(jsDay) {
    return jsDay === 0 ? 7 : jsDay;
  }

  function formatTodayTitle(date) {
    const formatted = new Intl.DateTimeFormat("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function setStatus(key) {
    state.statusKey = key;
    els.statusText.textContent = COPY[key] || key;
  }

  function setDataReadyStatus() {
    const churchCount = state.churches.length;
    const massCount = state.churches.reduce((total, church) => total + church.schedule.length, 0);
    const churchLabel = churchCount > 1 ? "églises" : "église";
    const massLabel = massCount > 1 ? "messes" : "messe";
    state.statusKey = "dataReady";
    els.statusText.textContent = `${churchCount} ${churchLabel}, ${massCount} ${massLabel}`;
  }

  function setLoading(isLoading) {
    if (!els.loadingOverlay) {
      return;
    }

    els.loadingOverlay.classList.toggle("is-hidden", !isLoading);
    els.loadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  }

  function updateVisibleText(visible, total) {
    const churchLabel = total > 1 ? "églises" : "église";
    els.visibleText.textContent = `${visible} visible / ${total} ${churchLabel}`;
  }

  class ChurchLabelLayer extends L.Layer {
    constructor(options) {
      super();
      this.options = options;
      this.churches = [];
      this.container = null;
      this.renderFrame = 0;
      this.visibleCount = 0;
      this.totalCount = 0;
      this.selectedChurchId = null;
      this.handleMapUpdate = this.requestRender.bind(this);
      this.handleClick = this.handleClick.bind(this);
    }

    onAdd(map) {
      this.map = map;
      this.container = L.DomUtil.create("div", "church-label-layer");
      this.pane = map.getPane("churchLabelPane") || map.createPane("churchLabelPane");
      this.pane.classList.add("church-label-pane");
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

    setChurches(churches) {
      this.churches = churches;
      this.totalCount = churches.length;
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

      const candidates = this.churches
        .filter((church) => bounds.contains([church.lat, church.lng]))
        .map((church) => ({
          church,
          containerPoint: this.map.latLngToContainerPoint([church.lat, church.lng]),
          layerPoint: this.map.latLngToLayerPoint([church.lat, church.lng]),
          priority: Number.isFinite(church.distanceKm)
            ? church.distanceKm
            : haversineKm(center.lat, center.lng, church.lat, church.lng),
        }))
        .sort((a, b) => a.priority - b.priority);

      const accepted = [];

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

        accepted.push(candidate);
      }

      const fragment = document.createDocumentFragment();
      const acceptedIds = new Set(accepted.map(({ church }) => church.id));

      candidates.forEach(({ church, layerPoint }) => {
        fragment.appendChild(renderChurchPoint(church, layerPoint, acceptedIds.has(church.id)));
      });

      accepted.forEach(({ church, layerPoint }) => {
        fragment.appendChild(renderChurchLabel(church, layerPoint));
      });

      if (this.selectedChurchId && !acceptedIds.has(this.selectedChurchId)) {
        const selected = candidates.find(({ church }) => church.id === this.selectedChurchId);
        if (selected) {
          fragment.appendChild(renderChurchLabel(selected.church, selected.layerPoint, true));
        }
      }

      this.container.replaceChildren(fragment);
      this.visibleCount = candidates.length;
      this.options.onVisibleChange?.(candidates.length, this.totalCount);
    }

    handleClick(event) {
      const button = event.target.closest("[data-nav-id]");
      if (!button) {
        const point = event.target.closest("[data-church-id]");
        if (point) {
          event.preventDefault();
          event.stopPropagation();
          this.selectedChurchId = point.dataset.churchId;
          this.requestRender();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const church = this.churches.find((candidate) => candidate.id === button.dataset.navId);
      if (church) {
        this.options.onNavigate?.(church);
      }
    }
  }

  function renderChurchPoint(church, point, hasLabel) {
    const pointEl = document.createElement("button");
    pointEl.className = `church-point${hasLabel ? " has-label" : ""}`;
    pointEl.type = "button";
    pointEl.dataset.churchId = church.id;
    pointEl.style.left = `${point.x}px`;
    pointEl.style.top = `${point.y}px`;
    pointEl.setAttribute("aria-label", church.label);
    pointEl.title = church.label;
    return pointEl;
  }

  function renderChurchLabel(church, point, selected = false) {
    const wrapper = document.createElement("article");
    wrapper.className = selected ? "church-label is-selected" : "church-label";
    wrapper.style.left = `${point.x}px`;
    wrapper.style.top = `${point.y}px`;
    wrapper.setAttribute("aria-label", church.label);

    const title = document.createElement("h2");
    title.className = "church-title";
    title.textContent = church.label;
    wrapper.appendChild(title);

    const schedule = document.createElement("div");
    schedule.className = "mass-schedule";
    schedule.setAttribute("aria-label", COPY.massTimes);

    sortedSchedule(church.schedule).forEach((mass) => {
      schedule.appendChild(renderMassRow(mass));
    });

    wrapper.appendChild(schedule);

    const footer = document.createElement("div");
    footer.className = "church-footer";

    const distance = document.createElement("span");
    distance.className = "church-distance";
    distance.textContent = formatDistance(church.distanceKm);

    const nav = document.createElement("button");
    nav.className = "church-nav";
    nav.type = "button";
    nav.dataset.navId = church.id;
    nav.textContent = "Y aller";
    nav.setAttribute("aria-label", `Navigation vers ${church.label}`);

    footer.append(distance, nav);
    wrapper.appendChild(footer);

    return wrapper;
  }

  function renderMassRow(mass) {
    const row = document.createElement("div");
    row.className = "mass-row";

    const day = document.createElement("span");
    day.textContent = mass.day;

    const time = document.createElement("strong");
    time.textContent = mass.time;

    row.append(day, time);
    return row;
  }

  function sortedSchedule(schedule) {
    return schedule
      .map((mass, index) => ({ mass, index }))
      .sort((a, b) => {
        const dayDelta = dayOrder(a.mass.day) - dayOrder(b.mass.day);
        return dayDelta || a.index - b.index;
      })
      .map(({ mass }) => mass);
  }

  function dayOrder(day) {
    const normalized = normalizeToken(day);

    if (normalized.startsWith("lun")) {
      return 1;
    }
    if (normalized.startsWith("mar")) {
      return 2;
    }
    if (normalized.startsWith("mer")) {
      return 3;
    }
    if (normalized.startsWith("jeu")) {
      return 4;
    }
    if (normalized.startsWith("ven")) {
      return 5;
    }
    if (normalized.startsWith("sam")) {
      return 6;
    }
    if (normalized.startsWith("dim")) {
      return 7;
    }

    return 99;
  }

  function normalizeToken(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatDistance(distanceKm) {
    if (!Number.isFinite(distanceKm)) {
      return COPY.unknownDistance;
    }

    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  function getLabelSize() {
    return window.innerWidth < 720
      ? { width: 150, height: 108 }
      : { width: 164, height: 110 };
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
    state.churchLayer?.options.onVisibleChange?.(state.churchLayer.visibleCount, state.churchLayer.totalCount);
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

  window.addEventListener("resize", () => {
    state.churchLayer?.requestRender();
    updateVisibleCountOnly();
  });
})();
