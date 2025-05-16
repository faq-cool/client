import { chromium } from '@playwright/test'
import { readFile } from 'fs/promises'
import yaml from 'yaml'
import { z } from 'zod'
import schema from './schema.ts'

type Schema = z.infer<typeof schema>
type FAQ = Schema['faq']

async function load(path_yaml: string) {
    const f = await readFile(
        path_yaml, {
        encoding: 'utf-8',
    })
    const obj = yaml.parse(f)
    return schema.parse(obj).faq
}

async function main(faq: FAQ) {
    const viewport = { width: 1024, height: 768 }
    const browser = await chromium.launch()
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor: 1,
    })

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
    await page.waitForLoadState()
    await screenshot()

    const steps = []

    async function click(click: string) {
        console.log('🔗', click)
    }

    async function description(description: string) {
        console.log('📝', description)
    }

    async function screenshot() {
        console.log('📸')
    }

    async function wait(wait: string) {
        console.log('⏳', wait)
    }

    async function fill(fill: { [k: string]: string }) {
        Object.entries(fill).forEach(async ([k, v]) => {
            await page.locator(k).fill(v)
        })
    }

    async function select(select: { [k: string]: string }) {
        console.log('📋', select)
    }


    faq.scenes.forEach(async (scene, i) => {
        console.log(i, scene)
    })
}

const faq = await load('demo/demo.yaml')

main(faq)
    .then(() => console.log('✅ Done'))
    .finally(process.exit)