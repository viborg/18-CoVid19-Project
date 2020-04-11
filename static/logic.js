console.log("CoVid19-Project here");

var myMap = L.map("map", {
  center: [39.8283, -98.5795],
  zoom: 4,
});

// Create an empty layer for the heatmap, which is needed by updateHeatMap(), which 
// removes the last heatmap layer before adding a new last heatmap layer with the 
// new data
var heatMapLayer = L.heatLayer([], {}).addTo(myMap);

// Create the streets tile layer
var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18, 
  id: "mapbox.streets",
  accessToken: API_KEY
  // accessToken: "pk.eyJ1Ijoic3RodWRpdW0iLCJhIjoiY2s4MXZhZXYxMHN6dzNkcmxmZm95ajVsZCJ9.ARt9J_hnUulmObjE3WGlGA"

}).addTo(myMap);

// A sleep function that loops until the elapsed time is detected
function sleep(milliseconds) { 
  let timeStart = new Date().getTime(); 
  while (true) { 
    let elapsedTime = new Date().getTime() - timeStart; 
    if (elapsedTime > milliseconds) { 
      break; 
    } 
  } 
};

// Initializes the page with the heatmap for the 50th (out of 70) day
function init() {
  updateHeatMap("0");
  updateCases("0");
  updateDeaths("0");
};

// Call updateMap() when a change takes place to the DOM
d3.selectAll("#selDate").on("change", updateMap);

// This function is called when a dropdown menu item is selected
function updateMap() {
  // Use D3 to select the dropdown menu
  var dropdownMenu = d3.select("#selDate");
  // Assign the value of the dropdown menu option to a variable
  var selectedDate = dropdownMenu.property("value");

  if (selectedDate == "Animate") {
    // If the user selects animation, then step through each date and update the overlay
    // There is a delay between steps, but since the updateHeatMp() is asynchronous,
    // the delay is put there to delay the return back to this loop
    var steps = [0, 15, 28, 39, 45, 52, 58, 62, 66, 70]
    for (var i=0; i<steps.length; i++) {
      updateHeatMap(steps[i]);
    }
  } else {
    // Update the heatmap and plots for the user selected date
    updateCases(selectedDate);
    updateDeaths(selectedDate);
    updateHeatMap(selectedDate);
  }
}  // end of updateMap()

//Create a heatmap layer using the date increment that the user selected
function updateHeatMap(sel_date) {
  url = "http://localhost:5000/date=" + sel_date;
  d3.json(url, function(response) {
    // console.log("response.features");
    // console.log(response.features);

    var heatArray = [];

    var covidCases = response.features;

    covidCases.forEach(function(covidCase) {
      // geometry.coordinates = [longitude, latitude], per GeoJSON. Leaflet expects the reverse. 
      // for(i=1; i<covidCase.properties.Confirmed_cases*1000; i++) {
      //   heatArray.push(covidCase.geometry.coordinates.reverse());
      // }
      var intensity = covidCase.properties.Confirmed_cases*5;
      heatArray.push([covidCase.geometry.coordinates[1], 
        covidCase.geometry.coordinates[0], intensity]);

    });

    console.log("heatArray");
    console.log(heatArray);

    // Remove the previous heatmap layer to display a new layer with different data
    myMap.removeLayer(heatMapLayer);

    // Create a new heatmap layer with data for the user selected date
    heatMapLayer = L.heatLayer(heatArray, {
    radius: 20,
      blur: 2
    }).addTo(myMap);

  // The last step in the asynchronous d3.json() is a delay to support the animation
  sleep(500);  // milliseconds

  });  // end of d3.json()

};  // end of updateHeatmap()


// Plot the location and number of cases for the top locations
function updateCases(sel_date) {
  var url = "http://localhost:5000/casedate=" + sel_date;
  var locs = [];
  var cases = [];
  d3.json(url, function(response) {
    response.forEach((element) => {
      locs.push(element.Location)
      cases.push(element.Cases)
    });
    var data = [
      {
        x: locs,
        y: cases,
        type: 'bar'
      }
    ];
    Plotly.newPlot('cases', data);
  });
};

// Plot the location and number of deaths for the top locations
function updateDeaths(sel_date) {
  url = "http://localhost:5000/deathdate=" + sel_date;
  var locs = [];
  var deaths = [];
  d3.json(url, function(response) {
    response.forEach((element) => {
      locs.push(element.Location)
      deaths.push(element.Deaths)
    });
    var data = [
      {
        x: locs,
        y: deaths,
        type: 'bar'
      }
    ];
    Plotly.newPlot('deaths', data);
  });
};

// Initialize the page with the heatmap for the middle day
init();