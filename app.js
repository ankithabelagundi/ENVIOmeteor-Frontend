
const status = document.getElementById("status");
const weatherDiv = document.getElementById("weather");
const aqiDiv = document.getElementById("aqi");
const suggestionsDiv = document.getElementById("suggestions");
const dayOutlook = document.getElementById("dayOutlook");
const skyInfo = document.getElementById("skyInfo");
const forecastStrip = document.getElementById("forecastStrip");

weatherDiv.innerHTML = "Loading weather…";
aqiDiv.innerHTML = "Loading air quality…";
suggestionsDiv.innerHTML = "Loading alerts…";
dayOutlook.innerHTML = "Loading outlook…";
if (forecastStrip) forecastStrip.innerHTML = "Fetching forecast…";
skyInfo.textContent = "Checking sky conditions…";


function getWeatherEmoji(condition) {
  if (!condition) return "🌥️";
  if (condition.includes("rain")) return "🌧️";
  if (condition.includes("cloud")) return "☁️";
  if (condition.includes("clear")) return "☀️";
  if (condition.includes("thunder")) return "⛈️";
  if (condition.includes("snow")) return "❄️";
  return "🌥️";
}

function getForecastClass(condition) {
  if (!condition) return "forecast-cloudy";
  if (condition.includes("rain")) return "forecast-rainy";
  if (condition.includes("cloud")) return "forecast-cloudy";
  if (condition.includes("clear")) return "forecast-sunny";
  if (condition.includes("thunder")) return "forecast-stormy";
  if (condition.includes("snow")) return "forecast-snowy";
  return "forecast-cloudy";
}

navigator.geolocation.getCurrentPosition(
  async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    status.textContent = "Location detected ✅";

    const API_BASE = "https://enviometeor-backend.onrender.com/api/insights";

    const insightsRes = await fetch(
  `${API_BASE}/api/insights?lat=${lat}&lon=${lon}`
      );
    const data = await insightsRes.json();

    const conditionText = data.weather.weather[0].description.toLowerCase();
    const mainCondition = data.weather.weather[0].main.toLowerCase();
    const temp = Math.round(data.weather.main.temp);
    const icon = getWeatherEmoji(conditionText);

    weatherDiv.innerHTML = `
      <div class="weather-hero">
        <div class="weather-icon">${icon}</div>
        <div>
          <div class="weather-temp">${temp}°</div>
          <div class="weather-desc">${data.weather.weather[0].description}</div>
        </div>
      </div>
    `;


    dayOutlook.innerHTML = `
      <div class="info-row">
        <span>🌞 Today</span>
        <span>${temp}° • ${data.weather.weather[0].main}</span>
      </div>
      <div class="info-row">
        <span>🌙 Tonight</span>
        <span>Partly cloudy</span>
      </div>
      <div class="info-row">
        <span>🌅 Tomorrow</span>
        <span>Forecast coming soon</span>
      </div>
    `;

    const aqiValue = data.aqi.list[0].main.aqi;
    let aqiText = "Good";
    if (aqiValue === 3) aqiText = "Moderate";
    if (aqiValue >= 4) aqiText = "Poor";

    aqiDiv.innerHTML = `
      <strong>${aqiText}</strong> (AQI ${aqiValue})
    `;

    const alerts = [];

    if (mainCondition.includes("rain")) {
      alerts.push("☔ Rain expected — carry an umbrella");
    }
    if (aqiValue >= 4) {
      alerts.push("😷 Poor air quality — avoid outdoor walks");
    }
    if (data.weather.clouds.all < 30 && mainCondition.includes("clear")) {
      alerts.push("🌠 Clear skies tonight — good for stargazing");
    }

    suggestionsDiv.innerHTML = alerts.length
      ? alerts.map(a => `<span class="chip">${a}</span>`).join("")
      : "No alerts today 👍";

  
    setTimeout(() => {
      const cloudCover = data.weather.clouds.all;

      if (cloudCover < 30 && mainCondition === "clear") {
        skyInfo.textContent =
          "🌠 Clear skies tonight — great for stargazing after 9 PM.";
      } else if (cloudCover < 60) {
        skyInfo.textContent =
          "🌙 Partly cloudy skies — brighter stars may be visible.";
      } else {
        skyInfo.textContent =
          "☁️ Cloudy skies — stargazing unlikely tonight.";
      }
    }, 300);

    if (forecastStrip) {
      fetch(`${API_BASE}/api/forecast?lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(forecastData => {
          try {
            forecastStrip.innerHTML = (() => {
  const realDays = forecastData.list
    .filter((_, i) => i % 8 === 0)
    .slice(0, 5);

  const estimatedDays = [
    { label: "Sat", trend: "cloudy", tempOffset: 1 },
    { label: "Sun", trend: "clear", tempOffset: 2 },
  ];

  const realCards = realDays.map((day, index) => {
    const d = new Date(day.dt_txt);
    const desc = day.weather[0].description.toLowerCase();
    const colorClass = getForecastClass(desc);
    const isToday = index === 0;

    return `
      <div class="forecast-card ${colorClass} ${isToday ? "forecast-today" : ""}">
        <div>${isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" })}</div>
        <div style="font-size:1.4rem">${getWeatherEmoji(desc)}</div>
        <div>${Math.round(day.main.temp)}°</div>
      </div>
    `;
  });

  const lastRealTemp = Math.round(realDays[realDays.length - 1].main.temp);

  const estimatedCards = estimatedDays.map(day => {
    const colorClass = getForecastClass(day.trend);
    const emoji = getWeatherEmoji(day.trend);

    return `
      <div class="forecast-card ${colorClass} estimated">
        <div>${day.label}</div>
        <div style="font-size:1.4rem">${emoji}</div>
        <div>${lastRealTemp + day.tempOffset}°</div>
        <div class="est-tag">Estimated</div>
      </div>
    `;
  });

  return [...realCards, ...estimatedCards].join("");
})();

          } catch (err) {
            console.error("Forecast render error", err);
            forecastStrip.innerHTML = "Forecast data error";
          }
        })
        .catch(() => {
          forecastStrip.innerHTML = "Forecast unavailable";
        });
    }
  },
  () => {
    status.textContent = "Location access denied ❌";
  }
);
