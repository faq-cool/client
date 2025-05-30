import { Command } from 'commander'
import { appendFileSync } from 'fs'
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

// AUTH
export const cmdAuth = program
    .command('auth')
    .option('-o, --out', 'Output json', 'auth.json')
    .description('Authenticate and authentication data to json')

// OPEN
export const cmdOpen = program
    .command('open')
    .description('Open a browser')
    .option('-a, --auth', 'Authentication json', 'auth.json')
    .option('-u, --url <string>', 'URL to open')
    .option('--headless', 'Run in headless mode', false)

// IT
export const cmdIt = program.command('it <path.yml>')
    .description('Generating faq from yaml')
    .option('-w, --width <number>', 'Viewport width', Number, 1280)
    .option('-h, --height <number>', 'Viewport height', Number, 720)
    .option('--headed', 'Run in headed mode')
    .option('-d, --dry', 'Run in dry run mode')
    .option('-i, --id <number>', 'Update existing faq id', Number)

function getFlags(cmd: Command) {
    return cmd.options.map(opt => {
        const match = opt.flags.match(/(-\w)?(?:, )?(--\w[\w-]*)?/)
        return {
            short: match?.[1],
            long: match?.[2],
            description: opt.description || ''
        }
    })
}

async function complete() {
    const cmds = program.commands.map(cmd => ({
        name: cmd.name(),
        description: cmd.description()
    }))

    const names = cmds.map(cmd => cmd.name)

    const env = tabtab.parseEnv(process.env)

    if (!env.complete) return

    // DEBUGGING
    const now = new Date()
    const time = now.toTimeString().split(' ')[0]
    const log = (...args: any[]) => appendFileSync('.faqc.log', `${time} ${args.join(' ')}\n`)

    log(JSON.stringify(env, null, 2))

    const words = env.line.split(' ')

    // IGNORE COMPLEX COMPLETION FOR NOW
    log('POINT', env.point, env.line.length)
    if (env.point < env.line.length - 1) return

    // COMPLETE COMMAND
    log('WORDS', words, words.length)
    log('NAMES', names, names.includes(env.prev))
    if (env.words <= 2 && !names.includes(env.prev)) {
        const comp = cmds.map(cmd => `${cmd.name}\t${cmd.description}`)
        log('COMPLETE COMMANDS', comp)
        return tabtab.log(comp)
    }

    const defined = (x: any) => x !== undefined && x !== null
    // COMPLETE OPTIONS
    const cmd = words[1]
    if (cmd == 'auth') {
        const flags = getFlags(cmdAuth)
        if (env.prev === '-') return tabtab.log(flags.map(f => f.short).filter(defined) as string[])
        // const opts = cmdAuth.options
        // return tabtab.log(cmdAuth.options.map(opt => `${opt.flags}\t${opt.description}`))
    }
}

complete()