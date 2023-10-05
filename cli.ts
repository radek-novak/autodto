#!/usr/bin/env node

import { extractTypes } from "./autodto";
import { OpenAPI } from "./generate-openapi";
import { writeFileSync } from "node:fs";

const [, _program, path] = process.argv;

const result = extractTypes(path);

const openapi = new OpenAPI("new API");

result.forEach((data) => {
  openapi.addEndpoint(data);
});

// console.log(openapi.toJSON());

writeFileSync("./openapi.json", openapi.toJSON());
