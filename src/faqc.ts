import { Command } from 'commander'
import tabtab from 'tabtab'
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

// OPEN
export const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode', false)

// AUTH
export const cmdAuth = program
    .command('auth')
    .description('Authenticate and save')

// IT
export const cmdIt = program.command('it <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-h, --height <number>', 'Viewport height', Number, 720)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')
    .option('-i, --id <number>', 'Update existing faq id', Number)

function complete() {
    const env = tabtab.parseEnv(process.env)
    const cmds = program.commands
    tabtab.log(cmds.map(cmd => `${cmd.name()}\t${cmd.description()}`))
}

complete()