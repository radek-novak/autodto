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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = exports.programFromConfig = exports.generateSchema = exports.buildGenerator = exports.getProgramFromFiles = exports.JsonSchemaGenerator = exports.regexRequire = exports.getDefaultArgs = void 0;
// @ts-nocheck
// lifted from https://github.com/YousefED/typescript-json-schema/blob/master/typescript-json-schema.ts#L1272
const glob = __importStar(require("glob"));
const safe_stable_stringify_1 = require("safe-stable-stringify");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const ts = __importStar(require("typescript"));
const path_equal_1 = require("path-equal");
const vm = require("vm");
const REGEX_FILE_NAME_OR_SPACE = /(\bimport\(".*?"\)|".*?")\.| /g;
const REGEX_TSCONFIG_NAME = /^.*\.json$/;
const REGEX_TJS_JSDOC = /^-([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;
const REGEX_GROUP_JSDOC = /^[.]?([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;
/**
 * Resolve required file, his path and a property name,
 *      pattern: require([file_path]).[property_name]
 *
 * the part ".[property_name]" is optional in the regex
 *
 * will match:
 *
 *      require('./path.ts')
 *      require('./path.ts').objectName
 *      require("./path.ts")
 *      require("./path.ts").objectName
 *      require('@module-name')
 *
 *      match[2] = file_path (a path to the file with quotes)
 *      match[3] = (optional) property_name (a property name, exported in the file)
 *
 * for more details, see tests/require.test.ts
 */
const REGEX_REQUIRE = /^(\s+)?require\((\'@?[a-zA-Z0-9.\/_-]+\'|\"@?[a-zA-Z0-9.\/_-]+\")\)(\.([a-zA-Z0-9_$]+))?(\s+|$)/;
const NUMERIC_INDEX_PATTERN = "^[0-9]+$";
function getDefaultArgs() {
    return {
        ref: true,
        aliasRef: false,
        topRef: false,
        titles: false,
        defaultProps: false,
        noExtraProps: false,
        propOrder: false,
        typeOfKeyword: false,
        required: false,
        strictNullChecks: false,
        esModuleInterop: false,
        skipLibCheck: false,
        ignoreErrors: false,
        out: "",
        validationKeywords: [],
        include: [],
        excludePrivate: false,
        uniqueNames: false,
        rejectDateType: false,
        id: "",
        defaultNumberType: "number",
        tsNodeRegister: false,
        constAsEnum: false,
    };
}
exports.getDefaultArgs = getDefaultArgs;
function extend(target, ..._) {
    if (target == null) {
        // TypeError if undefined or null
        throw new TypeError("Cannot convert undefined or null to object");
    }
    const to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];
        if (nextSource != null) {
            // Skip over if undefined or null
            for (const nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}
function unique(arr) {
    const temp = {};
    for (const e of arr) {
        temp[e] = true;
    }
    const r = [];
    for (const k in temp) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(temp, k)) {
            r.push(k);
        }
    }
    return r;
}
/**
 * Resolve required file
 */
function resolveRequiredFile(symbol, key, fileName, objectName) {
    const sourceFile = getSourceFile(symbol);
    const requiredFilePath = /^[.\/]+/.test(fileName)
        ? fileName === "."
            ? path.resolve(sourceFile.fileName)
            : path.resolve(path.dirname(sourceFile.fileName), fileName)
        : fileName;
    const requiredFile = require(requiredFilePath);
    if (!requiredFile) {
        throw Error("Required: File couldn't be loaded");
    }
    const requiredObject = objectName
        ? requiredFile[objectName]
        : requiredFile.default;
    if (requiredObject === undefined) {
        throw Error("Required: Variable is undefined");
    }
    if (typeof requiredObject === "function") {
        throw Error("Required: Can't use function as a variable");
    }
    if (key === "examples" && !Array.isArray(requiredObject)) {
        throw Error("Required: Variable isn't an array");
    }
    return requiredObject;
}
function regexRequire(value) {
    return REGEX_REQUIRE.exec(value);
}
exports.regexRequire = regexRequire;
/**
 * Try to parse a value and returns the string if it fails.
 */
function parseValue(symbol, key, value) {
    const match = regexRequire(value);
    if (match) {
        const fileName = match[2].substr(1, match[2].length - 2).trim();
        const objectName = match[4];
        return resolveRequiredFile(symbol, key, fileName, objectName);
    }
    try {
        return JSON.parse(value);
    }
    catch (error) {
        return value;
    }
}
function extractLiteralValue(typ) {
    let str = typ.value;
    if (str === undefined) {
        str = typ.text;
    }
    if (typ.flags & ts.TypeFlags.StringLiteral) {
        return str;
    }
    else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
        return typ.intrinsicName === "true";
    }
    else if (typ.flags & ts.TypeFlags.EnumLiteral) {
        // or .text for old TS
        const num = parseFloat(str);
        return isNaN(num) ? str : num;
    }
    else if (typ.flags & ts.TypeFlags.NumberLiteral) {
        return parseFloat(str);
    }
    return undefined;
}
/**
 * Checks whether a type is a tuple type.
 */
function resolveTupleType(propertyType) {
    if (!propertyType.getSymbol() &&
        propertyType.getFlags() & ts.TypeFlags.Object &&
        propertyType.objectFlags & ts.ObjectFlags.Reference) {
        return propertyType.target;
    }
    if (!(propertyType.getFlags() & ts.TypeFlags.Object &&
        propertyType.objectFlags & ts.ObjectFlags.Tuple)) {
        return null;
    }
    return propertyType;
}
const simpleTypesAllowedProperties = {
    type: true,
    description: true,
};
function addSimpleType(def, type) {
    for (const k in def) {
        if (!simpleTypesAllowedProperties[k]) {
            return false;
        }
    }
    if (!def.type) {
        def.type = type;
    }
    else if (typeof def.type !== "string") {
        if (!def.type.every((val) => {
            return typeof val === "string";
        })) {
            return false;
        }
        if (def.type.indexOf("null") === -1) {
            def.type.push("null");
        }
    }
    else {
        if (typeof def.type !== "string") {
            return false;
        }
        if (def.type !== "null") {
            def.type = [def.type, "null"];
        }
    }
    return true;
}
function makeNullable(def) {
    if (!addSimpleType(def, "null")) {
        const union = def.oneOf || def.anyOf;
        if (union) {
            union.push({ type: "null" });
        }
        else {
            const subdef = {};
            for (var k in def) {
                if (def.hasOwnProperty(k)) {
                    subdef[k] = def[k];
                    delete def[k];
                }
            }
            def.anyOf = [subdef, { type: "null" }];
        }
    }
    return def;
}
/**
 * Given a Symbol, returns a canonical Definition. That can be either:
 * 1) The Symbol's valueDeclaration parameter if defined, or
 * 2) The sole entry in the Symbol's declarations array, provided that array has a length of 1.
 *
 * valueDeclaration is listed as a required parameter in the definition of a Symbol, but I've
 * experienced crashes when it's undefined at runtime, which is the reason for this function's
 * existence. Not sure if that's a compiler API bug or what.
 */
function getCanonicalDeclaration(sym) {
    var _a, _b, _c;
    if (sym.valueDeclaration !== undefined) {
        return sym.valueDeclaration;
    }
    else if (((_a = sym.declarations) === null || _a === void 0 ? void 0 : _a.length) === 1) {
        return sym.declarations[0];
    }
    const declarationCount = (_c = (_b = sym.declarations) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
    throw new Error(`Symbol "${sym.name}" has no valueDeclaration and ${declarationCount} declarations.`);
}
/**
 * Given a Symbol, finds the place it was declared and chases parent pointers until we find a
 * node where SyntaxKind === SourceFile.
 */
function getSourceFile(sym) {
    let currentDecl = getCanonicalDeclaration(sym);
    while (currentDecl.kind !== ts.SyntaxKind.SourceFile) {
        if (currentDecl.parent === undefined) {
            throw new Error(`Unable to locate source file for declaration "${sym.name}".`);
        }
        currentDecl = currentDecl.parent;
    }
    return currentDecl;
}
/**
 * JSDoc keywords that should be used to annotate the JSON schema.
 *
 * Many of these validation keywords are defined here: http://json-schema.org/latest/json-schema-validation.html
 */
// prettier-ignore
const validationKeywords = {
    multipleOf: true,
    maximum: true,
    exclusiveMaximum: true,
    minimum: true,
    exclusiveMinimum: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    items: true,
    // additionalItems: true,          // 6.10.
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    contains: true,
    maxProperties: true,
    minProperties: true,
    // required: true,                 // 6.17.  This is not required. It is auto-generated.
    // properties: true,               // 6.18.  This is not required. It is auto-generated.
    // patternProperties: true,        // 6.19.
    additionalProperties: true,
    // dependencies: true,             // 6.21.
    // propertyNames: true,            // 6.22.
    enum: true,
    // const: true,                    // 6.24.
    type: true,
    // allOf: true,                    // 6.26.
    // anyOf: true,                    // 6.27.
    // oneOf: true,                    // 6.28.
    // not: true,                      // 6.29.
    examples: true,
    ignore: true,
    description: true,
    format: true,
    default: true,
    $ref: true,
    id: true,
    $id: true,
    title: true
};
/**
 * Subset of descriptive, non-type keywords that are permitted alongside a $ref.
 * Prior to JSON Schema draft 2019-09, $ref is a special keyword that doesn't
 * permit keywords alongside it, and so AJV may raise warnings if it encounters
 * any type-related keywords; see https://github.com/ajv-validator/ajv/issues/1121
 */
const annotationKeywords = {
    description: true,
    default: true,
    examples: true,
    title: true,
    // A JSDoc $ref annotation can appear as a $ref.
    $ref: true,
};
const subDefinitions = {
    items: true,
    additionalProperties: true,
    contains: true,
};
class JsonSchemaGenerator {
    constructor(symbols, allSymbols, userSymbols, inheritingTypes, tc, args = getDefaultArgs()) {
        this.args = args;
        /**
         * This map holds references to all reffed definitions, including schema
         * overrides and generated definitions.
         */
        this.reffedDefinitions = {};
        /**
         * This map only holds explicit schema overrides. This helps differentiate between
         * user defined schema overrides and generated definitions.
         */
        this.schemaOverrides = new Map();
        /**
         * Types are assigned names which are looked up by their IDs.  This is the
         * map from type IDs to type names.
         */
        this.typeNamesById = {};
        /**
         * Whenever a type is assigned its name, its entry in this dictionary is set,
         * so that we don't give the same name to two separate types.
         */
        this.typeIdsByName = {};
        this.recursiveTypeRef = new Map();
        this.symbols = symbols;
        this.allSymbols = allSymbols;
        this.userSymbols = userSymbols;
        this.inheritingTypes = inheritingTypes;
        this.tc = tc;
        this.userValidationKeywords = args.validationKeywords.reduce((acc, word) => (Object.assign(Object.assign({}, acc), { [word]: true })), {});
        this.constAsEnum = args.constAsEnum;
    }
    get ReffedDefinitions() {
        return this.reffedDefinitions;
    }
    isFromDefaultLib(symbol) {
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0 && declarations[0].parent) {
            return declarations[0].parent.getSourceFile().hasNoDefaultLib;
        }
        return false;
    }
    resetSchemaSpecificProperties() {
        this.reffedDefinitions = {};
        this.typeIdsByName = {};
        this.typeNamesById = {};
        // restore schema overrides
        this.schemaOverrides.forEach((value, key) => {
            this.reffedDefinitions[key] = value;
        });
    }
    /**
     * Parse the comments of a symbol into the definition and other annotations.
     */
    parseCommentsIntoDefinition(symbol, definition, otherAnnotations) {
        if (!symbol) {
            return;
        }
        if (!this.isFromDefaultLib(symbol)) {
            // the comments for a symbol
            const comments = symbol.getDocumentationComment(this.tc);
            if (comments.length) {
                definition.description = comments
                    .map((comment) => {
                    const newlineNormalizedComment = comment.text.replace(/\r\n/g, "\n");
                    // If a comment contains a "{@link XYZ}" inline tag that could not be
                    // resolved by the TS checker, then this comment will contain a trailing
                    // whitespace that we need to remove.
                    if (comment.kind === "linkText") {
                        return newlineNormalizedComment.trim();
                    }
                    return newlineNormalizedComment;
                })
                    .join("")
                    .trim();
            }
        }
        // jsdocs are separate from comments
        const jsdocs = symbol.getJsDocTags();
        jsdocs.forEach((doc) => {
            // if we have @TJS-... annotations, we have to parse them
            let name = doc.name;
            const originalText = doc.text ? doc.text.map((t) => t.text).join("") : "";
            let text = originalText;
            // In TypeScript versions prior to 3.7, it stops parsing the annotation
            // at the first non-alphanumeric character and puts the rest of the line as the
            // "text" of the annotation, so we have a little hack to check for the name
            // "TJS" and then we sort of re-parse the annotation to support prior versions
            // of TypeScript.
            if (name.startsWith("TJS-")) {
                name = name.slice(4);
                if (!text) {
                    text = "true";
                }
            }
            else if (name === "TJS" && text.startsWith("-")) {
                let match = new RegExp(REGEX_TJS_JSDOC).exec(originalText);
                if (match) {
                    name = match[1];
                    text = match[2];
                }
                else {
                    // Treat empty text as boolean true
                    name = text.replace(/^[\s\-]+/, "");
                    text = "true";
                }
            }
            // In TypeScript ~3.5, the annotation name splits at the dot character so we have
            // to process the "." and beyond from the value
            if (subDefinitions[name]) {
                const match = new RegExp(REGEX_GROUP_JSDOC).exec(text);
                if (match) {
                    const k = match[1];
                    const v = match[2];
                    definition[name] = Object.assign(Object.assign({}, definition[name]), { [k]: v ? parseValue(symbol, k, v) : true });
                    return;
                }
            }
            // In TypeScript 3.7+, the "." is kept as part of the annotation name
            if (name.includes(".")) {
                const parts = name.split(".");
                if (parts.length === 2 && subDefinitions[parts[0]]) {
                    definition[parts[0]] = Object.assign(Object.assign({}, definition[parts[0]]), { [parts[1]]: text ? parseValue(symbol, name, text) : true });
                }
            }
            if (validationKeywords[name] || this.userValidationKeywords[name]) {
                definition[name] =
                    text === undefined ? "" : parseValue(symbol, name, text);
            }
            else {
                // special annotations
                otherAnnotations[doc.name] = true;
            }
        });
    }
    getDefinitionForRootType(propertyType, reffedType, definition, defaultNumberType = this.args.defaultNumberType, ignoreUndefined = false) {
        var _a;
        const tupleType = resolveTupleType(propertyType);
        if (tupleType) {
            // tuple
            const elemTypes = propertyType
                .typeArguments;
            const fixedTypes = elemTypes.map((elType) => this.getTypeDefinition(elType));
            definition.type = "array";
            if (fixedTypes.length > 0) {
                definition.items = fixedTypes;
            }
            const targetTupleType = propertyType.target;
            definition.minItems = targetTupleType.minLength;
            if (targetTupleType.hasRestElement) {
                definition.additionalItems = fixedTypes[fixedTypes.length - 1];
                fixedTypes.splice(fixedTypes.length - 1, 1);
            }
            else {
                definition.maxItems = targetTupleType.fixedLength;
            }
        }
        else {
            const propertyTypeString = this.tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            const flags = propertyType.flags;
            const arrayType = this.tc.getIndexTypeOfType(propertyType, ts.IndexKind.Number);
            if (flags & ts.TypeFlags.String) {
                definition.type = "string";
            }
            else if (flags & ts.TypeFlags.Number) {
                const isInteger = definition.type === "integer" ||
                    (reffedType === null || reffedType === void 0 ? void 0 : reffedType.getName()) === "integer" ||
                    defaultNumberType === "integer";
                definition.type = isInteger ? "integer" : "number";
            }
            else if (flags & ts.TypeFlags.Boolean) {
                definition.type = "boolean";
            }
            else if (flags & ts.TypeFlags.ESSymbol) {
                definition.type = "object";
            }
            else if (flags & ts.TypeFlags.Null) {
                definition.type = "null";
            }
            else if (flags & ts.TypeFlags.Undefined ||
                propertyTypeString === "void") {
                if (!ignoreUndefined) {
                    throw new Error("Not supported: root type undefined");
                }
                // will be deleted
                definition.type = "undefined";
            }
            else if (flags & ts.TypeFlags.Any || flags & ts.TypeFlags.Unknown) {
                // no type restriction, so that anything will match
            }
            else if (propertyTypeString === "Date" && !this.args.rejectDateType) {
                definition.type = "string";
                definition.format = definition.format || "date-time";
            }
            else if (propertyTypeString === "object") {
                definition.type = "object";
                definition.properties = {};
                definition.additionalProperties = true;
            }
            else {
                const value = extractLiteralValue(propertyType);
                if (value !== undefined) {
                    // typeof value can be: "string", "boolean", "number", or "object" if value is null
                    const typeofValue = typeof value;
                    switch (typeofValue) {
                        case "string":
                        case "boolean":
                            definition.type = typeofValue;
                            break;
                        case "number":
                            definition.type = this.args.defaultNumberType;
                            break;
                        case "object":
                            definition.type = "null";
                            break;
                        default:
                            throw new Error(`Not supported: ${value} as a enum value`);
                    }
                    if (this.constAsEnum) {
                        definition.enum = [value];
                    }
                    else {
                        definition.const = value;
                    }
                }
                else if (arrayType !== undefined) {
                    if (propertyType.flags & ts.TypeFlags.Object &&
                        propertyType.objectFlags &
                            (ts.ObjectFlags.Anonymous |
                                ts.ObjectFlags.Interface |
                                ts.ObjectFlags.Mapped)) {
                        definition.type = "object";
                        definition.additionalProperties = false;
                        definition.patternProperties = {
                            [NUMERIC_INDEX_PATTERN]: this.getTypeDefinition(arrayType),
                        };
                        if (!!((_a = Array.from(propertyType.members)) === null || _a === void 0 ? void 0 : _a.find((member) => member[0] !== "__index"))) {
                            this.getClassDefinition(propertyType, definition);
                        }
                    }
                    else if (propertyType.flags & ts.TypeFlags.TemplateLiteral) {
                        definition.type = "string";
                        // @ts-ignore
                        const { texts, types } = propertyType;
                        const pattern = [];
                        for (let i = 0; i < texts.length; i++) {
                            const text = texts[i];
                            const type = types[i];
                            if (i === 0) {
                                pattern.push(`^`);
                            }
                            if (type) {
                                if (type.flags & ts.TypeFlags.String) {
                                    pattern.push(`${text}.*`);
                                }
                                if (type.flags & ts.TypeFlags.Number ||
                                    type.flags & ts.TypeFlags.BigInt) {
                                    pattern.push(`${text}[0-9]*`);
                                }
                                if (type.flags & ts.TypeFlags.Undefined) {
                                    pattern.push(`${text}undefined`);
                                }
                                if (type.flags & ts.TypeFlags.Null) {
                                    pattern.push(`${text}null`);
                                }
                            }
                            if (i === texts.length - 1) {
                                pattern.push(`${text}$`);
                            }
                        }
                        definition.pattern = pattern.join("");
                    }
                    else {
                        definition.type = "array";
                        if (!definition.items) {
                            definition.items = this.getTypeDefinition(arrayType);
                        }
                    }
                }
                else {
                    // Report that type could not be processed
                    const error = new TypeError("Unsupported type: " + propertyTypeString);
                    error.type = propertyType;
                    throw error;
                    // definition = this.getTypeDefinition(propertyType, tc);
                }
            }
        }
        return definition;
    }
    getReferencedTypeSymbol(prop) {
        const decl = prop.getDeclarations();
        if (decl === null || decl === void 0 ? void 0 : decl.length) {
            const type = decl[0].type;
            if (type && type.kind & ts.SyntaxKind.TypeReference && type.typeName) {
                const symbol = this.tc.getSymbolAtLocation(type.typeName);
                if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
                    return this.tc.getAliasedSymbol(symbol);
                }
                return symbol;
            }
        }
        return undefined;
    }
    getDefinitionForProperty(prop, node) {
        if (prop.flags & ts.SymbolFlags.Method) {
            return null;
        }
        const propertyName = prop.getName();
        const propertyType = this.tc.getTypeOfSymbolAtLocation(prop, node);
        const reffedType = this.getReferencedTypeSymbol(prop);
        const definition = this.getTypeDefinition(propertyType, undefined, undefined, prop, reffedType);
        if (this.args.titles) {
            definition.title = propertyName;
        }
        if (definition.hasOwnProperty("ignore")) {
            return null;
        }
        // try to get default value
        const valDecl = prop.valueDeclaration;
        if (valDecl === null || valDecl === void 0 ? void 0 : valDecl.initializer) {
            let initial = valDecl.initializer;
            while (ts.isTypeAssertionExpression(initial)) {
                initial = initial.expression;
            }
            if (initial.expression) {
                // node
                console.warn("initializer is expression for property " + propertyName);
            }
            else if (initial.kind &&
                initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                definition.default = initial.getText();
            }
            else {
                try {
                    const sandbox = { sandboxvar: null };
                    vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);
                    const val = sandbox.sandboxvar;
                    if (val === null ||
                        typeof val === "string" ||
                        typeof val === "number" ||
                        typeof val === "boolean" ||
                        Object.prototype.toString.call(val) === "[object Array]") {
                        definition.default = val;
                    }
                    else if (val) {
                        console.warn("unknown initializer for property " + propertyName + ": " + val);
                    }
                }
                catch (e) {
                    console.warn("exception evaluating initializer for property " + propertyName);
                }
            }
        }
        return definition;
    }
    getEnumDefinition(clazzType, definition) {
        const node = clazzType.getSymbol().getDeclarations()[0];
        const fullName = this.tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        const members = node.kind === ts.SyntaxKind.EnumDeclaration
            ? node.members
            : ts.factory.createNodeArray([node]);
        var enumValues = [];
        const enumTypes = [];
        const addType = (type) => {
            if (enumTypes.indexOf(type) === -1) {
                enumTypes.push(type);
            }
        };
        members.forEach((member) => {
            const caseLabel = member.name.text;
            const constantValue = this.tc.getConstantValue(member);
            if (constantValue !== undefined) {
                enumValues.push(constantValue);
                addType(typeof constantValue); // can be only string or number;
            }
            else {
                // try to extract the enums value; it will probably by a cast expression
                const initial = member.initializer;
                if (initial) {
                    if (initial.expression) {
                        // node
                        const exp = initial.expression;
                        const text = exp.text;
                        // if it is an expression with a text literal, chances are it is the enum convention:
                        // CASELABEL = 'literal' as any
                        if (text) {
                            enumValues.push(text);
                            addType("string");
                        }
                        else if (exp.kind === ts.SyntaxKind.TrueKeyword ||
                            exp.kind === ts.SyntaxKind.FalseKeyword) {
                            enumValues.push(exp.kind === ts.SyntaxKind.TrueKeyword);
                            addType("boolean");
                        }
                        else {
                            console.warn("initializer is expression for enum: " +
                                fullName +
                                "." +
                                caseLabel);
                        }
                    }
                    else if (initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText());
                        addType("string");
                    }
                    else if (initial.kind === ts.SyntaxKind.NullKeyword) {
                        enumValues.push(null);
                        addType("null");
                    }
                }
            }
        });
        if (enumTypes.length) {
            definition.type = enumTypes.length === 1 ? enumTypes[0] : enumTypes;
        }
        if (enumValues.length > 0) {
            if (enumValues.length > 1) {
                definition.enum = enumValues.sort();
            }
            else {
                definition.const = enumValues[0];
            }
        }
        return definition;
    }
    getUnionDefinition(unionType, unionModifier, definition) {
        const enumValues = [];
        const simpleTypes = [];
        const schemas = [];
        const pushSimpleType = (type) => {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };
        const pushEnumValue = (val) => {
            if (enumValues.indexOf(val) === -1) {
                enumValues.push(val);
            }
        };
        for (const valueType of unionType.types) {
            const value = extractLiteralValue(valueType);
            if (value !== undefined) {
                pushEnumValue(value);
            }
            else {
                const symbol = valueType.aliasSymbol;
                const def = this.getTypeDefinition(valueType, undefined, undefined, symbol, symbol, undefined, undefined, true);
                if (def.type === "undefined") {
                    continue;
                }
                const keys = Object.keys(def);
                if (keys.length === 1 && keys[0] === "type") {
                    if (typeof def.type !== "string") {
                        console.error("Expected only a simple type.");
                    }
                    else {
                        pushSimpleType(def.type);
                    }
                }
                else {
                    schemas.push(def);
                }
            }
        }
        if (enumValues.length > 0) {
            // If the values are true and false, just add "boolean" as simple type
            const isOnlyBooleans = enumValues.length === 2 &&
                typeof enumValues[0] === "boolean" &&
                typeof enumValues[1] === "boolean" &&
                enumValues[0] !== enumValues[1];
            if (isOnlyBooleans) {
                pushSimpleType("boolean");
            }
            else {
                const enumSchema = enumValues.length > 1
                    ? { enum: enumValues.sort() }
                    : { const: enumValues[0] };
                // If all values are of the same primitive type, add a "type" field to the schema
                if (enumValues.every((x) => {
                    return typeof x === "string";
                })) {
                    enumSchema.type = "string";
                }
                else if (enumValues.every((x) => {
                    return typeof x === "number";
                })) {
                    enumSchema.type = "number";
                }
                else if (enumValues.every((x) => {
                    return typeof x === "boolean";
                })) {
                    enumSchema.type = "boolean";
                }
                schemas.push(enumSchema);
            }
        }
        if (simpleTypes.length > 0) {
            schemas.push({
                type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes,
            });
        }
        if (schemas.length === 1) {
            for (const k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    if (k === "description" && definition.hasOwnProperty(k)) {
                        // If we already have a more specific description, don't overwrite it.
                        continue;
                    }
                    definition[k] = schemas[0][k];
                }
            }
        }
        else {
            definition[unionModifier] = schemas;
        }
        return definition;
    }
    getIntersectionDefinition(intersectionType, definition) {
        const simpleTypes = [];
        const schemas = [];
        const pushSimpleType = (type) => {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };
        for (const intersectionMember of intersectionType.types) {
            const def = this.getTypeDefinition(intersectionMember);
            const keys = Object.keys(def);
            if (keys.length === 1 && keys[0] === "type") {
                if (typeof def.type !== "string") {
                    console.error("Expected only a simple type.");
                }
                else {
                    pushSimpleType(def.type);
                }
            }
            else {
                schemas.push(def);
            }
        }
        if (simpleTypes.length > 0) {
            schemas.push({
                type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes,
            });
        }
        if (schemas.length === 1) {
            for (const k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k];
                }
            }
        }
        else {
            definition.allOf = schemas;
        }
        return definition;
    }
    getClassDefinition(clazzType, definition) {
        var _a, _b;
        const node = clazzType.getSymbol().getDeclarations()[0];
        // Example: typeof globalThis may not have any declaration
        if (!node) {
            definition.type = "object";
            return definition;
        }
        if (this.args.typeOfKeyword && node.kind === ts.SyntaxKind.FunctionType) {
            definition.typeof = "function";
            return definition;
        }
        const clazz = node;
        const props = this.tc.getPropertiesOfType(clazzType).filter((prop) => {
            // filter never and undefined
            const propertyFlagType = this.tc
                .getTypeOfSymbolAtLocation(prop, node)
                .getFlags();
            if (ts.TypeFlags.Never === propertyFlagType ||
                ts.TypeFlags.Undefined === propertyFlagType) {
                return false;
            }
            if (!this.args.excludePrivate) {
                return true;
            }
            const decls = prop.declarations;
            return !(decls &&
                decls.filter((decl) => {
                    const mods = decl.modifiers;
                    return (mods &&
                        mods.filter((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword)
                            .length > 0);
                }).length > 0);
        });
        const fullName = this.tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        const modifierFlags = ts.getCombinedModifierFlags(node);
        if (modifierFlags & ts.ModifierFlags.Abstract &&
            this.inheritingTypes[fullName]) {
            const oneOf = this.inheritingTypes[fullName].map((typename) => {
                return this.getTypeDefinition(this.allSymbols[typename]);
            });
            definition.oneOf = oneOf;
        }
        else {
            if (clazz.members) {
                const indexSignatures = clazz.members == null
                    ? []
                    : clazz.members.filter((x) => x.kind === ts.SyntaxKind.IndexSignature);
                if (indexSignatures.length === 1) {
                    // for case "array-types"
                    const indexSignature = indexSignatures[0];
                    if (indexSignature.parameters.length !== 1) {
                        throw new Error("Not supported: IndexSignatureDeclaration parameters.length != 1");
                    }
                    const indexSymbol = indexSignature.parameters[0]
                        .symbol;
                    const indexType = this.tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                    const isIndexedObject = indexType.flags === ts.TypeFlags.String ||
                        indexType.flags === ts.TypeFlags.Number;
                    if (indexType.flags !== ts.TypeFlags.Number && !isIndexedObject) {
                        throw new Error("Not supported: IndexSignatureDeclaration with index symbol other than a number or a string");
                    }
                    const typ = this.tc.getTypeAtLocation(indexSignature.type);
                    let def;
                    if (typ.flags & ts.TypeFlags.IndexedAccess) {
                        const targetName = ts.escapeLeadingUnderscores((_b = (_a = clazzType.mapper) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.value);
                        const indexedAccessType = typ;
                        const symbols = (indexedAccessType.objectType).members;
                        const targetSymbol = symbols === null || symbols === void 0 ? void 0 : symbols.get(targetName);
                        if (targetSymbol) {
                            const targetNode = targetSymbol.getDeclarations()[0];
                            const targetDef = this.getDefinitionForProperty(targetSymbol, targetNode);
                            if (targetDef) {
                                def = targetDef;
                            }
                        }
                    }
                    if (!def) {
                        def = this.getTypeDefinition(typ, undefined, "anyOf");
                    }
                    if (isIndexedObject) {
                        definition.type = "object";
                        if (!Object.keys(definition.patternProperties || {}).length) {
                            definition.additionalProperties = def;
                        }
                    }
                    else {
                        definition.type = "array";
                        if (!definition.items) {
                            definition.items = def;
                        }
                    }
                }
            }
            const propertyDefinitions = props.reduce((all, prop) => {
                const propertyName = prop.getName();
                const propDef = this.getDefinitionForProperty(prop, node);
                if (propDef != null) {
                    all[propertyName] = propDef;
                }
                return all;
            }, {});
            if (definition.type === undefined) {
                definition.type = "object";
            }
            if (definition.type === "object" &&
                Object.keys(propertyDefinitions).length > 0) {
                definition.properties = propertyDefinitions;
            }
            if (this.args.defaultProps) {
                definition.defaultProperties = [];
            }
            if (this.args.noExtraProps &&
                definition.additionalProperties === undefined) {
                definition.additionalProperties = false;
            }
            if (this.args.propOrder) {
                // propertyOrder is non-standard, but useful:
                // https://github.com/json-schema/json-schema/issues/87
                const propertyOrder = props.reduce((order, prop) => {
                    order.push(prop.getName());
                    return order;
                }, []);
                definition.propertyOrder = propertyOrder;
            }
            if (this.args.required) {
                const requiredProps = props.reduce((required, prop) => {
                    var _a, _b, _c, _d;
                    const def = {};
                    this.parseCommentsIntoDefinition(prop, def, {});
                    const allUnionTypesFlags = ((_d = (_c = (_b = (_a = prop.links) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.types) === null || _c === void 0 ? void 0 : _c.map) === null || _d === void 0 ? void 0 : _d.call(_c, (t) => t.flags)) || [];
                    if (!(prop.flags & ts.SymbolFlags.Optional) &&
                        !(prop.flags & ts.SymbolFlags.Method) &&
                        !allUnionTypesFlags.includes(ts.TypeFlags.Undefined) &&
                        !allUnionTypesFlags.includes(ts.TypeFlags.Void) &&
                        !def.hasOwnProperty("ignore")) {
                        required.push(prop.getName());
                    }
                    return required;
                }, []);
                if (requiredProps.length > 0) {
                    definition.required = unique(requiredProps).sort();
                }
            }
        }
        return definition;
    }
    /**
     * Gets/generates a globally unique type name for the given type
     */
    getTypeName(typ) {
        const id = typ.id;
        if (this.typeNamesById[id]) {
            // Name already assigned?
            return this.typeNamesById[id];
        }
        return this.makeTypeNameUnique(typ, this.tc
            .typeToString(typ, undefined, ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.UseFullyQualifiedType)
            .replace(REGEX_FILE_NAME_OR_SPACE, ""));
    }
    makeTypeNameUnique(typ, baseName) {
        const id = typ.id;
        let name = baseName;
        // If a type with same name exists
        // Try appending "_1", "_2", etc.
        for (let i = 1; this.typeIdsByName[name] !== undefined && this.typeIdsByName[name] !== id; ++i) {
            name = baseName + "_" + i;
        }
        this.typeNamesById[id] = name;
        this.typeIdsByName[name] = id;
        return name;
    }
    getTypeDefinition(typ, asRef = this.args.ref, unionModifier = "anyOf", prop, reffedType, pairedSymbol, forceNotRef = false, ignoreUndefined = false) {
        var _a;
        const definition = {}; // real definition
        // Ignore any number of Readonly and Mutable type wrappings, since they only add and remove readonly modifiers on fields and JSON Schema is not concerned with mutability
        while (typ.aliasSymbol &&
            (typ.aliasSymbol.escapedName === "Readonly" ||
                typ.aliasSymbol.escapedName === "Mutable") &&
            typ.aliasTypeArguments &&
            typ.aliasTypeArguments[0]) {
            typ = typ.aliasTypeArguments[0];
            reffedType = undefined;
        }
        if (this.args.typeOfKeyword &&
            typ.flags & ts.TypeFlags.Object &&
            typ.objectFlags & ts.ObjectFlags.Anonymous) {
            definition.typeof = "function";
            return definition;
        }
        let returnedDefinition = definition; // returned definition, may be a $ref
        // Parse property comments now to skip recursive if ignore.
        if (prop) {
            const defs = {};
            const others = {};
            this.parseCommentsIntoDefinition(prop, defs, others);
            if (defs.hasOwnProperty("ignore") || defs.hasOwnProperty("type")) {
                return defs;
            }
        }
        const symbol = typ.getSymbol();
        // FIXME: We can't just compare the name of the symbol - it ignores the namespace
        let isRawType = !symbol ||
            // Window is incorrectly marked as rawType here for some reason
            (this.tc.getFullyQualifiedName(symbol) !== "Window" &&
                (this.tc.getFullyQualifiedName(symbol) === "Date" ||
                    symbol.name === "integer" ||
                    this.tc.getIndexInfoOfType(typ, ts.IndexKind.Number) !== undefined));
        if (isRawType &&
            ((_a = typ.aliasSymbol) === null || _a === void 0 ? void 0 : _a.escapedName) &&
            typ.types) {
            isRawType = false;
        }
        // special case: an union where all child are string literals -> make an enum instead
        let isStringEnum = false;
        if (typ.flags & ts.TypeFlags.Union) {
            const unionType = typ;
            isStringEnum = unionType.types.every((propType) => {
                return (propType.getFlags() & ts.TypeFlags.StringLiteral) !== 0;
            });
        }
        // aliased types must be handled slightly different
        const asTypeAliasRef = asRef && reffedType && (this.args.aliasRef || isStringEnum);
        if (!asTypeAliasRef) {
            if (isRawType ||
                (typ.getFlags() & ts.TypeFlags.Object &&
                    typ.objectFlags & ts.ObjectFlags.Anonymous)) {
                asRef = false; // raw types and inline types cannot be reffed,
                // unless we are handling a type alias
                // or it is recursive type - see below
            }
        }
        let fullTypeName = "";
        if (asTypeAliasRef) {
            const typeName = this.tc
                .getFullyQualifiedName(reffedType.getFlags() & ts.SymbolFlags.Alias
                ? this.tc.getAliasedSymbol(reffedType)
                : reffedType)
                .replace(REGEX_FILE_NAME_OR_SPACE, "");
            if (this.args.uniqueNames && reffedType) {
                const sourceFile = getSourceFile(reffedType);
                const relativePath = path.relative(process.cwd(), sourceFile.fileName);
                fullTypeName = `${typeName}.${generateHashOfNode(getCanonicalDeclaration(reffedType), relativePath)}`;
            }
            else {
                fullTypeName = this.makeTypeNameUnique(typ, typeName);
            }
        }
        else {
            // typ.symbol can be undefined
            if (this.args.uniqueNames && typ.symbol) {
                const sym = typ.symbol;
                const sourceFile = getSourceFile(sym);
                const relativePath = path.relative(process.cwd(), sourceFile.fileName);
                fullTypeName = `${this.getTypeName(typ)}.${generateHashOfNode(getCanonicalDeclaration(sym), relativePath)}`;
            }
            else if (reffedType &&
                this.schemaOverrides.has(reffedType.escapedName)) {
                fullTypeName = reffedType.escapedName;
            }
            else {
                fullTypeName = this.getTypeName(typ);
            }
        }
        // Handle recursive types
        if (!isRawType || !!typ.aliasSymbol) {
            if (this.recursiveTypeRef.has(fullTypeName) && !forceNotRef) {
                asRef = true;
            }
            else {
                this.recursiveTypeRef.set(fullTypeName, definition);
            }
        }
        if (asRef) {
            // We don't return the full definition, but we put it into
            // reffedDefinitions below.
            returnedDefinition = {
                $ref: `${this.args.id}#/definitions/` + fullTypeName,
            };
        }
        // Parse comments
        const otherAnnotations = {};
        this.parseCommentsIntoDefinition(reffedType, definition, otherAnnotations); // handle comments in the type alias declaration
        this.parseCommentsIntoDefinition(symbol, definition, otherAnnotations);
        this.parseCommentsIntoDefinition(typ.aliasSymbol, definition, otherAnnotations);
        if (prop) {
            this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations);
        }
        if (pairedSymbol && symbol && this.isFromDefaultLib(symbol)) {
            this.parseCommentsIntoDefinition(pairedSymbol, definition, otherAnnotations);
        }
        // Create the actual definition only if is an inline definition, or
        // if it will be a $ref and it is not yet created
        if (!asRef || !this.reffedDefinitions[fullTypeName]) {
            if (asRef) {
                // must be here to prevent recursivity problems
                let reffedDefinition;
                if (asTypeAliasRef &&
                    reffedType &&
                    typ.symbol !== reffedType &&
                    symbol) {
                    reffedDefinition = this.getTypeDefinition(typ, true, undefined, symbol, symbol);
                }
                else {
                    reffedDefinition = definition;
                }
                this.reffedDefinitions[fullTypeName] = reffedDefinition;
                if (this.args.titles && fullTypeName) {
                    definition.title = fullTypeName;
                }
            }
            const node = (symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations()) !== undefined
                ? symbol.getDeclarations()[0]
                : null;
            if (definition.type === undefined) {
                // if users override the type, do not try to infer it
                if (typ.flags & ts.TypeFlags.Union &&
                    (node === null || node.kind !== ts.SyntaxKind.EnumDeclaration)) {
                    this.getUnionDefinition(typ, unionModifier, definition);
                }
                else if (typ.flags & ts.TypeFlags.Intersection) {
                    if (this.args.noExtraProps) {
                        // extend object instead of using allOf because allOf does not work well with additional properties. See #107
                        if (this.args.noExtraProps) {
                            definition.additionalProperties = false;
                        }
                        const types = typ.types;
                        for (const member of types) {
                            const other = this.getTypeDefinition(member, false, undefined, undefined, undefined, undefined, true);
                            definition.type = other.type; // should always be object
                            definition.properties = Object.assign(Object.assign({}, definition.properties), other.properties);
                            if (Object.keys(other.default || {}).length > 0) {
                                definition.default = extend(definition.default || {}, other.default);
                            }
                            if (other.required) {
                                definition.required = unique((definition.required || []).concat(other.required)).sort();
                            }
                        }
                    }
                    else {
                        this.getIntersectionDefinition(typ, definition);
                    }
                }
                else if (isRawType) {
                    if (pairedSymbol) {
                        this.parseCommentsIntoDefinition(pairedSymbol, definition, {});
                    }
                    this.getDefinitionForRootType(typ, reffedType, definition, undefined, ignoreUndefined);
                }
                else if (node &&
                    (node.kind === ts.SyntaxKind.EnumDeclaration ||
                        node.kind === ts.SyntaxKind.EnumMember)) {
                    this.getEnumDefinition(typ, definition);
                }
                else if (symbol &&
                    symbol.flags & ts.SymbolFlags.TypeLiteral &&
                    symbol.members.size === 0 &&
                    !(node && node.kind === ts.SyntaxKind.MappedType)) {
                    // {} is TypeLiteral with no members. Need special case because it doesn't have declarations.
                    definition.type = "object";
                    definition.properties = {};
                }
                else {
                    this.getClassDefinition(typ, definition);
                }
            }
        }
        if (this.recursiveTypeRef.get(fullTypeName) === definition) {
            this.recursiveTypeRef.delete(fullTypeName);
            // If the type was recursive (there is reffedDefinitions) - lets replace it to reference
            if (this.reffedDefinitions[fullTypeName]) {
                const annotations = Object.entries(returnedDefinition).reduce((acc, [key, value]) => {
                    if (annotationKeywords[key] && typeof value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});
                returnedDefinition = Object.assign({ $ref: `${this.args.id}#/definitions/` + fullTypeName }, annotations);
            }
        }
        if (otherAnnotations["nullable"]) {
            makeNullable(returnedDefinition);
        }
        return returnedDefinition;
    }
    setSchemaOverride(symbolName, schema) {
        this.schemaOverrides.set(symbolName, schema);
    }
    getSchemaForSymbol(symbolName, includeReffedDefinitions = true) {
        if (!this.allSymbols[symbolName]) {
            throw new Error(`type ${symbolName} not found`);
        }
        this.resetSchemaSpecificProperties();
        const def = this.getTypeDefinition(this.allSymbols[symbolName], this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName] || undefined);
        if (this.args.ref &&
            includeReffedDefinitions &&
            Object.keys(this.reffedDefinitions).length > 0) {
            def.definitions = this.reffedDefinitions;
        }
        def["$schema"] = "http://json-schema.org/draft-07/schema#";
        const id = this.args.id;
        if (id) {
            def["$id"] = this.args.id;
        }
        return def;
    }
    getSchemaForSymbols(symbolNames, includeReffedDefinitions = true) {
        const root = {
            $schema: "http://json-schema.org/draft-07/schema#",
            definitions: {},
        };
        this.resetSchemaSpecificProperties();
        const id = this.args.id;
        if (id) {
            root["$id"] = id;
        }
        for (const symbolName of symbolNames) {
            root.definitions[symbolName] = this.getTypeDefinition(this.allSymbols[symbolName], this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName]);
        }
        if (this.args.ref &&
            includeReffedDefinitions &&
            Object.keys(this.reffedDefinitions).length > 0) {
            root.definitions = Object.assign(Object.assign({}, root.definitions), this.reffedDefinitions);
        }
        return root;
    }
    getSymbols(name) {
        if (name === void 0) {
            return this.symbols;
        }
        return this.symbols.filter((symbol) => symbol.typeName === name);
    }
    getUserSymbols() {
        return Object.keys(this.userSymbols);
    }
    getMainFileSymbols(program, onlyIncludeFiles) {
        function includeFile(file) {
            if (onlyIncludeFiles === undefined) {
                return !file.isDeclarationFile;
            }
            return (onlyIncludeFiles.filter((f) => (0, path_equal_1.pathEqual)(f, file.fileName)).length > 0);
        }
        const files = program.getSourceFiles().filter(includeFile);
        if (files.length) {
            return Object.keys(this.userSymbols).filter((key) => {
                const symbol = this.userSymbols[key];
                if (!symbol || !symbol.declarations || !symbol.declarations.length) {
                    return false;
                }
                let node = symbol.declarations[0];
                while (node === null || node === void 0 ? void 0 : node.parent) {
                    node = node.parent;
                }
                return files.indexOf(node.getSourceFile()) > -1;
            });
        }
        return [];
    }
}
exports.JsonSchemaGenerator = JsonSchemaGenerator;
function getProgramFromFiles(files, jsonCompilerOptions = {}, basePath = "./") {
    // use built-in default options
    const compilerOptions = ts.convertCompilerOptionsFromJson(jsonCompilerOptions, basePath).options;
    const options = {
        noEmit: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        allowUnusedLabels: true,
    };
    for (const k in compilerOptions) {
        if (compilerOptions.hasOwnProperty(k)) {
            options[k] = compilerOptions[k];
        }
    }
    return ts.createProgram(files, options);
}
exports.getProgramFromFiles = getProgramFromFiles;
function generateHashOfNode(node, relativePath) {
    return (0, crypto_1.createHash)("md5")
        .update(relativePath)
        .update(node.pos.toString())
        .digest("hex")
        .substring(0, 8);
}
function buildGenerator(program, args = {}, onlyIncludeFiles) {
    function isUserFile(file) {
        if (onlyIncludeFiles === undefined) {
            return !file.hasNoDefaultLib;
        }
        return onlyIncludeFiles.indexOf(file.fileName) >= 0;
    }
    // Use defaults unless otherwise specified
    const settings = getDefaultArgs();
    for (const pref in args) {
        if (args.hasOwnProperty(pref)) {
            settings[pref] = args[pref];
        }
    }
    if (args.tsNodeRegister) {
        require("ts-node/register");
    }
    let diagnostics = [];
    if (!args.ignoreErrors) {
        diagnostics = ts.getPreEmitDiagnostics(program);
    }
    if (diagnostics.length === 0) {
        const typeChecker = program.getTypeChecker();
        const symbols = [];
        const allSymbols = {};
        const userSymbols = {};
        const inheritingTypes = {};
        const workingDir = program.getCurrentDirectory();
        program.getSourceFiles().forEach((sourceFile, _sourceFileIdx) => {
            const relativePath = path.relative(workingDir, sourceFile.fileName);
            function inspect(node, tc) {
                if (node.kind === ts.SyntaxKind.ClassDeclaration ||
                    node.kind === ts.SyntaxKind.InterfaceDeclaration ||
                    node.kind === ts.SyntaxKind.EnumDeclaration ||
                    node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
                    const symbol = node.symbol;
                    const nodeType = tc.getTypeAtLocation(node);
                    const fullyQualifiedName = tc.getFullyQualifiedName(symbol);
                    const typeName = fullyQualifiedName.replace(/".*"\./, "");
                    const name = !args.uniqueNames
                        ? typeName
                        : `${typeName}.${generateHashOfNode(node, relativePath)}`;
                    symbols.push({ name, typeName, fullyQualifiedName, symbol });
                    if (!userSymbols[name]) {
                        allSymbols[name] = nodeType;
                    }
                    if (isUserFile(sourceFile)) {
                        userSymbols[name] = symbol;
                    }
                    const baseTypes = nodeType.getBaseTypes() || [];
                    baseTypes.forEach((baseType) => {
                        var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        if (!inheritingTypes[baseName]) {
                            inheritingTypes[baseName] = [];
                        }
                        inheritingTypes[baseName].push(name);
                    });
                }
                else {
                    ts.forEachChild(node, (n) => inspect(n, tc));
                }
            }
            inspect(sourceFile, typeChecker);
        });
        return new JsonSchemaGenerator(symbols, allSymbols, userSymbols, inheritingTypes, typeChecker, settings);
    }
    else {
        diagnostics.forEach((diagnostic) => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            }
            else {
                console.error(message);
            }
        });
        return null;
    }
}
exports.buildGenerator = buildGenerator;
function generateSchema(program, fullTypeName, args = {}, onlyIncludeFiles, externalGenerator) {
    const generator = externalGenerator !== null && externalGenerator !== void 0 ? externalGenerator : buildGenerator(program, args, onlyIncludeFiles);
    if (generator === null) {
        return null;
    }
    if (fullTypeName === "*") {
        // All types in file(s)
        return generator.getSchemaForSymbols(generator.getMainFileSymbols(program, onlyIncludeFiles));
    }
    else if (args.uniqueNames) {
        // Find the hashed type name to use as the root object
        const matchingSymbols = generator.getSymbols(fullTypeName);
        if (matchingSymbols.length === 1) {
            return generator.getSchemaForSymbol(matchingSymbols[0].name);
        }
        else {
            throw new Error(`${matchingSymbols.length} definitions found for requested type "${fullTypeName}".`);
        }
    }
    else {
        // Use specific type as root object
        return generator.getSchemaForSymbol(fullTypeName);
    }
}
exports.generateSchema = generateSchema;
function programFromConfig(configFileName, onlyIncludeFiles) {
    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName));
    const configObject = result.config;
    const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, path.basename(configFileName));
    const options = configParseResult.options;
    options.noEmit = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;
    delete options.declarationDir;
    delete options.declarationMap;
    const program = ts.createProgram({
        rootNames: onlyIncludeFiles || configParseResult.fileNames,
        options,
        projectReferences: configParseResult.projectReferences,
    });
    return program;
}
exports.programFromConfig = programFromConfig;
function normalizeFileName(fn) {
    while (fn.substr(0, 2) === "./") {
        fn = fn.substr(2);
    }
    return fn;
}
function exec(filePattern, fullTypeName, args = getDefaultArgs()) {
    return __awaiter(this, void 0, void 0, function* () {
        let program;
        let onlyIncludeFiles = undefined;
        if (REGEX_TSCONFIG_NAME.test(path.basename(filePattern))) {
            if (args.include && args.include.length > 0) {
                const globs = args.include.map((f) => glob.sync(f));
                onlyIncludeFiles = []
                    .concat(...globs)
                    .map(normalizeFileName);
            }
            program = programFromConfig(filePattern, onlyIncludeFiles);
        }
        else {
            onlyIncludeFiles = glob.sync(filePattern);
            program = getProgramFromFiles(onlyIncludeFiles, {
                strictNullChecks: args.strictNullChecks,
                esModuleInterop: args.esModuleInterop,
                skipLibCheck: args.skipLibCheck,
            });
            onlyIncludeFiles = onlyIncludeFiles.map(normalizeFileName);
        }
        const definition = generateSchema(program, fullTypeName, args, onlyIncludeFiles);
        if (definition === null) {
            throw new Error("No output definition. Probably caused by errors prior to this?");
        }
        const json = (0, safe_stable_stringify_1.stringify)(definition, null, 4) + "\n\n";
        if (args.out) {
            return new Promise((resolve, reject) => {
                const fs = require("fs");
                fs.mkdir(path.dirname(args.out), { recursive: true }, function (mkErr) {
                    if (mkErr) {
                        return reject(new Error("Unable to create parent directory for output file: " +
                            mkErr.message));
                    }
                    fs.writeFile(args.out, json, function (wrErr) {
                        if (wrErr) {
                            return reject(new Error("Unable to write output file: " + wrErr.message));
                        }
                        resolve();
                    });
                });
            });
        }
        else {
            const hasBeenBuffered = process.stdout.write(json);
            if (hasBeenBuffered) {
                return new Promise((resolve) => process.stdout.on("drain", () => resolve()));
            }
        }
    });
}
exports.exec = exec;
