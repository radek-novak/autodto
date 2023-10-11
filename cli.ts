#!/usr/bin/env node

import { extractTypes } from "./autodto";
import { OpenAPI } from "./generate-openapi";
import { writeFileSync } from "node:fs";

const [, _program, path] = process.argv;

const { responseTypes, reffedDefinitions } = extractTypes(path);

const openapi = new OpenAPI("new API");

responseTypes.forEach((data) => {
  openapi.addEndpoint(data);
});

openapi.addRefDefinitions(reffedDefinitions);

console.log(reffedDefinitions);

writeFileSync("./openapi.json", openapi.toJSON());
