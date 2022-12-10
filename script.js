// Initial set up
$("#home").show(); // Show home tab
$(".nav-item .nav-link").on("click", handleNavigation); // Add listener to navbar

// Handle navbar actions
function handleNavigation(event) {
	$(".nav-item .nav-link.active").removeClass("active");
	$(event.target).addClass("active");

	let page = event.target.innerText.toLowerCase();
	$("#main-content > div").hide();
	$("#" + page).show();
}

// Script for Weather Page

$("#weather-query-input").on("submit", handleWeatherQuery); // Add listener to weather form

// Handle weather form submit
function handleWeatherQuery(event) {
	event.preventDefault();

	let query = $("input[name=location]").val();
	let URL = "https://api.tomtom.com/search/2/search/";
	let key = "bRt6SQP6GnWT5U8qL01IGFnLKHPcZEGO";
	let encodedQuery = encodeURIComponent(query);
	
	a = $.ajax({
		url: URL + encodedQuery + ".json?key=" + key,
		method: "GET"
	}).done(function(data) {
		if (data.results.length === 0) {
			console.log("Location Not Found");
		} else {
			getWeather(query, data.results[0]);
		}
	}).fail(function(error) {
		console.log(error);
	});
}

// Call openweathermap api
function getWeather(location, mapJson) {
	let URL = "https://api.openweathermap.org/data/2.5/forecast?";
	let key = "394dc74edf17a69a544451145dbb52d7";
	let lat = mapJson.position.lat;
        let lon = mapJson.position.lon;

	a = $.ajax({
		url: URL + "lat=" + lat + "&lon=" + lon + "&appid=" + key,
                method: "GET"
        }).done(function(data) {
		$("#weather .results").html("");
		let weatherJson = {list: []};
		for (let i = 0; i <= 32; i += 8) {
			generateForecast(location, data.list[i]);
			weatherJson.list.push(data.list[i]);
		}
		storeData(location, mapJson, weatherJson);	
	}).fail(function(error) {
                console.log(error);
        });
}

// Generate a block of forecast on a single-day data
function generateForecast(location, data) {
	let date = new Date(data.dt_txt);
	let dayOfWeek = date.getDay();
	const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	$("#weather .results").append(`
		<div class="forecast-container">
			<div class="info-container">
			<p class="date"><b>Date: ${date.toLocaleDateString()}</b></p>
			<p class="dayOfWeek">Day Of Week: ${dayName[dayOfWeek]}</p>
			<p class="temp_max">High: ${(data.main.temp_max - 273.15).toFixed(2)}℃</p>
			<p class="temp_min">Low: ${(data.main.temp_min - 273.15).toFixed(2)}℃</p>
			<p class="humidity">Humidity: ${data.main.humidity}%</p>
			<p class="visibility">Visibility: ${data.visibility}m</p>
			<p class="forecast">Forecast: ${data.weather[0].description}</p>
			</div>
			<div class="img-container">
				<img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="icon">
			</div>
		</div>
	`);
}


// Store data to database, call to php server
function storeData(location, mapJson, weatherJson) {
	let encodedLocation = encodeURIComponent(location);
	let encodedMapJson = encodeURIComponent(JSON.stringify(mapJson));
	let encodedWeatherJson = encodeURIComponent(JSON.stringify(weatherJson));
	let URL = "http://172.17.14.182/final.php?method=setWeather&";

	a = $.ajax({
                url: URL + "location=" + encodedLocation + "&mapJson=" + encodedMapJson + "&weatherJson=" + encodedWeatherJson,
                method: "PUSH"
        }).done(function() {
		console.log("Success");
        }).fail(function(error) {
                console.log(error);
        });
}

// Script for History Page

$("#history-query-input").on("submit", handleHistoryQuery); // Add listener to form

var historyData; // Store data from php server

// Handle weather JSON logging
function consoleLogWeatherData(index) {
	console.log(JSON.parse(historyData.result[index].weatherJson));
	alert("JSON Logged in Console");
}

// Create expanded data view
function showHistoryData(index) {
	$(`tbody tr[key=${index}]`).after(`
		<tr class="expanded-row" for="${index}">
			<td colspan=5 class="expanded-data" for="${index}">
				<div class="row-forecast-container">
				</div>
			</td>
		</tr>
	`);
	
	insertExpandedData(index);
}

// Insert data into expanded data view
function insertExpandedData(index) {
	let weatherData = JSON.parse(historyData.result[index].weatherJson);

	weatherData.list.forEach(function(data) {
		let date = new Date(data.dt_txt);
		let dayOfWeek = date.getDay();
		const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		$(`tbody td.expanded-data[for=${index}] .row-forecast-container`).append(`
			<div class="forecast-container">
                        	<div class="info-container">
                        		<p class="date"><b>Date: ${date.toLocaleDateString()}</b></p>
                        		<p class="dayOfWeek">Day Of Week: ${dayName[dayOfWeek]}</p>
                        		<p class="temp_max">High: ${(data.main.temp_max - 273.15).toFixed(2)}℃</p>
                        		<p class="temp_min">Low: ${(data.main.temp_min - 273.15).toFixed(2)}℃</p>
                        		<p class="humidity">Humidity: ${data.main.humidity}%</p>
                        		<p class="visibility">Visibility: ${data.visibility}m</p>
                        		<p class="forecast">Forecast: ${data.weather[0].description}</p>
                        	</div>
                        	<div class="img-container">
                        	        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="icon">
                	        </div>
        	        </div>
		`);
	});

	$(`tr[key=${index}] .expand-cell`).remove();
	$(`tr[key=${index}]`).append(`<td class="expand-cell"><button onclick="hideHistoryData('${index}')">Hide</button></td>`);
}

// Delete expanded data view
function hideHistoryData(index) {
	$(`tr.expanded-row[for=${index}]`).remove();
	$(`tr[key=${index}] .expand-cell`).remove();
        $(`tr[key=${index}]`).append(`<td class="expand-cell"><button onclick="showHistoryData('${index}')">Show</button></td>`);
}

// History form handling
function handleHistoryQuery(event) {
	event.preventDefault();

	let dateQuery = $("input[name=date]").val();
	let encodedDateQuery = encodeURIComponent(dateQuery);
	let maxResultsReturned = $("input[name=maximumResults]").val();
	let URL = "http://172.17.14.182/final.php?method=getWeather&";

	a = $.ajax({
		url: URL + "date=" + encodedDateQuery,
		method: "GET"
	}).done(function(data) {
		historyData = data;
		$("tbody").html("");

		data.result.forEach(function (item, index) {
			if (index >= maxResultsReturned) return;
			$("tbody").append(`
				<tr key="${index}">
					<td>${item.dateTime}</td>
					<td>${item.location}</td>
					<td>${JSON.parse(item.mapJson).position.lat}, ${JSON.parse(item.mapJson).position.lon}</td>
					<td><a onclick="consoleLogWeatherData('${index}');">JSON</a></td>
					<td class="expand-cell"><button onclick="showHistoryData('${index}')">Show</button></td>
				</tr>
			`);
		});
	}).fail(function(error) {
		console.log(error);
	});
}
