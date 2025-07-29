module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("Styles.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("distanceCalculator.js");
  eleventyConfig.addPassthroughCopy("dateMapping.js");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("google76f23145e3023303 (6).html");

  // The root .html files will be processed by Eleventy.
  // This is fine as long as they don't contain template syntax that conflicts.
  // If they are pure HTML, Eleventy will just copy them over.

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "blog/_includes",
      data: "blog/_data"
    }
  };
};
