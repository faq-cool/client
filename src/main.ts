import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'fs/promises'
import sharp from 'sharp'
import yaml from 'yaml'
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
    interface Box {
        x: number
        y: number
        width: number
        height: number
    }

    export type Step =
        | { type: 'say', text: string }
        | { type: 'click', input: string }
        | { type: 'highlight', input: string }
        | { type: 'fill', input: string, value: string }
        | { type: 'select', input: string, value: string }

    export interface Scene {
        image: string
        width: number
        height: number
        names: { [k: string]: Box | null }
        steps: Step[]
    }
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
        'wait': (input: string) => T

        'fill': (actions: KeyVals) => T
        'select': (actions: KeyVals) => T
        'file': (actions: KeyVals) => T
    }

    function visit<T>(step: Step, visitor: Visitor<T>) {
        if ('say' in step) return visitor.say(step.say)
        if ('click' in step) return visitor.click(step.click)
        if ('fill' in step) return visitor.fill(step.fill)
        if ('select' in step) return visitor.select(step.select)
        if ('file' in step) return visitor.file(step.file)
        if ('highlight' in step) return visitor.highlight(step.highlight)
        throw new Error('Unknown step type')
    }

    const kvs = (ks: KeyVals) => ks.map((o) => Object.entries(o)).flat()

    async function execute(scene: SceneItem['scene']) {
        log('Executing scene')
        for (const step of scene) {
            await visit(step, {
                say: async () => { },
                click: async (input) => {
                    log('Clicking', input)
                    await page.click(input)
                },
                highlight: async (input) => { },
                wait: async (input) => {
                    await page.waitForSelector(input, {
                        state: 'visible',
                    })
                },

                fill: async (fill) => {
                    for (const [k, v] of kvs(fill)) {
                        log('Filling', k, v)
                        await page.fill(k, v)
                    }
                },
                select: async (select) => {
                    for (const [k, v] of kvs(select)) {
                        await page.selectOption(k, v)
                    }
                },
                file: async (file) => {
                    for (const [k, v] of kvs(file)) {
                        await page.setInputFiles(k, v)
                    }
                },
            })
        }
    }

    type Steps = SceneItem['scene']

    async function compile(scene: Steps): Promise<out.Scene> {
        const selectors = scene.map(step => visit<string | string[]>(step, {
            say: () => [],
            click: (input) => input,
            highlight: (input) => input,
            wait: (input) => input,

            fill: (actions) => actions.map((o) => Object.keys(o)).flat(),
            select: (actions) => actions.map((o) => Object.keys(o)).flat(),
            file: (actions) => actions.map((o) => Object.keys(o)).flat(),
        })).flat()

        const locators = selectors.map(name => ({
            name,
            locator: page.locator(name),
        }))

        log('Waiting for locators')
        await Promise.all(locators.map(({ locator }) => locator.waitFor()))

        log('Waiting for boxes')
        const boxes = await Promise.all(locators.map(async ({ name, locator }) => {
            try {
                return {
                    name,
                    box: await locator.boundingBox(),
                }
            } catch {
                console.error('Error getting box for', name)
                process.exit(1)
            }
        }))

        log('Getting Document Size')
        const { width, height } = await page.evaluate(async () => {
            const { scrollWidth: width, scrollHeight: height } = document.documentElement
            return { width, height }
        })

        log('Getting Image')
        const image = await screenshot()

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
            wait: () => [],

            fill: o2ss(o2s('fill')),
            select: o2ss(o2s('select')),
            file: () => []
        }

        const steps: out.Step[] = scene.map(step => visit<out.Step | out.Step[]>(step, stepVisitor)).flat()

        log('Executing')
        await execute(scene)

        log('Emitting')
        return {
            image,
            width,
            height,
            names: Object.fromEntries(boxes.map(({ name, box }) => [name, box])),
            steps
        }
    }

    const scenes: out.Scene[] = []
    for (const scene of faq.scenes) scenes.push(await compile(scene.scene))

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)))
    await browser.close()

    await writeFile(
        'faq.json',
        JSON.stringify(scenes, null, 2))
}

const faq = await load('demo/yyy/new_studio.yaml')

main(faq)
    .then(() => console.log('✅ Done'))
    .finally(process.exit)