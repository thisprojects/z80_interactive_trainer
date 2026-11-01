import { test, expect } from '@playwright/test'
import challenges from '../src/data/challenges.js'
import solutions from '../src/data/solutions.js'
import { setCode, run, results, choose, editor } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('layout', () => {
  test('instructions take about 30% and the editor about 70%, and the editor has real height', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop layout only')
    const pane = await page.getByRole('complementary', { name: 'Instructions' }).boundingBox()
    const editorBox = await page.getByRole('region', { name: 'Code editor' }).boundingBox()
    const total = pane.width + editorBox.width
    expect(pane.width / total).toBeCloseTo(0.3, 1)
    expect(editorBox.height).toBeGreaterThan(200) // guards against CodeMirror collapsing to 0 height
    await expect(editor(page)).toBeVisible()
  })

  for (const [width, height] of [[390, 740], [390, 600], [320, 568]]) {
    test(`leaves the editor usable on a ${width}x${height} phone`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const box = await page.getByRole('region', { name: 'Code editor' }).boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(150) // it used to shrink to 45-150px
      const results = await page.getByRole('region', { name: 'Results' }).boundingBox()
      expect(results.height).toBeLessThan(box.height)
    })
  }

  test('has no horizontal scrolling on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  })
})

test.describe('instructions', () => {
  test('lists every challenge and switches between them', async ({ page }) => {
    await expect(page.getByLabel('Select challenge').locator('option')).toHaveCount(challenges.length)
    await choose(page, challenges[3].id)
    await expect(page.getByRole('heading', { level: 2, name: challenges[3].title })).toBeVisible()
  })

  test('keeps hints hidden until they are opened', async ({ page }) => {
    const first = challenges[0].hints[0]
    await expect(page.getByText(first.body)).toHaveCount(0)
    await page.getByRole('button', { name: first.title }).click()
    await expect(page.getByText(first.body)).toBeVisible()
    await page.getByRole('button', { name: first.title }).click()
    await expect(page.getByText(first.body)).toHaveCount(0)
  })

  test('ships no reference solution in the production bundle', async ({ page }) => {
    const urls = await page.evaluate(() => [...document.scripts].map((el) => el.src).filter(Boolean))
    expect(urls.length).toBeGreaterThan(0)
    const bundle = (await Promise.all(urls.map(async (u) => (await page.request.get(u)).text()))).join('\n')
    expect(bundle).toContain('Hello, Z80!') // control: we really did download the app code
    for (const [id, src] of Object.entries(solutions)) {
      expect(bundle, `solution ${id}`).not.toContain(src)
      expect(bundle, `solution ${id} (escaped)`).not.toContain(JSON.stringify(src).slice(1, -1))
    }
  })

  test('never shows a reference solution on the page', async ({ page }) => {
    const body = await page.locator('body').innerText()
    for (const src of Object.values(solutions)) expect(body).not.toContain(src.trim())
  })
})

test.describe('running code', () => {
  test('fails the starter code, then passes once the program is correct', async ({ page }) => {
    await expect(results(page)).toContainText('Press Run')
    await run(page)
    await expect(results(page)).toContainText('Some tests failed.')
    await setCode(page, solutions['load-a'])
    await run(page)
    await expect(results(page)).toContainText('All tests passed')
  })

  test('shows expected and actual values for a wrong answer', async ({ page }) => {
    await setCode(page, '        ORG 0x8000\n        LD A,7\n        HALT\n')
    await run(page)
    await expect(results(page)).toContainText('Some tests failed.')
    await expect(results(page)).toContainText('register A')
    await expect(results(page)).toContainText('expected: 42')
    await expect(results(page)).toContainText('actual: 7')
  })

  test('shows assembly errors with a line number', async ({ page }) => {
    await setCode(page, '        ORG 0x8000\n        FROBNICATE A\n        HALT\n')
    await run(page)
    await expect(page.getByRole('alert')).toContainText(/Line 2.*Unknown instruction/)
  })

  test('reports a program that never halts', async ({ page }) => {
    await setCode(page, '        ORG 0x8000\nloop:   JR loop\n')
    await run(page)
    await expect(results(page)).toContainText('did not finish')
  })

  test('clears the old verdict as soon as the code is edited', async ({ page }) => {
    await run(page)
    await expect(results(page)).toContainText('Some tests failed.')
    await editor(page).click()
    await page.keyboard.type(' ')
    await expect(results(page)).toContainText('Press Run')
  })

  test('requires a real subroutine for the subroutine challenge', async ({ page }) => {
    await choose(page, 'subroutine')
    await setCode(page, '        ORG 0x8000\n        ADD A,A\n        ADD A,A\n        ADD A,A\n        HALT\n')
    await run(page)
    await expect(results(page)).toContainText('subroutine "double"')
    await setCode(page, solutions.subroutine)
    await run(page)
    await expect(results(page)).toContainText('All tests passed')
  })
})

test.describe('keyboard and accessibility', () => {
  test('Ctrl/Cmd+Enter runs the program without adding a line to the editor', async ({ page }) => {
    await setCode(page, solutions['load-a'])
    const before = await page.locator('.cm-line').count()
    await page.keyboard.press('ControlOrMeta+Enter')
    await expect(results(page)).toContainText('All tests passed')
    expect(await page.locator('.cm-line').count()).toBe(before)
  })

  test('the code editor has an accessible name and can be left with Esc then Tab', async ({ page }) => {
    const textbox = page.getByRole('textbox', { name: 'Z80 assembly code editor' })
    await expect(textbox).toBeVisible()
    await textbox.click()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement.closest('.cm-editor'))).toBe(false)
  })

  test('loads and runs without console errors, page errors or failed requests', async ({ page }) => {
    const problems = []
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
    page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`))
    page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`))
    await page.goto('/')
    await choose(page, 'fizzbuzz')
    await run(page)
    await expect(results(page)).toContainText('Some tests failed.')
    expect(problems).toEqual([])
  })

  test('declares a favicon and a description so browsers do not request /favicon.ico', async ({ page }) => {
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Z80/)
  })

  test('text keeps WCAG AA contrast (4.5:1) on the Run button and the empty results panel', async ({ page }) => {
    const ratio = (el) =>
      el.evaluate((node) => {
        // Tailwind v4 reports oklch(); a 1x1 canvas converts any CSS colour to sRGB bytes
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
        const channels = (c) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = '#000'
          ctx.fillStyle = c
          ctx.fillRect(0, 0, 1, 1)
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
        }
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        let bg = node
        while (bg && /rgba\(.*, 0\)|transparent/.test(getComputedStyle(bg).backgroundColor)) bg = bg.parentElement
        const [a, b] = [lum(channels(getComputedStyle(node).color)), lum(channels(getComputedStyle(bg).backgroundColor))]
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      })
    expect(await ratio(page.getByRole('button', { name: 'Run' }))).toBeGreaterThanOrEqual(4.5)
    expect(await ratio(page.getByText('Press Run to test your program.'))).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe('saving', () => {
  test('remembers code and the selected challenge after a reload', async ({ page }) => {
    await choose(page, 'add-two')
    await setCode(page, '        ORG 0x8000\n        ADD A,B ; my work\n        HALT\n')
    await page.reload()
    await expect(page.getByLabel('Select challenge')).toHaveValue('add-two')
    await expect(editor(page)).toContainText('my work')
  })

  test('Reset empties the editor even when clicked immediately after typing', async ({ page }) => {
    await editor(page).click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.insertText('        ORG 0x8000\n        NOP ; fast scribble\n')
    await page.getByRole('button', { name: 'Reset' }).click() // no pause on purpose
    // Without remounting the editor, the old text lingered for ~1s after Reset, so the default
    // auto-retry hid it. Demand the update almost immediately instead.
    await expect(editor(page)).not.toContainText('fast scribble', { timeout: 250 })
    await expect(editor(page)).toContainText('your code here', { timeout: 250 })
    await run(page) // what is on screen must be what runs
    await expect(results(page)).toContainText('Some tests failed.')
  })

  test('Reset restores the starter code and forgets the saved copy', async ({ page }) => {
    await setCode(page, '        ORG 0x8000\n        NOP ; scribble\n        HALT\n')
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(editor(page)).not.toContainText('scribble')
    await expect(editor(page)).toContainText('your code here')
    await page.reload()
    await expect(editor(page)).not.toContainText('scribble')
  })
})

// The strongest check: type every reference solution into the real editor and press Run.
test.describe('every challenge can be solved in the browser', () => {
  for (const c of challenges) {
    test(`${c.id}`, async ({ page }) => {
      await choose(page, c.id)
      await run(page)
      await expect(results(page)).toContainText('Some tests failed.') // the starter code must not pass
      await setCode(page, solutions[c.id])
      await run(page)
      await expect(results(page)).toContainText('All tests passed')
    })
  }
})

test.describe('cheat sheet', () => {
  test('opens from the nav bar, shows examples, and returns to the trainer', async ({ page }) => {
    await page.getByRole('button', { name: 'Cheat sheet' }).click()
    await expect(page.getByRole('heading', { name: 'Z80 cheat sheet' })).toBeVisible()
    await expect(page.getByRole('article', { name: 'If / else' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await page.getByRole('button', { name: 'Back to challenges' }).click()
    await expect(editor(page)).toBeVisible()
  })
})
