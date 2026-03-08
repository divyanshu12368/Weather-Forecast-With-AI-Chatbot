import { intents, ignoreWords } from './intents.js';
import { getWeatherData } from '../api/weatherApi.js';

// Global variable tracking the user's currently viewed city
let currentContextCity = null;

/**
 * Updates context dynamically when user interacts with the dashboard
 */
export function updateChatbotContext(city) {
    currentContextCity = city;
}

/**
 * Main execution thread to process, analyze and respond to a text message
 */
export async function processChatMessage(message) {
    message = message.toLowerCase().trim();
    
    // 1. Immediately handle basic greetings
    if (["hi", "hello", "hey", "help", "who are you", "what can you do"].includes(message)) {
        return intents.find(i => i.name === "greeting").responseTemplate();
    }

    // 2. Extract city logic dynamically or inject contextual data
    let targetCity = extractCity(message) || currentContextCity;
    
    if (!targetCity) {
        return "Please specify a city name alongside your question, or search for a city on the dashboard first.";
    }

    // 3. Execute basic NLP to resolve the intent matching
    const intent = matchIntent(message);

    try {
        // Retrieve fresh weather data payload from abstracted API
        const weatherData = await getWeatherData(targetCity);
        
        // 4. Resolve template via invoked dynamic intent
        return intent.responseTemplate(weatherData);

    } catch (error) {
        return `I'm sorry, I couldn't find live weather data for "${targetCity}". Please check the spelling or specify a broader region.`;
    }
}

/**
 * Matches message text against intent keywords linearly
 */
function matchIntent(message) {
    // General 'weather' intent is standard fallback
    let matchedIntent = intents.find(i => i.name === "weather");
    let maxMatches = 0;

    intents.forEach(intent => {
        let matches = intent.keywords.filter(kw => message.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            matchedIntent = intent;
        }
    });

    return matchedIntent;
}

/**
 * Natural Language parameter extractor finding likely city terminology string targets
 */
function extractCity(message) {
    // Normalize string punctation globally
    const cleanMessage = message.replace(/[?,.!]/g, '');
    
    // Attempt standard preposition match regex pattern ("in London", "for Paris", "at Tokyo")
    const inMatch = cleanMessage.match(/(?:in|for|at) ([a-z\s]+)$/i);
    if (inMatch && inMatch[1]) {
        // filter out stop words conditionally to refine
        const cityWords = inMatch[1].split(' ').filter(w => !ignoreWords.includes(w));
        if (cityWords.length > 0) return cityWords.join(' ');
    }

    // Direct fallback vector: remove all conversational ignore/stop words
    const words = cleanMessage.split(' ');
    const potentialCities = words.filter(word => !ignoreWords.includes(word));
    
    // Simplest query logic e.g "(just querying user types 'London')"
    if (words.length <= 2 && potentialCities.length > 0) {
        return potentialCities.join(' ');
    }
    
    if (potentialCities.length > 0) {
        // Final fallback heuristics: often user mentions the location at grammatical closure
        return potentialCities.slice(-1)[0];
    }
    
    return null;
}
