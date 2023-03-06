# PLAYWRIGHT WORKSHOP

This is an introduction to e2e tests in playwright. In this workshop we will learn how to create, run and debug playwright tests
as well as how to create CI pipelines to automate our testing needs.

### Step 1: Installing playwright.

Playwright requires a Node installation to be present. 
If you do not have node installed download it [here](https://nodejs.org/en/download/).

To install playwright run the command:
```shell
    npm init playwright@latest
```

This will open a Wizard that will help you to pre-configure your playwright project. 
If you want to run your tests directly from you machine, remember to install playwright browsers and dependencies.

```text
    npm init playwright@latest

    ✔ Do you want to use TypeScript or JavaScript? · TypeScript
    ✔ Where to put your end-to-end tests? · tests
    ✔ Add a GitHub Actions workflow? (y/N) · false
    ✔ Install Playwright browsers (can be done manually via 'npx playwright install')? (Y/n) · true
    ✔ Install Playwright operating system dependencies (requires sudo / root - can be done manually via 'sudo npx playwright install-deps')? (y/N) · true
```

You can run your tests in a container without having to install browsers and os dependencies.
```shell
    docker run -v "$(pwd)":/playwright --workdir /playwright mcr.microsoft.com/playwright:v1.31.0-focal npx playwright test
```

Playwright already comes with a server capable of hosting our reports:
```shell
    npx playwright show-report
```

> Learn more about this step on the official [Playwright documentation](https://playwright.dev/docs/intro)

### Step 2: Creating and running your first test playwright.

Playwright comes out of the box with a powerful API for writing tests. This api includes many features, like
auto waiting, snapshot testing, soft assertions... In this workshop we will not dive deep into all the capabilities that
playwright offers, and will instead use the [Playwright codegen](https://playwright.dev/docs/codegen).

In this step we will test the following scenario:
```
	Scenario: [MONITORING-WEB] Date ranges are also taken in consideration when searching by id
		Given I am "administrator" on "order search" page
		When I search by order id "02d5414d-2271-415f-a195-bb516dde0dec"
		Then the table "order search" is empty
		When I search by order id "02d5414d-2271-415f-a195-bb516dde0dec" and date range "Last week"
		Then I should be on "order view" page	
```

Start the codegen by typing:
```shell
    npx playwright codegen --ignore-https-errors https://naportal-ci-pgsql.c.ptin.corppt.com/portal/na/login
```

>We need to use the flag **--ignore-https-errors** since out CI portal uses a self-signed certificate

Now I just have to record all the steps. In case of a step to validate a non-interactive state,
just click it where the final user would look to reach a conclusion, we can change the interaction into one assertion later.

After following the steps you should have with something like this:

```ts
import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://naportal-ci-pgsql.c.ptin.corppt.com/portal/na/login');
  await page.getByPlaceholder('Insert username').click();
  await page.getByPlaceholder('Insert username').fill('ADMIN_PORTAL');
  await page.getByPlaceholder('Insert username').press('Tab');
  await page.getByPlaceholder('Insert password').fill('naptin');
  await page.getByRole('button', { name: 'Enter' }).click();
  await page.locator('#operational-button-monitoring').click();
  await page.getByPlaceholder('Escreva o ID da ordem que deseja verificar').click();
  await page.getByPlaceholder('Escreva o ID da ordem que deseja verificar').fill('02d5414d-2271-415f-a195-bb516dde0dec');
  await page.getByRole('button', { name: 'Pesquisar' }).click();
  await page.getByRole('gridcell', { name: 'Não existem registos a apresentar' }).click();
  await page.locator('#search-date-range').click();
  await page.getByText('Última semana').click();
  await page.getByRole('button', { name: 'Pesquisar' }).click();
  await page.getByRole('heading', { name: '02d5414d-2271-415f-a195-bb516dde0dec - DUMMY' }).click();
});
```

Now copy it into a file in the test directory, edit the metadata, and change the clicks that should be [assertions](https://playwright.dev/docs/test-assertions).

And finally we have our test done:

tests/na-portal-6963.spec.ts
```ts
import { test, expect } from '@playwright/test';

test.use({
    ignoreHTTPSErrors: true
});

test('[MONITORING-WEB] Date ranges are also taken in consideration when searching by id', async ({ page }) => {
    await page.goto('https://naportal-ci-pgsql.c.ptin.corppt.com/portal/na/login');
    await page.getByPlaceholder('Insert username').click();
    await page.getByPlaceholder('Insert username').fill('ADMIN_PORTAL');
    await page.getByPlaceholder('Insert username').press('Tab');
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
```

Now all that is left is for us to run our test and check if everything is working as expected.

```shell
    npx playwright test --project firefox --headed
```

> the flag **--project** let us choose the browser that will run this test, the flag **--headed** let us watch the tests as they run-

### Step 3: Debug and Trace tests

#### Debugger
Playwright comes out of the box with tools to help us debug tests. A debugger and a trace viewer. The debug tool enable 
us to see how our test is in real time and traces let us see all that have happened to a previously executed test.

To run a test in debug mode, all you have to do is to add the **--debug** flag.

```shell
    npx playwright test --debug --project firefox
```

#### Tracer
First we need to record a trace, by default playwright will not record any trace, we can configure it to run traces on 
all tests or to rerun failed tests with the tracer recorder on. We can manually activate the trace recorder by using the
**--trace on** flag.

```shell
  npx playwright test --trace on --project firefox
```

After executing the test the trace will be available in the report.

### Step 4: Configurations, parallelism and sharding

#### playwright.config.ts
There is many ways to customize how to run our tests. The obvious first step is the playwright.config.ts file that was 
created during the step 1. This file contains our global configurations.

First lets configure what browsers should our tests run in by removing the webkit (safari) browser from it:
```ts
export default defineConfig({
    //...
    projects: [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
    
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        }]
    //...
});
```

Now lets make sure it rerun and record traces for all test failures:
```ts
export default defineConfig({
//...
    retries: 1,
//...
    use: {
        //...
        trace: 'on-first-retry'
    }
//...
});
```

Also let's avoid opening the report after running the tests even in the case of a failure:
```ts
export default defineConfig({
//...
    reporter: [['html', { open: 'never' }]],
//...
});
```

Let's also create a failing test by copying the test we already have and inverting one of the assertions:

failing.spec.ts
```ts
//..
test('[FAILING][MONITORING-WEB] Date ranges are also taken in consideration when searching by id', async ({ page }) => {
    //...
    await expect(page.getByRole('heading', {name: 'Wrong name'})).toBeVisible();
    //...
});
```

Now lets run our tests with the command:
```shell
  npx playwright test
```

#### Command options
Another powerful way of customizing how we run our tests is by though passing instructions when running it, lets try
to run our test with different levels of parallelism and sharding for example:

To run our tests with a defined number of threads, we can use the flag **--workers X** where X is the number of workers 
we want.

Run this command to execute the tests with a single worker:
```shell
  npx playwright test --workers 1
```

>This flag have the shorthanded format **-j X**

Now lets try to run our tests in different shards, to do it we use the flag **--shard=X/Y** where Y is the current shard
and Y is the total number of shards. Playwright will automatically resolve based onn this input what tests should run on 
each shard:

```shell
  npx playwright test -j 2 --shard=1/2; 
```

#### Environment variables
Another option is the use of environment variables, which is especially useful when working with containers.

Let's use an environment variable to change the html report directory:

```shell
env PLAYWRIGHT_HTML_REPORT='new-report-directory' bash -c 'npx playwright test --project firefox -j 2'
```

> We can also set configurations on our test files, you can lean more about playwright 
> configurations in the [Playwright documentation](https://playwright.dev/docs/test-configuration)

### Step 5: GitHub Actions and CI

Let's now create a GitHub action that uses action matrices to run our tests in sharded mode.

Starting with a simple test:
```yml
name: Playwright Tests Single
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  e2e-tests:
    name: 'e2e Tests'
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.31.0-focal
    strategy:
      fail-fast: false
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npx playwright test
        env:
          PLAYWRIGHT_HTML_REPORT: playwright-report
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report
```

Update our strategy to use a matrix that orchestrate all shards that we're going to use and update our execution
so that each shard executes only what it is supposed to execute:
```yml
#...
jobs:
  #...
  e2e-tests:
    #...
    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox]
        shardIndex: [1, 2]
        shardTotal: [2]
    #...
    steps:
      - name: Run tests
        run: npx playwright test -j 1 --project=${{ matrix.project }} --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    #...
```

In the present form, when there are errors, the GitHub action is overwriting the report. We need to make it so each
shard create a separated report:
```yaml
#...
jobs:
  #...
  e2e-tests:
    #...
    steps:
      - name: Run tests
        run: npx playwright test -j 1 --project=${{ matrix.project }} --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          PLAYWRIGHT_HTML_REPORT: playwright-report-${{ matrix.project }}-shard${{ matrix.shardIndex }}
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.project }}-shard${{ matrix.shardIndex }}
          path: playwright-report-${{ matrix.project }}-shard${{ matrix.shardIndex }}
    #...    
```

The end!