---
pagination:
  data: tools
  size: 1
  alias: tool
  addAllPagesToCollections: true
tags: tools
layout: base.html
permalink: "/{{ tool.Keyword | slugify }}/"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ tool.Title | default: 'Untitled Tool' }}"
  description: "{{ tool.MetaDescription | default: 'No description available' }}"
---

{{ tool.Introduction }}

## Foods  for  {{ tool.Name }} {{ tool.Foods }}
