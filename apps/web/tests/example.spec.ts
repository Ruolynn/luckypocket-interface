import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('功能说明', { exact: false })).toBeVisible()
})

test('leaderboard page renders', async ({ page }) => {
  await page.goto('/leaderboard')
  await expect(page.getByText('排行榜', { exact: false })).toBeVisible()
})


