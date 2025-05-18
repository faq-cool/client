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
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor: 1,
    })

    const { faq } = faqScript
    const cs = Object
        .entries(faq.cookies)
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
        if ('select' in step) return visitor.select(step.select)
        if ('file' in step) return visitor.file(step.file)

        console.error('Unknown step', step)
        process.exit(1)
    }

    const kvs = (ks: KeyVals) => ks.map((o) => Object.entries(o)).flat()

    async function execute(scene: SceneItem['scene']) {
        for (const step of scene) {
            await visit(step, {
                say: async () => { },
                click: async (input) => {
                    log('Clicking', input)
                    await page.click(input)
                },
                highlight: async (input) => { },

                fill: async (fill) => {
                    for (const [k, v] of kvs(fill)) {
                        log('Filling', k, v)
                        await page.fill(k, v)
                    }
                },
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

    async function initScene() {
        await page.waitForLoadState()
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
        })
        await page.evaluate(() => {
            window.scrollTo(0, 0)
        })
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images).map(img => {
                    if (img.complete && img.naturalWidth !== 0) return Promise.resolve()
                    return new Promise<void>((resolve, reject) => {
                        img.addEventListener('load', () => resolve(), { once: true })
                        img.addEventListener('error', () => reject('Image failed to load'), { once: true })
                    })
                })
            )
        })
    }
    async function compile(scene: Steps): Promise<out.Scene> {
        // LOAD AND SCROLL TO TOP
        await initScene()



        // GET ALL SELECTORS
        const selectors = scene.map(step => visit<string | string[]>(step, {
            say: () => [],
            click: (input) => input,
            highlight: (input) => input,

            fill: (actions) => actions.map((o) => Object.keys(o)).flat(),
            select: (actions) => actions.map((o) => Object.keys(o)).flat(),
            file: (actions) => actions.map((o) => Object.keys(o)).flat(),
        })).flat()

        const locators = selectors.map(name => ({
            name,
            locator: page.locator(name),
        }))

        // GETTING BOXES
        log('Waiting for boxes')
        const boxes = await Promise.all(locators.map(async ({ name, locator }) => {
            try {
                const box = await locator.boundingBox()
                if (box === null) return
                return { name, box }
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
        function o2s(type: 'fill' | 'select'): (o: KeyValue) => out.Step[] {
            return (o: KeyValue) =>
                Object.entries(o).map(([input, value]) => ({
                    type,
                    input,
                    value
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

// const file = '/home/gilad/Work/yomyomyoga.com/web/faq/new_class.yaml'
const file = '/home/gilad/Work/yomyomyoga.com/web/faq/new_session.yaml'
const faq = await load(file)

main(faq)
    .then(() => console.log('✅ Done'))
    .finally(process.exit)