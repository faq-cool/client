import faq from "@faq.cool/server"

const API = 'http://localhost:3000/api'
const SAVE = `${API}/save`

namespace api {

    export async function save(faq: faq.Save) {
        const res = await fetch(SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faq)
        })

        return await res.json()
    }
}

export default api
