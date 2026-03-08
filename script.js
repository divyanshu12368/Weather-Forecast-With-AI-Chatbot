// Modules are inherently strictly scoped
import { getWeatherData, getForecastData, getWeatherByCoords } from './api/weatherApi.js';
import { processChatMessage, updateChatbotContext } from './chatbot/chatbot.js';
import { processGeminiMessage } from './chatbot/gemini.js';

// --- Dashboard Component Registries ---
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const defaultState = document.getElementById('default-state');
const currentWeather = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast-section');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// --- Chatbot UI Registries ---
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

// Model Selector Registries
const botSelector = document.getElementById('bot-selector');
const botAvatar = document.getElementById('bot-avatar');
const botName = document.getElementById('bot-name');

// --- Global Application State ---
let currentCityName = null;
let activeBotModel = 'local'; // 'local' or 'gemini'

// Initialize system hooks once DOM is fully available
document.addEventListener('DOMContentLoaded', () => {
    // Search Dashboard bindings
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    locationBtn.addEventListener('click', handleLocationSearch);

    // Chatbot visual UX bindings
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
            // Minor structural animation delay adjustment
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
    
    // AI Model Toggle Binding
    botSelector.addEventListener('change', (e) => {
        activeBotModel = e.target.value;
        if (activeBotModel === 'gemini') {
            botName.textContent = "Gemini AI";
            botAvatar.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
            botAvatar.classList.add('gemini');
        } else {
            botName.textContent = "WeatherBot";
            botAvatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
            botAvatar.classList.remove('gemini');
        }
    });

    // Chatbot functional bindings
    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
});

// ==========================================
// CORE WEATHER PRESENTATION LOGIC
// ==========================================

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    showLoading();
    try {
        const currentData = await getWeatherData(city);
        const forecastData = await getForecastData(city);
        
        updateDashboard(currentData, forecastData);
        updateChatbotContext(currentData.name); // Provide AI context
    } catch (error) {
        showError("City not found. Please verify the name and try again.");
    }
}

async function handleLocationSearch() {
    if (!navigator.geolocation) {
        showError("Geolocation API is natively not supported by your browser.");
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const { weatherData, forecastData } = await getWeatherByCoords(latitude, longitude);
                
                updateDashboard(weatherData, forecastData);
                updateChatbotContext(weatherData.name);
                
                // Keep input in sync with geolocated city
                cityInput.value = weatherData.name;
            } catch (error) {
                showError("Unable to fetch regional weather data for your local coordinates.");
            }
        },
        (error) => {
            let msg = "Unable to retrieve your location.";
            if (error.code === 1) { // PERMISSION_DENIED
                msg = "Location access explicitly denied by user parameters.";
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                msg = "Location information is unavailable on this device.";
            } else if (error.code === 3) { // TIMEOUT
                msg = "The request to get user location timed out.";
            }
            showError(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateDashboard(currentData, forecastData) {
    hideLoading();
    errorMessage.classList.add('hidden'); // Clear any sticky error messages
    
    // Toggle application views gracefully
    defaultState.classList.add('hidden');
    currentWeather.classList.remove('hidden');
    forecastSection.classList.remove('hidden');

    // Store globally for Gemini Context Extraction
    currentCityName = currentData.name;

    // Systematically map live data to UI text elements
    document.getElementById('city-name').textContent = currentData.name;
    document.getElementById('current-date').textContent = new Date(currentData.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('temperature').textContent = Math.round(currentData.main.temp);
    document.getElementById('weather-condition').textContent = currentData.weather[0].description;
    
    // Inject detail properties dynamically
    document.getElementById('humidity').textContent = `${currentData.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`; // Internally normalize m/s to UX km/h
    document.getElementById('feels-like').textContent = `${Math.round(currentData.main.feels_like)}°C`;
    
    // Sync external weather visual resources
    const iconCode = currentData.weather[0].icon;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    updateForecast(forecastData);
}

function updateForecast(forecastData) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';

    // Advanced filtering pattern to isolate pseudo-midday forecast entries (if OWM) 
    // or direct iteration array (if fallback Open-Meteo)
    const dailyData = forecastData.list.filter(item => {
        // Fallback open-meteo proxies inject cleanly without dt_txt directly bypassing this
        if (item.dt_txt) {
             // Heuristic: Extract the noon forecasting data interval if supplied by OWM arrays
            return item.dt_txt.includes('12:00:00'); 
        }
        return true; 
    }).slice(0, 5); // Ensure maximum 5 elements render in timeline

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = day.weather[0].icon;
        const temp = Math.round(day.main.temp);
        const conditionText = day.weather[0].description;

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="f-day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon">
            <div class="f-temp">${temp}°C</div>
            <div class="f-desc">${conditionText}</div>
        `;
        container.appendChild(card);
    });
}

// Visual state management routines
function showLoading() {
    loading.classList.remove('hidden');
    defaultState.classList.add('hidden');
    currentWeather.classList.add('hidden');
    forecastSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(msg) {
    hideLoading();
    errorMessage.classList.remove('hidden');
    errorText.textContent = msg;
    defaultState.classList.add('hidden');
    currentWeather.classList.add('hidden');
    forecastSection.classList.add('hidden');
}

// ==========================================
// CHATBOT INTERACTION CONTROLLER
// ==========================================

async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Instantly manifest input locally for UX latency masking
    appendMessage(text, 'user');
    chatInput.value = '';

    // Enqueue typing lifecycle visual indicator
    const typingId = showTypingIndicator();

    // Route logic dynamically to selected AI model
    let botResponse = "";
    if (activeBotModel === 'gemini') {
        botResponse = await processGeminiMessage(text, currentCityName);
    } else {
        botResponse = await processChatMessage(text);
    }

    // AI task lifecycle completion resolution
    removeTypingIndicator(typingId);
    
    // Paint AI bot text via response engine 
    appendMessage(botResponse, 'bot');
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    
    // Inject gemini theming classes dynamically if required
    let classNames = `message ${sender}`;
    if (sender === 'bot' && activeBotModel === 'gemini') {
        classNames += ' gemini';
    }
    
    msgDiv.className = classNames;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    
    // Auto bottom-scrolling viewport enforcement constraint
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    
    let baseClass = 'typing-indicator';
    if (activeBotModel === 'gemini') baseClass += ' gemini';
    
    typingDiv.className = baseClass;
    typingDiv.id = id;
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
