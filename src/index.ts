// playwright-rrweb-recorder.ts
// https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/index.md
import faq from '@faq.cool/server'
import { writeFile } from 'fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'
import proxy from './proxy'

// const API = 'https://faq.cool/api'
const API = 'http://localhost:3000/api'
const SAVE = `${API}/save`


export interface Cookie {
    name: string
    value: string
    domain: string
}

interface FAQ {
    token: string
    faq_id: number
    width?: number
    cookies?: Cookie[]
    home: string
    voice: faq.Voice
}

async function save(version: faq.Save) {
    const res = await fetch(SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(version)
    })

    return await res.json()
}

export default async function faq(faq: FAQ) {
    const { token, faq_id, cookies = [], width = 1024, home, voice } = faq
    const height = Math.round(width * 3 / 4)

    // BROWSER
    const browser = await chromium.launch({
        // headless: false,
    })

    // CONTEXT
    const viewport = { width, height }
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor: 1,
    })

    context.addCookies(cookies.map(c => ({ ...c, path: '/' })))

    const doc = { width: 0, height: 0 }
    const steps: faq.Step[] = []

    async function screenshot() {
        await page.waitForLoadState('networkidle')
        await page.waitForLoadState()

        console.log('screenshot', page.url())

        const { width, height } = await page.evaluate(() => {
            const { scrollWidth: width, scrollHeight: height } = document.documentElement
            return { width, height }
        })

        doc.width = width
        doc.height = height

        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
        })

        const img = await sharp(buffer)
            .avif({ quality: 40 })
            .toBuffer()


        await scrollIfNeeded()
        steps.push({ type: 'screenshot', img: img.toString('base64') })
    }

    function describe(text: string) {
        steps.push({
            type: 'description',
            text,
            voice,
        })
    }

    const offset: faq.Offset = { x: 0, y: 0 }
    async function scrollIfNeeded() {
        await page.waitForLoadState()
        const { sx, sy } = await page.evaluate(() => {
            const { scrollX: x, scrollY: y } = window
            const { scrollWidth: w, scrollHeight: h } = document.documentElement

            return { sx: x / w, sy: y / h }
        })

        const { x, y } = offset

        if (sx !== x || sy !== y) steps.push({
            type: 'scroll',
            x: sx,
            y: sy,
        })

        offset.x = sx
        offset.y = sy
    }



    function norm(box: faq.Box) {
        const { width: w, height: h } = doc
        const { x, y, width, height } = box
        return { x: x / w, y: y / h, width: width / w, height: height / h }
    }

    function get(q: string) {
        const locator = page.locator(q)

        // TODO Ensure document size has not changed
        // if it has changed either throw an error or take a new screenshot

        return new Proxy(locator, {
            get(target, prop, receiver) {
                const org = Reflect.get(target, prop, receiver)
                const fun = proxy[prop]

                if (!fun) return org

                return async (...args: any[]) => {
                    if (await locator.isVisible()) await locator.scrollIntoViewIfNeeded()

                    await scrollIfNeeded()
                    const box = norm(await locator.evaluate((el) => {
                        const rect = el.getBoundingClientRect()
                        return {
                            x: rect.left + window.scrollX,
                            y: rect.top + window.scrollY,
                            width: rect.width,
                            height: rect.height
                        }
                    }))

                    const event = { ...box, ...fun.apply(target, args) }
                    steps.push(event)

                    console.log('org.apply', q)
                    await org.apply(target, args)
                    console.log('org.apply done', q)
                }
            }
        })
    }

    async function end() {
        await browser.close()
        await save({ token, faq_id, steps })
        await writeFile('steps.json', JSON.stringify(steps, null, 2))
    }

    // PAGE
    const page = await context.newPage()
    await page.goto(home)
    await page.waitForLoadState()
    await screenshot()

    return { screenshot, describe, get, end }
}

