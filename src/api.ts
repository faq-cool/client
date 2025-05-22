import faq from "@faq.cool/types"

const API = 'http://localhost:3000/api'
const SAVE = `${API}/save`

export namespace api {
    export async function save(faq: faq.Faq) {
        const res = await fetch(SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faq)
        })

        return await res.json()
    }
}

