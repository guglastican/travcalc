---
pagination:
  data: tools
  size: 1
  alias: tool
  addAllPagesToCollections: true
tags: tools
layout: base.html
permalink: "/tool/{{ tool.Name }}/"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ tool.Name | default: 'Untitled Tool' }}"
  description: "{{ tool.Description | default: 'No description available' }}"
---

{{ tool.Introduction }}

## Foods  for  {{ tool.Name }} {{ tool.Foods }}