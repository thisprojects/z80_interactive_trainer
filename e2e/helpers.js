import { expect } from '@playwright/test'

export const editor = (page) => page.locator('.cm-content')

// Replace the editor's whole contents by typing into the real CodeMirror instance.
export async function setCode(page, code) {
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
  await expect(editor(page)).toContainText(code.split('\n').find((l) => l.trim()).trim())
}

export const run = (page) => page.getByRole('button', { name: 'Run' }).click()
export const results = (page) => page.getByRole('region', { name: 'Results' })
export const challengeMenu = (page) => page.getByRole('button', { name: /^Select challenge/ })
export async function choose(page, id) {
  await challengeMenu(page).click()
  await page.locator(`[role=option][data-value="${id}"]`).click()
}
