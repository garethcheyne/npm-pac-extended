/**
 * ANSI color utilities for terminal output
 */
export declare const colors: {
    green: (t: string) => string;
    red: (t: string) => string;
    yellow: (t: string) => string;
    blue: (t: string) => string;
    cyan: (t: string) => string;
    magenta: (t: string) => string;
    bold: (t: string) => string;
    dim: (t: string) => string;
    reset: string;
};
export declare const log: {
    info: (msg: string) => void;
    success: (msg: string) => void;
    error: (msg: string) => void;
    warn: (msg: string) => void;
    title: (msg: string) => void;
    debug: (msg: string) => void;
};
//# sourceMappingURL=colors.d.ts.map