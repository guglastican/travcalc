// Wait for DOM to load before setting up the distance calculator
window.addEventListener("DOMContentLoaded", () => {
    const distanceForm = document.getElementById("distance-form");
    if (distanceForm) {
      distanceForm.addEventListener("submit", calculateDistance);
    }
});

/**
 * Handles the submission of the distance calculation form using Google Maps Distance Matrix API.
 */
async function calculateDistance(event) {
  event.preventDefault(); // Prevent default form submission

  const startLocation = document.getElementById("start-location").value;
  const endLocation = document.getElementById("end-location").value;
  const resultDiv = document.getElementById("distance-result");
  // IMPORTANT: Replace with your actual API key or a secure way to manage it.
  // Avoid committing keys directly into source code in production environments.
  const apiKey = "AIzaSyBEyTom-EIatnO-k5Zmtm65IM-Ub_gfPfE"; // User provided API key

  resultDiv.innerHTML = `<p>Calculating distance between <strong>${startLocation}</strong> and <strong>${endLocation}</strong>...</p>`;

  // Use HTTPS for API requests
  const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(startLocation)}&destinations=${encodeURIComponent(endLocation)}&key=${apiKey}&units=metric`; // Using metric units

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
        // Handle HTTP errors (e.g., 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Check the overall status and the element status
    if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
      const distance = data.rows[0].elements[0].distance.text;
      const duration = data.rows[0].elements[0].duration.text;
      resultDiv.innerHTML = `<p>Distance: <strong>${distance}</strong></p>
                             <p>Duration: <strong>${duration}</strong></p>`;
    } else {
      // Provide more specific error messages based on status codes
      let errorMessage = `Error calculating distance.`;
      if (data.status !== "OK") {
          errorMessage += ` API Status: ${data.status}.`;
          if (data.error_message) {
              errorMessage += ` Message: ${data.error_message}`;
          }
      } else if (data.rows[0]?.elements[0]?.status) {
          const elementStatus = data.rows[0].elements[0].status;
          errorMessage += ` Element Status: ${elementStatus}.`;
          if (elementStatus === "ZERO_RESULTS") {
              errorMessage = `<p>Could not find a route between <strong>${startLocation}</strong> and <strong>${endLocation}</strong>.</p>`;
          } else if (elementStatus === "NOT_FOUND") {
              errorMessage = `<p>One or both locations (<strong>${startLocation}</strong>, <strong>${endLocation}</strong>) could not be geocoded.</p>`;
          }
      }
      console.error("Distance Matrix API Error:", data);
      resultDiv.innerHTML = `<p>${errorMessage}</p>`;
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    resultDiv.innerHTML = `<p>Failed to fetch distance data. Error: ${error.message}. Please check your network connection or the API key.</p>`;
  }
}
