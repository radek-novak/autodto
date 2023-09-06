import * as ts from "typescript";

function createProgram(filePath: string) {
  const compilerOptions = { strict: true };
  return ts.createProgram([filePath], compilerOptions);
}

const filePath = "./tests/simple/oneline-1.ts";
const program = createProgram(filePath);
const sourcefiles = program.getSourceFiles();

sourcefiles
  .filter((sourceFile) => !sourceFile.isDeclarationFile)
  .map((sourceFile) => {
    const fileText = sourceFile.getFullText();
    const checker = program.getTypeChecker();

    sourceFile.forEachChild((node) => {
      let isCorrect = false;

      ts.forEachLeadingCommentRange(
        fileText,
        node.getFullStart(),
        (pos, end, kind, _hasTrailingNewLine) => {
          const comment = fileText.substring(pos, end);
          // console.log(comment);

          isCorrect = comment.includes("@autodto");
        }
      );

      if (isCorrect) {
        const type = checker.getTypeAtLocation(node);
        const typeString = checker.typeToString(type);

        const apparentType = checker.getApparentType(type);
        const apparentTypeString = checker.typeToString(apparentType);

        console.log(
          node.pos,
          node.end,
          node.getText(),
          typeString,
          apparentTypeString
        );
      }
    });
  });
