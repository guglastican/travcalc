// Distance Calculator - Client-side Implementation
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateDistance');
    calculateBtn.addEventListener('click', handleDistanceCalculation);
});

async function handleDistanceCalculation() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
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
        //     body: JSON.stringify({ origin, destination })
        // });
        // const data = await response.json();

        // For demo purposes, we'll simulate a response
        const data = simulateDistanceResponse(origin, destination);
        
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
function simulateDistanceResponse(origin, destination) {
    // In production, this would be handled by your backend service
    // which would make the actual Google Maps API calls
    
    return {
        origin: origin,
        destination: destination,
        distance: '248 miles',
        unit: 'miles',
        duration: '4 hours 12 mins',
        status: 'OK'
    };
}

/* 
Production Implementation Notes:
1. Set up a backend service (Node.js/Express, Python/Flask, etc.)
2. Store Google Maps API key securely in environment variables
3. Create an endpoint like POST /api/calculate-distance
4. Implement server-side validation and rate limiting
5. Make actual Google Maps Distance Matrix API calls from server
6. Return formatted results to client
*/
