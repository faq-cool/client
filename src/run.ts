
import faq from '@faq.cool/types'
import { chromium } from '@playwright/test'
import assert from 'assert'
import { readFile } from 'fs/promises'
import sharp from 'sharp'
import yaml from 'yaml'
import { FAQ, KeyVals, KeyValue, Scene, Step } from './schema'

function logger() {
    const start = Date.now()
    return (...args: any[]) => {
        const elapsed = Date.now() - start

        const hours = Math.floor(elapsed / (1000 * 60 * 60))
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
        const milliseconds = elapsed % 1000

        const formatted = [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0'),
            String(milliseconds).padStart(3, '0'),
        ].join(':')

        console.log(`[${formatted}]`, ...args)
    }
}

export async function load(path_yaml: string) {
    const f = await readFile(
        path_yaml, {
        encoding: 'utf-8',
    })
    return yaml.parse(f) as FAQ
}

namespace out {
    export type Step = faq.Step
    export type Scene = faq.Scene
}

interface Options {
    width?: number
    height?: number
    headless?: boolean
}

interface Params {
    script: FAQ
    options?: Options
}

export async function run({ script, options }: Params) {
    const log = logger()
    const {
        width = 1024,
        height = 768,
        headless = true,
    } = options || {}

    const viewport = { width, height }

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
        viewport,
        storageState: 'auth.json',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'en-GB,en;q=0.9',
            'sec-ch-ua': '"Not.A/Brand";v="99", "Chromium";v="136"'
        }
    })

    const { faq } = script
    const cs = Object
        .entries(faq.cookies || {})
        .map(([name, value]) => ({
            name,
            value,
            domain: faq.domain,
            path: '/',
        }))

    context.addCookies(cs)

    const page = await context.newPage()
    await page.goto(`https://${faq.domain}${faq.path}`)

    async function screenshot() {
        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
        })

        const img = await sharp(buffer)
            .avif({ quality: 40 })
            .toBuffer()

        return `data:image/avif;base64,${img.toString('base64')}`
    }

    type Keys<T> = T extends any ? keyof T : never
    type type = Keys<Step>
    type Visitor<T> = { [k in type]: (...ps: any) => T }

    function visit<T>(step: Step, visitor: Visitor<T>) {
        if ('say' in step) return visitor.say(step.say)
        if ('click' in step) return visitor.click(step.click)
        if ('highlight' in step) return visitor.highlight(step.highlight)

        if ('fill' in step) return visitor.fill(step.fill)
        if ('mask' in step) return visitor.mask(step.mask)
        if ('select' in step) return visitor.select(step.select)
        if ('file' in step) return visitor.file(step.file)

        console.error('Unknown step', step)
        process.exit(1)
    }

    const kvs = (ks: KeyVals) => ks.map((o) => Object.entries(o)).flat()

    const fillOrMask = async (keyVals: KeyVals) => {
        for (const [k, v] of kvs(keyVals)) {
            log('Fill Or Mask', k, v)
            await page.fill(k, v)
        }
    }

    async function execute(scene: Scene) {
        for (const step of scene) {
            await visit(step, {
                say: async () => { },
                click: async (input) => {
                    log('Clicking', input)
                    await page.click(input)
                },
                highlight: async (input) => { },

                fill: fillOrMask,
                mask: fillOrMask,
                select: async (select) => {
                    for (const [k, v] of kvs(select)) {
                        log('Selecting', k, v)
                        await page.selectOption(k, v)
                    }
                },
                file: async (file) => {
                    for (const [k, v] of kvs(file)) {
                        log('Uploading File', k, v)
                        await page.setInputFiles(k, v)
                    }
                },
            })
        }
    }

    function waitForAnimationFrame() {
        return page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
    }

    async function compile(scene: Scene): Promise<out.Scene> {
        log('Waiting for page to load')
        await page.waitForLoadState('networkidle', { timeout: 10000 })

        // THIS IS A BIT AGGRESSIVE
        // await page.addStyleTag({
        //     content: `
        //       *::before, *::after {
        //         content: none !important;
        //         width: 0 !important;
        //         height: 0 !important;
        //         display: none !important;
        //       }
        //     `
        // })

        await page.addStyleTag({
            content: `
              *, *::before, *::after {
                transition: none !important;
                animation: none !important;
              }
            `
        })

        // GET SELECTORS THAT MUST BE VISIBLE
        const keys = (keyVals: KeyVals) => keyVals.map((o) => Object.keys(o)).flat()
        const selectors = scene.map(step => visit<string | string[]>(step, {
            say: () => [],
            click: (input) => input,
            highlight: (input) => input,

            fill: keys,
            mask: keys,
            select: keys,
            file: () => [],
        })).flat()

        log('Selectors', selectors)

        const locators = selectors.map(name => ({
            name,
            locator: page.locator(name),
        }))

        // WAITING FOR LOCATORS
        await Promise.all(locators.map(async ({ locator }) => {
            await locator.waitFor({ state: 'visible' })
        }))

        async function getDimensions() {
            log('Getting Document Size')
            const { sw, sh } = await page.evaluate(() => {
                const { scrollWidth: sw, scrollHeight: sh } = document.documentElement
                return { sw, sh }
            })

            const { width, height } = page.viewportSize() || { width: 0, height: 0 }
            if (width != sw || height != sh) {
                log('Setting Viewport Size', sw, sh)
                await page.setViewportSize({ width: sw, height: sh })
                await waitForAnimationFrame()
            }

            log('Getting scroll position')
            const { sx, sy } = await page.evaluate(() => {
                return { sx: window.scrollX, sy: window.scrollY }
            })

            assert(sx == 0 && sy == 0, 'Scroll position should be 0,0')

            const boxes = await Promise.all(locators.map(async ({ name, locator }): Promise<{ name: string, box: faq.Box } | undefined> => {
                try {
                    log('Getting box for', name)
                    const box = await locator.boundingBox()
                    if (box === null) return
                    return { name, box }
                } catch {
                    console.error('Error getting box for', name)
                    process.exit(1)
                }
            }))

            return { sw, sh, boxes }
        }

        async function getScreenshot() {
            const { sw, sh, boxes } = await getDimensions()

            log('Taking Screenshot')
            const image = await screenshot()

            // const { sw: sw2, sh: sh2, boxes: boxes2 } = await getDimensions()
            // if (sw != sw2) {
            //     log('width mismatch', sw, sw2)
            //     return await getScreenshot()
            // }

            // if (sh != sh2) {
            //     log('height mismatch', sh, sh2)
            //     return await getScreenshot()
            // }


            // if (!isEqual(boxes, boxes2)) {
            //     log('boxes mismatch', boxes, boxes2)
            //     return await getScreenshot()
            // }

            return { image, sw, sh, boxes }
        }


        const { image, sw, sh, boxes } = await getScreenshot()


        // EXECUTING
        log('Executing')
        await execute(scene)


        // STEPS
        log('Generating Steps')
        function o2s(type: 'fill' | 'select', v2v = (v: string): string => v): (o: KeyValue) => out.Step[] {
            return (o: KeyValue) =>
                Object.entries(o).map(([input, value]) => ({
                    type,
                    input,
                    value: v2v(value)
                })).flat()
        }

        function o2ss(o2s: (o: KeyValue) => out.Step[]) {
            return (os: KeyVals) => os.map(o => o2s(o)).flat()
        }


        const stepVisitor: Visitor<out.Step | out.Step[]> = {
            say: (text) => ({ type: 'say', text }),
            click: (input) => ({ type: 'click', input }),
            highlight: (input) => ({ type: 'highlight', input }),

            fill: o2ss(o2s('fill')),
            mask: o2ss(o2s('fill', v => '*'.repeat(v.length))),
            select: o2ss(o2s('select')),
            file: () => []
        }

        const steps: out.Step[] = scene.map(step => visit<out.Step | out.Step[]>(step, stepVisitor)).flat()

        log('Emitting')
        const names = Object
            .fromEntries(
                boxes
                    .filter(e => e !== undefined)
                    .map(({ name, box }) => [name, box]))

        return { image, width: sw, height: sh, names, steps }
    }

    const scenes: out.Scene[] = []
    for (const scene of faq.scenes) scenes.push(await compile(scene))

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)))
    await browser.close()


    return {
        voice: faq.voice,
        scenes,
    }
}


