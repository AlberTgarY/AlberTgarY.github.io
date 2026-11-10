// Initialize medium zoom, and on the images of a page shown later (swap.js).
$(document).ready(function () {
  medium_zoom = mediumZoom("[data-zoomable]", {
    background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee", // + 'ee' for trasparency.
  });
  document.addEventListener("swap:content", (e) => medium_zoom.attach(e.target.querySelectorAll("[data-zoomable]")));
});
