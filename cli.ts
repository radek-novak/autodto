#!/usr/bin/env node

import { extractTypes } from "./autodto";
import { OpenAPI } from "./autodto-to-openapi/generate-openapi";
import { writeFileSync, readFileSync } from "node:fs";
import yargs from "yargs";

const argv = yargs
  .option("config", {
    // alias: "p",
    describe: "Config path",
    type: "string",
    // demandOption: true,
  })
  .option("openapiName", {
    describe: "Name of the Open API documentation",
    type: "string",
  })
  .option("openapiOutPath", {
    describe: "Output path of the Open API documentation",
    type: "string",
  })
  .parseSync();

const { openapiName = "new API", openapiOutPath = "./openapi.json" } = argv;

const config = {
  openapiName,
  openapiOutPath,
  ...(argv.config
    ? JSON.parse(readFileSync("config.json", "utf-8").toString())
    : {}),
} as typeof argv;

const { responseTypes, reffedDefinitions } = extractTypes();

function generateOpenAPI() {
  const openapi = new OpenAPI(config.openapiName);

  responseTypes.forEach((data) => {
    openapi.addEndpoint(data);
  });

  openapi.addRefDefinitions(reffedDefinitions);

  writeFileSync(config.openapiOutPath ?? "", openapi.toJSON());
}

generateOpenAPI();
