#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autodto_1 = require("./autodto");
const generate_openapi_1 = require("./generate-openapi");
const node_fs_1 = require("node:fs");
const [, _program, path] = process.argv;
const result = (0, autodto_1.extractTypes)(path);
const openapi = new generate_openapi_1.OpenAPI("new API");
result.forEach((data) => {
    openapi.addEndpoint(data);
});
// console.log(openapi.toJSON());
(0, node_fs_1.writeFileSync)("./openapi.json", openapi.toJSON());
