// Defines AI bot conversational capabilities and logical rules for NLP intent matching

export const intents = [
    {
        name: "temperature",
        keywords: ["temp", "temperature", "hot", "cold", "warm", "degrees", "celsius"],
        responseTemplate: (data) => `The current temperature in ${data.name} is ${Math.round(data.main.temp)}°C. It actually feels like ${Math.round(data.main.feels_like)}°C.`
    },
    {
        name: "rain",
        keywords: ["rain", "rainy", "umbrella", "snow", "precipitation", "raining", "wet"],
        responseTemplate: (data) => {
            const condition = data.weather[0].description.toLowerCase();
            const isRaining = condition.includes("rain") || condition.includes("drizzle") || condition.includes("snow");
            if (isRaining) return `Yes, the forecast shows ${condition} in ${data.name}. You should definitely carry an umbrella!`;
            return `No rain expected right now in ${data.name}. The weather is mainly ${condition}.`;
        }
    },
    {
        name: "humidity",
        keywords: ["humidity", "humid", "dry", "moisture", "sweaty"],
        responseTemplate: (data) => `The ambient humidity in ${data.name} is currently at ${data.main.humidity}%.`
    },
    {
        name: "wind",
        keywords: ["wind", "windy", "breeze", "storm", "gale"],
        responseTemplate: (data) => `The wind speed in ${data.name} is ${Math.round(data.wind.speed * 3.6)} km/h.`
    },
    {
        name: "weather",
        keywords: ["weather", "forecast", "conditions", "outside"],
        responseTemplate: (data) => `The weather in ${data.name} is currently ${data.weather[0].description} with a temperature of ${Math.round(data.main.temp)}°C.`
    },
    {
        name: "greeting",
        keywords: ["hello", "hi", "hey", "greetings"],
        responseTemplate: () => "Hello! I'm WeatherBot. You can ask me about the temperature, rain, wind, or general weather for any major city across the globe!"
    }
];

// NLP Stop words to aid precise city phrase extraction
export const ignoreWords = [
    "what", "whats", "is", "the", "weather", "in", "like", "today", "tomorrow", "will", "it", 
    "rain", "temperature", "how", "much", "degrees", "hot", "cold", "show", "me", "tell", "about", 
    "for", "city", "a", "an", "i", "need", "should", "carry", "umbrella", "humidity", "wind", "speed",
    "please", "give", "report", "can", "you", "my", "location"
];
