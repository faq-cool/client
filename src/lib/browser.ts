import { chromium } from "@playwright/test"

interface Props {
    headless?: boolean
    recordHar?: boolean
    storageState?: string
}

export async function newContext({
    headless = true,
    recordHar = false,
    storageState }: Props = {}) {

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

    const options = {
        ...(storageState ? { storageState } : {}),
        ...(recordHar ? { recordHar: { path: 'har.json' } } : {}),
    }

    const context = await browser.newContext({
        ...options,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'en-GB,en;q=0.9',
            'sec-ch-ua': '"Not.A/Brand";v="99", "Chromium";v="136"'
        }
    })

    return { browser, context }
}