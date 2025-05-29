import { config } from 'dotenv'

export function env() {
    config({ path: '.env' })
    config({ path: '.env.faq' })
    config({ path: '.env.local' })

    const { FAQ_TOKEN } = process.env

    return { FAQ_TOKEN }
}
