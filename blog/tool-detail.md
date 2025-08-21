---
pagination:
  data: tools
  size: 1
  alias: tool
  addAllPagesToCollections: true
tags: tool
layout: base.html
permalink: "{% if tool.Slug %}/{{ tool.Slug }}/{% else %}/{{ tool.Keyword | slugify }}/{% endif %}"
templateEngineOverride: md, liquid
eleventyComputed:
  title: "{{ tool.Title | default: 'Untitled Tool' }}"
  MetaDescription: "{{ tool.MetaDescription | default: 'No description available' }}"
---


{{ tool.Introduction }}

{% if tool.H2 and tool.Introduction2 %}
## {{ tool.H2 }}

{{ tool.Introduction2 }}
{% endif %}

{% if tool.H3 and tool.Introduction3 %}
## {{ tool.H3 }}

{{ tool.Introduction3 }}
{% endif %}

{% if tool.H4 and tool.Introduction4 %}
## {{ tool.H4 }}

{{ tool.Introduction4 }}
{% endif %}

{% if tool.Airports and tool.Introduction5 %}
## {{ tool.Airports }}

{{ tool.Introduction5 }}
{% endif %}
