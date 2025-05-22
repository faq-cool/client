import { Command } from 'commander'
import { writeFile } from 'fs/promises'
import { version } from '../package.json'
import { api } from './api'
import { load, run } from './gen'
import { FAQ } from './schema'

const program = new Command()

program
    .name('faq')
    .description('FAQing cool FAQ generator')
    .version(version)

const cmd = program
    .command('run <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1024)
    .option('-h, --height <number>', 'Viewport height', Number, 768)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')
    .option('-i, --id <number>', 'Update existing faq id', Number)
    .action(async (yaml) => {
        console.log('Generating faq from yaml', yaml)

        const script = await load(yaml) as FAQ
        const { width, height, headed, dry, id } = cmd.opts()

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
                ...faq,
                ...(id ? { faq_id: id } : {})
            })

            console.log('Saved to faq.cool', res)
        }

    })

program.parse()
