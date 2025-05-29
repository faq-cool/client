import faq from "@faq.cool/types"
import assert from "assert"
import { env } from "../lib/util"

const API = process.env.NEXT_PUBLIC_API_URL || 'https://faq.cool/api'
const SAVE = `${API}/save`

export namespace api {
    const { FAQ_TOKEN } = env()

    export async function save(faq: faq.Faq) {
        const res = await fetch(SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faq)
        })

        return await res.json()
    }

    export async function ls() {
        assert(FAQ_TOKEN, 'FAQ_TOKEN is not set. Please run `faq login` first.')

        const url = new URL(`${API}/ls`)
        url.searchParams.set('token', FAQ_TOKEN)

        const res = await fetch(url.toString())
        const data = await res.json()
        console.log(data)
    }
}

