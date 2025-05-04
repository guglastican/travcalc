// Distance Calculator - Client-side Implementation
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateDistance');
    calculateBtn.addEventListener('click', handleDistanceCalculation);
});

async function handleDistanceCalculation() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;
    const unitSystem = document.getElementById('unitSystem').value;
    const resultsDiv = document.getElementById('distanceResults');

    if (!origin || !destination) {
        resultsDiv.innerHTML = '<p class="error">Please enter both origin and destination</p>';
        return;
    }

    try {
        // In production, this would call your backend service
        // const response = await fetch('/api/calculate-distance', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ 
        //         origin,
        //         destination,
        //         mode: travelMode,
        //         units: unitSystem
        //     })
        // });
        // const data = await response.json();

        // For demo purposes, we'll simulate a response
        const data = simulateDistanceResponse(origin, destination, travelMode, unitSystem);
        
        displayDistanceResults(data);
    } catch (error) {
        console.error('Error calculating distance:', error);
        resultsDiv.innerHTML = `<p class="error">Error calculating distance: ${error.message}</p>`;
    }
}

function displayDistanceResults(data) {
    const resultsDiv = document.getElementById('distanceResults');
    
    if (data.error) {
        resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
        return;
    }

    resultsDiv.innerHTML = `
        <div class="distance-result">
            <h3>Distance Information</h3>
            <p><strong>From:</strong> ${data.origin}</p>
            <p><strong>To:</strong> ${data.destination}</p>
            <p><strong>Distance:</strong> ${data.distance} ${data.unit}</p>
            <p><strong>Duration:</strong> ${data.duration}</p>
        </div>
    `;
}

// Simulates what the backend would return
function simulateDistanceResponse(origin, destination, mode, units) {
    // In production, this would be handled by your backend service
    // which would make the actual Google Maps Distance Matrix API calls
    
    // Simulate different responses based on mode and units
    const baseDistance = mode === 'walking' ? 5 : 
                        mode === 'bicycling' ? 10 :
                        mode === 'transit' ? 15 : 20;
    
    const distance = units === 'metric' ? 
                    `${baseDistance * 1.6} km` : 
                    `${baseDistance} miles`;
    
    const duration = mode === 'walking' ? '1 hour 30 mins' :
                    mode === 'bicycling' ? '45 mins' :
                    mode === 'transit' ? '30 mins' : '25 mins';

    return {
        origin: origin,
        destination: destination,
        distance: distance,
        unit: units === 'metric' ? 'kilometers' : 'miles',
        duration: duration,
        mode: mode,
        status: 'OK'
    };
}

/* 
Google Maps Distance Matrix API Implementation Notes:

1. Required API Parameters:
   - origins: The starting point(s)
   - destinations: The end point(s)
   - mode: driving, walking, bicycling, or transit
   - units: metric or imperial
   - key: Your API key (MUST be stored server-side)

2. Backend Implementation:
   - Set up a secure backend service
   - Store API key in environment variables
   - Create endpoint: POST /api/calculate-distance
   - Validate all inputs server-side
   - Implement rate limiting
   - Make API call to Google Maps:
     const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
       params: {
         origins: origin,
         destinations: destination,
         mode: travelMode,
         units: unitSystem,
         key: process.env.GOOGLE_MAPS_API_KEY
       }
     });

3. Response Handling:
   - Parse the API response
   - Handle errors gracefully
   - Return clean, formatted data to client
   - Cache frequent requests
*/
