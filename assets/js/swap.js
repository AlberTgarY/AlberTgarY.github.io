/*******************************************************************************
 * Going between the pages in the top bar without loading the whole site again.
 *
 * Only the page's own content (the .swap-panel in the main container) changes:
 * the old one slides out, then the new one slides in from the side its tab
 * lies on, at the top of the page, and a line under the tabs slides along to
 * the new tab. Every page seen stays in the document, hidden (display: none,
 * so nothing of it is drawn), and coming back to one finds it as it was left:
 * the playground living on, the music playing.
 *
 * A page shown for the first time has its scripts run once it is in place;
 * then a `swap:content` event on its panel lets the site's scripts (common.js,
 * zoom.js) set up in it what they set up on a page load. `swap:placed` on a
 * panel says it has just taken the old one's place (progress-bar.js fits the
 * page's top to the top bar, taller with the name on a phone), and each
 * arrival ends with `swap:shown`. Anything else (another site, a new tab, a
 * page not in the top bar, a link to a #part of a page) loads as before.
 ******************************************************************************/
(() => {
  const main = document.querySelector('[role="main"]');
  const first = main && main.querySelector(":scope > .swap-panel");
  const nav = document.querySelector("#navbar .navbar-nav");
  if (!first || !nav || !window.fetch || !first.animate) return;

  const OUT_MS = 180; // the old page sliding out, speeding up
  const IN_MS = 320; // the new one sliding in, slowing down
  const EASE_OUT = "cubic-bezier(0.4, 0, 1, 1)";
  const EASE_IN = "cubic-bezier(0.22, 0.61, 0.36, 1)";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pathOf = (url) => new URL(url, location.href).pathname.replace(/index\.html$/, "");
  const tabs = [...nav.querySelectorAll(".nav-item > a.nav-link[href]")].filter((a) => a.origin === location.origin && !a.dataset.toggle);
  const order = tabs.map((a) => pathOf(a.href)); // left to right
  const BRAND = "#navbar .navbar-brand.title"; // the name, top left, on every page but the about page

  // path -> { panel, title, brand (whether the page has the name top left), ran (its scripts) }
  const pages = new Map([[pathOf(location.href), { panel: first, title: document.title, brand: !!document.querySelector(BRAND), ran: true }]]);
  const fetching = new Map(); // path -> the page's document, parsed, on its way
  let here = pathOf(location.href);
  let latest = 0; // the latest move; an earlier one still loading gives way to it
  let settle = null; // ends the slide under way at once

  history.scrollRestoration = "manual";
  history.replaceState({ swap: true }, "");

  // The line under the tab in view.
  tabs.forEach((a) => a.querySelector(".sr-only")?.remove()); // ("(current)": aria-current says it instead)
  const line = Object.assign(document.createElement("li"), { className: "nav-line" });
  line.setAttribute("aria-hidden", "true");
  nav.append(line);
  function placeLine() {
    const a = tabs.find((t) => t.parentElement.classList.contains("active"));
    if (!a || !a.offsetWidth) return void (line.style.opacity = "0");
    const css = getComputedStyle(a);
    const left = a.getBoundingClientRect().left - nav.getBoundingClientRect().left + parseFloat(css.paddingLeft);
    const width = a.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    line.style.transform = `translateX(${left}px) scaleX(${width})`;
    line.style.opacity = "";
  }
  function mark(path) {
    tabs.forEach((a) => {
      const on = pathOf(a.href) === path;
      a.parentElement.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    placeLine();
  }
  mark(here);
  requestAnimationFrame(() => line.classList.add("moving")); // (in place at once on the first page)
  window.addEventListener("resize", placeLine);
  document.fonts?.ready.then(placeLine);

  const loaded = (el) => new Promise((done) => (el.onload = el.onerror = done));

  function load(path) {
    if (!fetching.has(path)) {
      const doc = fetch(path)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((html) => new DOMParser().parseFromString(html, "text/html"));
      doc.catch(() => fetching.delete(path)); // (tried again next time)
      fetching.set(path, doc);
    }
    return fetching.get(path);
  }

  // The style sheets and scripts a page has that this document has not yet (the cv's table of contents, say).
  async function bringIn(doc) {
    const have = new Set(
      [...document.querySelectorAll("link[rel~='stylesheet'][href], script[src]")].map((el) => el.getAttribute("href") ?? el.getAttribute("src"))
    );
    const sheets = [...doc.head.querySelectorAll("link[rel~='stylesheet'][href]")].filter((l) => !have.has(l.getAttribute("href")));
    await Promise.all(
      sheets.map((l) => {
        const sheet = document.importNode(l);
        const done = loaded(sheet);
        document.head.append(sheet);
        return done;
      })
    );
    for (const s of doc.body.querySelectorAll("script[src]")) {
      if (s.closest(".swap-panel") || have.has(s.getAttribute("src"))) continue;
      await run(s, document.body);
    }
  }

  // A script from a parsed page does not run where it is put; a fresh copy of it does. External ones in turn.
  function run(script, into) {
    const s = document.createElement("script");
    for (const { name, value } of script.attributes) s.setAttribute(name, value);
    s.textContent = script.textContent;
    const done = s.src && s.type !== "module" ? loaded(s) : null;
    if (into) into.append(s);
    else script.replaceWith(s);
    return done;
  }

  async function arrive(path, page) {
    if (!page.ran) {
      page.ran = true;
      for (const s of page.panel.querySelectorAll("script")) await run(s);
      page.panel.dispatchEvent(new CustomEvent("swap:content", { bubbles: true }));
      window.MathJax?.typesetPromise?.([page.panel]);
    }
    page.panel.dispatchEvent(new CustomEvent("swap:shown", { bubbles: true }));
  }

  async function go(path) {
    const move = ++latest;
    mark(path);
    window.jQuery?.("#navbarNav.show").collapse("hide"); // (the menu on a phone)
    let page = pages.get(path);
    if (!page) {
      let doc;
      try {
        doc = await load(path);
      } catch {
        return location.replace(path);
      }
      if (move !== latest) return;
      const content = doc.querySelector('[role="main"] > .swap-panel');
      if (!content) return location.replace(path);
      await bringIn(doc);
      if (move !== latest) return;
      fetching.delete(path);
      page = { panel: document.importNode(content, true), title: doc.title, brand: !!doc.querySelector(BRAND), ran: false };
      page.panel.hidden = true;
      main.append(page.panel);
      pages.set(path, page);
      const brand = doc.querySelector(BRAND);
      if (brand && !document.querySelector(BRAND)) document.querySelector("#navbar .navbar-toggler").before(document.importNode(brand, true));
    }
    const from = pages.get(here);
    const dir = order.indexOf(path) < order.indexOf(here) ? -1 : 1;
    here = path;
    document.title = page.title;
    const brand = document.querySelector(BRAND);
    if (brand) brand.hidden = !page.brand;
    slide(from.panel, page.panel, dir, () => here === path && arrive(path, page));
  }

  // The old panel slides out where it is; once it is gone, the new one takes its place at the top of the page
  // and slides in. One panel in the flow of the page at a time, nothing pinned, so the page is never other than
  // the one in view, at the top. Only transform and opacity change, which the compositor animates on its own.
  function slide(from, to, dir, arrived) {
    settle?.();
    const swap = () => {
      from.hidden = true;
      to.hidden = false;
      to.dispatchEvent(new CustomEvent("swap:placed", { bubbles: true }));
      window.scrollTo(0, 0);
    };
    if (reducedMotion.matches) {
      swap();
      return arrived();
    }
    const d = Math.min(120, window.innerWidth * 0.12) * dir;
    let anim = from.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translateX(${-d}px)`, opacity: 0 },
      ],
      { duration: OUT_MS, easing: EASE_OUT }
    );
    settle = () => {
      anim.cancel();
      swap();
      settle = null;
    };
    anim.onfinish = () => {
      swap();
      anim = to.animate(
        [
          { transform: `translateX(${d}px)`, opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: IN_MS, easing: EASE_IN }
      );
      settle = () => {
        anim.cancel();
        settle = null;
      };
      anim.onfinish = () => {
        settle = null;
        arrived();
      };
    };
  }

  const ours = (a) => {
    if (!a || a.origin !== location.origin || a.hash || a.hasAttribute("download") || (a.target && a.target !== "_self")) return null;
    const path = pathOf(a.href);
    return order.includes(path) || pages.has(path) ? path : null;
  };
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const path = ours(e.target.closest?.("a[href]"));
    if (!path) return;
    e.preventDefault();
    if (path === here) return;
    history.pushState({ swap: true }, "", path);
    go(path);
  });
  window.addEventListener("popstate", () => {
    const path = pathOf(location.href);
    if (path === here) return; // (a #part of this page)
    if (order.includes(path) || pages.has(path)) go(path);
    else location.reload();
  });
  // Fetched ahead while the pointer is on a tab, so it is (nearly) there on the click.
  const ahead = (e) => {
    const path = ours(e.target.closest?.("a[href]"));
    if (path && !pages.has(path)) load(path).catch(() => {});
  };
  document.getElementById("navbar").addEventListener("pointerover", ahead, { passive: true });
  document.getElementById("navbar").addEventListener("focusin", ahead);
})();
