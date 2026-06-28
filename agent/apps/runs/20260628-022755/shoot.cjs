const { chromium } = require("playwright");

const RUNDIR = "/home/user/Monte9/agent/labs/runs/20260628-022755";
const slugs = ["liquid-chrome", "rope-type", "gray-scott"];
const themes = ["light", "dark"];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const slug of slugs) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      });
      // Seed theme before any page script runs.
      await context.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch (e) {}
      }, theme);
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`[${slug}/${theme}] console: ${msg.text()}`);
      });
      page.on("pageerror", (err) => {
        errors.push(`[${slug}/${theme}] pageerror: ${err.message}`);
      });
      const url = `http://localhost:4137/labs/${slug}/`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      } catch (e) {
        errors.push(`[${slug}/${theme}] goto: ${e.message}`);
      }
      // Confirm theme attribute landed.
      const applied = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme")
      );
      if (applied !== theme) {
        // Force-apply and reload as a fallback.
        await page.evaluate((t) => {
          document.documentElement.setAttribute("data-theme", t);
          try { localStorage.setItem("theme", t); } catch (e) {}
        }, theme);
      }
      // Let WebGL / canvas warm up.
      await page.waitForTimeout(1500);
      // Pointer interaction: sweep mouse across the viewport for reactive pieces.
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const x = 120 + (1040 * i) / steps;
        const y = 200 + 460 * Math.sin((i / steps) * Math.PI);
        await page.mouse.move(x, y);
        await page.waitForTimeout(18);
      }
      // Scroll attempt for any scroll-driven piece.
      const scroller = await page.$('[class*="overflow-y-auto"]');
      if (scroller) {
        await scroller.evaluate((el) => {
          el.scrollTo({ top: el.scrollHeight * 0.5, behavior: "instant" });
        });
      } else {
        await page.mouse.wheel(0, 400);
      }
      await page.waitForTimeout(900);
      const out = `${RUNDIR}/${slug}-${theme}.png`;
      await page.screenshot({ path: out });
      console.log(`shot ${out} (theme applied=${applied})`);
      await context.close();
    }
  }
  await browser.close();
  if (errors.length) {
    console.log("=== ERRORS ===");
    for (const e of errors) console.log(e);
  } else {
    console.log("=== no console/page errors ===");
  }
})();
