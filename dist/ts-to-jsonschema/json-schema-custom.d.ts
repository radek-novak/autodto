import * as TJS from "./getTypeDefinition";
import ts from "typescript";
export declare function getType(type: ts.Type, program: ts.Program): TJS.Definition;
