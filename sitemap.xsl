<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>XML Sitemap</title>
				<style type="text/css">
					body {
						font-family: sans-serif;
						margin: 40px;
						color: #333;
						background-color: #fff;
						line-height: 1.5;
					}
					h1 { font-size: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
					table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 20px; }
					th { border-bottom: 1px solid #eee; padding: 10px; font-size: 14px; color: #777; }
					td { padding: 8px 10px; border-bottom: 1px solid #f9f9f9; font-size: 13px; }
					a { color: #007bff; text-decoration: none; }
					a:hover { text-decoration: underline; }
				</style>
			</head>
			<body>
				<h1>XML Sitemap</h1>
				<table>
					<thead>
						<tr>
							<th>Location</th>
							<th>Priority</th>
							<th>Last Mod</th>
						</tr>
					</thead>
					<tbody>
						<xsl:for-each select="sitemap:urlset/sitemap:url">
							<tr>
								<td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
								<td><xsl:value-of select="sitemap:priority"/></td>
								<td><xsl:value-of select="sitemap:lastmod"/></td>
							</tr>
						</xsl:for-each>
						<xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
							<tr>
								<td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
								<td>-</td>
								<td>-</td>
							</tr>
						</xsl:for-each>
					</tbody>
				</table>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
