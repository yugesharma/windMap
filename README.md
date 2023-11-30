# Wind Data Visualization Web App

## [mapWinds](mapwinds.com)


## Overview

This web application provides an interactive interface to visualize wind data, including a 7-day forecast. Users can view color-coded wind arrows indicating wind direction, plot routes by selecting waypoints on the map, and retrieve real-time wind data for those waypoints. The coordinates for the waypoints and real-time wind data are displayed in a tabular format.


## Features

**Wind Arrows and Forecast**: Color-coded wind arrows on the map represent wind direction, and the 7-day forecast can be navigated using a date slider.

**Route Plotting**: Users can plot routes by selecting waypoints on the map. The route is displayed using a polyline, providing a clear visual representation.

**Real-time Wind Data**: Clicking on the map retrieves real-time wind data for the selected coordinates. The data includes wind speed, wind direction, and geographical coordinates.

**Tabular Display**: Real-time wind data for selected waypoints is presented in a tabular format for easy reference.


## Prerequisites

[Leaflet](https://leafletjs.com/) - An open-source JavaScript library for interactive maps.

[OpenWeatherMap](https://openweathermap.org/) API - API key required for fetching real-time wind data.


## Usage

The app is available [here](mapwinds.com)

alternatively,

1. Clone the repository:

```bash
git clone https://github.com/your-username/wind-data-web-app.git
```

2. Navigate to the project directory:

```bash
cd wind-data-web-app
```

3. Install the requirements and run downloadData.py to update the CSV for wind data.

4. Open index.html in your preferred web browser.

5. Interact with the map by clicking on specific locations to get real-time wind data. Use the date slider to navigate through the 7-day forecast.

6. To plot routes, click on the map to add waypoints. The route will be displayed as a polyline alongwith their real time wind data in the table.

7. Click the "Play" button to animate wind data for the next 7 days.


## Code Structure

- **index.html**: HTML file defining the structure of the web page.
- **style.css**: CSS file for styling the web page elements.
- **NewScript.js**: JavaScript file containing the logic for map interaction, wind data retrieval, and route plotting.


## Acknowledgments

This project utilizes the [Leaflet](https://leafletjs.com/) library for map rendering.

Data for wind markers is obtained from [PacIOOS](http://www.pacioos.hawaii.edu/weather/model-wind-global/#access).

Real-time wind data is obtained from the [OpenWeatherMap](https://openweathermap.org/) API.


## License

This project is licensed under the MIT License - see the LICENSE file for details.
