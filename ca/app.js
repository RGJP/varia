(() => {
  "use strict";

  const LIVE_DATA_URL = "https://www.donneesquebec.ca/recherche/dataset/515374ee-ce34-464f-9875-7d1af3fa9b2a/resource/40105615-3abf-414b-bcba-182e8f2c5eb2/download/listecondamnation.csv";

  // Pre-configured Quebec Region Viewports
  const REGION_VIEWPORTS = {
    quebec: { center: [46.8139, -71.2180], zoom: 13 },
    levis: { center: [46.8033, -71.1800], zoom: 13 },
    montreal: { center: [45.5088, -73.5700], zoom: 13 },
    laval: { center: [45.5700, -73.7000], zoom: 12 },
    longueuil: { center: [45.5312, -73.5181], zoom: 13 },
    "trois-rivieres": { center: [46.3432, -72.5432], zoom: 13 },
    sherbrooke: { center: [45.4042, -71.8929], zoom: 13 },
    gatineau: { center: [45.4287, -75.7081], zoom: 13 },
    saguenay: { center: [48.4280, -71.0664], zoom: 13 },
    all: { center: [47.5, -71.5], zoom: 6 }
  };

  const EARTH_RADIUS_KM = 6371.0088;
  const USER_LOCATION_ZOOM = 15;

  const I18N = {
    brandName: "Condalim Québec",
    brandSubtitle: "Salubrité & Inspections MAPAQ",
    locate: "📍 Localiser",
    locateLabel: "Localiser",
    postalBtn: "Code postal",
    searchPlaceholder: "Rechercher un restaurant, exploitant, rue, infraction...",
    postalTitle: "Naviguer par code postal",
    postalUse: "Aller",
    postalHint: "Exemples : G1K (Vieux-Québec), G1V (Sainte-Foy), G2E (Les Rivières), H2X (Montréal)...",
    postalNeedCode: "Entrez au moins les 3 premiers caractères du code postal.",
    postalNotFound: "Code postal introuvable au Québec.",
    loadingLive: "Téléchargement direct du registre MAPAQ...",
    loadingTitle: "Chargement des données en direct",
    loadingSub: "Téléchargement du CSV officiel Données Québec...",
    dataReady: "Données MAPAQ actualisées",
    dataError: "Impossible de joindre la source MAPAQ",
    visibleCount: "{visible} établissements affichés / {total} dans la zone",
    drawerSecAddress: "Adresse & Itinéraire",
    drawerNavAction: "Itinéraire GPS",
    drawerSecStats: "Bilan des condamnations",
    drawerTotalFines: "Total des amendes",
    drawerOffenseCount: "Nombre de condamnations",
    drawerSecInfractions: "Détails minutieux des condamnations",
    dateInfraction: "Date infraction",
    dateJudgement: "Date jugement",
    datePublication: "Date publication",
    fineLabel: "Amende",
    lawLabel: "Loi & Règlement",
    articleLabel: "Article & Infraction",
    descTitle: "Description officielle de l'infraction",
    prosecutorLabel: "Poursuivant",
    detailsBtn: "Détails",
    unknownDist: "-- km",
    reoffense: "Récidive",
    infractionSingular: "1 infraction",
    infractionPlural: "{count} infractions"
  };

  const state = {
    lang: "fr",
    map: null,
    condamLayer: null,
    allEstablishments: [],
    filteredEstablishments: [],
    userLocation: null,
    userMarker: null,
    accuracyCircle: null,
    watchId: null,
    selectedId: null,
    statusKey: "loadingLive",
    filters: {
      search: ""
    }
  };

  const els = {
    map: document.getElementById("map"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    visibleCountText: document.getElementById("visibleCountText"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    locateBtn: document.getElementById("locateBtn"),
    postalToggleBtn: document.getElementById("postalToggleBtn"),
    postalPrompt: document.getElementById("postalPrompt"),
    postalInput: document.getElementById("postalInput"),
    postalError: document.getElementById("postalError"),
    searchInput: document.getElementById("searchInput"),
    searchClearBtn: document.getElementById("searchClearBtn"),
    
    // Detail Drawer
    drawerOverlay: document.getElementById("detailDrawerOverlay"),
    drawerCloseBtn: document.getElementById("drawerCloseBtn"),
    drawerType: document.getElementById("drawerType"),
    drawerTitle: document.getElementById("drawerTitle"),
    drawerOperator: document.getElementById("drawerOperator"),
    drawerInfoBanner: document.getElementById("drawerInfoBanner"),
    drawerInfoText: document.getElementById("drawerInfoText"),
    drawerAddress: document.getElementById("drawerAddress"),
    drawerNavBtn: document.getElementById("drawerNavBtn"),
    drawerTotalFine: document.getElementById("drawerTotalFine"),
    drawerOffenseCount: document.getElementById("drawerOffenseCount"),
    drawerCondamList: document.getElementById("drawerCondamList")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.documentElement.lang = state.lang;
    applyTranslations();
    initMap();
    bindEvents();
    loadLiveData();
  }

  function initMap() {
    const qcVp = REGION_VIEWPORTS.quebec;
    state.map = L.map("map", {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      worldCopyJump: false
    }).setView(qcVp.center, qcVp.zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(state.map);

    state.condamLayer = new CondamLabelLayer({
      onVisibleChange: updateVisibleText,
      onSelect: openDetailDrawer
    });
    state.condamLayer.addTo(state.map);
  }

  function bindEvents() {
    // Locate button
    els.locateBtn.addEventListener("click", () => {
      if (state.userLocation) {
        state.map.setView([state.userLocation.lat, state.userLocation.lng], USER_LOCATION_ZOOM, { animate: true });
      } else {
        requestUserLocation();
      }
    });

    // Postal code toggle & submit
    els.postalToggleBtn.addEventListener("click", () => {
      els.postalPrompt.classList.toggle("is-hidden");
      if (!els.postalPrompt.classList.contains("is-hidden")) {
        els.postalInput.focus();
      }
    });

    els.postalPrompt.addEventListener("submit", handlePostalSubmit);

    // Search Input
    els.searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value.trim().toLowerCase();
      els.searchClearBtn.classList.toggle("is-visible", state.filters.search.length > 0);
      applyFilters();
    });

    els.searchClearBtn.addEventListener("click", () => {
      els.searchInput.value = "";
      state.filters.search = "";
      els.searchClearBtn.classList.remove("is-visible");
      applyFilters();
    });

    // Drawer close events
    els.drawerCloseBtn.addEventListener("click", closeDetailDrawer);
    els.drawerOverlay.addEventListener("click", (e) => {
      if (e.target === els.drawerOverlay) {
        closeDetailDrawer();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDetailDrawer();
        els.postalPrompt.classList.add("is-hidden");
      }
    });
  }

  // --- Live CSV Fetch & Processing ---

  async function loadLiveData() {
    setStatus("loadingLive", "loading");
    setLoading(true);

    try {
      // Load freshly directly from the URL with timestamp query param
      const liveUrlWithBust = `${LIVE_DATA_URL}?_t=${Date.now()}`;
      const response = await fetch(liveUrlWithBust, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} lors du téléchargement des données`);
      }

      const csvText = await response.text();
      const rows = parseCSV(csvText);
      state.allEstablishments = processCondamnationRows(rows);
      applyFilters();
      setStatus("dataReady", "ready");
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setStatus("dataError", "error");
    } finally {
      setLoading(false);
    }
  }

  // Robust CSV parser supporting quotes, commas, multiline strings, CRLF
  function parseCSV(text) {
    const clean = text.replace(/^\uFEFF/, ""); // Strip BOM if present
    const rows = [];
    let currentRow = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const nextChar = clean[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentField);
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] ? row[idx].trim() : "";
      });
      return obj;
    });
  }

  function processCondamnationRows(rows) {
    const postalRegex = /[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/;
    const groups = new Map();

    rows.forEach((row, index) => {
      const address = row.Adresse_lieu_infraction || "";
      const postalMatch = address.match(postalRegex);
      const postalCode = postalMatch ? postalMatch[0].replace(/\s+/g, "").toUpperCase() : "";
      
      const tradeName = row.Raison_sociale || "";
      const operatorName = row.Nom_exploitant || "";
      const name = tradeName || operatorName || "Établissement";
      
      // Grouping key: Normalized address + name
      const groupKey = `${address.toUpperCase().trim()}__${name.toUpperCase().trim()}`;

      const fineAmount = parseFine(row.Amende);
      const offenseType = categorizeOffense(row.SOC_NOM_ARTCL_INFRC, row.Description_infraction);
      const estCategory = categorizeEstablishment(row.Type_etablissement, row.SOC_DESC_REGRP_TYP_ENTT);

      const infractionObj = {
        id: `inf-${index}`,
        fineRaw: row.Amende || "0 $",
        fineAmount: fineAmount,
        dateInfraction: formatDate(row.Date_infraction),
        dateJudgement: formatDate(row.Date_jugement),
        datePublication: formatDate(row.Date_publication),
        lawCode: row.SOC_CD_LOI || "",
        lawName: row.SOC_NOM_LOI || "",
        reglCode: row.SOC_CD_REGL || "",
        reglName: row.SOC_NOM_REGL || "",
        articleCode: row.SOC_CD_ARTCL_INFRC || "",
        articleName: row.SOC_NOM_ARTCL_INFRC || "INFRACTION",
        prosecutor: row.SOC_DESC_POURS || "MAPAQ",
        description: row.Description_infraction || "",
        offenseCategory: offenseType
      };

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: `est-${groups.size + 1}`,
          name: name,
          tradeName: tradeName,
          operatorName: operatorName,
          address: address,
          postalCode: postalCode,
          type: row.Type_etablissement || "RESTAURANT",
          category: estCategory,
          information: row.Information_etablissement || "",
          infractions: [],
          totalFine: 0,
          lat: null,
          lng: null,
          distanceKm: null
        });
      }

      const est = groups.get(groupKey);
      est.infractions.push(infractionObj);
      est.totalFine += fineAmount;
      if (row.Information_etablissement && !est.information) {
        est.information = row.Information_etablissement;
      }
    });

    // Geocode and resolve coordinates for every establishment
    const establishments = Array.from(groups.values());
    const geoData = window.GEO_DATA || { postals: {}, fsas: {} };

    // Group establishments at the exact same point to add a slight visual jitter
    const locationCounts = new Map();

    establishments.forEach((est) => {
      let coords = null;
      if (est.postalCode && geoData.postals[est.postalCode]) {
        coords = geoData.postals[est.postalCode];
      } else if (est.postalCode && est.postalCode.length >= 3 && geoData.fsas[est.postalCode.slice(0, 3)]) {
        coords = geoData.fsas[est.postalCode.slice(0, 3)];
      } else if (est.address.toUpperCase().includes("MONTREAL")) {
        coords = [45.5017, -73.5673];
      } else if (est.address.toUpperCase().includes("QUEBEC")) {
        coords = [46.8139, -71.2180];
      } else {
        coords = [46.8139, -71.2180];
      }

      let lat = coords[0];
      let lng = coords[1];

      const locKey = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
      const count = locationCounts.get(locKey) || 0;
      locationCounts.set(locKey, count + 1);

      if (count > 0) {
        // Spiral dispersion jitter so multiple businesses on same spot don't hide each other
        const angle = count * 1.25;
        const dist = 0.0003 * Math.sqrt(count);
        lat += dist * Math.cos(angle);
        lng += dist * Math.sin(angle) * 1.4;
      }

      est.lat = lat;
      est.lng = lng;

      // Determine overall severity
      est.severity = getSeverityClass(est.totalFine);
      est.primaryOffense = est.infractions[0]?.articleName || "INFRACTION";
    });

    return establishments;
  }

  function parseFine(fineStr) {
    if (!fineStr) return 0;
    const clean = fineStr.replace(/[^\d.,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  }

  function formatDate(raw) {
    if (!raw) return "--";
    const parts = raw.split(" ")[0].split("/");
    if (parts.length === 3) {
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      return `${day}/${month}/${year}`;
    }
    return raw;
  }

  function categorizeOffense(articleName, description) {
    const text = `${articleName || ""} ${description || ""}`.toUpperCase();
    if (text.includes("INSALUBRITE") || text.includes("PROPRE")) return "insalubrite";
    if (text.includes("RONGEUR") || text.includes("INSECTE") || text.includes("EXCREMENT") || text.includes("ANIMAL")) {
      if (text.includes("BIEN-ETRE") || text.includes("GARDIEN")) return "animaux";
      return "rongeurs";
    }
    if (text.includes("TEMPERATURE") || text.includes("FROID") || text.includes("CHAUD") || text.includes("4°C") || text.includes("CONSERVATION")) return "temperature";
    if (text.includes("PERSONNEL") || text.includes("ONGLE") || text.includes("BARBE") || text.includes("VETEMENT") || text.includes("LAVAGE")) return "hygiene";
    if (text.includes("BIEN-ETRE") || text.includes("DETRESSE") || text.includes("ABRI")) return "animaux";
    return "other";
  }

  function categorizeEstablishment(typeStr, groupTypeStr) {
    const text = `${typeStr || ""} ${groupTypeStr || ""}`.toUpperCase();
    if (text.includes("RAPIDE") || text.includes("CASSE-CROUTE") || text.includes("EMPORTER") || text.includes("CAMION")) return "fastfood";
    if (text.includes("RESTAURANT") || text.includes("REST.") || text.includes("BAR") || text.includes("BUFFET")) return "restaurant";
    if (text.includes("EPICERIE") || text.includes("BOUCHERIE") || text.includes("MARCHE") || text.includes("SUPERMARCHE") || text.includes("HYPERMARCHE")) return "grocery";
    if (text.includes("BOULANGERIE") || text.includes("PATISSERIE")) return "bakery";
    return "other";
  }

  function getSeverityClass(fine) {
    if (fine < 1000) return "sev-low";
    if (fine < 2500) return "sev-mid";
    if (fine < 5000) return "sev-high";
    return "sev-crit";
  }

  // --- Search Filtering Logic ---

  function applyFilters() {
    const search = (state.filters.search || "").trim().toLowerCase();

    state.filteredEstablishments = state.allEstablishments.filter((est) => {
      if (!search) return true;
      const fullSearchable = `${est.name} ${est.operatorName} ${est.address} ${est.postalCode} ${est.type} ${est.infractions.map(i => `${i.articleName} ${i.description}`).join(" ")}`.toLowerCase();
      return fullSearchable.includes(search);
    });

    if (state.condamLayer) {
      state.condamLayer.setEstablishments(state.filteredEstablishments);
    }
  }

  // --- Geolocation & Navigation ---

  function requestUserLocation() {
    if (!("geolocation" in navigator)) {
      els.postalPrompt.classList.remove("is-hidden");
      return;
    }

    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
    }

    state.watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 12000 }
    );
  }

  function handleLocationSuccess(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    state.userLocation = {
      lat: latitude,
      lng: longitude,
      accuracy: accuracy || null
    };

    updateUserMarker(state.userLocation);
    updateDistances();
    state.map.setView([latitude, longitude], USER_LOCATION_ZOOM, { animate: true });
  }

  function handleLocationError() {
    els.postalPrompt.classList.remove("is-hidden");
  }

  function handlePostalSubmit(e) {
    e.preventDefault();
    const raw = els.postalInput.value.replace(/\s+/g, "").toUpperCase();
    if (raw.length < 3) {
      els.postalError.textContent = t("postalNeedCode");
      return;
    }

    const geoData = window.GEO_DATA || { postals: {}, fsas: {} };
    let coords = geoData.postals[raw] || geoData.fsas[raw.slice(0, 3)];

    if (!coords) {
      els.postalError.textContent = t("postalNotFound");
      return;
    }

    els.postalError.textContent = "";
    els.postalPrompt.classList.add("is-hidden");

    state.userLocation = {
      lat: coords[0],
      lng: coords[1],
      accuracy: 2500,
      source: "postal"
    };

    updateUserMarker(state.userLocation);
    updateDistances();
    state.map.setView(coords, USER_LOCATION_ZOOM, { animate: true });
  }

  function updateUserMarker(loc) {
    const latLng = [loc.lat, loc.lng];
    const icon = L.divIcon({
      className: "",
      html: `<div class="user-marker-pin${loc.source === "postal" ? " estimated" : ""}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    if (!state.userMarker) {
      state.userMarker = L.marker(latLng, { interactive: false, icon, zIndexOffset: 1000 }).addTo(state.map);
    } else {
      state.userMarker.setLatLng(latLng);
      state.userMarker.setIcon(icon);
    }

    if (loc.accuracy) {
      if (!state.accuracyCircle) {
        state.accuracyCircle = L.circle(latLng, {
          radius: loc.accuracy,
          interactive: false,
          stroke: false,
          fillColor: "#0284c7",
          fillOpacity: 0.12
        }).addTo(state.map);
      } else {
        state.accuracyCircle.setLatLng(latLng);
        state.accuracyCircle.setRadius(loc.accuracy);
      }
    }
  }

  function updateDistances() {
    if (!state.userLocation) return;
    const { lat, lng } = state.userLocation;
    state.allEstablishments.forEach((est) => {
      est.distanceKm = haversineKm(lat, lng, est.lat, est.lng);
    });
    if (state.condamLayer) {
      state.condamLayer.requestRender();
    }
  }

  // --- Detail Drawer / Modal ---

  function openDetailDrawer(est) {
    state.selectedId = est.id;
    els.drawerType.textContent = est.type;
    els.drawerTitle.textContent = est.name;
    els.drawerOperator.textContent = est.operatorName ? `Exploitant : ${est.operatorName}` : "";

    if (est.information) {
      els.drawerInfoBanner.style.display = "flex";
      els.drawerInfoText.textContent = est.information;
    } else {
      els.drawerInfoBanner.style.display = "none";
    }

    els.drawerAddress.textContent = est.address;
    els.drawerNavBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(est.address)}&travelmode=driving`;

    els.drawerTotalFine.textContent = formatCurrency(est.totalFine);
    els.drawerOffenseCount.textContent = est.infractions.length;

    // Render individual infractions
    els.drawerCondamList.innerHTML = "";
    est.infractions.forEach((inf, idx) => {
      const item = document.createElement("div");
      item.className = "condam-item-card";

      const sevClass = getSeverityClass(inf.fineAmount);

      item.innerHTML = `
        <div class="condam-item-header">
          <span class="condam-article-badge">#${idx + 1} • ${inf.articleName}</span>
          <span class="condam-fine-amount">${formatCurrency(inf.fineAmount)}</span>
        </div>
        <div class="condam-item-body">
          <div class="condam-meta-grid">
            <div class="meta-field">
              <span class="meta-title">${t("dateInfraction")}</span>
              <span class="meta-val">${inf.dateInfraction}</span>
            </div>
            <div class="meta-field">
              <span class="meta-title">${t("dateJudgement")}</span>
              <span class="meta-val">${inf.dateJudgement}</span>
            </div>
            <div class="meta-field">
              <span class="meta-title">${t("datePublication")}</span>
              <span class="meta-val">${inf.datePublication}</span>
            </div>
          </div>

          <div class="condam-law-info">
            <strong>${t("lawLabel")} :</strong> ${inf.lawCode} ${inf.lawName ? `(${inf.lawName})` : ""}
            ${inf.reglCode ? `<br><strong>Règlement :</strong> ${inf.reglCode} ${inf.reglName}` : ""}
            ${inf.articleCode ? `<br><strong>Article :</strong> ${inf.articleCode}` : ""}
          </div>

          <div class="condam-desc-box">
            <div class="condam-desc-title">${t("descTitle")}</div>
            <div>${escapeHtml(inf.description)}</div>
          </div>

          <div class="condam-prosecutor">
            <span>🏛️</span> <span>${t("prosecutorLabel")} : ${inf.prosecutor}</span>
          </div>
        </div>
      `;
      els.drawerCondamList.appendChild(item);
    });

    els.drawerOverlay.classList.add("is-open");
    els.drawerOverlay.setAttribute("aria-hidden", "false");
  }

  function closeDetailDrawer() {
    els.drawerOverlay.classList.remove("is-open");
    els.drawerOverlay.setAttribute("aria-hidden", "true");
    state.selectedId = null;
    if (state.condamLayer) {
      state.condamLayer.requestRender();
    }
  }

  // --- High Performance Leaflet Layer ---

  class CondamLabelLayer extends L.Layer {
    constructor(options) {
      super();
      this.options = options;
      this.establishments = [];
      this.container = null;
      this.renderFrame = 0;
      this.visibleCount = 0;
      this.totalCount = 0;
      this.handleMapUpdate = this.requestRender.bind(this);
      this.handleClick = this.handleClick.bind(this);
    }

    onAdd(map) {
      this.map = map;
      this.container = L.DomUtil.create("div", "condam-label-layer");
      this.pane = map.getPane("condamLabelPane") || map.createPane("condamLabelPane");
      this.pane.classList.add("condam-label-pane");
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

    setEstablishments(establishments) {
      this.establishments = establishments;
      this.totalCount = establishments.length;
      this.requestRender();
    }

    requestRender() {
      if (!this.map || !this.container || this.renderFrame) return;
      this.renderFrame = requestAnimationFrame(() => {
        this.renderFrame = 0;
        this.render();
      });
    }

    render() {
      if (!this.map || !this.container) return;

      const size = this.map.getSize();
      const zoom = this.map.getZoom();
      const bounds = this.map.getBounds().pad(0.1);
      const cardSize = getCardDimensions();
      const maxCards = getMaxCardsPerZoom(zoom, size.x);
      const center = this.map.getCenter();

      this.container.style.width = `${size.x}px`;
      this.container.style.height = `${size.y}px`;

      const candidates = this.establishments
        .filter((est) => bounds.contains([est.lat, est.lng]))
        .map((est) => ({
          est,
          containerPoint: this.map.latLngToContainerPoint([est.lat, est.lng]),
          layerPoint: this.map.latLngToLayerPoint([est.lat, est.lng]),
          priority: Number.isFinite(est.distanceKm)
            ? est.distanceKm
            : haversineKm(center.lat, center.lng, est.lat, est.lng)
        }))
        .sort((a, b) => a.priority - b.priority);

      const accepted = [];
      const collision = new CollisionGrid(80);

      for (const cand of candidates) {
        if (accepted.length >= maxCards) break;

        const rect = {
          left: cand.containerPoint.x - cardSize.width / 2,
          right: cand.containerPoint.x + cardSize.width / 2,
          top: cand.containerPoint.y - cardSize.height - 12,
          bottom: cand.containerPoint.y - 2
        };

        if (rect.right < 0 || rect.left > size.x || rect.bottom < 0 || rect.top > size.y) {
          continue;
        }

        if (collision.hasCollision(rect)) {
          continue;
        }

        collision.insert(rect);
        accepted.push(cand);
      }

      const fragment = document.createDocumentFragment();
      const acceptedIds = new Set(accepted.map(({ est }) => est.id));

      // 1. Render all candidate points (dot markers)
      candidates.forEach(({ est, layerPoint }) => {
        fragment.appendChild(renderPointDot(est, layerPoint, acceptedIds.has(est.id)));
      });

      // 2. Render accepted rich card labels
      accepted.forEach(({ est, layerPoint }) => {
        fragment.appendChild(renderCardLabel(est, layerPoint, est.id === state.selectedId));
      });

      // 3. If selected establishment is in viewport but collision culled, force render its card
      if (state.selectedId && !acceptedIds.has(state.selectedId)) {
        const selected = candidates.find(({ est }) => est.id === state.selectedId);
        if (selected) {
          fragment.appendChild(renderCardLabel(selected.est, selected.layerPoint, true));
        }
      }

      this.container.replaceChildren(fragment);
      this.visibleCount = candidates.length;
      this.options.onVisibleChange?.(candidates.length, this.totalCount);
    }

    handleClick(e) {
      const card = e.target.closest("[data-est-id]");
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        const estId = card.dataset.estId;
        const est = this.establishments.find((candidate) => candidate.id === estId);
        if (est) {
          this.options.onSelect?.(est);
        }
      }
    }
  }

  // --- HTML Elements Renderers ---

  function renderPointDot(est, point, hasLabel) {
    const dot = document.createElement("button");
    dot.className = `condam-point ${est.severity}${hasLabel ? " has-label" : ""}`;
    dot.type = "button";
    dot.dataset.estId = est.id;
    dot.style.left = `${point.x}px`;
    dot.style.top = `${point.y}px`;
    dot.setAttribute("aria-label", `${est.name} - ${formatCurrency(est.totalFine)}`);
    dot.title = `${est.name} (${formatCurrency(est.totalFine)})`;
    return dot;
  }

  function renderCardLabel(est, point, isSelected) {
    const card = document.createElement("article");
    card.className = `condam-card-label${isSelected ? " is-selected" : ""}`;
    card.style.left = `${point.x}px`;
    card.style.top = `${point.y}px`;
    card.dataset.estId = est.id;

    const count = est.infractions.length;
    const countLabel = count > 1 ? t("infractionPlural", { count }) : t("infractionSingular");

    card.innerHTML = `
      <div class="card-top-row">
        <span class="card-type-tag">${est.type}</span>
        <span class="card-count-badge">${countLabel}</span>
      </div>
      <div class="card-title" title="${escapeHtml(est.name)}">${escapeHtml(est.name)}</div>
      <div class="card-offense-pill ${est.severity}">
        <span class="card-offense-name">${est.primaryOffense}</span>
        <span class="card-offense-fine">${formatCurrency(est.totalFine)}</span>
      </div>
      <div class="card-bottom-row">
        <span class="card-distance">${formatDistance(est.distanceKm)}</span>
        <button class="card-details-btn" type="button">${t("detailsBtn")} ➔</button>
      </div>
    `;

    return card;
  }

  // --- Collision Grid & Math Utilities ---

  class CollisionGrid {
    constructor(cellSize) {
      this.cellSize = cellSize;
      this.cells = new Map();
    }

    hasCollision(rect) {
      const keys = this.keysForRect(rect);
      return keys.some((k) => (this.cells.get(k) || []).some((c) => intersects(rect, c)));
    }

    insert(rect) {
      this.keysForRect(rect).forEach((k) => {
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k).push(rect);
      });
    }

    keysForRect(rect) {
      const keys = [];
      const left = Math.floor(rect.left / this.cellSize);
      const right = Math.floor(rect.right / this.cellSize);
      const top = Math.floor(rect.top / this.cellSize);
      const bottom = Math.floor(rect.bottom / this.cellSize);

      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          keys.push(`${x}:${y}`);
        }
      }
      return keys;
    }
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function getCardDimensions() {
    return window.innerWidth < 768 ? { width: 144, height: 80 } : { width: 154, height: 84 };
  }

  function getMaxCardsPerZoom(zoom, width) {
    const desktopFactor = width >= 768 ? 1.4 : 1;
    if (zoom < 8) return Math.round(30 * desktopFactor);
    if (zoom < 11) return Math.round(80 * desktopFactor);
    if (zoom < 13) return Math.round(180 * desktopFactor);
    if (zoom < 15) return Math.round(320 * desktopFactor);
    return Math.round(500 * desktopFactor);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0
    }).format(val);
  }

  function formatDistance(distKm) {
    if (!Number.isFinite(distKm)) return t("unknownDist");
    return distKm < 10 ? `${distKm.toFixed(1)} km` : `${Math.round(distKm)} km`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- Translation & Status Functions ---

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.setAttribute("placeholder", t(key));
    });
  }

  function setStatus(key, type = "ready") {
    state.statusKey = key;
    if (els.statusText) {
      els.statusText.textContent = t(key);
    }
    if (els.statusDot) {
      els.statusDot.className = `status-dot ${type}`;
    }
  }

  function setLoading(isLoading) {
    els.loadingOverlay.classList.toggle("is-hidden", !isLoading);
    els.loadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  }

  function updateVisibleText(visible, total) {
    if (els.visibleCountText) {
      els.visibleCountText.textContent = t("visibleCount", { visible, total });
    }
  }

  function t(key, values = {}) {
    let text = I18N[key] || key;
    Object.entries(values).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
    return text;
  }
})();
