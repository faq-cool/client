import { writeFile } from "fs/promises"
import { api } from "../api/api"
import { env } from "../lib/util"
import { load, run } from "../run"
import { FAQ } from "../schema"

interface It {
    width: number
    height: number
    headed: boolean
    dry: boolean
    id?: number
}

export async function it(yaml: string, it: It) {
    const { FAQ_TOKEN } = env()

    if (!FAQ_TOKEN) {
        console.error('Please set the FAQ_TOKEN environment variable')
        process.exit(1)
    }

    console.log('Generating faq from', yaml)

    const script = await load(yaml) as FAQ
    const { width, height, headed, dry, id } = it

    const faq = await run({
        script, options: {
            width,
            height,
            headless: !headed,
        }
    })

    console.log('Saving to faq.json for debugging')

    await writeFile(
        'faq.json',
        JSON.stringify(
            faq, (k, v) => k == 'image' ? '' : v, 2))


    if (!dry) {
        console.log('Saving to faq.cool')
        const res = await api.save({
            viewport: {
                width,
                height,
            },
            ...faq,
            ...(id ? { faq_id: id } : {})
        })

        console.log('Saved to faq.cool', res)
    }

}