import { test, expect } from '@playwright/test';

test.use({
    ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
    await page.goto('https://naportal-ci-pgsql.c.ptin.corppt.com/portal/na/login');
    await page.getByPlaceholder('Insert username').click();
    await page.getByPlaceholder('Insert username').fill('ADMIN_PORTAL');
    await page.getByPlaceholder('Insert password').click();
    await page.getByPlaceholder('Insert password').fill('naptin');
    await page.getByRole('button', { name: 'Enter' }).click();
    await page.locator('#operational-button-monitoring').click();
    await page.getByPlaceholder('Escreva o ID da ordem que deseja verificar').click();
    await page.getByPlaceholder('Escreva o ID da ordem que deseja verificar').fill('02d5414d-2271-415f-a195-bb516dde0dec');
    await page.getByRole('button', { name: 'Pesquisar' }).click();
    await expect(page.getByRole('gridcell', { name: 'Não existem registos a apresentar' })).toBeVisible();
    await page.locator('#search-date-range').click();
    await page.getByText('Última semana').click();
    await page.getByRole('button', { name: 'Pesquisar' }).click();
    await expect(page.getByRole('heading', { name: '02d5414d-2271-415f-a195-bb516dde0dec - DUMMY' })).toBeVisible();
});