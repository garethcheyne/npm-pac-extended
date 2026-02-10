"use strict";
/**
 * Report path generation utilities
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
exports.getReportPath = getReportPath;
exports.getCompareReportPath = getCompareReportPath;
exports.saveJsonReport = saveJsonReport;
exports.saveHtmlReport = saveHtmlReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const env_1 = require("./env");
/**
 * Generates a report path with environment and date-based subdirectories
 * Structure: reports/{envName}/{date}/{command}/report-{time}.{ext}
 * e.g., reports/aucmnswcrp01/2026-02-09/audit/report-143000.json
 */
function getReportPath(command, extension, environmentUrl) {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    let dir;
    if (environmentUrl) {
        // New structure: reports/{envName}/{date}/{command}
        const envName = (0, env_1.extractEnvName)(environmentUrl);
        dir = path.join('reports', envName, date, command);
    }
    else {
        // Legacy structure: reports/{date}/{command}
        dir = path.join('reports', date, command);
    }
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `report-${time}.${extension}`);
}
/**
 * Generates a report path for comparison audits (multiple environments)
 * Structure: reports/audit-compare/{date}/report-{time}.{ext}
 */
function getCompareReportPath(extension, masterUrl) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    let dir;
    if (masterUrl) {
        const envName = (0, env_1.extractEnvName)(masterUrl);
        dir = path.join('reports', envName, date, 'audit-compare');
    }
    else {
        dir = path.join('reports', date, 'audit-compare');
    }
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `report-${time}.${extension}`);
}
/**
 * Saves JSON report to file
 */
function saveJsonReport(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
/**
 * Saves HTML report to file
 */
function saveHtmlReport(filePath, html) {
    fs.writeFileSync(filePath, html);
}
//# sourceMappingURL=reports.js.map