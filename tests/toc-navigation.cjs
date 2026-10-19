// Requires Playwright. Run against: hugo server --bind 127.0.0.1 --port 1414 --disableLiveReload
// Usage: node tests/toc-navigation.cjs (TOC_TEST_BASE_URL defaults to http://127.0.0.1:1414).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const baseURL = process.env.TOC_TEST_BASE_URL || 'http://127.0.0.1:1414';
const selector = '#TableOfContents a';

async function settleScroll(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    let previous = window.scrollY;
    let lastChange = performance.now();
    const timeout = setTimeout(() => reject(new Error('Scrolling did not settle')), 5000);
    const frame = (now) => {
      if (window.scrollY !== previous) {
        previous = window.scrollY;
        lastChange = now;
      }
      if (now - lastChange >= 250) {
        clearTimeout(timeout);
        resolve();
      } else {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }));
}

async function resetTrace(page) {
  await page.evaluate(() => { window.tocChanges = []; });
}

async function expectTrace(page, expected, description) {
  await page.waitForFunction((hash) => {
    const heading = document.getElementById(decodeURIComponent(hash.slice(1)));
    const destination = Math.max(0, Math.min(window.scrollY + heading.getBoundingClientRect().top, document.documentElement.scrollHeight - innerHeight));
    return Math.abs(window.scrollY - destination) <= 2;
  }, expected.at(-1));
  await settleScroll(page);
  const changes = await page.evaluate(() => window.tocChanges);
  assert.deepEqual(changes, expected, `${description}: ${changes.join(' -> ')}`);
}

async function expectScrollSpy(page) {
  const state = await page.evaluate(() => {
    const links = [...document.querySelectorAll('#TableOfContents a')];
    let current = links[0];
    for (const link of links) {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading.getBoundingClientRect().top > Math.min(160, window.innerHeight * 0.2)) break;
      current = link;
    }
    if (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = links.at(-1);
    return { expected: current.hash, actual: document.querySelector('#TableOfContents a[aria-current="location"]')?.hash };
  });
  assert.equal(state.actual, state.expected, 'Manual scrolling must resume chapter tracking');
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chromium.executablePath()) ? {} : { channel: 'msedge' }) });
  const checks = [];
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${baseURL}/posts/welcome/`);
      await page.locator('.toc-toggle').first().waitFor();
      await settleScroll(page);
      await page.evaluate(() => {
        window.tocChanges = [];
        new MutationObserver((records) => {
          for (const { target } of records) {
            if (target.getAttribute('aria-current') !== 'location') continue;
            const hash = target.hash;
            if (window.tocChanges.at(-1) !== hash) window.tocChanges.push(hash);
          }
        }).observe(document.querySelector('#TableOfContents'), { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
      });

      const links = page.locator(selector);
      const first = links.first();
      const last = links.last();
      const firstHash = await first.evaluate((link) => link.hash);
      const lastHash = await last.evaluate((link) => link.hash);
      const child = links.filter({ hasText: 'PowerShell' });
      const childHash = await child.evaluate((link) => link.hash);
      const childWeight = await child.evaluate((link) => getComputedStyle(link).fontWeight);
      await last.click();
      await expectTrace(page, [lastHash], 'A downward jump must not highlight intermediate headings');
      await resetTrace(page);
      await first.click();
      await expectTrace(page, [firstHash], 'An upward jump must not bounce back to the old heading');
      checks.push(`${reducedMotion}: stable downward and upward jumps`);

      await resetTrace(page);
      await last.click();
      await page.waitForTimeout(50);
      await child.click();
      await page.waitForTimeout(50);
      await first.click();
      await expectTrace(page, [lastHash, childHash, firstHash], 'Rapid clicks must keep the latest selection');
      checks.push(`${reducedMotion}: interrupted/rapid navigation`);

      await resetTrace(page);
      await child.click();
      await expectTrace(page, [childHash], 'A nested heading must remain selected after settling');
      assert.equal(await child.evaluate((link) => getComputedStyle(link).fontWeight), childWeight, 'Highlighting must not change font metrics');
      checks.push(`${reducedMotion}: nested heading and stable font weight`);

      await first.click();
      await expectTrace(page, [childHash, firstHash], 'Returning from a nested heading must stay stable');
      await resetTrace(page);
      const nearBottom = links.nth((await links.count()) - 2);
      const nearBottomHash = await nearBottom.evaluate((link) => link.hash);
      await nearBottom.click();
      await expectTrace(page, [nearBottomHash], 'A bottom-clamped destination must not switch to the last heading');
      checks.push(`${reducedMotion}: bottom-clamped destination`);

      await last.click();
      await settleScroll(page);
      await page.mouse.move(600, 500);
      await page.mouse.wheel(0, -850);
      await settleScroll(page);
      await expectScrollSpy(page);
      checks.push(`${reducedMotion}: manual scroll resumes tracking`);

      await first.click();
      await settleScroll(page);
      await last.click();
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, -3000);
      await settleScroll(page);
      await expectScrollSpy(page);
      checks.push(`${reducedMotion}: manual interruption resumes tracking`);

      await last.click();
      await page.waitForTimeout(100);
      await page.keyboard.press('Home');
      await settleScroll(page);
      await expectScrollSpy(page);
      checks.push(`${reducedMotion}: keyboard interruption resumes tracking`);

      const geometry = await page.evaluate(() => {
        const article = document.querySelector('.post-content').getBoundingClientRect();
        const sidebar = document.querySelector('.toc').getBoundingClientRect();
        return { width: article.width, center: article.left + article.width / 2, viewportCenter: document.documentElement.clientWidth / 2, gap: sidebar.left - article.right };
      });
      assert.equal(geometry.width, 720);
      assert.ok(Math.abs(geometry.center - geometry.viewportCenter) < 1);
      assert.ok(geometry.gap >= 24);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(JSON.stringify({ result: 'PASS', checks }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
