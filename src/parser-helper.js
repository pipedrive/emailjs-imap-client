import { toTypedArray, fromTypedArray } from './common'
import { parser } from 'emailjs-imap-handler'

const parsingHacks = [
  {
    // parsing hack in situation when last character breaks parsing
    func: (command, opts) => parser(command.slice(0, -1), opts),
    condition: (command, e) => e && e.message === `Unexpected char at position ${command.length - 1}` && typeof command.slice === 'function'
  },
  {
    // parsing hack which is caused by provider returning command with two sequential double quotes ""
    func: (command, opts) => parser(toTypedArray(fromTypedArray(command).replaceAll(/""/ig, '"')), opts),
    condition: (command, e) => e && e.message && e.message.toLowerCase().indexOf('unexpected char at position') !== -1
  }
]

export const parserHelper = (command, opts) => {
  try {
    return parser(command, opts)
  } catch (e) {
    for (let i = 0; i < parsingHacks.length; i++) {
      const attempt = parsingHacks[i]

      if (!attempt.condition(command, e)) {
        continue
      }

      try {
        return attempt.func(command, opts)
      } catch (e) { }
    }

    throw e
  }
}
