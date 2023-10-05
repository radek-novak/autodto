import { JSONSchema7 } from "json-schema";
type JSONSchema = JSONSchema7;
export type ExtractedType = {
    file: string;
    rawComment: string;
    typeString: string;
    parsedComment?: string;
    jsonSchema?: JSONSchema;
};
export declare function extractTypes(filePath: string): ExtractedType[];
export {};
