module.exports = class {
  data() {
    return {
      permalink: "/sitemap.xml",
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const siteUrl = data.metadata.website_url || 'https://www.calculatortrip.com';
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>2025-06-26T21:08:52.008Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1</priority>
  </url>
  ${(data.collections.tool || []).map(item => `
    <url>
      <loc>${siteUrl}${item.url}</loc>
      <lastmod>2025-06-26T21:08:52.008Z</lastmod>
      <changefreq>weekly</changefreq>
    </url>`).join('')}
</urlset>`;
  }
};
