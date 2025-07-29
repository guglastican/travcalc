module.exports = function(eleventyConfig) {
  // Add XML to template formats
  eleventyConfig.setTemplateFormats([
    "md",
    "html",
    "liquid", 
    "xml"
  ]);
  
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
