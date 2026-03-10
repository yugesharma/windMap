const map = L.map('map', { preferCanvas: true }).setView([34, -72], 6);
map.createPane('label');
map.getPane('label').style.zIndex = 1000;
var tables = "";
const drawnItems = new L.FeatureGroup();


map.createPane('windArrows');
map.getPane('windArrows').style.zIndex = 450;
map.getPane('windArrows').style.pointerEvents = 'none';

let currentDisplayData = []; 
let polyline;

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0');
var yyyy = today.getFullYear();
today = yyyy + '-' + mm + '-' + dd;

var endDateformat = new Date(new Date().setDate(new Date().getDate() + 6));
var year = endDateformat.getFullYear();
var month = (endDateformat.getMonth() + 1).toString().padStart(2, '0');
var day = endDateformat.getDate().toString().padStart(2, '0');
var endDate = year + '-' + month + '-' + day;
var dateRangeData = {};
var availableDates = [];
var forecastFeatures = [];
var dateFeatureMap = {};
let bgWarmGeneration = 0;
const loadingIndicator = document.getElementById('loadingIndicator');
const dateSlider = document.getElementById("dateslider");
const play = document.getElementById("play");
const resetRouteBtn = document.getElementById("resetRoute");
const selectedDateLabel = document.getElementById("selectedDate");

const oapiKey = '5431cea4928259758e577c8cd26f641d';

function toDMS(lat, lng) {
  const toDMS = coord => {
    min = ~~(minA = ((a = Math.abs(coord)) - (deg = ~~a)) * 60);
    return deg + "° " + min + "' " + Math.ceil((minA - min) * 60) + '"';
  };
  return ` ${toDMS(lat)} ${lat >= 0 ? "N" : "S"} / ${toDMS(lng)} ${lng >= 0 ? "E" : "W"}`;
}

function fetchWindData(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${oapiKey}`;
  return fetch(apiUrl)
    .then(response => response.json())
    .catch(error => console.error('Error fetching wind data:', error));
}

fetch('ocean.geojson')
  .then(response => response.json())
  .then(data => {
    const geoJsonLayer = L.geoJSON(data).addTo(map);
    geoJsonLayer.setStyle({ color: '#94b6ef', weight: 1, fillOpacity: 1 });
  })
  .catch(error => console.error('Error loading ocean GeoJSON:', error));

async function buildFeatureData(date) {
  const featuresForDate = dateFeatureMap[date] || [];
  const zoom = map.getZoom();
  let sampleMod;
  if (zoom <= 3) sampleMod = 20;
  else if (zoom <= 4) sampleMod = 10;
  else if (zoom <= 5) sampleMod = 4;
  else if (zoom <= 6) sampleMod = 2;
  else sampleMod = 1;

  const useBoundsCulling = zoom > 6;
  const bounds = useBoundsCulling ? map.getBounds() : null;

  const data = [];
  for (let i = 0; i < featuresForDate.length; i++) {
    const feature = featuresForDate[i];
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;

    const lat = parseFloat(coords[1]);
    const lon = parseFloat(coords[0]);
    const props = feature.properties || {};
    const speed = parseFloat(props.WS);
    const dir = parseFloat(props.WD);

    if (isNaN(lat) || isNaN(lon) || isNaN(speed) || isNaN(dir)) continue;

    if (sampleMod > 1) {
      const latKey = Math.round((lat + 90) * 100);
      const lonKey = Math.round((lon + 180) * 100);
      const hash = Math.abs((latKey * 73856093) ^ (lonKey * 19349663));
      if (hash % sampleMod !== 0) continue;
    }

    if (useBoundsCulling && !bounds.contains([lat, lon])) continue;

    data.push({ lat, lon, dir, speed });
  }
  return data;
}

function renderWindArrows(data) {
  const pane = map.getPane('windArrows');
  if (!data || data.length === 0) { pane.innerHTML = ''; return; }
  const parts = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const { lat, lon, dir, speed } = data[i];
    const pt = map.latLngToLayerPoint([lat, lon]);
    parts[i] = `<div style="position:absolute;left:${pt.x}px;top:${pt.y}px;transform:translate(-50%,-50%) rotate(${dir}deg);font-size:10px;color:${getColor(speed)};opacity:0.8"><i class="fas fa-arrow-up"></i></div>`;
  }
  pane.innerHTML = parts.join('');
}

async function preloadData() {
  const geojson = await fetch('forecast.geojson').then(r => r.json());
  forecastFeatures = Array.isArray(geojson.features) ? geojson.features : [];
  dateFeatureMap = {};

  const datesSet = new Set();
  for (let i = 0; i < forecastFeatures.length; i++) {
    const props = forecastFeatures[i]?.properties || {};
    const dateOnly = props.date || (props.time ? String(props.time).split(' ')[0] : null);
    if (dateOnly) {
      datesSet.add(dateOnly);
      if (!dateFeatureMap[dateOnly]) dateFeatureMap[dateOnly] = [];
      dateFeatureMap[dateOnly].push(forecastFeatures[i]);
    }
  }
  availableDates = Array.from(datesSet).sort();

  if (availableDates.length > 0) {
    if (!availableDates.includes(today)) {
      today = availableDates[0];
      console.log('Using first available date in GeoJSON:', today);
    }
    endDate = availableDates[availableDates.length - 1];
  }

  const result = {};
  result[today] = await buildFeatureData(today);
  return result;
}

function updateSliderAndDate(date) {
  const dateIndex = availableDates.indexOf(date);
  if (dateIndex !== -1) {
    dateSlider.value = dateIndex;
    selectedDateLabel.textContent = date;
  }
}

function updateWind(selectedDate) {
  selectedDateLabel.textContent = selectedDate;

  if (dateRangeData[selectedDate] && dateRangeData[selectedDate].length > 0) {
    displayMarkers(dateRangeData[selectedDate]);
    return;
  }

  loadingIndicator.style.display = 'block';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      buildFeatureData(selectedDate).then(function (data) {
        dateRangeData[selectedDate] = data;
        displayMarkers(data);
      });
    });
  });
}

function animate(date, delay) {
  setTimeout(function () {
    updateSliderAndDate(date);
    updateWind(date);
  }, delay);
}

function displayMarkers(data) {
  currentDisplayData = data;
  loadingIndicator.style.display = 'none';
  renderWindArrows(data);
}

selectedDateLabel.textContent = 'Loading…';

preloadData().then(data => {
  dateRangeData = data;
  dateSlider.value = 0;
  dateSlider.max = availableDates.length - 1;

  updateWind(today);


  async function backgroundWarmDates(dates, generation) {
    for (const d of dates) {
      if (bgWarmGeneration !== generation) return;
      if (!dateRangeData[d]) {
        dateRangeData[d] = await buildFeatureData(d);
      }
      await new Promise(r => setTimeout(r, 30));
    }
  }

  const otherDates = availableDates.filter(d => d !== today);
  bgWarmGeneration++;
  backgroundWarmDates(otherDates, bgWarmGeneration);

  let sliderDebounce;
  dateSlider.addEventListener("input", function () {
    const sliderIndex = parseInt(dateSlider.value);
    if (sliderIndex < availableDates.length) {
      const formattedDate = availableDates[sliderIndex];
      selectedDateLabel.textContent = formattedDate;
      clearTimeout(sliderDebounce);
      sliderDebounce = setTimeout(function () {
        updateWind(formattedDate);
      }, 150);
    }
  });

  function invalidateAndRefresh() {
    const sliderIndex = parseInt(dateSlider.value);
    if (sliderIndex >= availableDates.length) return;
    const formattedDate = availableDates[sliderIndex];
    bgWarmGeneration++; 
    delete dateRangeData[formattedDate];
    updateWind(formattedDate);
  }

  let viewChangeTimeout;

  map.on('zoomend', function () {
    console.log('Current zoom level:', map.getZoom());
    clearTimeout(viewChangeTimeout);
    viewChangeTimeout = setTimeout(invalidateAndRefresh, 300);
  });

  map.on('moveend', function () {
    if (currentDisplayData.length > 0) {
      renderWindArrows(currentDisplayData);
    }
    if (map.getZoom() > 6) {
      clearTimeout(viewChangeTimeout);
      viewChangeTimeout = setTimeout(invalidateAndRefresh, 400);
    }
  });

  play.onclick = function () {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    for (let i = 0; i < availableDates.length; i++) {
      animate(availableDates[i], i * 800);
    }
    setTimeout(function () {
      loader.style.display = 'none';
    }, (availableDates.length - 1) * 800);
  };
});

map.on('click', function (e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  fetchWindData(lat, lng).then(data => {
    const windSpeed = Math.round(1.944 * data.wind.speed * 100) / 100;
    const windDirection = data.wind.deg;
    tables += "<tr>" +
      "<td class='position'>" + toDMS(lat, lng) + "</td>" +
      "<td class='windSpeed'>" + windSpeed + "</td>" +
      "<td class='windDirection'>" + windDirection + "°" + "</td>" +
      "</tr>";
    document.getElementById("selected").innerHTML = tables;
  });

  L.marker([lat, lng], { pane: 'label' }).addTo(drawnItems);

  if (polyline) map.removeLayer(polyline);

  polyline = L.polyline([], { className: 'line', color: 'white', weight: 3, pane: 'label' }).addTo(map);
  polyline.bringToFront();
  polyline.setLatLngs(drawnItems.getLayers().map(layer => layer.getLatLng()));
});

function getColor(speed) {
  if (speed < 5) return 'green';
  if (speed < 10) return '#ffcc00';
  return 'red';
}

if (resetRouteBtn) {
  resetRouteBtn.addEventListener('click', function () {
    drawnItems.clearLayers();
    if (polyline) {
      map.removeLayer(polyline);
      polyline = null;
    }
    tables = "";
    const selectedTable = document.getElementById("selected");
    if (selectedTable) selectedTable.innerHTML = "";
  });
}

map.addLayer(drawnItems);
drawnItems.bringToFront();

fetch('countries.geojson')
  .then(response => response.json())
  .then(data => {
    const geoJsonLayer = L.geoJSON(data, { pane: 'label' }).addTo(map);
    geoJsonLayer.setStyle({ color: '#dea450', weight: 1, fillOpacity: 1 });
  })
  .catch(error => console.error('Error loading countries GeoJSON:', error));
