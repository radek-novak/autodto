import { ExtractedType } from "./autodto";
type HTTPMethods = "get" | "post" | "put" | "patch" | "delete";
type TOpenAPI = {
    openapi: string;
    info: {
        title: string;
        version: string;
    };
    paths: Record<string, Record<HTTPMethods, {
        summary: string;
        responses: Record<string, {
            description: string;
            content: Record<string, {
                schema: {
                    $ref: string;
                };
            }>;
        }>;
    }>>;
    components: {
        schemas: {};
    };
};
export declare class OpenAPI {
    _result: TOpenAPI;
    constructor(title?: string);
    setTitle(title: string): void;
    private maybeAddPath;
    private maybeAddMethod;
    private addResponse;
    addEndpoint(data: ExtractedType): void;
    toObject(): TOpenAPI;
    toJSON(): string;
}
export {};
