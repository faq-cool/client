import { Command } from 'commander'
import { config } from 'dotenv'
import { writeFile } from 'fs/promises'
import { version } from '../package.json'
import { api } from './api'
import { auth } from './auth'
import { open } from './open'
import { load, run } from './run'
import { FAQ } from './schema'

const program = new Command()

program
    .name('faq')
    .description('FAQing cool FAQ generator')
    .version(version)

const cmdLs = program
    .command('ls')
    .description('List My faqs')
    .action(() => {
        api.ls()
    })

const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
        console.log('Opening browser...')
        await open(cmdOpen.opts())
    })

program
    .command('auth')
    .description('Authenticate and save')
    .action(async () => {
        console.log('Authenticating')
        await auth()
    })

const cmdRun = program.command('run <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-h, --height <number>', 'Viewport height', Number, 720)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')
    .option('-i, --id <number>', 'Update existing faq id', Number)
    .action(async (yaml) => {
        config({ path: '.env' })
        const token = process.env.TOKEN as string
        console.log('Token', token)
        if (!token) {
            console.error('Please set the TOKEN environment variable')
            process.exit(1)
        }

        console.log('Generating faq from', yaml)

        const script = await load(yaml) as FAQ
        const { width, height, headed, dry, id } = cmdRun.opts()

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
                token,
                viewport: {
                    width,
                    height,
                },
                ...faq,
                ...(id ? { faq_id: id } : {})
            })

            console.log('Saved to faq.cool', res)
        }

    })

program.parse()
