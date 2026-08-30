/**
 * Interactive geometric background.
 *
 * Floating outlined circles / squares / triangles that drift on a sine path,
 * link up with faint lines when close, and are pushed away (and grow + rotate)
 * by the mouse pointer. Colours follow the site's light/dark theme.
 *
 * Disabled for coarse pointers, reduced-motion users and data-saver mode.
 */
(function () {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  if (reducedMotion.matches || saveData || !finePointer) {
    canvas.style.display = "none";
    return;
  }
  canvas.style.display = "";

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const frameInterval = 1000 / (isSafari || !finePointer ? 30 : 60);

  // Screen area (px squared) that each shape gets to itself -- larger = sparser.
  const AREA_PER_SHAPE = { lite: 79000, safari: 61000, default: 38000 };
  const MIN_SHAPES = { lite: 4, safari: 5, default: 10 };

  // Interaction is only live while the pointer is fine and motion is allowed.
  const interactive = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height;
  let mouseX = -1000, // smoothed pointer position
    mouseY = -1000,
    targetX = -1000, // raw pointer position
    targetY = -1000;
  let time = 0;
  let shapes = [];
  let rafId = null;
  let lastFrame = 0;
  let isDark = false;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createShapes();
  }

  class Shape {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 40 + 20;
      this.baseSize = this.size;
      this.rotation = Math.random() * Math.PI * 2;
      this.baseRotation = this.rotation;
      this.rotationSpeed = (Math.random() - 0.5) * 0.005;
      this.type = Math.floor(Math.random() * 3);
      this.phase = Math.random() * Math.PI * 2;
      this.floatSpeed = Math.random() * 0.3 + 0.1;
      this.opacity = Math.random() * 0.15 + 0.15;
    }

    update() {
      const driftX = Math.sin(time * this.floatSpeed + this.phase) * 15;
      const driftY = Math.cos(time * this.floatSpeed * 0.7 + this.phase) * 10;

      const dx = mouseX - this.baseX;
      const dy = mouseY - this.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 300;

      let pushX = 0,
        pushY = 0,
        grow = 0,
        spin = 0;

      if (interactive() && dist < radius && mouseX > 0) {
        const strength = 1 - dist / radius;
        const angle = Math.atan2(dy, dx);
        pushX = -Math.cos(angle) * strength * 50;
        pushY = -Math.sin(angle) * strength * 50;
        grow = strength * 15;
        spin = strength * 0.5;
      }

      this.x = this.baseX + driftX + pushX;
      this.y = this.baseY + driftY + pushY;
      this.size = this.baseSize + grow;
      this.rotation = this.baseRotation + time * this.rotationSpeed + spin;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.strokeStyle = `rgba(${strokeRGB()}, ${this.opacity})`;
      ctx.lineWidth = 1;

      switch (this.type) {
        case 0: // circle
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 1: // square
          ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
          break;
        case 2: // triangle
          ctx.beginPath();
          ctx.moveTo(0, -this.size / 2);
          ctx.lineTo(this.size / 2, this.size / 2);
          ctx.lineTo(-this.size / 2, this.size / 2);
          ctx.closePath();
          ctx.stroke();
          break;
      }
      ctx.restore();
    }
  }

  function strokeRGB() {
    return isDark ? "160, 160, 160" : "120, 120, 130";
  }

  function createShapes() {
    shapes = [];
    const tier = !interactive() ? "lite" : isSafari ? "safari" : "default";
    const areaPerShape = AREA_PER_SHAPE[tier];
    const minShapes = MIN_SHAPES[tier];
    const count = Math.floor((width * height) / areaPerShape);
    for (let i = 0; i < Math.max(count, minShapes); i++) {
      shapes.push(new Shape());
    }
  }

  function drawConnections() {
    const maxDist = !interactive() ? 160 : isSafari ? 180 : 250;
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const dx = shapes[i].x - shapes[j].x;
        const dy = shapes[i].y - shapes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(shapes[i].x, shapes[i].y);
          ctx.lineTo(shapes[j].x, shapes[j].y);
          ctx.strokeStyle = `rgba(${strokeRGB()}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  let paused = false;
  let running = false;

  const start = () => {
    if (running || paused) return;
    running = true;
    lastFrame = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Don't burn frames on a hidden tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      paused = true;
      stop();
    } else {
      paused = false;
      start();
    }
  });

  function currentThemeIsDark() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function tick(now = performance.now()) {
    if (paused) {
      running = false;
      return;
    }
    if (reducedMotion.matches) {
      ctx.clearRect(0, 0, width, height);
      running = false;
      return;
    }

    rafId = requestAnimationFrame(tick);

    if (isSafari || !finePointer) {
      const elapsed = now - lastFrame;
      if (elapsed < frameInterval) return;
      lastFrame = now - (elapsed % frameInterval);
    }

    ctx.clearRect(0, 0, width, height);
    isDark = currentThemeIsDark();
    time += 0.01;

    if (!interactive()) {
      targetX = -1000;
      targetY = -1000;
    }
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;

    drawConnections();
    shapes.forEach((shape) => {
      shape.update();
      shape.draw();
    });
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });

  window.addEventListener(
    "mousemove",
    (e) => {
      if (interactive()) {
        targetX = e.clientX;
        targetY = e.clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener("mouseleave", () => {
    if (interactive()) {
      targetX = -1000;
      targetY = -1000;
    }
  });

  resize();
  start();
})();
