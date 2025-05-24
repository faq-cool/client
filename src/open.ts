import { chromium } from "@playwright/test"

interface Props {

}

export async function open() {
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
        storageState: 'auth.json',
    })

    const page = await context.newPage()

    page.on('close', async () => {
        await browser.close()
    })
}