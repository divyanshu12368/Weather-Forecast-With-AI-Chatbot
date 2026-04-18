
const API_KEY = "ba3ba9eb5120f72cbe610320e62f2c9f";
const BASE_URL = "https://api.openweathermap.org/data/2.5";


export async function getWeatherData(city) {

    const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('City not found');
    return await response.json();
}

// fetch weather forcast data

export async function getForecastData(city) {


    const response = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('Forecast not found');
    return await response.json();
}


// Fetch weather data based on geographic coordinates

export async function getWeatherByCoords(lat, lon) {


    const [weatherRes, forecastRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) throw new Error('Location data not found');

    return {
        weatherData: await weatherRes.json(),
        forecastData: await forecastRes.json()
    };
}
