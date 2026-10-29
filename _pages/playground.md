---
layout: page
permalink: /playground/
title: playground
nav: true
nav_order: 4
---

<div class="playground" role="group" aria-label="A voxel home seen from above, with a kitchen, a living room with a fireplace, stairs up to a loft with a dressing corner, and a vegetable garden, where a girl, a boy, a border collie and a tortoiseshell cat go about their day; a button switches to her flower shop, where she and the collie look after the flowers">
  <div class="playground-stage"></div>
  <div class="playground-loading" role="progressbar" aria-label="Loading the home and the flower shop" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <div class="playground-loading-bar"><span></span></div>
    <p><span class="playground-loading-what">Scripts</span> <span class="playground-loading-pct">0.0%</span></p>
  </div>
</div>
<p class="playground-note">This room needs WebGL, which this browser does not have turned on.</p>

<!-- The loading bar: `show(k, what, part)` moves it on to k (0 to 1, never back) and names what is loading just
now, with how far along that is (0 to 1). The first part is the code arriving (each of the playground's script
files, counted as it comes in); playground.js takes it on from there as it builds the home and the flower shop,
and shows the home once both are all there. -->

{% assign pets = site.static_files | where_exp: "f", "f.path contains 'assets/js/pets/'" | where_exp: "f", "f.name != 'pet.js'" | where_exp: "f", "f.name != 'together.js'" %}

<script>
  (() => {
    const loading = document.querySelector(".playground-loading");
    const fill = loading.querySelector(".playground-loading-bar span");
    const pct = loading.querySelector(".playground-loading-pct");
    const item = loading.querySelector(".playground-loading-what");
    const SCRIPTS = 0.25; // of the bar: the code arriving
    let at = 0;
    loading.show = (k, what, part) => {
      if (k > at) {
        at = Math.min(1, k);
        fill.style.transform = `scaleX(${at})`;
        loading.setAttribute("aria-valuenow", Math.floor(at * 100));
      }
      if (!what) return;
      item.textContent = what;
      pct.textContent = `${(Math.min(1, part) * 100).toFixed(1)}%`;
    };
    const FILES = {{ pets.size | plus: 2 }}; // the pets' scripts, playground.js and three.js
    const CODE = /\/assets\/js\/(playground|pets\/)|three\.module/;
    const seen = new Set();
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (CODE.test(e.name)) seen.add(e.name.split("?")[0]);
      const part = Math.min(1, seen.size / FILES);
      if (at <= SCRIPTS) loading.show(SCRIPTS * part, "Scripts", part); // (playground.js has taken over once past it)
    }).observe({ type: "resource", buffered: true });
  })();
</script>
<script type="module" src="{{ '/assets/js/playground.js' | relative_url | bust_file_cache }}"></script>
