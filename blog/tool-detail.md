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
  MetaDescription: "{{ tool.MetaDescription | default: 'No description available' }}"
---


{{ tool.Introduction }}


## {{ tool.H2 }}
<a href="{{ tool.url }}">{{ tool.data.title }}</a>
{{ tool.Introduction2 }}

## {{ tool.H3 }}

{{ tool.Introduction3 }}

## {{ tool.H4 }}

{{ tool.Introduction4 }}
