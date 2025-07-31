---
title: HomePage
layout: base.html
---

Put something here!

{% if tools %}
  {% for tool in tools %}
    <h3><a href="{{ tool.url }}">{{ tool.data.title }}</a></h3>
    <p>{{ tool.data.desc }}</p>
    <a href="{{ tool.url }}" role="button" class="btn">Explore</a>
  {% endfor %}
{% else %}
  <p>No tools available at the moment.</p>
{% endif %}

