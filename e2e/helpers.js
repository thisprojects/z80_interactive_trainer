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
export const menu = (page) => page.getByRole('button', { name: /^Select (lesson|challenge)/ })
export const openChallenges = (page) => page.getByRole('tab', { name: 'Challenges' }).click()
export const openLessons = (page) => page.getByRole('tab', { name: 'Learn' }).click()
// Pick an item from the menu of whichever tab is showing.
export async function choose(page, id) {
  await menu(page).click()
  await page.locator(`[role=option][data-value="${id}"]`).click()
}
