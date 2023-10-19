import { resolve } from "path";

import * as TJS from "./getTypeDefinition";
import ts from "typescript";

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
  required: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
  // strictNullChecks: true,
};

// optionally pass a base path

// // generator can be also reused to speed up generating the schema if usecase allows:
// const schemaWithReusedGenerator = TJS.generateSchema(
//   program,
//   "MyType",
//   settings,
//   [],
//   generator
// );

// // all symbols
// const symbols = generator.getUserSymbols();

// // Get symbols for different types from generator.
// generator.getSchemaForSymbol("MyType");
// generator.getSchemaForSymbol("AnotherType");

// A list of all types of a given name can then be retrieved.
// const symbolList = generator.getSymbols("MyType");

// Choose the appropriate type, and continue with the symbol's unique name.
// generator.getSchemaForSymbol(symbolList[1].name);

// Also it is possible to get a list of all symbols.

export function buildGenerator(program: ts.Program) {
  // const basePath = "./tests";

  // const program = TJS.getProgramFromFiles(
  //   [resolve("tests/simple/declaration-1.ts")],
  //   compilerOptions,
  //   basePath
  // );

  // We can either get the schema for one file and one type...
  // const schema = TJS.generateSchema(program, "MyType", settings);

  // ... or a generator that lets us incrementally get more schemas

  const generator = TJS.buildGenerator(program, settings);
  if (!generator) throw new Error("no generator");

  return generator;
}

export function getType(type: ts.Type, generator: TJS.JsonSchemaGenerator) {
  const jsonSchema = generator.getTypeDefinition(
    type,
    false,
    undefined,
    undefined,
    undefined,
    undefined,
    true
  );

  return jsonSchema;
}
