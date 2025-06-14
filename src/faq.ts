import { login } from './cmd/login'
import { open } from './cmd/open'

import { api } from './api/api'
import { auth } from './cmd/auth'
import { it } from './cmd/it'
import { cmdAuth, cmdEnv, cmdInit, cmdIt, cmdLogin, cmdLs, cmdOpen, init, program } from "./faqc"
import { env } from './lib/util'

cmdInit.action(init)
cmdLogin.action(login)
cmdEnv.action(() => console.log(env()))
cmdLs.action(api.ls)
cmdOpen.action(async () => await open(cmdOpen.opts()))
cmdAuth.action(async () => await auth())
cmdIt.action(() => it(cmdIt.args[0], cmdIt.opts()))


program.parse()
