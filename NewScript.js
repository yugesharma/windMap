const map = L.map('map').setView([34, -72], 6);
map.createPane('label');
map.getPane('label').style.zIndex = 1000;
var tables="";
const drawnItems = new L.FeatureGroup();
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
var availableDates = []; // Store dates found in CSV


const oapiKey = '5431cea4928259758e577c8cd26f641d';

// Function to convert coordinates to DMS
function toDMS(lat,lng) {
    const toDMS=coord=>{min=~~(minA=((a=Math.abs(coord))-(deg=~~a))*60);
    return deg+"° "+min+"' "+Math.ceil((minA-min)*60)+'"';
    };
    var cord= ` ${toDMS(lat)} ${lat>=0?"N":"S"} / ${toDMS(lng)} ${lng>=0?"E":"W"}`;
    return cord;
    }

//real time wind data for co-ordinates
function fetchWindData(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${oapiKey}`;
  return fetch(apiUrl)
    .then(response => response.json())
    .catch(error => {
      console.error('Error fetching wind data:', error);
    });
}

fetch('ocean.geojson')
  .then(response => response.json())
  .then(data => {
    const geoJsonLayer = L.geoJSON(data).addTo(map);
    geoJsonLayer.setStyle({
      color: '#94b6ef',
      weight: 1,
      fillOpacity: 1,
    });
  })
  .catch(error => {
    console.error('Error loading GeoJSON data:', error);
  });

  

  async function fetchWindDataForDate(date) {
    const data = await fetch('final.csv').then((response) => response.text());
    const rows = data.split('\n');
    const markers = [];
    
    // Adjust sampling rate based on zoom level
    const zoom = map.getZoom();
    let step;
    if (zoom <= 4) step = 4;
    else if (zoom <= 5) step = 3;
    else step = 2;
  
    for (let i = 1; i < rows.length - 1; i += step) {
      const row = rows[i].split(',');
      const time = row[0];
      if (time.includes(date)) {
        const latitude = parseFloat(row[1]);
        const longitude = parseFloat(row[2]);
        const windSpeed = parseFloat(row[6]);
        const windDirection = parseFloat(row[7]);
  
        const arrowIcon = L.divIcon({
          className: 'wind-arrow-icon',
          iconSize: [10, 10],
          html: '<div style="transform: rotate(' + windDirection + 'deg)"><i class="fas fa-arrow-up" style="color: ' + getColor(windSpeed) + ';"></i></div>'
        });
  
        const marker = L.marker([latitude, longitude], { icon: arrowIcon, markerType: 'wind' });
        markers.push(marker);
      }
    }
  
    return markers;
  }
  
  async function preloadData() {
    const data = await fetch('final.csv').then((response) => response.text());
    const rows = data.split('\n');
    
    // Extract unique dates from CSV
    const datesSet = new Set();
    for (let i = 1; i < rows.length - 1; i++) {
      const row = rows[i].split(',');
      const time = row[0];
      if (time) {
        const dateOnly = time.split(' ')[0];
        datesSet.add(dateOnly);
      }
    }
    availableDates = Array.from(datesSet).sort();
    
    // If no dates match today, use the first available date
    if (availableDates.length > 0) {
      if (!availableDates.includes(today)) {
        today = availableDates[0];
        console.log('Using first available date in CSV:', today);
      }
      
      // Update endDate based on available data
      if (availableDates.length > 0) {
        endDate = availableDates[availableDates.length - 1];
      }
    }
  
    const dateRangeData = {};
  
    // Load data for all available dates
    for (const date of availableDates) {
      dateRangeData[date] = await fetchWindDataForDate(date);
    }
    
    return dateRangeData;
    
  }

  function updateSliderAndDate(date) {
    // Find the index of the date in available dates
    const dateIndex = availableDates.indexOf(date);
    if (dateIndex !== -1) {
      dateSlider.value = dateIndex;
      selectedDate.textContent = date;
    }
  }


// Function for showing wind markers updated by date slider or play button
function updateWind(selectedDate) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.style.display = 'block';
  // Clear cache on zoom level change to refetch with new sampling rate
  fetchWindDataForDate(selectedDate).then((markers) => {
    dateRangeData[selectedDate] = markers;
    displayMarkers(markers);
  });
}

//animate wind data display
function animate(date, delay) {
  setTimeout(function(){
    updateSliderAndDate(date);
    updateWind(date);
  }, delay);
}

// Display markers on the map
function displayMarkers(markers) {
  // Clear existing markers from the map
  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker && layer.options.markerType=='wind') {
      map.removeLayer(layer);
    }
  });
  loadingIndicator.style.display = 'none';

  // Add the new markers to the map
  markers.forEach((marker) => marker.addTo(map));
}

// Initial data preload
preloadData().then(data => {
  dateRangeData = data;
  updateWind(today);
  
  // Initialize slider after data is loaded
  const dateSlider = document.getElementById("dateslider");
  const play = document.getElementById("play"); 
  const selectedDate = document.getElementById("selectedDate");
  document.getElementById("selectedDate").defaultValue = today;
  dateSlider.value = 0; 
  dateSlider.max = availableDates.length - 1; // Set max based on available dates
  selectedDate.textContent = today;

  dateSlider.addEventListener("input", function () {
    // Handle slider value changes using available dates
    const sliderIndex = parseInt(dateSlider.value);
    if (sliderIndex < availableDates.length) {
      const formattedDate = availableDates[sliderIndex];
      selectedDate.textContent = formattedDate;
      updateWind(formattedDate);
    }
  });
  
  // Add zoom event listener to refresh markers with appropriate density
  let zoomTimeout;
  map.on('zoomend', function() {
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(function() {
      const sliderIndex = parseInt(dateSlider.value);
      if (sliderIndex < availableDates.length) {
        const formattedDate = availableDates[sliderIndex];
        updateWind(formattedDate);
      }
    }, 300); // Debounce to avoid too many refreshes during zoom
  });

  play.onclick = function(){
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    for (let i = 0; i < availableDates.length; i++) {
      animate(availableDates[i], i * 800);
    }
    setTimeout(function() {
      loader.style.display = 'none';
    }, (availableDates.length - 1) * 800);
  };
});

//event handler for showing real time wind data for co-ordinates selected on the map
map.on('click', function (e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  fetchWindData(lat, lng).then(data => {
    const windSpeed = Math.round(1.944*data.wind.speed*100)/100;
    const windDirection = data.wind.deg;
    tables+="<tr>"+
    "<td class='position' >"+ toDMS(lat, lng) +"</td>"+
    "<td class='windSpeed'>"+ windSpeed +"</td>"+
    "<td class='windDirection'>"+ windDirection+"°"+"</td>"
    +"</tr>"
    document.getElementById("selected").innerHTML=tables;
   });

  L.marker([lat, lng], {pane: 'label'}).addTo(drawnItems);

  if (polyline) {
    map.removeLayer(polyline);
  }

  polyline = L.polyline([], { className: 'line', color: 'white', weight: 3, pane: 'label' }).addTo(map);
  polyline.bringToFront();

  const coordinates = drawnItems.getLayers().map(layer => layer.getLatLng());
  polyline.setLatLngs(coordinates);
});

function getColor(speed) {
  if (speed < 5) {
    return 'green';
  } else if (speed < 10) {
    return '#ffcc00';
  } else {
    return 'red';
  }
}
map.addLayer(drawnItems);
drawnItems.bringToFront();

//layer for land features to hide data from appearing on the land
fetch('countries.geojson')
  .then(response => response.json())
  .then(data => {
    const geoJsonLayer = L.geoJSON(data, { pane: 'label' }).addTo(map);
    geoJsonLayer.setStyle({
      color: '#dea450',
      weight: 1,
      fillOpacity: 1,
    });
  })
  .catch(error => {
    console.error('Error loading GeoJSON data:', error);
  });
