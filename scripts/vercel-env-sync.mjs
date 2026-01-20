#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const configPath = getArgValue(args, "--config") ?? ".vercel.env.json";
const dryRun = args.includes("--dry-run");
const onlyEnv = getArgValue(args, "--env");

const config = await loadConfig(configPath);
const environments = onlyEnv ? [onlyEnv] : config.environments ?? [];

if (!environments.length) {
  fail("No environments specified. Add environments[] in config or pass --env.");
}

const variables = config.variables ?? {};
const variableEntries = Object.entries(variables);

if (!variableEntries.length) {
  fail("No variables defined in config.");
}

for (const environment of environments) {
  for (const [name, spec] of variableEntries) {
    const value = typeof spec?.value === "string" ? spec.value : "";
    const sensitive = Boolean(spec?.sensitive);

    const args = ["env", "add", name, environment, "--force"];
    if (sensitive) {
      args.push("--sensitive");
    }

    if (dryRun) {
      const flags = sensitive ? " (sensitive)" : "";
      console.log(`[dry-run] vercel ${args.join(" ")}${flags}`);
      continue;
    }

    const result = spawnSync("vercel", args, {
      input: value,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

console.log("Env sync complete.");

function getArgValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

async function loadConfig(path) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Failed to load ${path}: ${message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
