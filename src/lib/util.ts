import { config } from 'dotenv'

export function env() {
    config({ path: '.env' })
    config({ path: '.env.faq' })
    config({ path: '.env.local' })

    const { FAQ_TOKEN, FAQ_API_URL } = process.env

    return { FAQ_TOKEN, FAQ_API_URL }
}
