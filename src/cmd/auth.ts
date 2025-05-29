import { chromium } from "@playwright/test"

export async function auth() {
    console.log('Authenticating and saving...')
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-infobars',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--enable-features=NetworkService,NetworkServiceInProcess',
        ],
    })
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
    })

    const page = await context.newPage()
    page.on('close', async () => {
        await context.storageState({ path: 'auth.json' })
        await browser.close()
    })
}