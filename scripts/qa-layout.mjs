// Navbar layout QA: loads the site at fixed viewports, asserts layout numbers,
// and saves screenshots to docs/qa/.
//
// Usage:
//   npm run qa                            # builds, serves, runs this script, stops the server
//   QA_URL=http://127.0.0.1:4173/live_3D-portfolio/ node scripts/qa-layout.mjs   # against a running server
//   QA_WIDTHS=500,1100 QA_OUT=/tmp/qa node scripts/qa-layout.mjs   # extra between-breakpoint sweep
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
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('nav');
  await page.waitForSelector('h1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return page;
}

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

  const menu = nav.querySelector('img[alt="menu"]');
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

  // Mobile menu: open, check the dropdown is fully on screen, click a link.
  if (MENU_WIDTHS.includes(width)) {
    await page.click('img[alt="menu"]');
    await page.waitForTimeout(400);
    const dd = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const panel = nav.querySelector('img[alt="menu"]').nextElementSibling;
      const b = panel.getBoundingClientRect();
      return { visible: panel.checkVisibility(), left: b.left, right: b.right, top: b.top, bottom: b.bottom, navBottom: nav.getBoundingClientRect().bottom };
    });
    const ddOk = dd.visible && dd.left >= 0 && dd.right <= width && dd.top >= 0 && dd.bottom <= HEIGHT;
    check(width, ddOk, 'dropdown on screen', JSON.stringify(dd));
    await page.screenshot({ path: `${OUT}/menu-open-${width}.png`, clip: { x: 0, y: 0, width, height: 500 } });

    await page.click('nav img[alt="menu"] + div >> text=Experience');
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => {
      const panel = document.querySelector('nav img[alt="menu"]').nextElementSibling;
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
      const chat = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('🤖'));
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
