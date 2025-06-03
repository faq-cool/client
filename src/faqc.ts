import { Command } from 'commander'
import { existsSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { version } from '../package.json'

export const program = new Command()

program
    .name('faq')
    .description('FAQing cool FAQ generator')
    .version(version)

// INIT
export const cmdInit = program
    .command('init')
    .description('Install Shell Autocomplete')

// LOGIN
export const cmdLogin = program
    .command('login')
    .description('Login to faq.cool')

// ENV
export const cmdEnv = program
    .command('env')
    .description('Show current environment variables')

// LS
export const cmdLs = program
    .command('ls')
    .description('List My faqs')

// AUTH
export const cmdAuth = program
    .command('auth')
    .option('-o, --out', '<out.json>', 'auth.json')
    .description('Open a browser, authenticate and saves session to a json file')

// OPEN
export const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth <string>', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode')

// IT
export const cmdIt = program
    .command('it <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-i, --id <number>', 'Update existing faq id', Number)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')

export default function init() {
    const outFolder = `${homedir()}/.config/fish/completions`
    if (!existsSync(outFolder)) return

    function* completions() {
        yield 'complete -c faq -e'
        for (const c of program.commands) {
            const name = c.name()
            const description = c.description()
            const comp = `complete -c faq -n "__fish_use_subcommand" -f -a ${name} -d "${description}"`

            yield ''
            yield `# ${name.toUpperCase()}`
            yield comp

            for (const o of c.options) {
                const s = o.short ? `-s ${o.short}` : ''
                const l = o.long ? `-l ${o.long}` : ''
                const flag = `complete -c faq -n "__fish_seen_subcommand_from ${name}" -f ${s} ${l} -d "${o.description}"`

                yield flag
            }
        }
    }

    const outFile = `${outFolder}/faq.fish`
    writeFileSync(outFile, [...completions()].join('\n'))
    console.log(`Fish completions written to ${outFile}`)
}