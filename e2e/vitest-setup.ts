/**
 * Vitest Setup for E2E Tests
 *
 * This file runs before all E2E tests.
 * It sets up the environment for real HTTP testing.
 */

// Load environment variables from .env file
import { config } from "dotenv";
config();

// Provide DOMParser for Node environment (used by RSS parser)
import { JSDOM } from "jsdom";
const dom = new JSDOM("");
globalThis.DOMParser = dom.window.DOMParser;

// Global setup logging
console.log("[E2E Setup] Environment configured");
console.log(`[E2E Setup] TMDB_API_KEY: ${process.env.TMDB_API_KEY ? "present" : "not set"}`);
console.log("[E2E Setup] DOMParser polyfill installed");
