const fs = require('fs');

try {
  // 1. Remove embed from distance.html
  let distHTML = fs.readFileSync('c:/Users/Maglic/travcalc/distance.html', 'utf8');
  distHTML = distHTML.replace(
      /[\s]*<div class="embed-section"[\s\S]*?<\/div>\s*<\/div>/,
      '\n    </div>'
  );
  fs.writeFileSync('c:/Users/Maglic/travcalc/distance.html', distHTML);

  // 2. Add embed to gas-calculator-trip.html
  let gasHTML = fs.readFileSync('c:/Users/Maglic/travcalc/gas-calculator-trip.html', 'utf8');
  if (!gasHTML.includes('embed-section')) {
      const gasEmbedHtml = `
            <div class="embed-section" style="margin-top: 30px; padding: 20px; background-color: #fcfcfc; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;">
                <h3 style="margin-top: 0; font-size: 1.3rem; color: #333; text-align: left;">Embed this Calculator</h3>
                <p style="font-size: 0.95rem; color: #666; margin-bottom: 10px; text-align: left;">Copy and paste the code below to embed the gas calculator on your website or blog:</p>
                <textarea readonly style="width: 100%; height: 60px; resize: none; font-family: monospace; font-size: 0.9rem; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff; color: #333; box-sizing: border-box;" onclick="this.select()">&lt;iframe src="https://www.calculatortrip.com/gas-calculator-trip?embed=true" width="100%" height="600" style="border:none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" title="Gas Calculator Trip"&gt;&lt;/iframe&gt;</textarea>
            </div>
        </div>`;
      gasHTML = gasHTML.replace('        </div>\n\n        <article class="narrow-article', gasEmbedHtml + '\n\n        <article class="narrow-article');
      fs.writeFileSync('c:/Users/Maglic/travcalc/gas-calculator-trip.html', gasHTML);
  }

  // 3. Add embed logic to script.js
  let scriptJS = fs.readFileSync('c:/Users/Maglic/travcalc/script.js', 'utf8');
  if (!scriptJS.includes('embed-mode')) {
      scriptJS = scriptJS.replace(
          'window.addEventListener("DOMContentLoaded", () => {', 
          'window.addEventListener("DOMContentLoaded", () => {\\n  // Handle embed mode\\n  const urlParams = new URLSearchParams(window.location.search);\\n  if (urlParams.get("embed") === "true") {\\n    document.body.classList.add("embed-mode");\\n  }'
      );
      // Wait, let's fix the escaped newlines replacing:
      scriptJS = scriptJS.replace(/\\n/g, '\n'); 
      fs.writeFileSync('c:/Users/Maglic/travcalc/script.js', scriptJS);
  }

  // 4. Add embed styles to Styles.css
  let stylesCSS = fs.readFileSync('c:/Users/Maglic/travcalc/Styles.css', 'utf8');
  if (!stylesCSS.includes('body.embed-mode')) {
      stylesCSS += `
/* Embed Mode Styles */
body.embed-mode {
  background: transparent !important;
}

body.embed-mode site-header,
body.embed-mode header,
body.embed-mode footer,
body.embed-mode article,
body.embed-mode .explore-tools-section,
body.embed-mode .embed-section,
body.embed-mode h1,
body.embed-mode h2,
body.embed-mode h3 {
  display: none !important;
}

body.embed-mode main.container {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}

body.embed-mode .form-section,
body.embed-mode .gas-calculator-container {
  box-shadow: none !important;
  margin: 0 auto !important;
  padding: 10px !important;
  background: transparent !important;
  border: none !important;
}
`;
      fs.writeFileSync('c:/Users/Maglic/travcalc/Styles.css', stylesCSS);
  }
  console.log("Success");
} catch (e) {
  console.error("Error running fix", e);
}
