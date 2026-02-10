"use strict";
/**
 * Environment URL utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEnvName = extractEnvName;
exports.getNumberedEnvUrls = getNumberedEnvUrls;
exports.getTestTargets = getTestTargets;
exports.getProdTargets = getProdTargets;
exports.getAllTargets = getAllTargets;
exports.getEnvUrl = getEnvUrl;
exports.getMasterUrl = getMasterUrl;
exports.getEnvSummary = getEnvSummary;
/**
 * Extract environment name from URL
 * e.g., https://aucmnswcrp01.crm6.dynamics.com/ -> aucmnswcrp01
 */
function extractEnvName(url) {
    const match = url.match(/https?:\/\/([^.]+)/);
    return match ? match[1] : url;
}
/**
 * Get numbered environment URLs (ENV_TEST_URL_01, ENV_TEST_URL_02, etc.)
 * Scans for numbered env vars starting from 01 and continues until no more found
 */
function getNumberedEnvUrls(type) {
    const targets = [];
    const prefix = `ENV_${type.toUpperCase()}_URL_`;
    // Scan numbers 01-99 (could be extended if needed)
    for (let i = 1; i <= 99; i++) {
        const key = `${prefix}${i.toString().padStart(2, '0')}`;
        const url = process.env[key];
        if (url && url.trim().startsWith('http')) {
            targets.push({
                url: url.replace(/\/$/, ''), // Remove trailing slash
                name: extractEnvName(url),
            });
        }
    }
    return targets;
}
/**
 * Get all test environment URLs (ENV_TEST_URL_01, ENV_TEST_URL_02, etc.)
 */
function getTestTargets() {
    return getNumberedEnvUrls('test');
}
/**
 * Get all production environment URLs (ENV_PROD_URL_01, ENV_PROD_URL_02, etc.)
 */
function getProdTargets() {
    return getNumberedEnvUrls('prod');
}
/**
 * Get all environment URLs (both test and prod numbered vars)
 * Falls back to ENV_ALL_TARGETS if no numbered vars found
 */
function getAllTargets() {
    const testTargets = getTestTargets();
    const prodTargets = getProdTargets();
    // If we have numbered env vars, use them
    if (testTargets.length > 0 || prodTargets.length > 0) {
        return [...testTargets, ...prodTargets];
    }
    // Fall back to ENV_ALL_TARGETS (comma-separated)
    const envValue = process.env.ENV_ALL_TARGETS || '';
    if (!envValue.trim()) {
        return [];
    }
    return envValue
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0 && url.startsWith('http'))
        .map(url => ({
        url: url.replace(/\/$/, ''),
        name: extractEnvName(url),
    }));
}
/**
 * Get specific environment URL from .env
 */
function getEnvUrl(envKey) {
    const key = `ENV_${envKey.toUpperCase()}_URL`;
    return process.env[key];
}
/**
 * Get master environment URL (defaults to ENV_PROD_URL)
 */
function getMasterUrl() {
    return process.env.ENV_PROD_URL || process.env.ENV_DEV_URL;
}
/**
 * Get environment summary for status display
 */
function getEnvSummary() {
    const test = getTestTargets().length;
    const prod = getProdTargets().length;
    return { test, prod, total: test + prod };
}
//# sourceMappingURL=env.js.map