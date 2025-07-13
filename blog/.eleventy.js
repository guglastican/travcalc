module.exports = function(eleventyConfig) {
  // Add support for data directory
  eleventyConfig.addDataExtension("js", {
    parser: (contents, path) => {
      // This ensures JS data files are properly processed
      const module = { exports: {} };
      const fn = new Function('module', 'exports', 'require', contents);
      fn(module, module.exports, require);
      return module.exports;
    }
  });
  
  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "data"
    }
  };
};
