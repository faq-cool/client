import { writeFile } from 'fs/promises'
import http, { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
export async function login() {
    const url = 'https://faq.cool/login'
    await require(' open')(url)
    const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        const reqUrl = new URL(req.url!, `http://${req.headers.host}`)
        const token = reqUrl.searchParams.get('token')

        await writeFile('.env.faq', `FAQ_TOKEN=${token}`)

        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('You are now signed in! Token was saved to .env.faq. You can close me now.')

        console.log('Token was saved to .env.faq')
        server.close(() => { })
    })

    server.listen(8979, () => {
        console.log(`Please login at ${url}`)
    })
}