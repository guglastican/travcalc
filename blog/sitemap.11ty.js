module.exports = class {
  data() {
    return {
      permalink: "/blog/sitemap.xml",
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const siteUrl = (data.site && data.site.url) || 
                   (data.metadata && data.metadata.website_url) || 
                   'https://www.calculatortrip.com';
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${data.collections.all.map(item => {
    if (item.data.ignore) return '';
    return `
    <url>
      <loc>${siteUrl}${item.url}</loc>
      <lastmod>${this.formatDate(item.date)}</lastmod>
    </url>`;
  }).join('')}
</urlset>`;
  }

  formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }
};
