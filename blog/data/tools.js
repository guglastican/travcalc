// Responsible for fetching data
const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
    let url = `https://script.google.com/macros/s/AKfycbypAJszYtZ0h-XTZaHE3BGVrp9k9Db3j7C4f6j1z8OXyE-V_bBJ_HCOFXdyco6-E5h4/exec`;
  
    const response = await EleventyFetch(url, {
      duration: "1d",
      type: "json"
    });
  
    return response.data;
};