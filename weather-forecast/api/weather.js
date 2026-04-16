const API_KEY = "ba3ba9eb5120f72cbe610320e62f2c9f";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export async function getWeatherData(city) {

    const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    console.log(`${BASE_URL}/weather?q=${city}`);
    if (!response.ok) throw new Error('City not found');
    return await response.json();
}


export async function getLatLonByCity(city) {
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
  );

  if (!response.ok) throw new Error("City not found");

  const data = await response.json();
  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].name,
    country: data[0].country
  };
}

export async function getOneCallWeather(lat, lon) {
  const response = await fetch(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) throw new Error("Weather fetch failed");

  return await response.json();
}