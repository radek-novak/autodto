import ts from "typescript";

const typeForParams = "type ParamsType = { a: number };";
const typeForResponse = "type ResponseType = { data: any };"; // Replace 'any' with your type

// Parse types from string
const parsedParamsType = ts.createSourceFile(
  "temp1.ts",
  typeForParams,
  ts.ScriptTarget.Latest
).statements[0];
const parsedResponseType = ts.createSourceFile(
  "temp2.ts",
  typeForResponse,
  ts.ScriptTarget.Latest
).statements[0];

// Create AST
const funcAST = ts.factory.createVariableStatement(
  undefined,
  ts.factory.createVariableDeclarationList(
    [
      ts.factory.createVariableDeclaration(
        "x",
        undefined,
        undefined,
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "params",
              undefined,
              ts.factory.createTypeReferenceNode("ParamsType", undefined)
            ),
          ],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("axios"),
                  ts.factory.createIdentifier("get")
                ),
                [ts.factory.createTypeReferenceNode("ResponseType", undefined)],
                [
                  ts.factory.createStringLiteral("/abc/"),
                  ts.factory.createIdentifier("params"),
                ]
              ),
              ts.factory.createIdentifier("then")
            ),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "r",
                    undefined,
                    undefined
                  ),
                ],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("r"),
                  ts.factory.createIdentifier("data")
                )
              ),
            ]
          )
        )
      ),
    ],
    ts.NodeFlags.Const
  )
);

const printer = ts.createPrinter();
const generatedCode = printer.printList(
  ts.ListFormat.MultiLine,
  ts.factory.createNodeArray([parsedParamsType, parsedResponseType, funcAST]),
  ts.createSourceFile("temp.ts", "", ts.ScriptTarget.Latest)
);

console.log(generatedCode);
