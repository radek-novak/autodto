"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPI = void 0;
// const tpl = {
//   openapi: "3.0.0",
//   info: {
//     title: "Sample API",
//     version: "1.0.0",
//   },
//   paths: {
//     "/users": {
//       get: {
//         summary: "Get list of users",
//         responses: {
//           "200": {
//             description: "Successful response",
//             content: {
//               "application/json": {
//                 schema: {
//                   $ref: "#/components/schemas/UserArray",
//                 },
//               },
//               "application/xml": {
//                 schema: {
//                   $ref: "#/components/schemas/UserArray",
//                 },
//               },
//             },
//           },
//           "400": {
//             description: "Bad Request",
//           },
//           "404": {
//             description: "Not Found",
//           },
//         },
//       },
//     },
//   },
//   components: {
//     schemas: {},
//   },
// };
class OpenAPI {
    constructor(title = "Sample") {
        this._result = {
            openapi: "3.0.0",
            info: {
                title,
                version: "1.0.0",
            },
            paths: {},
            components: {
                schemas: {},
            },
        };
    }
    setTitle(title) {
        this._result.info.title = title;
    }
    maybeAddPath(path) {
        var _a;
        var _b;
        (_a = (_b = this._result.paths)[path]) !== null && _a !== void 0 ? _a : (_b[path] = {});
    }
    maybeAddMethod(path, method) {
        var _a;
        var _b;
        const lowerCaseMethod = method.toLowerCase();
        (_a = (_b = this._result.paths[path])[lowerCaseMethod]) !== null && _a !== void 0 ? _a : (_b[lowerCaseMethod] = {});
        return this._result.paths[path][lowerCaseMethod];
    }
    addResponse(path, method, code, description) {
        this._result.paths[path][method].responses[code] = {
            description,
            content: {
                "application/json": {
                    schema: {},
                },
            },
        };
    }
    addEndpoint(data) {
        var _a;
        const [method, path, description] = (_a = data.parsedComment) === null || _a === void 0 ? void 0 : _a.split(" ");
        this.maybeAddPath(path);
        const endpoint = this.maybeAddMethod(path, method);
        // @ts-ignore
        endpoint["x-source-file"] = data.file;
        endpoint.summary = "";
        endpoint.responses = {
            "200": {
                description: description !== null && description !== void 0 ? description : "Successful response",
                content: {
                    "application/json": {
                        schema: data.jsonSchema,
                    },
                },
            },
        };
    }
    toObject() {
        return this._result;
    }
    toJSON() {
        return JSON.stringify(this.toObject(), null, 2);
    }
}
exports.OpenAPI = OpenAPI;
