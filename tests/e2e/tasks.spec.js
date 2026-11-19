import { test, expect } from '@playwright/test';

test('crear, persistir, completar, aislar y eliminar una tarea', async ({ page, browser }, info) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Agregar' })).toBeEnabled();
  await page.getByLabel('Nueva tarea').fill('Preparar el artículo NoSQL');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Preparar el artículo NoSQL', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('tarea-creada.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Completar: Preparar el artículo NoSQL', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Completar: Preparar el artículo NoSQL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reabrir: Preparar el artículo NoSQL', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('tarea-completada.png'), fullPage: true });
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await second.goto('http://127.0.0.1:15174');
    await expect(second.getByRole('button', { name: 'Agregar' })).toBeEnabled();
    await expect(second.locator('.task')).toHaveCount(0);
  } finally { await other.close(); }
  await page.getByRole('button', { name: 'Eliminar: Preparar el artículo NoSQL', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu lista empieza aquí' })).toBeVisible();
});
