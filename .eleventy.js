module.exports = function(eleventyConfig) {
  // Set input and output directories for the blog
  return {
    dir: {
      input: "blog",
      output: "blog/_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
