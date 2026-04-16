import { getWeatherData, getLatLonByCity, getOneCallWeather } from "./api/weather.js";

const temp = document.getElementById('temp');
const feels_like = document.getElementById('FeelsLike')
const humidity = document.getElementById('Humidity')
const wind_speed = document.getElementById('WindSpeed')
const city = 'kasganj';

const data = await getWeatherData(city);
console.log(data)

temp.innerText = data.main.temp;
feels_like.innerText = data.main.feels_like;
humidity.innerText = data.main.humidity;
wind_speed.innerText = data.wind.speed;

console.log(await getLatLonByCity(city))

const coord = await getLatLonByCity(city)

console.log(await getOneCallWeather(coord.lat,coord.lon))