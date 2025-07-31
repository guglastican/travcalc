---
title: "Our Blog"
layout: "base.html"
templateEngineOverride: "html, liquid"
---

<header>
  <h2 style="text-align: center; margin-bottom: 2rem;">Welcome to the Blog</h2>
  <p style="text-align: center;">Discover our latest articles, tools, and insights.</p>
</header>

<div class="grid">
  {% for tool in collections.tool %}
    <article>
      <header>
        <h3><a href="/blog{{ tool.url }}" style="text-decoration: none;">{{ tool.data.title }}</a></h3>
      </header>
      <p>{{ tool.data.MetaDescription }}</p>
      <footer style="padding-top: 1rem;">
        <a href="/blog{{ tool.url }}" role="button" class="secondary">Read More</a>
      </footer>
    </article>
  {% endfor %}
</div>
