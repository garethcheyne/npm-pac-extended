/**
 * Interactive prompt utilities
 */
/**
 * Prompts user for input with optional default value
 */
export declare function prompt(question: string, defaultValue?: string): Promise<string>;
/**
 * Prompts user for yes/no confirmation
 */
export declare function promptYN(question: string, defaultYes?: boolean): Promise<boolean>;
/**
 * Prompts user to select from a list of options
 */
export declare function promptSelect<T extends {
    name: string;
}>(question: string, options: T[], displayFn?: (item: T) => string): Promise<T | null>;
//# sourceMappingURL=prompts.d.ts.map