// Royale + Rose Invitation: Merged Royal Elephant & Petal Scratch Date Reveal
// 1. Initial State: Royal Lotus Crown, Elephants on left/right, 'Reveal the Date' plaque button.
// 2. Button Tap: Elephants shower rose petals from their howdahs across the stage, covering the date card.
// 3. Interactive Scratch: Guest scratches/brushes petals aside to uncover '2nd February 2027'.
// 4. Reveal: Once ~25% is brushed, wind blows remaining petals away with celebration pop.
(function () {
  'use strict';

  const section = document.getElementById('ryDateReveal');
  if (!section) return;

  const stage = document.getElementById('petalStage');
  const layer = document.getElementById('petalLayer');
  const dateCard = document.getElementById('dateCard');
  const btn = document.getElementById('ryRevealBtn');
  const hint = document.getElementById('ryPetalHint');
  const elephants = section.querySelectorAll('.royale-date__elephant');

  if (!stage || !layer || !dateCard) return;

  const PETAL_SRC = [
    'media/rose_petals/Property 1=pink1.png',
    'media/rose_petals/Property 1=pink2.png',
    'media/rose_petals/Property 1=re2.png',
    'media/rose_petals/Property 1=red1.png',
    'media/rose_petals/Property 1=red3.png',
    'media/rose_petals/Property 1=yellow.png',
  ];

  // Pre-load petals
  PETAL_SRC.forEach(src => { const img = new Image(); img.src = src; });

  const REVEAL_TARGET = 0.22; // uncover 22% of surface to trigger wind
  const BRUSH_R = 64;         // radius (px) pointer pushes petals
  const GRID_CELL = 32;       // coverage resolution

  let W = 0, H = 0;
  let surface = { x: 0, y: 0, w: 0, h: 0 };
  let petals = [];
  let grid = null;
  let triggered = false;
  let enabled = false;
  let started = false;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function place(p) {
    p.el.style.transform = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px) rotate(${p.rot}deg)`;
  }

  // --- 1. Elephant Petal Shower Animation ---
  function showerFromElephants() {
    if (!elephants.length) return;
    const box = section.getBoundingClientRect();
    const unit = box.width / 100;

    elephants.forEach(el => {
      const r = el.getBoundingClientRect();
      const isLeft = el.classList.contains('royale-date__elephant--left');
      const startX = r.left - box.left + r.width * (isLeft ? 0.45 : 0.55);
      const startY = r.top - box.top + r.height * 0.12;

      // Spawn 22 airborne petals flying inward and upward from each elephant
      for (let i = 0; i < 22; i++) {
        spawnAirbornePetal(startX, startY, isLeft ? 1 : -1, unit, box);
      }
    });
  }

  function spawnAirbornePetal(x, y, dir, unit, box) {
    const flake = document.createElement('div');
    const arc = document.createElement('i');
    const img = document.createElement('img');
    const size = rand(36, 58);

    flake.className = 'ryd-flake';
    arc.className = 'ryd-flake__arc';
    img.className = 'ryd-flake__bead ryd-flower';
    img.src = pick(PETAL_SRC);

    flake.style.left = x.toFixed(1) + 'px';
    flake.style.top = y.toFixed(1) + 'px';
    flake.style.setProperty('--w', size.toFixed(0) + 'px');

    const targetX = (box.width / 2) + rand(-180, 180);
    const dx = (targetX - x) * rand(0.7, 1.15);
    const rise = -rand(120, 240);
    const fall = rand(140, 260);

    flake.style.setProperty('--dx', dx.toFixed(1) + 'px');
    flake.style.setProperty('--rise', rise.toFixed(1) + 'px');
    flake.style.setProperty('--fall', fall.toFixed(1) + 'px');
    flake.style.setProperty('--rot', (rand(-540, 540) | 0) + 'deg');
    flake.style.setProperty('--dur', rand(1100, 1700).toFixed(0) + 'ms');
    flake.style.setProperty('--delay', rand(0, 300).toFixed(0) + 'ms');

    arc.appendChild(img);
    flake.appendChild(arc);
    section.appendChild(flake);

    // Remove airborne petal after flight
    setTimeout(() => { if (flake.parentNode) flake.parentNode.removeChild(flake); }, 2000);
  }

  // --- 2. Build Settle Petals onto the Date Card ---
  function measure() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    const cr = dateCard.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    surface = {
      x: cr.left - sr.left,
      y: cr.top - sr.top,
      w: cr.width,
      h: cr.height,
    };
  }

  function buildPetalLayer() {
    measure();
    layer.innerHTML = '';
    petals = [];

    // Density: enough petals to fully cover the date card
    const count = Math.max(75, Math.round((surface.w * surface.h) / 1900));

    for (let i = 0; i < count; i++) {
      const el = document.createElement('img');
      el.className = 'petal';
      el.src = pick(PETAL_SRC);
      el.alt = '';
      el.draggable = false;

      const size = rand(52, 74);
      el.style.width = size + 'px';
      el.style.height = size + 'px';

      // Distribute with slight padding around the date card
      const x = surface.x + rand(-15, surface.w + 15);
      const y = surface.y + rand(-15, surface.h + 15);
      const rot = rand(0, 360);

      // Start transparent and scaled down, then blossom in
      el.style.opacity = '0';
      el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) scale(0.3) rotate(${rot - 90}deg)`;

      layer.appendChild(el);

      const p = { el, x, y, size, rot, vx: 0, vy: 0 };
      petals.push(p);

      // Animate petals landing into position
      setTimeout(() => {
        el.style.transition = 'all 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        el.style.opacity = '1';
        el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) scale(1) rotate(${rot}deg)`;
        setTimeout(() => { el.style.transition = 'transform 0.35s ease-out'; }, 700);
      }, rand(250, 750));
    }

    initGrid();
  }

  function initGrid() {
    const cols = Math.ceil(surface.w / GRID_CELL);
    const rows = Math.ceil(surface.h / GRID_CELL);
    grid = new Uint8Array(cols * rows);
  }

  // --- 3. Interactive Scratching & Brushing ---
  let down = false;
  let lastX = 0, lastY = 0;

  function pointerPos(e) {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function brush(x, y, dx, dy) {
    if (!enabled || triggered) return;

    let movedAny = false;
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      const px = p.x - x;
      const py = p.y - y;
      const dist2 = px * px + py * py;

      if (dist2 < BRUSH_R * BRUSH_R && dist2 > 0) {
        const d = Math.sqrt(dist2);
        const force = (1 - d / BRUSH_R) * 1.5;
        const pushX = (px / d) * force * 55 + dx * 0.4;
        const pushY = (py / d) * force * 55 + dy * 0.4;

        p.x += pushX;
        p.y += pushY;
        p.rot += (pushX * 1.5);
        place(p);
        movedAny = true;
      }
    }

    if (movedAny) {
      markCoverage(x, y);
      checkReveal();
    }
  }

  function markCoverage(x, y) {
    if (!grid) return;
    const cols = Math.ceil(surface.w / GRID_CELL);
    const rows = Math.ceil(surface.h / GRID_CELL);

    const gx = Math.floor((x - surface.x) / GRID_CELL);
    const gy = Math.floor((y - surface.y) / GRID_CELL);

    for (let r = Math.max(0, gy - 2); r <= Math.min(rows - 1, gy + 2); r++) {
      for (let c = Math.max(0, gx - 2); c <= Math.min(cols - 1, gx + 2); c++) {
        grid[r * cols + c] = 1;
      }
    }
  }

  function checkReveal() {
    if (triggered || !grid) return;
    let covered = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) covered++;
    }

    const ratio = covered / grid.length;
    if (ratio >= REVEAL_TARGET) {
      blowAway();
    }
  }

  function blowAway() {
    if (triggered) return;
    triggered = true;
    enabled = false;

    if (hint) hint.classList.add('is-hidden');

    // Blow all remaining petals away in a gust of wind
    petals.forEach(p => {
      const delay = rand(0, 320);
      const angle = rand(-0.4, 0.4); // upward-right wind
      const dist = rand(700, 1300);

      setTimeout(() => {
        p.el.style.transition = `transform ${rand(1.1, 1.7)}s cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${rand(0.8, 1.3)}s ease`;
        p.el.style.transform = `translate(${p.x + Math.cos(angle) * dist}px, ${p.y - Math.sin(angle) * dist - 300}px) rotate(${p.rot + rand(360, 900)}deg) scale(0.6)`;
        p.el.style.opacity = '0';
      }, delay);
    });

    setTimeout(() => {
      dateCard.classList.add('is-revealed');
      layer.innerHTML = '';
    }, 900);
  }

  // Pointer events on stage
  stage.addEventListener('pointerdown', (e) => {
    if (!enabled || triggered) return;
    down = true;
    const pos = pointerPos(e);
    lastX = pos.x;
    lastY = pos.y;
    brush(pos.x, pos.y, 0, 0);
  });

  window.addEventListener('pointermove', (e) => {
    if (!down || !enabled || triggered) return;
    const pos = pointerPos(e);
    const dx = pos.x - lastX;
    const dy = pos.y - lastY;
    lastX = pos.x;
    lastY = pos.y;
    brush(pos.x, pos.y, dx, dy);
  });

  window.addEventListener('pointerup', () => { down = false; });
  window.addEventListener('pointercancel', () => { down = false; });

  // --- 4. Main Trigger: Reveal Button Tap ---
  if (btn) {
    btn.addEventListener('click', function () {
      if (started) return;
      started = true;

      // Animate button away
      btn.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
      btn.style.transform = 'scale(0.85)';
      btn.style.opacity = '0';
      setTimeout(() => { btn.style.display = 'none'; }, 420);

      // 1. Elephants shower petals
      showerFromElephants();

      // 2. Build settling petal layer over date card
      buildPetalLayer();

      // 3. Show scratch hint & enable brushing
      setTimeout(() => {
        if (hint) {
          hint.hidden = false;
          hint.style.opacity = '0';
          hint.style.transition = 'opacity 0.6s ease';
          void hint.offsetWidth;
          hint.style.opacity = '1';
        }
        enabled = true;
        layer.classList.add('petals-live');
      }, 700);
    });
  }

})();
