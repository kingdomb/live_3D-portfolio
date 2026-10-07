// Navbar layout QA: loads the site at fixed viewports, asserts layout numbers,
// and saves screenshots to docs/qa/.
//
// Usage:
//   npm run qa                            # builds, serves, runs this script, stops the server
//   QA_URL=http://127.0.0.1:4173/live_3D-portfolio/ node scripts/qa-layout.mjs   # against a running server
//   QA_WIDTHS=500,1100 QA_OUT=/tmp/qa node scripts/qa-layout.mjs   # extra between-breakpoint sweep
//   QA_SELFTEST_OVERFLOW=1 ...            # injects a 2000px element; the overflow checks must FAIL
//
// Exits non-zero if any assertion fails.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.env.QA_URL || 'http://127.0.0.1:4173/live_3D-portfolio/';
const WIDTHS = process.env.QA_WIDTHS
  ? process.env.QA_WIDTHS.split(',').map(Number)
  : [320, 360, 390, 430, 640, 768, 900, 940, 1023, 1024, 1180, 1280, 1536, 1920];
const HEIGHT = 800;
const LG = 1024;
const MENU_WIDTHS = [360, 390];
const TOP_BUTTON_WIDTHS = [390, 1280];
const OUT = process.env.QA_OUT || 'docs/qa';
const TOGGLE = 'nav button[aria-controls="mobile-menu"]';
const LAUNCHER = 'button[aria-label="Ask AI About Bernard"]';
const LAUNCHER_PILL_MIN = 1580; // launcher is icon-only below this width
const LAUNCHER_SHOT_WIDTHS = [320, 390, 768, 1280, 1920];
const CHAT_PANEL_SHOT_WIDTHS = [320, 360, 390];
const CONTACT_SHOT_WIDTHS = [320, 360, 390, 768];
const SCROLLED_NAV_WIDTHS = [360, 768, 1280];
// Gap between two boxes (0 if they overlap).
const boxGap = (a, b) => Math.max(0, a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
const overlaps = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
// Every route in src/App.jsx (relative to the Vite base path).
const ROUTES = [
  { name: '/', path: '' },
  { name: '/admin', path: 'admin' },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const failures = [];
const rows = [];
const log = [];
const say = (line) => { console.log(line); log.push(line); };

// results: check label -> Map(width -> boolean). Printed as the PASS/FAIL summary table.
const results = new Map();
const check = (width, ok, label, detail) => {
  ok = Boolean(ok);
  if (!results.has(label)) results.set(label, new Map());
  const prev = results.get(label).get(width);
  results.get(label).set(width, prev === undefined ? ok : prev && ok);
  if (!ok) failures.push(`[${width}] ${label}: ${detail}`);
  return ok;
};

async function openPage(width) {
  const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
  // Not 'load': that waits for every third-party request (reCAPTCHA, fonts, 3D model)
  // and intermittently exceeded 30s. The selector waits below gate on what is measured.
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('nav');
  await page.waitForSelector('h1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return page;
}

// Horizontal-overflow probe: page scroll width plus every visible element whose
// right edge passes the viewport, unless an ancestor clips overflow on purpose
// (overflow-x hidden/auto/scroll/clip) or it is the three.js canvas.
const overflowProbe = () => {
  const vw = window.innerWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') return true;
    }
    return false;
  };
  const offenders = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.tagName === 'CANVAS' || el.closest('canvas')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue;
    if (!el.checkVisibility() || clipped(el)) continue;
    offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).slice(0, 6).join('.')} w=${Math.round(r.width)} right=${Math.round(r.right)}`);
  }
  return { scrollWidth: document.scrollingElement.scrollWidth, innerWidth: vw, offenders };
};

// Runs the overflow probe at the top, then scrolls to the bottom in steps (so lazy
// and animated sections render) and probes again.
async function overflowAudit(page, width, label) {
  const record = (where, o) => {
    const ok = o.scrollWidth <= o.innerWidth;
    check(width, ok, `${label}: no overflow (${where})`, `scrollWidth ${o.scrollWidth} > ${o.innerWidth}`);
    check(width, o.offenders.length === 0, `${label}: no offending elements (${where})`, o.offenders.slice(0, 8).join(' ; '));
    if (o.offenders.length) say(`[${width}] ${label} offenders (${where}): ${o.offenders.slice(0, 8).join(' ; ')}`);
  };
  if (process.env.QA_SELFTEST_OVERFLOW) {
    // Self-test: inject a too-wide element so the audit must fail.
    await page.evaluate(() => {
      const d = document.createElement('div');
      d.className = 'qa-selftest-wide';
      d.style.cssText = 'width:2000px;height:10px';
      document.getElementById('root').appendChild(d);
    });
  }
  record('top', await page.evaluate(overflowProbe));
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.scrollingElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: document.scrollingElement.scrollHeight, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 500));
  });
  record('scrolled to bottom', await page.evaluate(overflowProbe));
}

const openChatPanel = (page) => page.click(LAUNCHER);

// Collects every number the assertions need in one pass inside the page.
const measure = () => {
  const box = (e) => {
    const b = e.getBoundingClientRect();
    return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
  };
  const nav = document.querySelector('nav');
  const brand = nav.querySelector('a:not([href^="#"])');
  const logo = brand.querySelector('img[alt="logo"]');
  const textBlock = logo.parentElement.nextElementSibling;
  const [nameEl, taglineWrap] = textBlock.children;
  const tagline = [...taglineWrap.children].find((e) => e.checkVisibility());
  const segments = [...tagline.querySelectorAll('span.inline-block')];
  const clipBox = segments.length ? tagline.firstElementChild : tagline;
  const lineHeight = parseFloat(getComputedStyle(tagline).lineHeight);

  const segmentInfo = segments.map((seg) => {
    const pipe = seg.firstElementChild;
    const clip = clipBox.getBoundingClientRect();
    return {
      text: seg.textContent.slice(1),
      box: box(seg),
      lines: seg.getClientRects().length === 1 && seg.getBoundingClientRect().height <= lineHeight * 1.5 ? 1 : 2,
      pipeVisible: pipe.getBoundingClientRect().left >= clip.left - 0.5,
    };
  });

  const menu = nav.querySelector('button[aria-controls="mobile-menu"]');
  const desktopLinks = [...nav.querySelector('ul').querySelectorAll('a')];
  const h1 = document.querySelector('h1');

  return {
    innerWidth: window.innerWidth,
    scrollWidth: document.scrollingElement.scrollWidth,
    nav: box(nav),
    heroTop: box(h1).top,
    brand: box(brand),
    logo: { ...box(logo), naturalRatio: logo.naturalWidth / logo.naturalHeight },
    textBlock: box(textBlock),
    name: { ...box(nameEl), text: nameEl.textContent, clipped: nameEl.scrollWidth > nameEl.clientWidth },
    tagline: {
      text: tagline.innerText,
      fontSize: getComputedStyle(tagline).fontSize,
      clipped: clipBox.scrollWidth > clipBox.clientWidth,
      singleLine: segments.length ? null : tagline.getClientRects().length === 1 && tagline.getBoundingClientRect().height <= lineHeight * 1.5,
      segments: segmentInfo,
    },
    menu: menu ? { visible: menu.checkVisibility(), ...box(menu) } : null,
    links: desktopLinks.map((a) => ({ text: a.textContent, visible: a.checkVisibility(), ...box(a) })),
  };
};

for (const width of WIDTHS) {
  try {
    await runWidth(width);
    check(width, true, 'checks ran without crashing', '');
  } catch (err) {
    // A crash at one width is reported as a FAIL (with the error) instead of a silent exit.
    check(width, false, 'checks ran without crashing', err.stack || String(err));
  }
}

async function runWidth(width) {
  const page = await openPage(width);
  const m = await page.evaluate(measure);
  const r = (n) => Math.round(n * 10) / 10;

  // 1. No horizontal overflow.
  const overflow = m.scrollWidth > m.innerWidth;
  check(width, !overflow, 'no horizontal overflow', `scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth}`);

  // 2 / 3. Hamburger below lg, inline links from lg.
  let hamburger = 'n/a';
  let linksVisible = 'n/a';
  if (width < LG) {
    const mb = m.menu;
    const ok = mb && mb.visible && mb.width > 0 && mb.left >= 0 && mb.right <= m.innerWidth;
    check(width, ok, 'hamburger visible in viewport', JSON.stringify(mb));
    check(width, mb && mb.width >= 44 && mb.height >= 44, 'hamburger hit area >= 44x44', mb ? `${mb.width}x${mb.height}` : 'missing');
    hamburger = mb ? `${ok ? 'yes' : 'NO'} [${r(mb.left)}-${r(mb.right)}]` : 'NO (missing)';
    check(width, m.links.every((l) => !l.visible), 'desktop links hidden below lg', 'links visible');
  } else {
    const bad = m.links.filter(
      (l) => !l.visible || l.left < 0 || l.right > m.innerWidth ||
        !(l.left >= m.brand.right || l.right <= m.brand.left || l.top >= m.brand.bottom || l.bottom <= m.brand.top)
    );
    check(width, m.links.length === 5 && bad.length === 0, '5 nav links visible, no overlap', JSON.stringify(bad));
    linksVisible = `${m.links.length - bad.length}/5, gap to brand ${r(m.links[0].left - m.brand.right)}px`;
    check(width, !m.menu || !m.menu.visible, 'hamburger hidden from lg', 'hamburger visible');
  }

  // 4. Logo keeps its natural ratio and matches the text block height.
  const logoRatio = m.logo.width / m.logo.height;
  check(width, Math.abs(logoRatio / m.logo.naturalRatio - 1) <= 0.02, 'logo ratio', `${logoRatio} vs natural ${m.logo.naturalRatio}`);
  check(width, Math.abs(m.logo.height - m.textBlock.height) <= 2, 'logo height = text height', `logo ${m.logo.height} vs text ${m.textBlock.height}`);
  check(width, m.textBlock.left - m.logo.right >= 8, 'logo/text gap >= 8px', `${m.textBlock.left - m.logo.right}px`);

  // 5. Brand text: no clipping, tagline breaks only at the pipe.
  check(width, m.name.text === 'Bernard' && !m.name.clipped, 'name not clipped', JSON.stringify(m.name));
  check(width, !m.tagline.clipped, 'tagline not clipped', m.tagline.text);
  let taglineLayout;
  if (m.tagline.segments.length) {
    const [a, b] = m.tagline.segments;
    const sameLine = Math.abs(a.box.top - b.box.top) < 1;
    check(width, a.lines === 1 && b.lines === 1, 'tagline breaks only at pipe', JSON.stringify(m.tagline.segments));
    check(width, !a.pipeVisible, 'no leading pipe', 'first segment pipe not clipped');
    check(width, b.pipeVisible === sameLine, 'pipe placement', `sameLine=${sameLine} pipeVisible=${b.pipeVisible}`);
    taglineLayout = sameLine ? '1 line' : '2 lines (at pipe)';
  } else {
    check(width, m.tagline.singleLine, 'short tagline one line', m.tagline.text);
    taglineLayout = 'short, 1 line';
  }

  // 6. Nav height vs. hero heading.
  check(width, m.heroTop >= m.nav.bottom, 'nav clear of hero h1', `nav bottom ${m.nav.bottom} > h1 top ${m.heroTop}`);

  rows.push({
    width,
    navHeight: r(m.nav.height),
    heroTop: r(m.heroTop),
    hamburger,
    links: linksVisible,
    logo: `${r(m.logo.width)}x${r(m.logo.height)} ratio ${logoRatio.toFixed(3)} (natural ${m.logo.naturalRatio.toFixed(3)}), text h ${r(m.textBlock.height)}`,
    tagline: `${m.tagline.fontSize} ${taglineLayout}`,
    overflow: overflow ? `YES (${m.scrollWidth})` : 'no',
  });

  await page.screenshot({ path: `${OUT}/navbar-${width}.png`, clip: { x: 0, y: 0, width, height: 300 } });

  // Mobile menu: Escape closes it and returns focus to the toggle; so does a press outside.
  if (width < LG) {
    const state = () => page.evaluate(() => {
      const t = document.querySelector('nav button[aria-controls="mobile-menu"]');
      return { open: document.getElementById('mobile-menu').checkVisibility(), expanded: t.getAttribute('aria-expanded'), focusOnToggle: document.activeElement === t };
    });
    await page.click(TOGGLE);
    await page.waitForTimeout(200);
    const opened = await state();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const afterEsc = await state();
    check(width, opened.open && opened.expanded === 'true', 'menu opens from toggle', JSON.stringify(opened));
    check(width, !afterEsc.open && afterEsc.expanded === 'false' && afterEsc.focusOnToggle, 'Escape closes menu, focus on toggle', JSON.stringify(afterEsc));
    await page.click(TOGGLE);
    await page.waitForTimeout(200);
    await page.mouse.click(8, Math.round(HEIGHT / 2)); // left edge, mid-height: outside the dropdown and toggle
    await page.waitForTimeout(300);
    const afterOutside = await state();
    check(width, !afterOutside.open && afterOutside.expanded === 'false' && afterOutside.focusOnToggle, 'outside click closes menu, focus on toggle', JSON.stringify(afterOutside));
    say(`[${width}] menu open ${JSON.stringify(opened)} | after Escape ${JSON.stringify(afterEsc)} | after outside click ${JSON.stringify(afterOutside)}`);
  }

  // Floating chat launcher: size per breakpoint, tap target, spacing from scroll-to-top,
  // margin inside the viewport, and not covering the nav or hero text at the top of the page.
  {
    const L = await page.evaluate(() => {
      const box = (e) => (({ left, right, top, bottom, width, height }) => ({ left, right, top, bottom, width, height }))(e.getBoundingClientRect());
      const btn = document.querySelector('button[aria-label="Ask AI About Bernard"]');
      const label = [...btn.querySelectorAll('span')].filter((s) => s.checkVisibility() && !s.getAttribute('aria-hidden')).map((s) => s.textContent).join('');
      const h1 = document.querySelector('h1');
      return {
        launcher: box(btn), label,
        top: box(document.querySelector('button[aria-label="Scroll to Top"]')),
        nav: box(document.querySelector('nav')),
        heroText: [box(h1), box(h1.nextElementSibling)],
        vw: window.innerWidth, vh: window.innerHeight,
      };
    });
    const l = L.launcher;
    const r1 = (n) => Math.round(n * 10) / 10;
    let sizeOk;
    if (width < LAUNCHER_PILL_MIN) sizeOk = Math.abs(l.width - 48) <= 1 && Math.abs(l.height - 48) <= 1 && L.label === '';
    else sizeOk = Math.abs(l.height - 48) <= 1 && l.width <= 240 && L.label === 'Ask AI About Bernard';
    check(width, sizeOk, 'launcher size for breakpoint', `${r1(l.width)}x${r1(l.height)} label "${L.label}"`);
    check(width, l.width >= 44 && l.height >= 44, 'launcher tap target >= 44x44', `${l.width}x${l.height}`);
    const gapTop = boxGap(l, L.top);
    check(width, gapTop >= 12, 'launcher >= 12px from scroll-to-top', `gap ${gapTop}`);
    const margin = Math.min(l.left, L.vw - l.right, l.top, L.vh - l.bottom);
    check(width, margin >= 16, 'launcher >= 16px inside viewport', `margin ${margin}`);
    check(width, !overlaps(l, L.nav) && !L.heroText.some((t) => overlaps(l, t)), 'launcher clear of nav and hero text', JSON.stringify(L));
    say(`[${width}] launcher ${r1(l.width)}x${r1(l.height)} at ${r1(l.left)},${r1(l.top)} label "${L.label}" | gap to scroll-to-top ${r1(gapTop)}px | viewport margin ${r1(margin)}px`);
  }

  // Mobile menu: open, check the dropdown is fully on screen, click a link.
  if (MENU_WIDTHS.includes(width)) {
    await page.click(TOGGLE);
    await page.waitForTimeout(400);
    const dd = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const panel = document.getElementById('mobile-menu');
      const b = panel.getBoundingClientRect();
      return { visible: panel.checkVisibility(), left: b.left, right: b.right, top: b.top, bottom: b.bottom, navBottom: nav.getBoundingClientRect().bottom };
    });
    const ddOk = dd.visible && dd.left >= 0 && dd.right <= width && dd.top >= 0 && dd.bottom <= HEIGHT;
    check(width, ddOk, 'dropdown on screen', JSON.stringify(dd));

    // Dropdown background: mostly opaque, text contrast >= 4.5:1, and no position:fixed
    // descendants under an element with backdrop-filter/filter/transform.
    const look = await page.evaluate(() => {
      const panel = document.getElementById('mobile-menu');
      const cs = getComputedStyle(panel);
      const [r, g, b, a = 1] = cs.backgroundColor.match(/[\d.]+/g).map(Number);
      const lum = ([R, G, B]) => {
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B);
      };
      const ratio = (x, y) => { const [l1, l2] = [lum(x), lum(y)].sort((p, q) => q - p); return (l1 + 0.05) / (l2 + 0.05); };
      // Worst case: the translucent panel composited over pure white page content.
      const over = (base) => [r, g, b].map((c, i) => c * a + base[i] * (1 - a));
      const bgWorst = over([255, 255, 255]);
      // Link colors in use, plus white (the active-link color) even if no link is active yet.
      const textColors = [...new Set(['rgb(255, 255, 255)', ...[...panel.querySelectorAll('li')].map((li) => getComputedStyle(li).color)])];
      const contrasts = textColors.map((c) => ({ color: c, ratio: ratio(c.match(/[\d.]+/g).slice(0, 3).map(Number), bgWorst) }));
      const hasFilter = (e) => { const c = getComputedStyle(e); return c.backdropFilter !== 'none' || c.filter !== 'none' || c.transform !== 'none'; };
      const fixedUnderFilter = [...document.querySelectorAll('nav, nav *')].filter(hasFilter)
        .flatMap((e) => [...e.querySelectorAll('*')].filter((d) => getComputedStyle(d).position === 'fixed').map((d) => d.tagName));
      return { background: cs.backgroundColor, alpha: a, backdropFilter: cs.backdropFilter, bgWorst: bgWorst.map(Math.round), contrasts, fixedUnderFilter };
    });
    check(width, look.alpha >= 0.88 && look.alpha <= 0.92, 'dropdown opacity 88-92%', JSON.stringify(look));
    check(width, look.contrasts.length > 0 && look.contrasts.every((c) => c.ratio >= 4.5), 'dropdown text contrast >= 4.5', JSON.stringify(look.contrasts));
    check(width, look.fixedUnderFilter.length === 0, 'no fixed under filter in nav', JSON.stringify(look.fixedUnderFilter));
    say(`[${width}] dropdown background ${look.background} (alpha ${look.alpha}, backdrop-filter ${look.backdropFilter}); contrast vs worst case ${JSON.stringify(look.bgWorst)}: ${look.contrasts.map((c) => `${c.color} ${c.ratio.toFixed(2)}:1`).join(', ')}`);
    await page.screenshot({ path: `${OUT}/menu-open-${width}.png`, clip: { x: 0, y: 0, width, height: 500 } });

    await page.click('#mobile-menu >> text=Experience');
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => {
      const panel = document.getElementById('mobile-menu');
      return { open: panel.checkVisibility(), scrollY: window.scrollY, workTop: document.getElementById('work').getBoundingClientRect().top };
    });
    check(width, !after.open, 'menu closes on link click', JSON.stringify(after));
    check(width, after.scrollY > 0 && Math.abs(after.workTop) < 200, 'link scrolls to #work', JSON.stringify(after));
    await page.screenshot({ path: `${OUT}/menu-after-click-${width}.png`, clip: { x: 0, y: 0, width, height: 500 } });
    say(`[${width}] dropdown ${JSON.stringify(dd)} | after link click ${JSON.stringify(after)}`);
  }

  // Scroll-to-top button and the floating chat button, on one phone and one desktop width.
  if (TOP_BUTTON_WIDTHS.includes(width)) {
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
    // The button fades in over 300ms; wait for the fade to finish (fails below if it never does).
    await page
      .waitForFunction(() => getComputedStyle(document.querySelector('button[aria-label="Scroll to Top"]')).opacity === '1', null, { timeout: 3000 })
      .catch(() => {});
    const fab = await page.evaluate(() => {
      const box = (e) => (e ? (({ left, right, top, bottom }) => ({ left, right, top, bottom }))(e.getBoundingClientRect()) : null);
      const top = document.querySelector('button[aria-label="Scroll to Top"]');
      const chat = document.querySelector('button[aria-label="Ask AI About Bernard"]');
      return { top: { opacity: getComputedStyle(top).opacity, ...box(top) }, chat: chat ? { visible: chat.checkVisibility(), ...box(chat) } : null };
    });
    const inView = (b) => b && b.left >= 0 && b.right <= width && b.top >= 0 && b.bottom <= HEIGHT;
    const overlap = fab.chat && !(fab.top.bottom <= fab.chat.top || fab.top.top >= fab.chat.bottom || fab.top.right <= fab.chat.left || fab.top.left >= fab.chat.right);
    check(width, fab.top.opacity === '1' && inView(fab.top), 'scroll-to-top visible', JSON.stringify(fab.top));
    check(width, fab.chat && fab.chat.visible && inView(fab.chat), 'chat button visible', JSON.stringify(fab.chat));
    check(width, !overlap, 'scroll-to-top clear of chat button', JSON.stringify(fab));
    await page.click('button[aria-label="Scroll to Top"]');
    await page.waitForTimeout(2500);
    const scrollY = await page.evaluate(() => window.scrollY);
    check(width, scrollY < 50, 'scroll-to-top returns to top', `scrollY ${scrollY}`);
    say(`[${width}] floating buttons ${JSON.stringify(fab)} | scrollY after scroll-to-top click ${scrollY}`);
  }
  await page.close();

  // Chat panel: fits inside the viewport, close control reachable and working.
  {
    const p = await openPage(width);
    if (LAUNCHER_SHOT_WIDTHS.includes(width)) {
      // Scrolled so the scroll-to-top button shows next to the launcher.
      await p.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
      await p
        .waitForFunction(() => getComputedStyle(document.querySelector('button[aria-label="Scroll to Top"]')).opacity === '1', null, { timeout: 3000 })
        .catch(() => {});
      await p.screenshot({ path: `${OUT}/launcher-${width}.png` });
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await p.waitForTimeout(300);
    }
    await openChatPanel(p);
    await p.waitForTimeout(800);
    const panel = await p.evaluate(() => {
      const h = [...document.querySelectorAll('h3')].find((e) => e.textContent.includes("Bernard's Agent"));
      const el = h.closest('.fixed');
      const close = [...el.querySelectorAll('button')].find((b) => b.textContent.includes('✕'));
      const box = (e) => (({ left, right, top, bottom }) => ({ left, right, top, bottom }))(e.getBoundingClientRect());
      const send = el.querySelector('form button[type="submit"]');
      return { panel: box(el), close: box(close), send: box(send), vw: window.innerWidth, vh: window.innerHeight, scrollWidth: document.scrollingElement.scrollWidth };
    });
    const inside = (b) => b.left >= 0 && b.right <= panel.vw && b.top >= 0 && b.bottom <= panel.vh;
    check(width, inside(panel.panel) && panel.scrollWidth <= panel.vw, 'chat panel inside viewport', JSON.stringify(panel));
    check(width, inside(panel.close), 'chat close button inside viewport', JSON.stringify(panel.close));
    const inPanel = (b) => b.left >= panel.panel.left && b.right <= panel.panel.right && b.top >= panel.panel.top && b.bottom <= panel.panel.bottom;
    check(width, inPanel(panel.send) && panel.send.right - panel.send.left > 0, 'chat send button inside panel', JSON.stringify({ send: panel.send, panel: panel.panel }));
    if (CHAT_PANEL_SHOT_WIDTHS.includes(width)) await p.screenshot({ path: `${OUT}/chat-panel-${width}.png` });
    await p.click('h3:has-text("Bernard\'s Agent") >> xpath=../.. >> button:has-text("✕")');
    await p.waitForTimeout(600);
    const closed = await p.evaluate(() => ![...document.querySelectorAll('h3')].some((e) => e.textContent.includes("Bernard's Agent")));
    check(width, closed, 'chat close button closes panel', 'panel still open');
    say(`[${width}] chat panel ${JSON.stringify(panel.panel)} close ${JSON.stringify(panel.close)} send ${JSON.stringify(panel.send)} closed after click: ${closed}`);
    await p.close();
  }

  // Scrolled nav: solid background, and brand / links / toggle still clear of each other.
  if (SCROLLED_NAV_WIDTHS.includes(width)) {
    const p = await openPage(width);
    await p.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await p.waitForTimeout(800);
    const n = await p.evaluate(() => {
      const box = (e) => (({ left, right, top, bottom }) => ({ left, right, top, bottom }))(e.getBoundingClientRect());
      const nav = document.querySelector('nav');
      const vis = (e) => e && e.checkVisibility();
      const brand = nav.querySelector('a:not([href^="#"])');
      const links = [...nav.querySelector('ul').querySelectorAll('a')].filter(vis);
      const toggle = nav.querySelector('button[aria-controls="mobile-menu"]');
      return { bg: getComputedStyle(nav).backgroundColor, brand: box(brand), links: links.map(box), toggle: vis(toggle) ? box(toggle) : null };
    });
    const solid = /^rgb\(/.test(n.bg) || /, 1\)$/.test(n.bg);
    check(width, solid, 'scrolled nav has solid background', n.bg);
    const others = [...n.links, ...(n.toggle ? [n.toggle] : [])];
    check(width, others.every((o) => !overlaps(o, n.brand)), 'scrolled nav: no collisions', JSON.stringify(n));
    await p.screenshot({ path: `${OUT}/nav-scrolled-${width}.png`, clip: { x: 0, y: 0, width, height: 200 } });
    say(`[${width}] scrolled nav background ${n.bg}`);
    await p.close();
  }

  // Contact form: placeholder size equal on all three fields and fitting the field,
  // typed text kept at 16px (iOS zooms inputs below 16px), reCAPTCHA inside the card.
  {
    const p = await openPage(width);
    await p.evaluate(() => document.getElementById('contact').scrollIntoView({ behavior: 'instant' }));
    // Wait for the card's slide-in transform to finish and the reCAPTCHA iframe to load.
    await p
      .waitForFunction(() => {
        const card = document.querySelector('#root form').closest('.rounded-2xl');
        const t = getComputedStyle(card).transform;
        return (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)') && document.querySelector('#recaptcha-container iframe');
      }, null, { timeout: 15000 })
      .catch(() => {});
    await p.waitForTimeout(500);
    const c = await p.evaluate(() => {
      const box = (e) => (({ left, right, top, bottom, width, height }) => ({ left, right, top, bottom, width, height }))(e.getBoundingClientRect());
      const form = document.querySelector('#root form');
      const card = form.closest('.rounded-2xl');
      const ctx = document.createElement('canvas').getContext('2d');
      const fields = [...form.querySelectorAll('input[placeholder], textarea[placeholder]')].map((el) => {
        const ph = getComputedStyle(el, '::placeholder');
        const cs = getComputedStyle(el);
        ctx.font = `${ph.fontWeight} ${ph.fontSize} ${ph.fontFamily}`;
        return {
          name: el.name, tag: el.tagName.toLowerCase(),
          placeholderSize: ph.fontSize, textSize: cs.fontSize,
          need: ctx.measureText(el.placeholder).width,
          room: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        };
      });
      const iframe = document.querySelector('#recaptcha-container iframe');
      return { fields, card: box(card), recaptcha: iframe ? box(iframe) : null, vw: window.innerWidth };
    });
    const sizes = [...new Set(c.fields.map((f) => f.placeholderSize))];
    check(width, c.fields.length === 3 && sizes.length === 1, 'contact placeholder size equal on 3 fields', JSON.stringify(c.fields));
    const clipped = c.fields.filter((f) => f.tag === 'input' && f.need > f.room);
    check(width, clipped.length === 0, 'contact placeholders fit their inputs', JSON.stringify(clipped));
    check(width, c.fields.every((f) => parseFloat(f.textSize) >= 16), 'contact typed text >= 16px', JSON.stringify(c.fields.map((f) => f.textSize)));
    const rc = c.recaptcha;
    const rcOk = rc && rc.left >= c.card.left && rc.right <= c.card.right && rc.left >= 0 && rc.right <= c.vw;
    check(width, rcOk, 'reCAPTCHA loaded and inside contact card', JSON.stringify({ recaptcha: rc, card: c.card }));
    say(`[${width}] contact placeholders ${sizes.join('/')} (${c.fields.map((f) => `${f.name} ${Math.round(f.need)}/${Math.round(f.room)}px`).join(', ')}) | reCAPTCHA ${rc ? `${rc.width}x${rc.height} at ${Math.round(rc.left)}-${Math.round(rc.right)}` : 'NOT LOADED'} in card ${Math.round(c.card.left)}-${Math.round(c.card.right)}`);
    if (CONTACT_SHOT_WIDTHS.includes(width)) {
      await p.locator('#root form').evaluate((f) => f.closest('.rounded-2xl').scrollIntoView({ block: 'start', behavior: 'instant' }));
      await p.waitForTimeout(300);
      const card = p.locator('#root form >> xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
      await card.screenshot({ path: `${OUT}/contact-${width}.png` });
    }
    await p.close();
  }

  // Whole-page overflow: every route, then the home page with the mobile menu open and with the chat panel open.
  for (const route of ROUTES) {
    const p = await browser.newPage({ viewport: { width, height: HEIGHT } });
    await p.goto(URL + route.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForSelector('#root *');
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(route.path ? 800 : 1500);
    await overflowAudit(p, width, `route ${route.name}`);
    await p.close();
  }
  if (width < LG) {
    const p = await openPage(width);
    await p.click(TOGGLE);
    await p.waitForTimeout(300);
    await overflowAudit(p, width, 'menu open');
    await p.close();
  }
  {
    const p = await openPage(width);
    await openChatPanel(p);
    await p.waitForTimeout(800);
    await overflowAudit(p, width, 'chat panel open');
    await p.close();
  }
}

await browser.close();

say('');
say('width | nav h | h1 top | hamburger [left-right] | links | logo | tagline | overflow');
for (const row of rows) {
  say(`${row.width} | ${row.navHeight} | ${row.heroTop} | ${row.hamburger} | ${row.links} | ${row.logo} | ${row.tagline} | ${row.overflow}`);
}
say('');
say('SUMMARY (PASS/FAIL per check per width; - = not applicable at that width)');
const labelWidth = Math.max(...[...results.keys()].map((l) => l.length), 5);
say(`${'check'.padEnd(labelWidth)} | ${WIDTHS.map((w) => String(w).padStart(4)).join(' | ')}`);
say(`${'-'.repeat(labelWidth)}-|-${WIDTHS.map(() => '----').join('-|-')}`);
for (const [label, byWidth] of results) {
  const cells = WIDTHS.map((w) => (byWidth.has(w) ? (byWidth.get(w) ? 'PASS' : 'FAIL') : '   -'));
  say(`${label.padEnd(labelWidth)} | ${cells.join(' | ')}`);
}
say('');
say(failures.length ? `FAILURES (${failures.length}):\n${failures.join('\n')}` : 'ALL ASSERTIONS PASSED');
writeFileSync(`${OUT}/qa-layout-output.txt`, `${log.join('\n')}\n`);
process.exit(failures.length ? 1 : 0);
