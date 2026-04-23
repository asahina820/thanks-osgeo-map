// ---- Map ----
const map = new maplibregl.Map({
  container: "map",
  style: "https://tile.openstreetmap.jp/styles/maptiler-basic-en/style.json",
  center: [137, 37],
  zoom: 2,
});

map.addControl(new maplibregl.NavigationControl(), "bottom-right");

// ---- Items layer ----
async function loadItemsLayer() {
  let items = [];
  try {
    const res = await fetch(`${CONFIG.backendUrl}/items`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    items = json.data?.items ?? [];
  } catch (e) {
    console.error("Failed to load items:", e);
  }

  const features = items
    .map((item) => {
      const fields = Object.fromEntries(item.fields.map((f) => [f.key, f.value]));
      const rawLocation = fields["location"];
      const location = typeof rawLocation === "string" ? JSON.parse(rawLocation) : rawLocation;
      if (!location?.coordinates) return null;
      return {
        type: "Feature",
        geometry: location,
        properties: {
          nickname: fields["nickname"] ?? "",
          country: fields["country"] ?? "",
          favorite: fields["your-favorite-foss4g"] ?? "",
          comment: fields["comment"] ?? "",
        },
      };
    })
    .filter(Boolean);

  const geojson = { type: "FeatureCollection", features };

  if (map.getSource("items")) {
    map.getSource("items").setData(geojson);
    return;
  }

  map.addSource("items", { type: "geojson", data: geojson });

  map.addLayer({
    id: "items-circles",
    type: "circle",
    source: "items",
    paint: {
      "circle-radius": 8,
      "circle-color": "#4caf50",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
      "circle-opacity": 0.85,
    },
  });

  map.on("click", "items-circles", (e) => {
    if (pickingLocation) return;
    const { nickname, country, favorite, comment } = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates;
    const favoriteHtml = favorite ? `<p class="popup-favorite">${favorite}</p>` : "";
    new maplibregl.Popup({ maxWidth: "280px" })
      .setLngLat(coords)
      .setHTML(
        `<div class="popup-body">
          <p class="popup-name">${nickname} <span class="popup-country">${country}</span></p>
          ${favoriteHtml}
          <p class="popup-comment">${comment}</p>
        </div>`
      )
      .addTo(map);
  });

  map.on("mouseenter", "items-circles", () => {
    if (!pickingLocation) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "items-circles", () => {
    if (!pickingLocation) map.getCanvas().style.cursor = "";
  });
}

map.on("load", loadItemsLayer);

// ---- State ----
let pickingLocation = false;

// ---- Country list (REST Countries API) ----
async function populateCountries() {
  const sel = document.getElementById("country");
  sel.disabled = true;
  sel.innerHTML = '<option value="">Loading…</option>';

  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const names = data
      .map((c) => c.name.common)
      .sort((a, b) => a.localeCompare(b));

    sel.innerHTML = '<option value="">— Select country —</option>';
    names.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (name === "Japan") opt.selected = true;
      sel.appendChild(opt);
    });
  } catch {
    sel.innerHTML = '<option value="">Failed to load — refresh to retry</option>';
  } finally {
    sel.disabled = false;
  }
}

populateCountries();

// ---- Pick location toggle ----
document.getElementById("pickBtn").addEventListener("click", togglePick);

function togglePick() {
  if (pickingLocation) {
    pickingLocation = false;
    onPickingCancelled();
  } else {
    pickingLocation = true;
    onPickingStarted();
  }
}

function onPickingStarted() {
  document.getElementById("pickBtn").classList.add("picking");
  document.getElementById("pickIcon").textContent = "⏹";
  document.getElementById("pickLabel").textContent = "Cancel";
  document.getElementById("pickHint").classList.add("visible");
  document.getElementById("map").classList.add("map-picking");
}

function onPickingCancelled() {
  document.getElementById("pickBtn").classList.remove("picking");
  document.getElementById("pickIcon").textContent = "📍";
  document.getElementById("pickLabel").textContent = "Pick from map";
  document.getElementById("pickHint").classList.remove("visible");
  document.getElementById("map").classList.remove("map-picking");
}

// ---- Map click → set location ----
map.on("click", (e) => {
  if (!pickingLocation) return;
  pickingLocation = false;

  const { lng, lat } = e.lngLat;
  const lngVal = lng.toFixed(5);
  const latVal = lat.toFixed(5);

  document.getElementById("lng").value = lngVal;
  document.getElementById("lat").value = latVal;

  onPickingCancelled();
  document.getElementById("pickIcon").textContent = "✅";
  document.getElementById("pickLabel").textContent =
    "Location set — pick again";

  const disp = document.getElementById("coordsDisplay");
  disp.textContent = lngVal + ", " + latVal;
  disp.classList.add("visible");

  addOrUpdateMarker(lng, lat);
});

// ---- Pin layer ----
function addOrUpdateMarker(lng, lat) {
  const geojson = {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: {} }],
  };

  if (map.getSource("pin")) {
    map.getSource("pin").setData(geojson);
    return;
  }

  map.addSource("pin", { type: "geojson", data: geojson });
  map.addLayer({
    id: "pin-layer",
    type: "circle",
    source: "pin",
    paint: {
      "circle-radius": 10,
      "circle-color": "#4caf50",
      "circle-stroke-width": 3,
      "circle-stroke-color": "#fff",
      "circle-pitch-alignment": "map",
    },
  });
}

// ---- Submit ----
document.getElementById("submitBtn").addEventListener("click", handleSubmit);

async function handleSubmit() {
  const nickname = document.getElementById("nickname").value.trim();
  const country = document.getElementById("country").value.trim();
  const favorite = document.getElementById("favorite").value.trim();
  const comment = document.getElementById("comment").value.trim();
  const lng = document.getElementById("lng").value;
  const lat = document.getElementById("lat").value;
  const status = document.getElementById("statusMsg");

  status.className = "status";
  status.textContent = "";

  if (!nickname || !country || !comment || !lng || !lat) {
    status.className = "status error";
    status.textContent =
      "Please fill in all required fields including a map location.";
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Sending…";

  try {
    const res = await fetch(`${CONFIG.backendUrl}/items`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: [
          { key: "nickname", type: "text", value: nickname },
          { key: "country", type: "text", value: country },
          { key: "your-favorite-foss4g", type: "text", value: favorite },
          { key: "comment", type: "textArea", value: comment },
          {
            key: "location",
            type: "geometryObject",
            value: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    await res.json();
    status.className = "status success";
    status.textContent = "Your message has been added to the map!";
    loadItemsLayer();
  } catch (e) {
    console.error("Submit failed:", e);
    status.className = "status error";
    status.textContent = "Something went wrong. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Message";
  }
}
