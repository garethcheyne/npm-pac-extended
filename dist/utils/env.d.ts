/**
 * Environment URL utilities
 */
export interface EnvironmentTarget {
    url: string;
    name: string;
}
export type EnvironmentType = 'test' | 'prod';
/**
 * Extract environment name from URL
 * e.g., https://aucmnswcrp01.crm6.dynamics.com/ -> aucmnswcrp01
 */
export declare function extractEnvName(url: string): string;
/**
 * Get numbered environment URLs (ENV_TEST_URL_01, ENV_TEST_URL_02, etc.)
 * Scans for numbered env vars starting from 01 and continues until no more found
 */
export declare function getNumberedEnvUrls(type: EnvironmentType): EnvironmentTarget[];
/**
 * Get all test environment URLs (ENV_TEST_URL_01, ENV_TEST_URL_02, etc.)
 */
export declare function getTestTargets(): EnvironmentTarget[];
/**
 * Get all production environment URLs (ENV_PROD_URL_01, ENV_PROD_URL_02, etc.)
 */
export declare function getProdTargets(): EnvironmentTarget[];
/**
 * Get all environment URLs (both test and prod numbered vars)
 * Falls back to ENV_ALL_TARGETS if no numbered vars found
 */
export declare function getAllTargets(): EnvironmentTarget[];
/**
 * Get specific environment URL from .env
 */
export declare function getEnvUrl(envKey: 'dev' | 'test' | 'prod'): string | undefined;
/**
 * Get master environment URL (defaults to ENV_PROD_URL)
 */
export declare function getMasterUrl(): string | undefined;
/**
 * Get environment summary for status display
 */
export declare function getEnvSummary(): {
    test: number;
    prod: number;
    total: number;
};
//# sourceMappingURL=env.d.ts.map