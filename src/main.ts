import { chromium } from '@playwright/test'
import { readFile } from 'fs/promises'
import sharp from 'sharp'
import yaml from 'yaml'
import { Click, FAQ, Fill, Say, SceneItem, Select } from './schema'

async function load(path_yaml: string) {
    const f = await readFile(
        path_yaml, {
        encoding: 'utf-8',
    })
    return yaml.parse(f) as FAQ
}

async function main(faqScript: FAQ) {
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


    interface Box {
        x: number
        y: number
        width: number
        height: number
    }

    interface Scene {
        image: string
        width: number
        height: number
        names: { [k: string]: Box | null }
        // steps: Step[]
    }

    async function screenshot() {
        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
        })

        const img = await sharp(buffer)
            .avif({ quality: 40 })
            .toBuffer()

        return img.toString('base64')
    }

    type Step = SceneItem['scene'][0]

    interface Action {
        input: string
        value: string
    }

    interface Visitor {
        'say': (text: string) => Promise<void>
        'fill': (actions: Action[]) => Promise<void>
        'click': (input: string) => Promise<void>
        'select': (action: Action) => Promise<void>
    }

    function visit(step: Step, visitor: Visitor) {
        if ('say' in step) return visitor.say(step.say)
        if ('click' in step) return visitor.click(step.click)
        if ('fill' in step) return visitor.fill(step.fill)
        if ('select' in step) return visitor.select(step.select)
        throw new Error('Unknown step type')
    }

    async function compile(scene: (Say | Fill | Click | Select)[]): Promise<Scene> {
        console.log('🚀', scene)

        const selectors = scene.map(step => {
            if ('say' in step) return
            if ('click' in step) return step.click
            if ('fill' in step) return step.fill.map(e => e.input)
            if ('select' in step) return Object.keys(step.select)
        }).filter(e => e !== undefined).flat()


        const locators = await Promise.all(selectors.map(async name => ({
            name,
            locator: page.locator(name),
        })))

        await Promise.all(locators.map(async ({ locator }) => locator.waitFor()))

        const boxes = await Promise.all(locators.map(async ({ name, locator }) => ({
            name,
            box: await locator.boundingBox(),
        })))

        const { width, height } = await page.evaluate(async () => {
            const { scrollWidth: width, scrollHeight: height } = document.documentElement
            return { width, height }
        })

        const image = await screenshot()

        for (const step of scene) {
            await visit(step, {
                say: async () => { },
                fill: async (fill) => {
                    for (const { input, value } of fill) {
                        const locator = page.locator(input)
                        await locator.fill(value)
                    }
                },
                click: async (input) => {
                    await page.click(input)
                },
                select: async ({ input, value }) => {
                    await page.selectOption(input, value)
                },
            })
        }

        return {
            image,
            width,
            height,
            names: Object.fromEntries(boxes.map(({ name, box }) => [name, box])),
        }
    }

    const scenes: Scene[] = []
    for (const scene of faq.scenes) scenes.push(await compile(scene.scene))

    await context.close()
}

const faq = await load('demo/demo.yaml')

main(faq)
    .then(() => console.log('✅ Done'))
    .finally(process.exit)