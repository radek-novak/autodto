import * as path from "path";
import * as ts from "typescript";
import {
  getType,
  getReffedDefinitions,
} from "./ts-to-jsonschema/json-schema-custom";
import { JSONSchema7 } from "json-schema";

type JSONSchema = JSONSchema7;

export type ExtractedType = {
  file: string;
  rawComment: string;
  typeString: string;
  parsedComment?: string;
  jsonSchema?: JSONSchema;
};

// function createProgram(filePath: string) {
//   const compilerOptions = { strict: true };
//   return ts.createProgram([filePath], compilerOptions);
// }

function createProgram(filePath: string) {
  const configPath = ts.findConfigFile(
    path.dirname(filePath), // Search start directory
    ts.sys.fileExists,
    "tsconfig.json" // Config file name
  );

  if (!configPath) {
    console.warn('Could not find a valid "tsconfig.json".');
    return ts.createProgram([filePath], { strict: true });
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );
  delete parsedConfig.options.incremental;

  const allFiles = [filePath, ...parsedConfig.fileNames];
  return ts.createProgram(allFiles, parsedConfig.options);

  // return ts.createProgram([filePath], parsedConfig.options);
}
export function extractTypes(filePath: string) {
  const program = createProgram(filePath);
  // program.getGlobalDiagnostics().forEach((d) => console.log(d.messageText));
  // console.log(program.getCompilerOptions());
  // const diag = program
  //   .getOptionsDiagnostics()
  //   .map((d) => console.log(d.messageText));
  // const projectFiles = program
  //   .getSourceFiles()
  //   .filter((sf) => !sf.isDeclarationFile)
  //   .map((sf) => sf.fileName);

  // console.log(projectFiles);
  // console.log(diag);
  // console.log({
  //   version: ts.version,
  //   servicesVersion: ts.servicesVersion,
  //   versionMajorMinor: ts.versionMajorMinor,
  // });

  const result = [] as ExtractedType[];
  const collect = (
    rawComment: string,
    typeString: string,
    file: string,
    jsonSchema?: JSONSchema
  ) => {
    const commentMatch = rawComment.match(/\/+\s*?@autodto\s+(.*)/);
    const parsedComment = commentMatch?.[1];

    result.push({
      file,
      rawComment,
      parsedComment,
      typeString,
      jsonSchema,
    });
  };

  function visitNode(
    node: ts.Node,
    checker: ts.TypeChecker,
    fileText: string,
    isCorrectArg = false
  ) {
    let isCorrect = isCorrectArg;
    let comment = "";

    ts.forEachLeadingCommentRange(fileText, node.getFullStart(), (pos, end) => {
      comment = fileText.substring(pos, end);
      isCorrect = comment.includes("@autodto");
    });
    if (
      isCorrect &&
      (ts.isVariableDeclaration(node) || ts.isBinaryExpression(node))
    ) {
      const type = checker.getTypeAtLocation(node);
      const typeString = checker.typeToString(type);
      // console.log(type.getSymbol());

      const jsonSchema = getType(type, program);
      // console.log(node.pos, node.end, comment, node.getText(), typeString);

      collect(comment, typeString, node.getSourceFile().fileName, jsonSchema);

      // maybe switch isCorrect to false after collecting type?
      isCorrect = false;
      comment = "";
    }

    ts.forEachChild(
      node,
      (child) => visitNode(child, checker, fileText, isCorrect),
      (children) =>
        children.forEach((child) =>
          visitNode(child, checker, fileText, isCorrect)
        )
    );
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
