const express = require('express');
const axios = require('axios');

const router = express();

const OPENWEATHERMAP_API_KEY = 'c797c961c081c289976596442782bab3';

// Endpoint to get weather data by city name
router.get('/weather/:cityName', async (req, res) => {
    const cityName = req.params.cityName;

    try {
        // Call Geocoding API to get latitude and longitude for the city
        const geocodingResponse = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`);
        const { lat, lon } = geocodingResponse.data[0]; // Extract latitude and longitude

        // Call Weather API to get weather data using latitude and longitude
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`);
        const { main, weather, wind } = weatherResponse.data;
        ////////convert to celcius
        const temperatureCelsius = weatherResponse.data.main.temp - 273.15;
         // we dont want the whole response so we only extracted whats necessary

        const responseData = {
            
            temperature: temperatureCelsius,
            description: weather[0].description,
            windSpeed: wind.speed
        };  
        // Check if weather conditions are suitable for working outside
        const isGoodForActivity = temperatureCelsius > 15 && temperatureCelsius < 30  && wind.speed < 7;

        let responseMessage;
        if (isGoodForActivity) {
            responseMessage = 'The weather is good for Working on you project outside!';
        } else {
            responseMessage = 'The weather may not be suitable for working outside.';
        }


        res.json({ message: responseMessage ,City:cityName,WeatherDetails:responseData}); 
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'An error occurred while fetching weather data' });
    }
});

module.exports=router;