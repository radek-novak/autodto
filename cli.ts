#!/usr/bin/env node

import { extractTypes } from "./autodto";
import { OpenAPI } from "./autodto-to-openapi/generate-openapi";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import yargs from "yargs";
import { buildClient, buildEndpointMap } from "./autodto-to-axios/builder";
import { join } from "path";
import buildClientDefinitions from "./autodto-to-axios/build-client-definitions";

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
  .option("clientsOutDir", {
    describe: "Output directory of the axios clients",
    type: "string",
    default: "./autodto",
  })
  .parseSync();

const {
  openapiName = "new API",
  openapiOutPath = "./openapi.json",
  clientsOutDir,
} = argv;

const config = {
  openapiName,
  openapiOutPath,
  clientsOutDir,
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

function generateClients() {
  const endpointMap = buildEndpointMap(responseTypes);
  const clientDefinitions = buildClientDefinitions(endpointMap);
  const clientFile = `
import axios from "axios";
import endpointdatatype from "./endpointdataType";
import { buildClient } from "autodto";
import * as path from 'path';

const endpointData = JSON.parse('${JSON.stringify(endpointMap)}');

const client = buildClient(endpointData);

export default client;
`;

  mkdirSync(config.clientsOutDir, { recursive: true });
  writeFileSync(join(config.clientsOutDir, "client.js"), clientFile);
  writeFileSync(join(config.clientsOutDir, "client.d.ts"), clientDefinitions);

  console.log(reffedDefinitions);
  console.log(clientFile);
}

generateClients();

generateOpenAPI();
