---
pagination:
  data: tools
  size: 1
  alias: .eleventy
  addAllPagesToCollections: true
tags: eleventy
layout: base.html
permalink: "/{{ eleventy.Keyword | slugify }}/"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ eleventy.Title | default: 'Untitled Tool' }}"
  description: "{{ tool.Metadescription | default: 'No description available' }}"
---
{{ eleventy.H1 }}
{{ eleventy.Introduction }}

## Foods  for  {{ tool.Name }} {{ tool.Foods }}
