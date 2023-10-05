"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTypes = void 0;
const ts = __importStar(require("typescript"));
const json_schema_custom_1 = require("./ts-to-jsonschema/json-schema-custom");
function createProgram(filePath) {
    const compilerOptions = { strict: true };
    return ts.createProgram([filePath], compilerOptions);
}
function extractTypes(filePath) {
    const program = createProgram(filePath);
    const result = [];
    const collect = (rawComment, typeString, file, jsonSchema) => {
        const commentMatch = rawComment.match(/\/+\s*?@autodto\s+(.*)/);
        const parsedComment = commentMatch === null || commentMatch === void 0 ? void 0 : commentMatch[1];
        result.push({
            file,
            rawComment,
            parsedComment,
            typeString,
            jsonSchema,
        });
    };
    function visitNode(node, checker, fileText, isCorrectArg = false) {
        let isCorrect = isCorrectArg;
        let comment = "";
        ts.forEachLeadingCommentRange(fileText, node.getFullStart(), (pos, end) => {
            comment = fileText.substring(pos, end);
            isCorrect = comment.includes("@autodto");
        });
        if (isCorrect &&
            (ts.isVariableDeclaration(node) || ts.isBinaryExpression(node))) {
            const type = checker.getTypeAtLocation(node);
            const typeString = checker.typeToString(type);
            // console.log(type.getSymbol());
            const jsonSchema = (0, json_schema_custom_1.getType)(type, program);
            // console.log(node.pos, node.end, comment, node.getText(), typeString);
            collect(comment, typeString, node.getSourceFile().fileName, jsonSchema);
            // maybe switch isCorrect to false after collecting type?
            isCorrect = false;
            comment = "";
        }
        ts.forEachChild(node, (child) => visitNode(child, checker, fileText, isCorrect), (children) => children.forEach((child) => visitNode(child, checker, fileText, isCorrect)));
    }
    // existing code
    const sourcefiles = program.getSourceFiles();
    const checker = program.getTypeChecker();
    sourcefiles
        .filter((sourceFile) => !sourceFile.isDeclarationFile)
        .forEach((sourceFile) => {
        const fileText = sourceFile.getFullText();
        sourceFile.forEachChild((node) => visitNode(node, checker, fileText));
    });
    // console.log(result);
    return result;
}
exports.extractTypes = extractTypes;
