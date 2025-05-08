require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
// const path = require('path'); // No longer needed as express.static and explicit sendFile are removed

const app = express();
const PORT = process.env.PORT || 3001;

// Simplified CORS setup
app.use(cors()); 

app.use(express.json());

// Distance Matrix API endpoint
app.post('/api/calculate-distance', async (req, res) => {
  try {
    const { origin, destination, mode, units } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        mode: mode || 'driving',
        units: units || 'imperial',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(response.data.error_message || 'Failed to calculate distance');
    }

    const result = response.data?.rows?.[0]?.elements?.[0];
    if (!result || result.status !== 'OK') {
      throw new Error('No valid route found between locations');
    }

    res.json({
      origin: response.data?.origin_addresses?.[0] || 'Unknown origin',
      destination: response.data?.destination_addresses?.[0] || 'Unknown destination',
      distance: result.distance?.text || 'Unknown distance',
      duration: result.duration?.text || 'Unknown duration',
      status: response.data?.status || 'UNKNOWN_ERROR'
    });
  } catch (error) {
    console.error('API Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = 'An unexpected error occurred while calculating distance.';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Google API Error Response Data:', error.response.data);
      console.error('Google API Error Response Status:', error.response.status);
      errorMessage = error.response.data?.error_message || error.response.data?.message || (error.response.data?.status ? `Google Maps API Error: ${error.response.data.status}` : errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Google API No Response:', error.request);
      errorMessage = 'No response received from Google Maps API. Check server connectivity and API key quotas.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Google API Request Setup Error:', error.message);
      errorMessage = error.message || errorMessage;
    }
    res.status(500).json({ error: errorMessage }); // Keep client response simpler for now
  }
});

// HTML files and other static assets (CSS, client-side JS)
// are now expected to be served by Vercel's default static file handling
// based on the simplified vercel.json.
// This server.js is now API-only.

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (API only)`);
});
