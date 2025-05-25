import { chromium } from "@playwright/test"

interface Props {
    headless?: boolean
    url?: string
}

export async function open({ url, headless = false }: Props) {
    const browser = await chromium.launch({
        headless,
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
        recordHar: { path: 'har.json' },
        storageState: 'auth.json',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'en-GB,en;q=0.9',
            'sec-ch-ua': '"Not.A/Brand";v="99", "Chromium";v="136"'
        }
    })

    const page = await context.newPage()
    if (url) await page.goto(url)

    page.on('close', async () => {
        try {
            console.log('Page closed, closing context and browser...')
            await context.close()
            await browser.close()
        } catch (e) {
            console.error('Error closing browser:', e)
        }
    })

    if (headless) {
        await page.waitForTimeout(10000)
        console.log('Headless mode: closing page after 10 seconds...')
        await page.close()
    }
}