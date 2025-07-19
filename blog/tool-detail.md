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
  description: "{{ tool.Metadescription | default: 'No description available' }}"
---
{{ tool.H1 }}
{{ tool.Introduction }}

## Foods  for  {{ tool.Name }} {{ tool.Foods }}
