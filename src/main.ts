import faq from '@faq.cool/server'
import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'fs/promises'
import sharp from 'sharp'
import yaml from 'yaml'
import api from './api'
import { FAQ, KeyVals, KeyValue, SceneItem, Step } from './schema'

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

async function load(path_yaml: string) {
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

async function main(faqScript: FAQ) {
    const log = logger()

    const viewport = { width: 1024, height: 768 }
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-infobars'
        ],
    })

    const context = await browser.newContext({
        viewport,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        colorScheme: 'light',
        javaScriptEnabled: true,
    })

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        })
    })

    const { faq } = faqScript
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
    interface Visitor<T> extends Record<type, (...args: any[]) => T> {
        'say': (text: string) => T
        'click': (input: string) => T
        'highlight': (input: string) => T

        'fill': (actions: KeyVals) => T
        'select': (actions: KeyVals) => T
        'file': (actions: KeyVals) => T
    }

    function visit<T>(step: Step, visitor: Visitor<T>) {
        if ('say' in step) return visitor.say(step.say)
        if ('click' in step) return visitor.click(step.click)
        if ('highlight' in step) return visitor.highlight(step.highlight)

        if ('fill' in step) return visitor.fill(step.fill)
        if ('mask' in step) return visitor.fill(step.mask)
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

    async function execute(scene: SceneItem['scene']) {
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

    type Steps = SceneItem['scene']

    interface Init {
        timeout?: number
    }

    async function compile(scene: Steps): Promise<out.Scene> {
        // await initScene()
        log('Waiting for page to load')
        await page.waitForLoadState('load', { timeout: 5000 })

        // GET ALL SELECTORS
        const keys = (keyVals: KeyVals) => keyVals.map((o) => Object.keys(o)).flat()
        const selectors = scene.map(step => visit<string | string[]>(step, {
            say: () => [],
            click: (input) => input,
            highlight: (input) => input,

            fill: keys,
            mask: keys,
            select: keys,
            file: keys,
        })).flat()

        const locators = selectors.map(name => ({
            name,
            locator: page.locator(name),
        }))

        // GETTING BOXES
        log('Getting scroll position')
        const { sx, sy } = await page.evaluate(() => {
            return { sx: window.scrollX, sy: window.scrollY }
        })

        const boxes = await Promise.all(locators.map(async ({ name, locator }) => {
            try {
                log('Getting box for', name, await locator.count())
                const box = await locator.boundingBox()
                if (box === null) return
                return {
                    name, box: {
                        x: box.x + sx,
                        y: box.y + sy,
                        width: box.width,
                        height: box.height,
                    }
                }
            } catch {
                console.error('Error getting box for', name)
                process.exit(1)
            }
        }))

        // TAKING SCREENSHOT
        log('Taking Screenshot')
        const image = await screenshot()

        // DOCUMENT SIZE
        log('Getting Document Size')
        const { width, height } = await page.evaluate(async () => {
            const { scrollWidth: width, scrollHeight: height } = document.documentElement
            return { width, height }
        })


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

        // EXECUTING
        log('Executing')
        await execute(scene)

        log('Emitting')
        const names = Object
            .fromEntries(
                boxes
                    .filter(e => e !== undefined)
                    .map(({ name, box }) => [name, box]))

        return { image, width, height, names, steps }
    }

    const scenes: out.Scene[] = []
    for (const scene of faq.scenes) scenes.push(await compile(scene.scene))

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)))
    await browser.close()

    log('Saving to faq.json')
    const save = {
        token: process.env.TOKEN as string,
        faq_id: faq.id,
        voice: faq.voice,
        scenes,
    }

    await writeFile('faq.json', JSON.stringify(
        save,
        (k, v) => k == 'image' ? '' : v,
        2))

    log('Saving to faq.cool')
    await api.save(save)
}

const file = '/home/gilad/Work/faq.cool/server/demo.yaml'
const faq = await load(file)

main(faq)
    .then(() => console.log('✅ Done'))
    .catch(console.error)
    .finally(process.exit)