import { newContext } from "../lib/browser"

interface Open {
    url: string
    authJson?: string
}

export async function open({ url, authJson }: Open) {
    const { browser, context } = await newContext({
        headless: false,
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
}