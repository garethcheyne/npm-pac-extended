"use strict";
/**
 * Interactive prompt utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompt = prompt;
exports.promptYN = promptYN;
exports.promptSelect = promptSelect;
const readline = __importStar(require("readline"));
/**
 * Prompts user for input with optional default value
 */
async function prompt(question, defaultValue = '') {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        const q = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
        rl.question(q, (answer) => {
            rl.close();
            resolve(answer || defaultValue);
        });
    });
}
/**
 * Prompts user for yes/no confirmation
 */
async function promptYN(question, defaultYes = true) {
    const answer = await prompt(`${question} (${defaultYes ? 'Y/n' : 'y/N'})`);
    if (!answer)
        return defaultYes;
    return answer.toLowerCase().startsWith('y');
}
/**
 * Prompts user to select from a list of options
 */
async function promptSelect(question, options, displayFn) {
    if (options.length === 0) {
        return null;
    }
    console.log(`\n${question}\n`);
    options.forEach((opt, i) => {
        const display = displayFn ? displayFn(opt) : opt.name;
        console.log(`  ${i + 1}. ${display}`);
    });
    console.log();
    const answer = await prompt('Enter number');
    const index = parseInt(answer, 10) - 1;
    if (isNaN(index) || index < 0 || index >= options.length) {
        return null;
    }
    return options[index];
}
//# sourceMappingURL=prompts.js.map