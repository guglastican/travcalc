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
    <lastmod>${this.formatDate(new Date())}</lastmod>
  </url>
  ${(data.collections.tool || []).map(item => `
    <url>
      <loc>${siteUrl}${item.url}</loc>
      <lastmod>${this.formatDate(item.date)}</lastmod>
    </url>`).join('')}
</urlset>`;
  }

  formatDate(date) {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  }
};
