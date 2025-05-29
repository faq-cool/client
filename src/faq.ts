import { Command } from 'commander'
import tabtab from 'tabtab'
import { version } from '../package.json'
import { api } from './api/api'
import { auth } from './cmd/auth'
import { it } from './cmd/it'
import { login } from './cmd/login'
import { open } from './cmd/open'
import { env } from './lib/util'

const program = new Command()

program
    .name('faq')
    .description('FAQing cool FAQ generator')
    .version(version)

// INIT
program
    .command('init')
    .description('Install Shell Autocomplete')
    .action(async () => {
        await tabtab.install({
            name: 'faq',
            completer: 'faq'
        })
    })

// LOGIN
program
    .command('login')
    .description('Login to faq.cool')
    .action(login)

// ENV
program
    .command('env')
    .action(() => console.log(env()))

// LS
program
    .command('ls')
    .description('List My faqs')
    .action(api.ls)

// OPEN
const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => await open(cmdOpen.opts()))

// AUTH
program
    .command('auth')
    .description('Authenticate and save')
    .action(async () => await auth())

// IT
const cmdRun = program.command('it <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-h, --height <number>', 'Viewport height', Number, 720)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')
    .option('-i, --id <number>', 'Update existing faq id', Number)
    .action(() => it(cmdRun.args[0], cmdRun.opts()))


program
    .command('completion')
    .argument('env', 'Environment to generate completion for')
    .description('Generate shell completion script')
    .action(async () => {
        console.log('Generating shell completion script...', env)
        tabtab.log(program.commands.map(cmd => cmd.name))
    })


program.parse()
