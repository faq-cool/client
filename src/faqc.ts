import { Command } from 'commander'
import { existsSync } from 'fs'
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
    .option('-o, --out', 'Output json', 'auth.json')
    .description('Use to authenticate and save session data to a json file')

// OPEN
export const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth <string>', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode')

// IT
export const cmdIt = program.command('it <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-h, --height <number>', 'Viewport height', Number, 720)
    .option('-i, --id <number>', 'Update existing faq id', Number)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')

function complete() {
    if (!existsSync(`${homedir()}/.config/fish/completions`)) return
    program.commands.forEach(c => {
        const name = c.name()
        const description = c.description()
        const comp = `complete -c faq -n "__fish_use_subcommand" -f -a ${name} -d "${description}"`

        console.log()
        console.log(`# ${name.toUpperCase()}`)
        console.log(comp)

        c.options.forEach(o => {
            const s = o.short ? `-s ${o.short}, ` : ''
            const l = o.long ? `-l ${o.long}, ` : ''
            const flag = `complete -c faq -n "__fish_seen_subcommand_from ${name}" -f ${s} ${l} -d "${o.description}"`
            console.log(flag)
        })
    })
}

complete()