import { ExtractedType } from "./autodto";
import { JSONSchema7 } from "json-schema";

type HTTPMethods = "get" | "post" | "put" | "patch" | "delete";
type TOpenAPI = {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<
    string,
    Record<
      HTTPMethods,
      {
        summary: string;
        responses: Record<
          string,
          {
            description: string;
            content: Record<
              string,
              {
                schema: {
                  $ref: string;
                };
              }
            >;
          }
        >;
      }
    >
  >;
  components: {
    schemas: Record<string, JSONSchema7>;
  };
};

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

export class OpenAPI {
  _result: TOpenAPI;

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

  setTitle(title: string) {
    this._result.info.title = title;
  }

  private maybeAddPath(path: string) {
    this._result.paths[path] ??= {} as TOpenAPI["paths"][string];
  }
  private maybeAddMethod(path: string, method: HTTPMethods) {
    const lowerCaseMethod = method.toLowerCase() as HTTPMethods;
    this._result.paths[path][lowerCaseMethod] ??=
      {} as TOpenAPI["paths"][string][HTTPMethods];

    return this._result.paths[path][lowerCaseMethod];
  }

  private addResponse(
    path: string,
    method: HTTPMethods,
    code: string,
    description: string
  ) {
    this._result.paths[path][method].responses[code] = {
      description,
      content: {
        "application/json": {
          schema:
            {} as TOpenAPI["paths"][string][HTTPMethods]["responses"][string]["content"]["application/json"]["schema"],
        },
      },
    };
  }

  addEndpoint(data: ExtractedType) {
    const [method, path, description] = data.parsedComment?.split(" ")!;
    this.maybeAddPath(path);
    const endpoint = this.maybeAddMethod(path, method as HTTPMethods);

    // @ts-ignore
    endpoint["x-source-file"] = data.file;
    endpoint.summary = "";

    endpoint.responses = {
      "200": {
        description: description ?? "Successful response",
        content: {
          "application/json": {
            schema: data.jsonSchema as any,
          },
        },
      },
    };
  }

  addRefDefinition(name: string, schema: JSONSchema7) {
    this._result.components.schemas[name] = schema;
  }
  addRefDefinitions(definitions: Record<string, JSONSchema7>) {
    this._result.components.schemas = {
      ...this._result.components.schemas,
      ...definitions,
    };
  }

  toObject() {
    return this._result;
  }

  toJSON() {
    return JSON.stringify(this.toObject(), null, 2);
  }
}
