import { getWeatherData } from '../api/weatherApi.js';

// User must replace this with their actual Gemini API Key
const GEMINI_API_KEY = "AIzaSyArA2Wjeal9rIujqw37RNSf_q_Hh2CFDX4";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Maintain conversation history to allow continuous chat flow
let conversationHistory = [];

export async function processGeminiMessage(message, currentCityName) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        return "Please add your Gemini API key in `chatbot/gemini.js` to use the Advanced AI.";
    }

    try {
        let weatherContext = "No specific city is selected right now.";

        // Dynamically fetch the absolute latest weather context just-in-time for the AI
        if (currentCityName) {
            try {
                const data = await getWeatherData(currentCityName);
                weatherContext = `The user is currently looking at the weather dashboard for ${data.name}. 
The temperature is ${Math.round(data.main.temp)}°C, feels like ${Math.round(data.main.feels_like)}°C. 
The condition is ${data.weather[0].description}, humidity is ${data.main.humidity}%, and wind speed is ${Math.round(data.wind.speed * 3.6)} km/h.`;
            } catch (e) {
                weatherContext = `The user is looking at ${currentCityName}, but real-time data fetch failed briefly.`;
            }
        }

        const systemPrompt = `You are a helpful, expert AI Weather Assistant for a web app dashboard.
Context: ${weatherContext}.
Answer the user's questions clearly, concisely, and naturally. If they ask about the current city, use the provided context. If they ask about abstract weather concepts or other cities, answer them using your general knowledge. Format responses in plain conversational text. Keep answers brief unless explicitly asked for detail (max 2-3 sentences).`;

        // Add user message to local history tracking
        conversationHistory.push({ role: "user", parts: [{ text: message }] });

        // Keep history manageable (last 10 interactions)
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        const payload = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: conversationHistory
        };

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Gemini API Error:", await response.text());
            throw new Error("Gemini API Error");
        }

        const result = await response.json();
        const botOutput = result.candidates[0].content.parts[0].text;

        // Append bot response to history
        conversationHistory.push({ role: "model", parts: [{ text: botOutput }] });

        return botOutput;
    } catch (error) {
        console.error(error);
        return "I'm having trouble connecting to the Gemini Advanced AI. Please check your API key or internet connection.";
    }
}
