/**
 * ═══════════════════════════════════════════════════════════════
 * LUXURY BIRTHDAY CARD — script.js  v4.0
 * ─────────────────────────────────────────────────────────────
 * Complete scene-transition engine rewrite.
 * Every page change now uses a natural, directional animation
 * instead of a flat opacity crossfade.
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG
═══════════════════════════════════════════════════════════════ */
const CONFIG = {
  message: [
    "Tanvi,",
    "There are people who walk into your life and quietly rearrange everything — the way sunlight does when it finally finds its way through curtains. You are one of those people.",
    "Today isn't just a birthday. It's a celebration of every laugh you've shared, every gentle word you've spoken, and every moment of warmth you've brought into the lives of those around you.",
    "May this new year carry with it only the softest mornings, the richest evenings, and all the joy that a heart as beautiful as yours deserves.",
    "You are truly, deeply loved.",
  ],
  msgInitialDelay: 600,
  msgStaggerDelay: 1000,
  signatureDelay: 500,
  musicSrc: 'assets/music/birthday.mp3',
};

/* ═══════════════════════════════════════════════════════════════
   2. STATE
═══════════════════════════════════════════════════════════════ */
const STATE = {
  currentScene:    'cover',
  transitioning:   false,     // lock to prevent double-clicks
  cardOpened:      false,
  mediaItems:      [],
  lightboxIndex:   -1,
  lightboxOpen:    false,
  musicPlaying:    false,
  messagePlayed:   false,
  collageAnimated: false,
  touchStartScale: 1,
  lbScale:         1,
};

/* ═══════════════════════════════════════════════════════════════
   3. HELPERS
═══════════════════════════════════════════════════════════════ */
const clamp   = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const rand    = (lo, hi)    => Math.random() * (hi - lo) + lo;
const randInt = (lo, hi)    => Math.floor(rand(lo, hi + 1));
const delay   = (ms)        => new Promise(r => setTimeout(r, ms));
const $       = id          => document.getElementById(id);
const $$      = sel         => document.querySelectorAll(sel);

/** Wait for a CSS animation to end on an element */
function awaitAnimation(el) {
  return new Promise(resolve => {
    const done = () => { el.removeEventListener('animationend', done); resolve(); };
    el.addEventListener('animationend', done);
  });
}

/* ═══════════════════════════════════════════════════════════════
   4. SCENE TRANSITION ENGINE
   ─────────────────────────────────────────────────────────────
   Instead of opacity crossfade, each transition specifies a
   CSS exit animation class for the leaving scene and an
   enter animation class for the arriving scene.
   
   The engine:
   1. Applies the exit class to the current scene
   2. Waits for its animationend
   3. Hides the old scene, cleans up classes
   4. Shows the new scene, applies the enter class
   5. Waits for its animationend
   6. Cleans up and marks active
═══════════════════════════════════════════════════════════════ */
const Scenes = {
  cover:  $('scene-cover'),
  inside: $('scene-inside'),
  back:   $('scene-back'),
  final:  $('scene-final'),
};

/**
 * Transition from one scene to another with directional animation.
 * @param {string} to        - Scene key ('cover','inside','back','final')
 * @param {string} exitAnim  - CSS class for exit animation (e.g. 'exit-fade-down')
 * @param {string} enterAnim - CSS class for enter animation (e.g. 'enter-fade-up')
 */
async function transition(to, exitAnim, enterAnim) {
  const from = STATE.currentScene;
  if (from === to || STATE.transitioning) return;
  STATE.transitioning = true;

  const oldEl = Scenes[from];
  const newEl = Scenes[to];

  // 1. Exit the old scene
  oldEl.classList.remove('active');
  oldEl.classList.add(exitAnim);
  await awaitAnimation(oldEl);

  // 2. Hide old scene, reset classes
  oldEl.style.visibility = 'hidden';
  oldEl.style.opacity = '0';
  oldEl.classList.remove(exitAnim);
  oldEl.setAttribute('hidden', '');

  // 3. Show new scene, apply enter
  newEl.removeAttribute('hidden');
  newEl.style.visibility = 'visible';
  newEl.style.opacity = '0';
  newEl.classList.add(enterAnim);

  // Force reflow so the animation plays from the start
  void newEl.offsetWidth;

  await awaitAnimation(newEl);

  // 4. Clean up: mark active, reset inline styles
  newEl.classList.remove(enterAnim);
  newEl.classList.add('active');
  newEl.style.visibility = '';
  newEl.style.opacity = '';
  oldEl.style.visibility = '';
  oldEl.style.opacity = '';

  STATE.currentScene = to;
  STATE.transitioning = false;
}

/* ═══════════════════════════════════════════════════════════════
   5. BACKGROUND CANVASES — Stars
═══════════════════════════════════════════════════════════════ */
(function initStars() {
  const canvas = $('stars-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, stars;

  class Star {
    constructor() {
      this.x     = rand(0, window.innerWidth);
      this.y     = rand(0, window.innerHeight);
      this.r     = rand(0.25, 1.5);
      this.alpha = rand(0.15, 0.85);
      this.delta = rand(0.003, 0.01) * (Math.random() > 0.5 ? 1 : -1);
    }
    update() {
      this.alpha += this.delta;
      if (this.alpha <= 0.08 || this.alpha >= 0.92) this.delta *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 248, 220, ${clamp(this.alpha, 0, 1)})`;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: 220 }, () => new Star());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  loop();
})();

/* ═══════════════════════════════════════════════════════════════
   5b. BACKGROUND — Glow Particles
═══════════════════════════════════════════════════════════════ */
(function initGlowParticles() {
  const canvas = $('particles-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;

  class GlowParticle {
    constructor() { this.reset(); this.life = randInt(0, this.maxLife); }
    reset() {
      this.x        = rand(0, window.innerWidth);
      this.y        = rand(window.innerHeight * 0.15, window.innerHeight * 0.9);
      this.r        = rand(1.5, 3.8);
      this.alpha    = 0;
      this.maxAlpha = rand(0.1, 0.28);
      this.vx       = rand(-0.12, 0.12);
      this.vy       = rand(-0.22, -0.06);
      this.life     = 0;
      this.maxLife  = rand(140, 300);
      this.hue      = Math.random() > 0.5 ? '43,78%,55%' : '26,52%,58%';
    }
    update() {
      this.life++;
      const t = this.life / this.maxLife;
      this.alpha = t < 0.2 ? (t / 0.2) * this.maxAlpha
                 : t > 0.8 ? ((1 - t) / 0.2) * this.maxAlpha
                 : this.maxAlpha;
      this.x += this.vx;
      this.y += this.vy;
      if (this.life >= this.maxLife) this.reset();
    }
    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.5);
      g.addColorStop(0, `hsla(${this.hue},${clamp(this.alpha, 0, 1)})`);
      g.addColorStop(1, `hsla(${this.hue},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles = Array.from({ length: 60 }, () => new GlowParticle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  loop();
})();

/* ═══════════════════════════════════════════════════════════════
   5c. Floating Petals
═══════════════════════════════════════════════════════════════ */
(function initPetals() {
  const container = $('petals-container');
  for (let i = 0; i < 15; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = rand(7, 15);
    Object.assign(petal.style, {
      left:              `${rand(4, 96)}%`,
      width:             `${size}px`,
      height:            `${size * 1.45}px`,
      animationDuration: `${rand(15, 30)}s`,
      animationDelay:    `${rand(-25, 0)}s`,
      opacity:           `${rand(0.28, 0.65)}`,
    });
    container.appendChild(petal);
  }
})();

/* ═══════════════════════════════════════════════════════════════
   6. PAGE NAVIGATION — All Transitions Defined
═══════════════════════════════════════════════════════════════ */
const greetingCard = $('greeting-card');
const ribbon       = $('ribbon');

// ── COVER → INSIDE (Card Opening) ──
async function openCard() {
  if (STATE.cardOpened || STATE.transitioning) return;
  STATE.cardOpened = true;
  STATE.transitioning = true;

  // 1. Untie ribbon with a soft float-away
  ribbon.classList.add('untying');
  await delay(700);

  // 2. Card front cover swings open from left hinge
  greetingCard.classList.add('opening');
  await delay(1200);

  // 3. Start fading cover scene while card is mid-swing
  Scenes.cover.classList.remove('active');
  Scenes.cover.classList.add('exit-fade-down');
  await delay(800);

  // 4. Finalise hide
  Scenes.cover.style.visibility = 'hidden';
  Scenes.cover.style.opacity = '0';
  Scenes.cover.classList.remove('exit-fade-down');
  Scenes.cover.setAttribute('hidden', '');

  // 5. Show inside scene with a gentle zoom-in (like book pages spreading)
  Scenes.inside.removeAttribute('hidden');
  Scenes.inside.style.visibility = 'visible';
  Scenes.inside.style.opacity = '0';
  Scenes.inside.classList.add('enter-zoom-in');
  void Scenes.inside.offsetWidth;
  await awaitAnimation(Scenes.inside);

  Scenes.inside.classList.remove('enter-zoom-in');
  Scenes.inside.classList.add('active');
  Scenes.inside.style.visibility = '';
  Scenes.inside.style.opacity = '';
  Scenes.cover.style.visibility = '';
  Scenes.cover.style.opacity = '';

  STATE.currentScene = 'inside';
  STATE.transitioning = false;

  // Trigger content reveals
  revealCollage();
  revealMessage();
}

$('open-card-btn').addEventListener('click', openCard);
greetingCard.addEventListener('click', openCard);
greetingCard.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); }
});

// ── Cover hover tilt ──
greetingCard.addEventListener('mousemove', e => {
  if (STATE.cardOpened) return;
  const { left, top, width, height } = greetingCard.getBoundingClientRect();
  const dx = (e.clientX - left - width / 2)  / (width / 2);
  const dy = (e.clientY - top  - height / 2) / (height / 2);
  greetingCard.style.transform = `rotateY(${dx * 5}deg) rotateX(${-dy * 3.5}deg) scale(1.012)`;
});
greetingCard.addEventListener('mouseleave', () => {
  if (!STATE.cardOpened) greetingCard.style.transform = '';
});

// ── INSIDE → COVER (Back button) ──
$('nav-back-to-cover-btn').addEventListener('click', async () => {
  if (STATE.transitioning) return;

  // Reset card
  greetingCard.classList.remove('opening');
  greetingCard.style.transform = '';
  ribbon.classList.remove('untying');

  await transition('cover', 'exit-zoom-out', 'enter-dissolve');

  STATE.cardOpened = false;
});

// ── INSIDE → BACK COVER ──
// This is like flipping to the back of the card — a horizontal slide
$('nav-to-back-btn').addEventListener('click', async () => {
  if (STATE.transitioning) return;
  await transition('back', 'exit-slide-right', 'enter-slide-left');
  // Show nav after transition completes
  $('back-nav').classList.remove('nav-hidden');
});

// ── BACK COVER → INSIDE (Going backward) ──
$('nav-back-to-inside-btn').addEventListener('click', async () => {
  if (STATE.transitioning) return;
  // Hide back nav before animating
  $('back-nav').classList.add('nav-hidden');
  await delay(200);
  // Reverse direction: slide back from the right
  await transition('inside', 'exit-slide-right', 'enter-slide-left');
});

// ── BACK COVER → FINAL (Cinematic zoom-dissolve) ──
$('nav-to-final-btn').addEventListener('click', async () => {
  if (STATE.transitioning) return;
  $('back-nav').classList.add('nav-hidden');
  await delay(200);
  await transition('final', 'exit-shrink-dissolve', 'enter-dissolve');
  initGoldenSparkles();
});

// ── FINAL → COVER (Replay) ──
$('replay-btn').addEventListener('click', async () => {
  if (STATE.transitioning) return;

  // Reset everything
  STATE.cardOpened = false;
  STATE.messagePlayed = false;
  STATE.collageAnimated = false;
  greetingCard.classList.remove('opening');
  greetingCard.style.transform = '';
  ribbon.classList.remove('untying');
  $('inside-nav').classList.add('nav-hidden');
  $('back-nav').classList.add('nav-hidden');
  $('message-container').innerHTML = '';
  $('signature').classList.remove('visible');
  $('heart-outline-path').className.baseVal = '';
  $('heart-outline-path').style.strokeDashoffset = '1000';
  $('collage-caption').classList.remove('visible');

  // Reset polaroids to center
  $$('#heart-collage .polaroid').forEach(pol => {
    pol.style.opacity = '0';
    pol.style.transform = `translate(${pol.dataset.cx}px, ${pol.dataset.cy}px) scale(0) rotate(0deg)`;
    pol.style.animation = '';
  });

  await transition('cover', 'exit-zoom-out', 'enter-fade-up');
});

/* ═══════════════════════════════════════════════════════════════
   7. STATE 2 — Inside Card: Message & Collage
═══════════════════════════════════════════════════════════════ */
const msgContainer = $('message-container');
const signatureEl  = $('signature');

async function revealMessage() {
  if (STATE.messagePlayed) return;
  STATE.messagePlayed = true;

  await delay(CONFIG.msgInitialDelay);

  for (let i = 0; i < CONFIG.message.length; i++) {
    const para = document.createElement('p');
    para.className = 'msg-paragraph';
    para.textContent = CONFIG.message[i];
    msgContainer.appendChild(para);

    await delay(30);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => para.classList.add('visible'));
    });
    await delay(CONFIG.msgStaggerDelay);

    if (i < CONFIG.message.length - 1) {
      const sparkle = document.createElement('span');
      sparkle.className = 'sparkle-sep';
      sparkle.setAttribute('aria-hidden', 'true');
      sparkle.textContent = '✦ ✦ ✦';
      msgContainer.appendChild(sparkle);
      await delay(80);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => sparkle.classList.add('burst'));
      });
      await delay(300);
    }
  }

  await delay(CONFIG.signatureDelay);
  signatureEl.classList.add('visible');
}

/* ─── Media Discovery ─── */
function probeImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => { img.src = ''; resolve(false); }, 600);
    img.onload  = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = src;
  });
}

function probeVideo(src) {
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const timer = setTimeout(() => { v.src = ''; resolve(false); }, 600);
    v.onloadedmetadata = () => { clearTimeout(timer); resolve(true); };
    v.onerror          = () => { clearTimeout(timer); resolve(false); };
    v.src = src;
  });
}

async function discoverMedia() {
  const found = [];

  const photoSrcSet = new Set();
  for (let i = 1; i <= 35; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    photoSrcSet.add(`assets/photos/photo${pad}.jpg`);
    photoSrcSet.add(`assets/photos/photo${pad}.png`);
    photoSrcSet.add(`assets/photos/photo${pad}.webp`);
    photoSrcSet.add(`assets/photos/photo${i}.jpg`);
  }
  const photoSrcs = Array.from(photoSrcSet);

  const videoSrcSet = new Set();
  for (let i = 1; i <= 25; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    videoSrcSet.add(`assets/videos/video${pad}.mp4`);
    videoSrcSet.add(`assets/videos/video${i}.mp4`);
  }
  const videoSrcs = Array.from(videoSrcSet);

  const BATCH = 15;
  for (let i = 0; i < photoSrcs.length; i += BATCH) {
    const batch   = photoSrcs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(probeImage));
    results.forEach((ok, idx) => {
      if (ok) found.push({ src: batch[idx], type: 'photo' });
    });
  }

  for (let i = 0; i < videoSrcs.length; i += BATCH) {
    const batch   = videoSrcs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(probeVideo));
    results.forEach((ok, idx) => {
      if (ok) found.push({ src: batch[idx], type: 'video' });
    });
  }

  return found;
}

/* ─── Heart Layout ─── */
function getHeartLayout(count, cx, cy, S) {
  const points = [];
  const largeCount = Math.max(1, Math.floor(count * 0.1));
  const medCount   = Math.max(1, Math.floor(count * 0.3));
  const smallCount = Math.max(1, count - largeCount - medCount);

  const pos = (t, rScale) => {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    return { x: cx + (S * rScale * x) / 16, y: cy + (S * rScale * y) / 16 };
  };

  for (let i = 0; i < largeCount; i++) {
    const t = (i / largeCount) * 2 * Math.PI + Math.PI / 2;
    points.push({ ...pos(t, 0.22), sizeClass: 'large' });
  }
  for (let i = 0; i < medCount; i++) {
    const t = (i / medCount) * 2 * Math.PI + Math.PI / 4;
    points.push({ ...pos(t, 0.55), sizeClass: 'medium' });
  }
  for (let i = 0; i < smallCount; i++) {
    const t = (i / smallCount) * 2 * Math.PI;
    points.push({ ...pos(t, 0.86), sizeClass: 'small' });
  }

  return points;
}

/* ─── Build Collage ─── */
async function buildCollage() {
  const collageEl = $('heart-collage');
  collageEl.innerHTML = '';

  const items = await discoverMedia();
  STATE.mediaItems = items;

  if (items.length === 0) {
    collageEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;color:var(--charcoal-light);font-family:var(--font-ui);font-size:0.72rem;
        text-align:center;padding:20px;letter-spacing:0.08em;line-height:1.6">
        <div style="font-size:1.5rem;color:var(--gold);margin-bottom:10px">✦</div>
        Place your photos in<br/><code>assets/photos/</code><br/>
        and videos in <code>assets/videos/</code>
      </div>`;
    return;
  }

  const rect  = collageEl.getBoundingClientRect();
  const W     = rect.width  || 300;
  const H     = rect.height || 300;
  const tileBase = Math.min(W, H) * 0.23;
  const cx = W / 2;
  const cy = H / 2 + H * 0.05;
  const S  = Math.min(W, H) * 0.44;

  const points = getHeartLayout(items.length, cx, cy, S);
  const count  = Math.min(items.length, points.length);
  const frag   = document.createDocumentFragment();

  for (let idx = 0; idx < count; idx++) {
    const item = items[idx];
    const pt   = points[idx];
    const rot  = rand(-11, 11);

    let w = tileBase * 0.76;
    if (pt.sizeClass === 'large')  w = tileBase * 1.32;
    if (pt.sizeClass === 'medium') w = tileBase * 1.0;

    const pol = document.createElement('div');
    pol.className = `polaroid ${pt.sizeClass} ${item.type === 'video' ? 'video-type' : ''}`;
    pol.tabIndex  = 0;
    pol.setAttribute('role', 'button');
    pol.setAttribute('aria-label', `Memory ${idx + 1} of ${count}`);

    const wrap = document.createElement('div');
    wrap.className = 'polaroid-img-wrap';
    wrap.style.width = wrap.style.height = `${w}px`;

    if (item.type === 'photo') {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = item.src;
      img.alt = `Memory ${idx + 1}`;
      wrap.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = item.src;
      vid.preload = 'metadata';
      vid.muted = true;
      vid.playsInline = true;
      wrap.appendChild(vid);

      const play = document.createElement('div');
      play.className = 'play-icon';
      play.innerHTML = '▶';
      pol.appendChild(play);
    }

    const foot = document.createElement('div');
    foot.className = 'polaroid-foot';
    pol.appendChild(wrap);
    pol.appendChild(foot);

    const tx = pt.x - w / 2;
    const ty = pt.y - (w + w * 0.16) / 2;

    pol.dataset.tx = tx;
    pol.dataset.ty = ty;
    pol.dataset.rot = rot;
    pol.dataset.cx = cx - w / 2;   // store center for replay reset
    pol.dataset.cy = cy - w / 2;

    pol.style.cssText = `
      width: ${w}px;
      left: 0; top: 0;
      transform: translate(${cx - w/2}px, ${cy - w/2}px) scale(0) rotate(0deg);
      opacity: 0;
      z-index: ${10 + idx};
    `;

    pol.addEventListener('click', () => openLightbox(idx));
    pol.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); }
    });

    frag.appendChild(pol);
  }

  collageEl.appendChild(frag);
}

/* ─── Reveal Collage Fly-in ─── */
async function revealCollage() {
  if (STATE.collageAnimated) return;
  STATE.collageAnimated = true;

  const pols        = $$('#heart-collage .polaroid');
  const outlinePath = $('heart-outline-path');
  const caption     = $('collage-caption');
  const insideNav   = $('inside-nav');

  if (pols.length === 0) {
    insideNav.classList.remove('nav-hidden');
    return;
  }

  insideNav.classList.add('nav-hidden');
  caption.classList.remove('visible');

  // 1. Draw gold outline
  outlinePath.style.strokeDashoffset = '1000';
  outlinePath.classList.remove('sweep');
  outlinePath.classList.add('active');
  void outlinePath.offsetWidth;
  outlinePath.style.strokeDashoffset = '0';

  // 2. Stagger each polaroid flying in
  pols.forEach((pol, idx) => {
    const tx  = pol.dataset.tx;
    const ty  = pol.dataset.ty;
    const rot = pol.dataset.rot;
    const t   = (idx / pols.length) * 1900;

    setTimeout(() => {
      pol.style.setProperty('--tx', `${tx}px`);
      pol.style.setProperty('--ty', `${ty}px`);
      pol.style.setProperty('--rot', `${rot}deg`);
      pol.style.transform = `translate(${tx}px, ${ty}px) scale(1) rotate(${rot}deg)`;
      pol.style.opacity   = '1';

      // Gentle hovering after landing
      pol.style.animation = `polFloat ${rand(3.5, 5.5).toFixed(2)}s ease-in-out ${rand(0, 2.5).toFixed(2)}s infinite`;

      pol.addEventListener('mouseenter', () => {
        pol.style.transform = `translate(${tx}px, ${ty}px) scale(1.15) rotate(0deg)`;
        pol.style.zIndex    = '100';
      });
      pol.addEventListener('mouseleave', () => {
        pol.style.transform = `translate(${tx}px, ${ty}px) scale(1) rotate(${rot}deg)`;
        pol.style.zIndex    = `${10 + idx}`;
      });
    }, t);
  });

  // 3. Gold sweep after photos land
  setTimeout(() => outlinePath.classList.add('sweep'), 2200);

  // 4. Show caption + nav
  setTimeout(() => {
    caption.classList.add('visible');
    insideNav.classList.remove('nav-hidden');
  }, 3200);
}

/* ═══════════════════════════════════════════════════════════════
   8. LIGHTBOX
═══════════════════════════════════════════════════════════════ */
const lightbox  = $('lightbox');
const lbImg     = $('lightbox-img');
const lbVideo   = $('lightbox-video');
const lbClose   = $('lightbox-close');
const lbPrev    = $('lightbox-prev');
const lbNext    = $('lightbox-next');
const lbCounter = $('lightbox-counter');

function openLightbox(index) {
  if (!STATE.mediaItems.length) return;
  STATE.lightboxIndex = clamp(index, 0, STATE.mediaItems.length - 1);
  STATE.lightboxOpen  = true;
  STATE.lbScale       = 1;
  lightbox.removeAttribute('hidden');
  void lightbox.offsetWidth;
  requestAnimationFrame(() => lightbox.classList.add('open'));
  renderLightboxItem();
  lbClose.focus();
}

function closeLightbox() {
  STATE.lightboxOpen = false;
  lbVideo.pause();
  lightbox.classList.remove('open');
  setTimeout(() => {
    lightbox.setAttribute('hidden', '');
    lbImg.setAttribute('hidden', '');
    lbVideo.setAttribute('hidden', '');
    lbImg.src = '';
    lbVideo.src = '';
  }, 420);
}

function renderLightboxItem() {
  const item = STATE.mediaItems[STATE.lightboxIndex];
  lbCounter.textContent = `${STATE.lightboxIndex + 1} / ${STATE.mediaItems.length}`;

  lbImg.style.opacity   = '0';
  lbVideo.style.opacity = '0';

  setTimeout(() => {
    lbVideo.pause();
    lbImg.setAttribute('hidden', '');
    lbVideo.setAttribute('hidden', '');
    lbImg.src   = '';
    lbVideo.src = '';

    if (item.type === 'photo') {
      lbImg.src = item.src;
      lbImg.removeAttribute('hidden');
      lbImg.style.opacity = '1';
    } else {
      lbVideo.src = item.src;
      lbVideo.removeAttribute('hidden');
      lbVideo.style.opacity = '1';
      lbVideo.play().catch(() => {});
    }
  }, 180);
}

function lightboxNav(dir) {
  const len = STATE.mediaItems.length;
  STATE.lightboxIndex = (STATE.lightboxIndex + dir + len) % len;
  STATE.lbScale = 1;
  lbImg.style.transform   = '';
  lbVideo.style.transform = '';
  renderLightboxItem();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click',  () => lightboxNav(-1));
lbNext.addEventListener('click',  () => lightboxNav(1));

/* Swipe */
let lbTouchStartX = 0;
lightbox.addEventListener('touchstart', e => {
  lbTouchStartX = e.touches[0].clientX;
  STATE.touchStartScale = STATE.lbScale;
}, { passive: true });

lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - lbTouchStartX;
  if (Math.abs(dx) > 55 && STATE.lbScale <= 1.05) lightboxNav(dx < 0 ? 1 : -1);
}, { passive: true });

/* Pinch zoom */
let pinchDist0 = 0;
lightbox.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    pinchDist0 = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
  }
}, { passive: true });

lightbox.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    STATE.lbScale = clamp(STATE.touchStartScale * (dist / pinchDist0), 1, 4);
    const el = lbImg.hidden ? lbVideo : lbImg;
    el.style.transform = `scale(${STATE.lbScale})`;
  }
}, { passive: true });

/* ═══════════════════════════════════════════════════════════════
   9. FINAL SCENE — GOLDEN SPARKLES
═══════════════════════════════════════════════════════════════ */
let goldenSparklesRunning = false;

function initGoldenSparkles() {
  if (goldenSparklesRunning) return;
  goldenSparklesRunning = true;

  const canvas = $('golden-sparkles-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, sparkles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Sparkle {
    constructor(burst = false) {
      this.x        = burst ? rand(W * 0.15, W * 0.85) : rand(0, W);
      this.y        = burst ? rand(H * 0.2, H * 0.75)  : rand(H * 0.5, H);
      this.size     = rand(1.2, burst ? 4.5 : 2.8);
      this.alpha    = 0;
      this.maxAlpha = rand(0.55, 1);
      this.vy       = rand(-0.7, -0.22);
      this.vx       = rand(-0.18, 0.18);
      this.life     = 0;
      this.maxLife  = randInt(90, 200);
      this.arms     = randInt(4, 6);
      this.rotation = rand(0, Math.PI * 2);
    }

    draw() {
      this.life++;
      const t = this.life / this.maxLife;
      this.alpha = t < 0.25 ? (t / 0.25) * this.maxAlpha
                 : t > 0.72 ? ((1 - t) / 0.28) * this.maxAlpha
                 : this.maxAlpha;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += 0.04;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = clamp(this.alpha, 0, 1);
      ctx.fillStyle   = `hsl(${rand(40, 54)},88%,${rand(65,85)}%)`;

      const step = (Math.PI * 2) / (this.arms * 2);
      ctx.beginPath();
      for (let i = 0; i < this.arms * 2; i++) {
        const r = i % 2 === 0 ? this.size : this.size * 0.38;
        const a = i * step - Math.PI / 2;
        i === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
                : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      return this.life < this.maxLife;
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  for (let i = 0; i < 70; i++) sparkles.push(new Sparkle(true));

  function loop() {
    ctx.clearRect(0, 0, W, H);
    sparkles = sparkles.filter(s => s.draw());
    if (Math.random() < 0.5) sparkles.push(new Sparkle(false));
    if (sparkles.length < 90) sparkles.push(new Sparkle(true));
    requestAnimationFrame(loop);
  }

  loop();
}

/* ═══════════════════════════════════════════════════════════════
   10. MUSIC PLAYER
═══════════════════════════════════════════════════════════════ */
const musicBtn   = $('music-btn');
const musicLabel = $('music-label');
const musicIcon  = $('music-icon');
const audio      = $('music-audio');

musicBtn.addEventListener('click', async () => {
  if (STATE.musicPlaying) {
    audio.pause();
    musicLabel.textContent = 'Play Our Song';
    musicIcon.textContent  = '𝄞';
    STATE.musicPlaying = false;
  } else {
    try {
      audio.src = CONFIG.musicSrc;
      await audio.play();
      musicLabel.textContent = 'Pause Music';
      musicIcon.textContent  = '⏸';
      STATE.musicPlaying = true;
    } catch (err) {
      console.warn('Playback blocked:', err.message);
    }
  }
});

/* ═══════════════════════════════════════════════════════════════
   11. KEYBOARD
═══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (STATE.lightboxOpen) {
    if (e.key === 'Escape')     { closeLightbox(); return; }
    if (e.key === 'ArrowLeft')  { lightboxNav(-1); return; }
    if (e.key === 'ArrowRight') { lightboxNav(1);  return; }
  }
});

/* ═══════════════════════════════════════════════════════════════
   12. INIT
═══════════════════════════════════════════════════════════════ */
(async function init() {
  Scenes.cover.classList.add('active');
  Scenes.cover.removeAttribute('hidden');
  STATE.currentScene = 'cover';

  buildCollage();
})();
