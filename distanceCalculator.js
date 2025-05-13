// Distance Calculator - Client-side Implementation
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateDistance');
    console.log('calculateBtn', calculateBtn)
    calculateBtn.addEventListener('click', () => {
        console.log('Calculate button clicked');
        handleDistanceCalculation();
    });
});

async function handleDistanceCalculation() {
    console.log('handleDistanceCalculation called');
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;
    const unitSystem = document.getElementById('unitSystem').value;
    const resultsDiv = document.getElementById('distanceResults');

    if (!origin || !destination) {
        resultsDiv.innerHTML = '<p class="error">✋ Please enter both locations</p>';
        return;
    }
    
    // Show loading state with animation
    resultsDiv.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Calculating route...</p>
        </div>
    `;

    try {
        // Simulate API response
        const data = {
            origin: origin,
            destination: destination,
            distance: '120 km',
            duration: '2 hours',
            status: 'OK'
        };
        
        displayDistanceResults(data);
    } catch (error) {
        console.error('Error calculating distance:', error);
        resultsDiv.innerHTML = `<p class="error">Error calculating distance: ${error.message}</p>`;
    }
}

function displayDistanceResults(data) {
    const resultsDiv = document.getElementById('distanceResults');
    const distanceCalculatorTitle = document.getElementById('distanceCalculatorTitle');
    
    if (data.error) {
        resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
        return;
    }

    distanceCalculatorTitle.textContent = `Distance Calculator from ${data.origin} to ${data.destination}`;

    resultsDiv.innerHTML = `
        <div class="distance-result">
            <h3>Distance Information</h3>
            <div class="distance-info-row">
                <p><strong>From:</strong> ${data.origin}</p>
                <p><strong>To:</strong> ${data.destination}</p>
            </div>
            <div class="distance-info-row">
                <p><strong>Distance:</strong> ${data.distance}</p>
                <p><strong>Duration:</strong> ${data.duration}</p>
            </div>
            ${data.status !== 'OK' ? `<p class="warning">Note: ${data.status}</p>` : ''}
        </div>
    `;
}

// Simulates what the backend would return

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
