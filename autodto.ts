import * as ts from "typescript";

function createProgram(filePath: string) {
  const compilerOptions = { strict: true };
  return ts.createProgram([filePath], compilerOptions);
}

function extractTypes(filePath: string) {
  const program = createProgram(filePath);
  function visitNode(
    node: ts.Node,
    checker: ts.TypeChecker,
    fileText: string,
    isCorrectArg = false
  ) {
    let isCorrect = isCorrectArg;

    ts.forEachLeadingCommentRange(fileText, node.getFullStart(), (pos, end) => {
      const comment = fileText.substring(pos, end);
      isCorrect = comment.includes("@autodto");
    });
    if (isCorrect && ts.isVariableDeclaration(node)) {
      const type = checker.getTypeAtLocation(node);
      const typeString = checker.typeToString(type);

      console.log(node.pos, node.end, node.getText(), typeString);
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
}

const [, _program, path] = process.argv;

extractTypes(path);
