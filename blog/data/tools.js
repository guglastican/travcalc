// Responsible for fetching data
const EleventyFetch = require("@11ty/eleventy-fetch");

// Local fallback data matching expected structure
const localTools = {
  tools: [
    {
      Name: "Paris",
      Description: "Paris travel calculator",
      Introduction: "Calculate travel details for Paris",
      Foods: "French cuisine"
    },
    {
      Name: "Example Tool",
      Description: "Sample description",
      Introduction: "This is an example tool", 
      Foods: "Sample foods"
    }
  ]
};

module.exports = async function() {
    let url = `https://script.google.com/macros/s/AKfycbypAJszYtZ0h-XTZaHE3BGVrp9k9Db3j7C4f6j1z8OXyE-V_bBJ_HCOFXdyco6-E5h4/exec`;
  
    try {
      const response = await EleventyFetch(url, {
        duration: "1d",
        type: "json"
      });
      
      // Ensure response has expected structure
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return { tools: response.data };
      }
      return localTools;
    } catch (error) {
      console.error("Failed to fetch tools data:", error);
      return localTools;
    }
};
