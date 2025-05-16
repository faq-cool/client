import { chromium } from '@playwright/test'
import FAQScript from './config'

import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import fs from 'fs'
import YAML from 'yaml'


const schemaPath = require.resolve('@faq.cool/client/faq.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
addErrors(ajv)
const validate = ajv.compile(schema)

function load(path_yaml: string): FAQScript {
    const file = fs.readFileSync(path_yaml, 'utf8')
    const data = YAML.parse(file)

    if (validate(data)) return data as FAQScript

    console.error('❌ Validation failed:\n', validate.errors)
    process.exit(1)
}

async function main(config: FAQScript) {
    const viewport = { width: 1024, height: 768 }
    const browser = await chromium.launch()
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor: 1,
    })

    context.addCookies(config.faq.cookies?.map(c => ({
        name: c.name,
        value: c.value,
        domain: config.faq.domain,
    })) ?? [])

    async function click(click: string) {
        console.log('🔗', click)
    }

    async function description(description: string) {
        console.log('📝', description)
    }

    async function screenshot() {
        console.log('📸', config.faq.home)
    }

    async function wait(wait: string) {
        console.log('⏳', wait)
    }

    async function fill(fill: { [k: string]: string }[]) {
        console.log('✏️', fill)
    }

    async function select(select: { [k: string]: string }[]) {
        console.log('📋', select)
    }

    config.faq.steps.forEach(async (step, i) => {
        if (step.click) await click(step.click)
        if (step.description) await description(step.description)
        if (step.fill) await fill(step.fill)
        if (step.screenshot) await screenshot()
        if (step.select) await select(step.select)
        if (step.wait) await wait(step.wait)
    })
}

const config = load('demo/session.yaml')

main(config)
    .then(() => console.log('✅ Done'))
    .finally(process.exit)