(function () {
  const campaigns = window.CAMPAIGNS.filter(Boolean);
  const live = campaigns.filter((c) => !c.comingSoon);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const posterFor = (src) => src.replace(/\.mp4$/, '.poster.jpg');
  const asItem = (x) => (typeof x === 'string' ? { src: x } : x);

  // Drifting smoke over a still cover: two layers of soft generated noise, tinted green, sliding slowly in opposite directions.
  const smokeLayer = (seed) => `<svg viewBox="0 0 1600 450" preserveAspectRatio="none"><filter id="smk${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0035 0.009" numOctaves="4" seed="${seed}"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .95  0 0 0 0 .5  0 0 0 2.2 -.6"/></filter><rect width="100%" height="100%" filter="url(#smk${seed})"/></svg>`;
  const smokeFx = `<span class="fx-smoke" aria-hidden="true"><span class="fx-smoke-a">${smokeLayer(3)}</span><span class="fx-smoke-b">${smokeLayer(11)}</span></span>`;

  // Dexter: the wordmark melts. Letters and drips are drawn together in one SVG under a "goo" filter,
  // so each drip grows out of a letter like thick blood, swells, and lets a drop fall.
  const drip = (x, w, len, delay, dur) => `<rect x="${x - w / 2}" y="64" width="${w}" height="6" rx="${w / 2}"><animate attributeName="height" values="6;${len};${len * 0.82};${len * 0.82};6" keyTimes="0;.55;.62;.9;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines=".5 0 .5 1;.3 0 .7 1;0 0 1 1;.5 0 .5 1"/></rect><circle cx="${x}" cy="70" r="${w * 0.75}"><animate attributeName="cy" values="${64 + len * 0.5};${64 + len};${64 + len + 4};170;170" keyTimes="0;.55;.62;.9;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines=".5 0 .5 1;.3 0 .7 1;.6 0 1 .7;0 0 1 1"/><animate attributeName="opacity" values="1;1;1;1;0" keyTimes="0;.55;.62;.88;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
  const dexterMelt = `<svg class="melt" viewBox="0 0 320 170" aria-label="Dexter"><defs><linearGradient id="blood" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="150"><stop offset="0" stop-color="#ea1620"/><stop offset=".45" stop-color="#bb0811"/><stop offset="1" stop-color="#6a0005"/></linearGradient><filter id="melt" x="-10%" y="-10%" width="120%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.4"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"/></filter></defs><g filter="url(#melt)" fill="url(#blood)"><text x="168" y="72" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="82" textLength="282" lengthAdjust="spacingAndGlyphs" transform="skewX(-11)">DEXTER</text>${drip(40, 9, 34, 0, 7)}${drip(118, 7, 22, 2.3, 6)}${drip(172, 10, 46, 4.1, 8)}${drip(268, 8, 30, 1.2, 6.5)}${drip(300, 6, 18, 5.2, 5.5)}</g></svg>`;

  // Water ripple: one shared SVG filter. A copy of the cover is warped by slowly shifting noise,
  // masked to the waterline so only the bath moves.
  if (campaigns.some((c) => c.coverFx === 'water')) {
    document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="ripple" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.035" numOctaves="2" seed="4" result="n"><animate attributeName="baseFrequency" dur="9s" values="0.006 0.035;0.008 0.042;0.006 0.035" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
  }

  // Flames around a cover: tall layers of stretched noise, tinted orange and yellow, rising on a loop.
  const flameLayer = (seed, r, g, b, fx, fy) => `<svg viewBox="0 0 800 900" preserveAspectRatio="none"><filter id="fl${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="4" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 3.2 -1.45"/></filter><rect width="100%" height="100%" filter="url(#fl${seed})"/></svg>`;
  const flamesFx = `<span class="fx-flames" aria-hidden="true"><span class="fx-flames-a">${flameLayer(21, 1, .38, .04, 0.0125, 0.005)}${flameLayer(21, 1, .38, .04, 0.0125, 0.005)}</span><span class="fx-flames-b">${flameLayer(37, 1, .8, .25, 0.02, 0.0075)}${flameLayer(37, 1, .8, .25, 0.02, 0.0075)}</span></span>`;

  // MAFS: pastel vines draw themselves around the title, then the flowers open. Loops gently.
  const bloom = (x, y, r, petal, d) => `<g class="bloom" style="--d:${d}s">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - r}" rx="${r * 0.62}" ry="${r}" fill="${petal}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#f7e3a1"/></g>`;
  const leaf = (x, y, a, d) => `<g class="leaf" style="--d:${d}s"><ellipse cx="${x}" cy="${y}" rx="7" ry="3.2" fill="#b7d3ad" transform="rotate(${a} ${x} ${y})"/></g>`;
  const vines = `<svg class="vines" viewBox="-40 -40 480 200" aria-hidden="true">
    <path class="stem" pathLength="100" d="M-30 150 C -10 110, -34 70, -8 40 S 4 -6, 30 -20"/>
    <path class="stem" pathLength="100" style="--d:.5s" d="M430 150 C 400 140, 360 150, 330 136 S 280 132, 262 140"/>
    <path class="stem" pathLength="100" style="--d:1s" d="M440 -30 C 420 -36, 400 -20, 380 -28 S 350 -36, 336 -22"/>
    ${leaf(-14, 92, -60, 1.2)}${leaf(-6, 30, 40, 1.6)}${leaf(380, 141, 15, 1.8)}${leaf(300, 132, -20, 2.1)}${leaf(402, -28, 25, 2)}
    ${bloom(30, -20, 9, '#f6c1cc', 2.2)}${bloom(-18, 70, 7, '#dcc8f2', 2.5)}${bloom(262, 140, 8, '#fbd3b6', 2.6)}${bloom(336, -22, 8, '#f6c1cc', 2.8)}${bloom(410, 146, 6, '#dcc8f2', 3)}${bloom(-30, 150, 6, '#fbd3b6', 2.9)}
  </svg>`;

  // Embers: a soft flicker over the fire and a few sparks drifting up off the flames.
  const embersFx = `<span class="fx-embers" aria-hidden="true"><i class="fx-glow"></i>${[[44.3,59.8,3.91,3.4,1.0,2.2],[35.0,64.1,0.22,4.41,-12.0,1.7],[47.9,67.9,0.74,3.83,3.6,3.1],[53.2,62.8,5.86,3.33,10.0,2.1],[38.0,59.4,1.85,5.49,-8.9,2.5],[55.4,62.5,3.29,3.38,-12.3,1.9],[56.8,63.1,1.88,4.84,-1.3,2.1],[60.8,66.4,1.46,4.81,0.7,3.0],[58.5,61.5,5.88,3.53,-2.3,2.8],[38.3,63.9,0.24,5.07,7.4,2.5],[63.6,61.8,4.17,4.86,2.2,2.3],[62.4,69.3,2.84,5.06,-12.3,2.7],[55.6,69.9,4.93,4.0,-3.2,2.7],[33.8,63.5,1.01,3.53,-12.3,2.8],[37.5,61.0,2.35,5.64,-11.7,2.3],[52.2,68.6,4.92,5.62,-6.2,2.3],[45.6,68.6,5.75,3.62,-9.1,2.0],[41.2,63.8,3.53,3.94,-13.9,2.3]].map(([x, y, d, t, dx, sz]) => `<i class="spark" style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;--dx:${dx}px;animation-duration:${t}s;animation-delay:-${d}s"></i>`).join('')}</span>`;

  // Sauna steam: soft white noise, two layers rising slowly at different speeds.
  const steamLayer = (seed) => `<svg viewBox="0 0 800 900" preserveAspectRatio="none"><filter id="stm${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.004" numOctaves="3" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .97  0 0 0 0 .92  0 0 0 2.4 -1.05"/></filter><rect width="100%" height="100%" filter="url(#stm${seed})"/></svg>`;
  const steamFx = `<span class="fx-steam" aria-hidden="true"><span class="fx-steam-a">${steamLayer(5)}${steamLayer(5)}</span><span class="fx-steam-b">${steamLayer(17)}${steamLayer(17)}</span></span>`;

  /* ---------- Homepage grid ---------- */
  const grid = $('#grid');
  grid.innerHTML = campaigns.map((c) => c.comingSoon
    ? `<div class="tile is-empty reveal" aria-label="${esc(c.title)}: coming soon"><span>${esc(c.title)} · coming soon</span></div>`
    : `<a class="tile reveal" href="#${c.slug}" data-slug="${c.slug}">
        <img src="${c.cover}" alt="" loading="lazy"${c.coverClass ? ` class="${esc(c.coverClass)}"` : ''} style="${c.coverPos ? `object-position:${esc(c.coverPos)};` : ''}${c.coverZoom ? `scale:${+c.coverZoom};` : ''}">
        ${c.preview ? `<video muted loop playsinline preload="none" src="${c.preview}" aria-hidden="true"></video>` : ''}
        ${c.coverFx === 'smoke' ? smokeFx : ''}
        ${c.coverFx === 'bobble' ? `<span class="fx-bobble" aria-hidden="true"><img class="bob bob-1" src="media/gogglebox/head-denise.png" alt=""><img class="bob bob-2" src="media/gogglebox/head-duncan.png" alt=""></span>` : ''}
        ${c.coverFx === 'steam' ? steamFx : ''}
        ${c.coverFx === 'embers' || c.coverFx === 'embers-left' ? embersFx.replace('fx-embers', `fx-embers ${c.coverFx}`) : ''}
        ${c.coverFxVideo ? `<video class="fx-video" muted loop playsinline preload="none" src="${c.coverFxVideo}" aria-hidden="true"></video>` : ''}
        ${c.coverFx === 'water' ? `<span class="fx-water" aria-hidden="true"><img src="${c.cover}" alt="" loading="lazy"></span>` : ''}
        ${c.coverTitle ? `<span class="tile-title-card is-${esc(c.coverTitle.pos || 'left')}${c.coverTitle.style ? ` tt-${esc(c.coverTitle.style)}` : ''}"${c.coverTitle.top ? ` style="top:${esc(c.coverTitle.top)}"` : ''} aria-hidden="true">${c.coverTitle.image ? `<img src="${c.coverTitle.image}" alt="">${c.coverTitle.style === 'flowers' ? vines : ''}${c.coverTitle.style === 'sparkle' ? [[8,18,0],[31,62,1.3],[47,12,2.6],[63,70,.7],[79,22,3.4],[93,58,1.9],[22,88,4.1]].map(([x, y, d]) => `<i class="spk" style="left:${x}%;top:${y}%;animation-delay:${d}s"></i>`).join('') : ''}` : c.coverTitle.style === 'melt' ? dexterMelt : c.coverTitle.style === 'gbh' ? `<span class="gbh-main">${esc(c.coverTitle.text)}</span><span class="gbh-sub">${esc(c.coverTitle.sub || '')}</span>` : c.coverTitle.style === 'ramsay' ? `<span class="rk-1">Ramsay’s</span><span class="rk-2">Kitchen</span><span class="rk-3">Nightmares</span><span class="rk-4">USA</span>` : c.coverTitle.style === 'stage' ? `<span class="sm-1">Stage</span><span class="sm-2">Mother</span>${[[4,8,0],[38,4,1.6],[70,30,.8],[90,6,2.4],[58,92,3.1]].map(([x, y, d]) => `<i class="spk" style="left:${x}%;top:${y}%;animation-delay:${d}s"></i>`).join('')}` : c.coverTitle.style === 'mw' ? `<span class="mw-top">Mitchell and Webb</span><span class="mw-main">Are Not Helping</span>` : c.coverTitle.style === 'dexter' ? `<span class="dx-wrap"><span class="dx-half dx-top">${esc(c.coverTitle.text)}</span><span class="dx-half dx-bot">${esc(c.coverTitle.text)}</span><i class="dx-cut"></i></span>` : c.coverTitle.style === 'text' ? `<span class="tt-typing"><i></i><i></i><i></i></span><span class="tt-msg">${esc(c.coverTitle.text)}</span>` : esc(c.coverTitle.text || c.title)}</span>` : ''}
        <span class="tile-label">
          <span><span class="tile-title">${esc(c.title)}</span><span class="tile-client">${esc(c.client)}</span></span>
          <span class="tile-cta" aria-hidden="true">Watch</span>
        </span>
      </a>`).join('');

  // Overlay effects on covers (e.g. flames) loop only while on screen, so phones keep a decoder free for the hero reel.
  // Switched off with reduced motion.
  const fxInView = new Set();
  const fxIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { fxInView.add(v); v.play().catch(() => {}); }
    else { fxInView.delete(v); v.pause(); }
  }), { threshold: 0.2 });
  if (!reduceMotion) grid.querySelectorAll('video.fx-video').forEach((v) => fxIO.observe(v));

  // Hover previews (desktop) / in-view previews (touch). Never autoplay with reduced motion.
  if (!reduceMotion) {
    const play = (tile) => {
      const v = tile.querySelector('video:not(.fx-video)');
      if (!v) return;
      v.play().then(() => tile.classList.add('is-playing')).catch(() => {});
    };
    const stop = (tile) => {
      const v = tile.querySelector('video:not(.fx-video)');
      if (!v) return;
      v.pause();
      tile.classList.remove('is-playing');
    };
    grid.querySelectorAll('a.tile').forEach((tile) => {
      if (canHover) {
        tile.addEventListener('pointerenter', () => play(tile));
        tile.addEventListener('pointerleave', () => stop(tile));
        tile.addEventListener('focus', () => play(tile));
        tile.addEventListener('blur', () => stop(tile));
      }
    });
    // On phones and tablets the covers stay still (with their title cards and effects); previews only play on hover.
  }

  /* ---------- Overlay ---------- */
  const overlay = $('#overlay');
  const caseEl = $('#case');
  const countEl = $('#overlay-count');
  let lastFocus = null;

  // Intro copy: a string, a list of paragraphs, or TODO() for a placeholder.
  const introHTML = (v) => {
    if (v && v.todo) return `<p><span class="placeholder">${esc(v.todo)}</span></p>`;
    return [].concat(v || []).map((para) => `<p>${esc(para)}</p>`).join('');
  };

  // Campaign videos never autoplay: they show their poster frame until the viewer presses play.
  function videoEl(item) {
    const poster = item.poster || posterFor(item.src);
    return `<video controls playsinline preload="none" poster="${poster}" src="${item.src}"${item.loop ? ' loop' : ''}></video>`;
  }
  // Width ÷ height of a piece: a number, or a string like '4 / 5'.
  const arOf = (m, fallback) => {
    if (!m.ratio) return fallback;
    if (typeof m.ratio === 'number') return m.ratio;
    const [w, h] = String(m.ratio).split('/').map(Number);
    return h ? w / h : fallback;
  };

  function section(title, cls, items, render, attrs = '') {
    if (!items || !items.length) return '';
    return `<section class="case-section">
      <h3 class="eyebrow">${title}</h3>
      <div class="media-grid ${cls}"${attrs}>${items.map(asItem).map(render).join('')}</div>
    </section>`;
  }

  /* ---------- Flow layout ----------
     Every piece sits in one centred column. Landscape pieces (wider than 1.35:1) run the full column width,
     one per row. Portrait and square pieces sit side by side in balanced rows of the same height, capped
     so a short row never balloons. layoutFlows() works out the sizes for the current width. */
  const WIDE = 1.35;
  const MAX_ROW_H = 620;
  const MIN_ROW_H = 300;
  const SMALL_ROW_H = 380;

  function flowSection(title, list, kind, fallbackAr, altFor, oneRow = false, perRow = 0) {
    const items = (list || []).map(asItem);
    if (!items.length) return '';
    const figs = items.map((m) => {
      const ar = arOf(m, fallbackAr);
      // A still can sit among videos (e.g. a social static in the social row): images are spotted by extension.
      const inner = (kind === 'video' && !/\.(jpe?g|png|gif|webp)$/i.test(m.src)
        ? videoEl(m)
        : `<img src="${m.src}" alt="${esc(altFor ? altFor(m) : m.alt || "")}" loading="lazy">`) + (m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : '');
      // small: true caps a piece's height at SMALL_ROW_H; small: 280 sets a specific cap in px.
      // group: 'name' keeps neighbouring pieces with the same name on one row, whatever their shape.
      return `<figure class="media" data-ar="${ar}"${m.small ? ` data-maxh="${typeof m.small === 'number' ? m.small : SMALL_ROW_H}"` : ''}${m.group ? ` data-group="${esc(m.group)}"` : ''} style="--ar:${ar}">${inner}</figure>`;
    }).join('');
    return `<section class="case-section"><h3 class="eyebrow">${title}</h3><div class="flow"${oneRow ? ' data-one-row' : ''}${perRow ? ` data-per-row="${+perRow}"` : ''}>${figs}</div></section>`;
  }

  function layoutFlows() {
    caseEl.querySelectorAll('.flow').forEach((flow) => {
      const figs = [...flow.querySelectorAll('.media')];
      flow.querySelectorAll('.flow-row').forEach((r) => r.replaceWith(...r.childNodes));
      const W = flow.clientWidth;
      if (!W) return;
      const gap = parseFloat(getComputedStyle(flow).rowGap) || 16;
      const mobile = W < 700;
      const cap = mobile ? innerHeight * 0.7 : MAX_ROW_H;
      const fit = (row) => (W - gap * (row.length - 1)) / row.reduce((s, f) => s + +f.dataset.ar, 0);
      const rows = []; // [{ figs, h }]
      let run = [];
      const flushRun = () => {
        if (!run.length) return;
        let groups;
        const runCap = Math.min(cap, ...run.map((f) => +f.dataset.maxh || Infinity));
        const perRow = +flow.dataset.perRow;
        if (!mobile && perRow) {
          groups = []; // a fixed number per row, e.g. a grid of GIFs
          for (let i = 0; i < run.length; i += perRow) groups.push(run.slice(i, i + perRow));
        } else if (!mobile && (flow.hasAttribute('data-one-row') || fit(run) >= MIN_ROW_H)) {
          groups = [run]; // a small set fits on one row at a decent size
        } else {
          const avg = run.reduce((s, f) => s + +f.dataset.ar, 0) / run.length;
          let k = 1;
          while (!mobile && k < run.length && (W - gap * (k - 1)) / (k * avg) > cap) k++;
          const r = Math.ceil(run.length / k);
          const base = Math.floor(run.length / r), extra = run.length % r;
          groups = []; let i = 0;
          for (let n = 0; n < r; n++) { const size = base + (n < extra ? 1 : 0); groups.push(run.slice(i, i + size)); i += size; }
        }
        const h = Math.min(mobile ? cap : runCap, ...groups.map(fit)); // one height for the whole set
        groups.forEach((g) => rows.push({ figs: g, h }));
        run = [];
      };
      let group = [];
      const flushGroup = () => {
        if (!group.length) return;
        const groupCap = Math.min(cap, ...group.map((f) => +f.dataset.maxh || Infinity));
        if (mobile) group.forEach((f) => rows.push({ figs: [f], h: Math.min(cap, W / +f.dataset.ar) }));
        else rows.push({ figs: group, h: Math.min(groupCap, fit(group)) });
        group = [];
      };
      figs.forEach((f) => {
        if (f.dataset.group) {
          if (group.length && group[0].dataset.group !== f.dataset.group) flushGroup();
          flushRun(); group.push(f); return;
        }
        flushGroup();
        if (+f.dataset.ar >= WIDE) { flushRun(); rows.push({ figs: [f], h: W / +f.dataset.ar }); } else run.push(f);
      });
      flushGroup();
      flushRun();
      rows.forEach(({ figs: row, h }) => {
        const div = document.createElement('div');
        div.className = 'flow-row';
        row.forEach((f) => { f.style.width = `${Math.floor(+f.dataset.ar * h)}px`; div.appendChild(f); });
        flow.appendChild(div);
      });
    });
  }
  let layoutQueued = false;
  addEventListener('resize', () => { if (!layoutQueued) { layoutQueued = true; requestAnimationFrame(() => { layoutQueued = false; layoutFlows(); }); } });

  const DEFAULT_ORDER = ['films', 'teasers', 'social', 'carousel', 'stills', 'audio', 'bts'];
  const sections = {
    // Optional per-campaign headings: filmsLabel, teasersLabel, carouselLabel, socialLabel, stillsLabel.
    films: (c) => flowSection(esc(c.filmsLabel || 'Films'), c.films, 'video', 16 / 9),
    teasers: (c) => flowSection(esc(c.teasersLabel || 'Teasers'), c.teasers, 'video', 16 / 9),
    carousel: (c) => flowSection(esc(c.carouselLabel || 'Carousel'), c.carousel, 'video', 16 / 9),
    // socialOneRow: true keeps every social piece on a single row.
    social: (c) => flowSection(esc(c.socialLabel || 'Social'), c.social, 'video', 9 / 16, undefined, !!c.socialOneRow),
    // stillsPerRow: a fixed number of portrait/square pieces per row (e.g. 4 for a grid).
    stills: (c) => flowSection(c.stillsLabel ? esc(c.stillsLabel) : 'Print &amp; out of home', c.stills, 'image', 1, (m) => m.alt || `${c.title} artwork`, false, c.stillsPerRow),
    bts: (c) => flowSection('BTS', c.bts, 'image', 1, (m) => m.alt || `Behind the scenes on ${c.title}`),
    audio: (c) => section('Audio', 'landscape', c.audio, (m) => `<figure class="media audio-card"><strong>${esc(m.label || 'Audio')}</strong><audio controls preload="none" src="${m.src}"></audio></figure>`),
  };

  function render(c) {
    const i = live.indexOf(c);
    const next = live[(i + 1) % live.length];
    countEl.textContent = `${String(i + 1).padStart(2, '0')} / ${String(live.length).padStart(2, '0')}`;
    caseEl.innerHTML = `
      <header class="case-head">
        <div>
          <p class="eyebrow">${esc(c.client)}</p>
          <h2 id="case-title">${esc(c.title)}</h2>
        </div>
        <div class="case-intro">${introHTML(c.intro)}
        </div>
      </header>
      ${c.hero ? `<div class="case-hero">${videoEl({ src: c.hero })}</div>` : ''}
      ${(c.order || DEFAULT_ORDER).map((key) => sections[key](c)).join('')}
      <nav class="case-next" aria-label="Next project">
        <button type="button" data-goto="${next.slug}">
          <span><span class="label">Next</span><span class="title">${esc(next.title)}</span></span>
          <span class="arrow" aria-hidden="true">→</span>
        </button>
      </nav>`;
    caseEl.querySelector('[data-goto]').addEventListener('click', () => { location.hash = next.slug; });
    layoutFlows();
  }

  // Only one thing plays at a time: starting a video or audio pauses the others.
  caseEl.addEventListener('play', (e) => {
    caseEl.querySelectorAll('video, audio').forEach((m) => { if (m !== e.target) m.pause(); });
  }, true);

  function open(slug) {
    const c = live.find((x) => x.slug === slug);
    if (!c) return close();
    const wasOpen = overlay.classList.contains('is-open');
    if (!wasOpen) lastFocus = document.activeElement;
    render(c);
    overlay.hidden = false;
    layoutFlows(); // sizes need the panel visible to measure its width
    overlay.scrollTop = 0;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.title = `${c.title} · Lewis Clements`;
    $('#close').focus({ preventScroll: true });
  }

  function close() {
    if (!overlay.classList.contains('is-open')) return;
    caseEl.querySelectorAll('video, audio').forEach((m) => m.pause());
    overlay.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    document.title = 'Lewis Clements · Trailer Editor';
    setTimeout(() => { if (!overlay.classList.contains('is-open')) { overlay.hidden = true; caseEl.innerHTML = ''; } }, 350);
    lastFocus?.focus?.({ preventScroll: true });
  }

  const route = () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (live.some((c) => c.slug === slug)) open(slug); else close();
  };
  addEventListener('hashchange', route);
  route();

  $('#close').addEventListener('click', () => {
    // Use Back when we came from the grid so the browser history stays tidy.
    if (history.state?.fromGrid) history.back();
    else history.pushState(null, '', location.pathname + location.search), close();
  });
  grid.addEventListener('click', (e) => {
    const tile = e.target.closest('a.tile');
    if (!tile) return;
    e.preventDefault();
    history.pushState({ fromGrid: true }, '', `#${tile.dataset.slug}`);
    route();
  });
  addEventListener('popstate', route);

  // Keyboard: Esc closes, Tab stays inside the overlay.
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); $('#close').click(); }
    if (e.key === 'Tab') {
      const f = [...overlay.querySelectorAll('button, a[href], video[controls], audio[controls]')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Sticky header + reveals ---------- */
  const topbar = $('#topbar');
  const hero = $('.hero-logo');
  new IntersectionObserver(([e]) => {
    topbar.classList.toggle('is-stuck', !e.isIntersecting);
    topbar.querySelector('.topbar-logo').tabIndex = e.isIntersecting ? -1 : 0;
  }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);

  const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const delay = [...e.target.parentElement.children].indexOf(e.target) % 2 * 70;
    e.target.style.transitionDelay = `${delay}ms`;
    e.target.classList.add('is-in');
    revealIO.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

  // Hero reel: one pre-rendered montage (crossfades and push-ins baked in), looping behind the name.
  // Skipped with reduced motion, where the poster frame shows instead.
  const reel = $('.hero-reel video');
  if (reel && reduceMotion) { reel.removeAttribute('autoplay'); reel.pause(); }
  else if (reel) {
    reel.play().catch(() => {});
    // Some phones block autoplay on load; try again on the first touch or scroll.
    const retry = () => { if (reel.paused) reel.play().catch(() => {}); };
    ['touchstart', 'scroll', 'click'].forEach((ev) => addEventListener(ev, retry, { once: true, passive: true }));
  }

  // Pause hover previews when the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video').forEach((v) => v.pause());
    else if (!reduceMotion) {
      if (reel) reel.play().catch(() => {});
      fxInView.forEach((v) => v.play().catch(() => {}));
    }
  });

  /* ---------- Contact form ----------
     The site is static (GitHub Pages), so sending opens the visitor's email app with the message filled in. */
  const form = $('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const fields = [
      { el: $('#cf-name'), msg: 'Please add your name.' },
      { el: $('#cf-email'), msg: 'Please add an email address I can reply to, like name@example.com.' },
      { el: $('#cf-message'), msg: 'Please add a message.' },
    ];
    const check = (f) => {
      const ok = f.el.value.trim() !== '' && f.el.checkValidity();
      f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      document.getElementById(f.el.getAttribute('aria-describedby')).textContent = ok ? '' : f.msg;
      return ok;
    };
    fields.forEach((f) => f.el.addEventListener('blur', () => { if (f.el.value) check(f); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = fields.filter((f) => !check(f));
      if (bad.length) { bad[0].el.focus(); return; }
      const v = (id) => $(id).value.trim();
      const company = v('#cf-company');
      const subject = `Hello Lewis, from ${company || v('#cf-name')}`;
      const body = `${v('#cf-message')}\n\n${v('#cf-name')}${company ? `, ${company}` : ''}\n${v('#cf-email')}`;
      location.href = `mailto:lewisanthonyclements@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app should open with the message ready to send. If it doesn’t, email lewisanthonyclements@gmail.com.';
    });
  }
})();
