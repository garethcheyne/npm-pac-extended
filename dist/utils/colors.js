"use strict";
/**
 * ANSI color utilities for terminal output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.colors = void 0;
exports.colors = {
    green: (t) => `\x1b[32m${t}\x1b[0m`,
    red: (t) => `\x1b[31m${t}\x1b[0m`,
    yellow: (t) => `\x1b[33m${t}\x1b[0m`,
    blue: (t) => `\x1b[34m${t}\x1b[0m`,
    cyan: (t) => `\x1b[36m${t}\x1b[0m`,
    magenta: (t) => `\x1b[35m${t}\x1b[0m`,
    bold: (t) => `\x1b[1m${t}\x1b[0m`,
    dim: (t) => `\x1b[2m${t}\x1b[0m`,
    reset: '\x1b[0m',
};
exports.log = {
    info: (msg) => console.log(exports.colors.blue('i'), msg),
    success: (msg) => console.log(exports.colors.green('✓'), msg),
    error: (msg) => console.log(exports.colors.red('✗'), msg),
    warn: (msg) => console.log(exports.colors.yellow('!'), msg),
    title: (msg) => console.log('\n' + exports.colors.bold(exports.colors.cyan(msg))),
    debug: (msg) => {
        if (process.env.DEBUG) {
            console.log(exports.colors.dim(`[DEBUG] ${msg}`));
        }
    },
};
//# sourceMappingURL=colors.js.map