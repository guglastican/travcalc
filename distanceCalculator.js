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
        const response = await fetch('/api/calculate-distance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origin,
                destination,
                mode: travelMode,
                units: unitSystem
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Redirect to the pSEO URL
        window.location.href = `/udaljenost/${data.slug}`;

    } catch (error) {
        console.error('Error calculating distance:', error);
        resultsDiv.innerHTML = `<p class="error">Error calculating distance: ${error.message}</p>`;
    }
}

// Handle data injected by server for pSEO
if (window.PSEO_DATA) {
    document.addEventListener('DOMContentLoaded', () => {
        displayDistanceResults(window.PSEO_DATA);

        // Pre-fill inputs
        const originInput = document.getElementById('origin');
        const destInput = document.getElementById('destination');
        if (originInput) originInput.value = window.PSEO_DATA.origin;
        if (destInput) destInput.value = window.PSEO_DATA.destination;
    });
}

function displayDistanceResults(data) {
    console.log('displayDistanceResults called');
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
            <p>The distance from ${data.origin} to ${data.destination} is:</p>
            <div class="distance-info">
                <span class="distance">${data.distance}</span>
                <span class="duration">(${data.duration})</span>
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
