---
layout: page
permalink: /playground/
title: playground
nav: true
nav_order: 4
---

<div class="playground" role="group" aria-label="A voxel home seen from above, with a kitchen, a living room with a fireplace, stairs up to a loft with a dressing corner, and a vegetable garden, where a girl, a boy, a border collie and a tortoiseshell cat go about their day">
  <div class="playground-stage"></div>
  <div class="playground-loading" role="progressbar" aria-label="Loading the home" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <div class="playground-loading-bar"><span></span></div>
    <p>Loading the home… <span class="playground-loading-pct">0%</span></p>
  </div>
</div>
<p class="playground-note">This room needs WebGL, which this browser does not have turned on.</p>

<!-- The loading bar: `show(k)` moves it on to k (0 to 1, never back). The first part is the code arriving (each
of the playground's script files, counted as it comes in); playground.js takes it on from there as it builds
the home, and shows the home once it is all there. -->

{% assign pets = site.static_files | where_exp: "f", "f.path contains 'assets/js/pets/'" %}

<script>
  (() => {
    const loading = document.querySelector(".playground-loading");
    const fill = loading.querySelector(".playground-loading-bar span");
    const pct = loading.querySelector(".playground-loading-pct");
    let at = 0;
    loading.show = (k) => {
      if (k <= at) return;
      at = Math.min(1, k);
      const n = Math.floor(at * 100);
      fill.style.transform = `scaleX(${at})`;
      pct.textContent = `${n}%`;
      loading.setAttribute("aria-valuenow", n);
    };
    const FILES = {{ pets.size | plus: 2 }}; // the pets' scripts, playground.js and three.js
    const CODE = /\/assets\/js\/(playground|pets\/)|three\.module/;
    const seen = new Set();
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (CODE.test(e.name)) seen.add(e.name.split("?")[0]);
      loading.show(0.45 * Math.min(1, seen.size / FILES));
    }).observe({ type: "resource", buffered: true });
  })();
</script>
<script type="module" src="{{ '/assets/js/playground.js' | relative_url | bust_file_cache }}"></script>
