import { Command } from 'commander'

const program = new Command()

program
    .name('mycli')
    .description('My CLI written in TypeScript')
    .version('1.0.0')

program
    .command('hello <name>')
    .description('Say hello')
    .action((name) => {
        console.log(`Hello, ${name}!`)
    })

program.parse()
