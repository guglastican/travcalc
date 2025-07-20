---
pagination:
  data: tools
  size: 3
  alias: tool
  addAllPagesToCollections: true
tags: tool
layout: base.html
permalink: "/{{ tool.Keyword | slugify }}/"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ tool.Title | default: 'Untitled Tool' }}"
  description: "{{ tool.MetaDescription | default: 'No description available' }}"
---
{{ tool.H2 }}
{{ tool.Introduction }}


## Foods  for  {{ tool.Introductionn }} 

## Foods  for  {{ tool.Description2 }} 