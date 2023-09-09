import * as ts from "typescript";

function createProgram(filePath: string) {
  const compilerOptions = { strict: true };
  return ts.createProgram([filePath], compilerOptions);
}

function extractTypes(filePath: string) {
  const program = createProgram(filePath);

  const result = [] as {
    file: string;
    rawComment: string;
    typeString: string;
    parsedComment?: string;
  }[];
  const collect = (rawComment: string, typeString: string, file: string) => {
    const commentMatch = rawComment.match(/\/+\s*?@autodto\s+(.*)/);
    const parsedComment = commentMatch?.[1];

    result.push({
      file,
      rawComment,
      parsedComment,
      typeString,
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

      // console.log(node.pos, node.end, comment, node.getText(), typeString);

      collect(comment, typeString, node.getSourceFile().fileName);

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

  console.log(result);
}

const [, _program, path] = process.argv;

extractTypes(path);
