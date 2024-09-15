import { ExtractedType } from "../core/autodto";
import { JSONSchema7 } from "json-schema";
import { schemaTransform } from "./utils";

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

  definitions?: Record<string, JSONSchema7>;
};

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
            schema: schemaTransform(data.jsonSchema as any) as any,
          },
        },
      },
    };
  }

  private postProcessSchema(schema: any) {
    const properties = schema.properties;
    if (!properties) return schema;

    const keys = Object.keys(schema.properties);

    for (const key of keys) {
      if (
        Array.isArray(properties[key].type) &&
        properties[key].type.includes("null")
      ) {
      }
    }
  }

  addRefDefinitions(definitions: Record<string, JSONSchema7>) {
    // this._result.components.schemas = {
    this._result.definitions = {
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
