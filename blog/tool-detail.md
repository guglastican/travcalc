---
pagination:
  data: tools
  size: 1
  alias: tool
  addAllPagesToCollections: true
tags: tool
layout: base.html
permalink: "/{{ tool.Keyword | slugify }}/"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ tool.Title | default: 'Untitled Tool' }}"
  description: "{{ tool.Metadescription | default: 'No description available' }}"
---
{{ tool.H1 }}
{{ tool.Introduction }}
{{ tool.H2 }}
{{ tool.Introductionn }}
## Foods  for  {{ tool.Name }} {{ tool.Foods }}
