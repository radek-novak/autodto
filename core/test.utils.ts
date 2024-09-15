import * as ts from "typescript";

export function rebuildProgram(
  sourceFiles: ts.SourceFile[],
  options: ts.CompilerOptions
): ts.Program {
  // Create a map of source files to simulate a virtual file system
  const fileMap = new Map<string, ts.SourceFile>();
  for (const sourceFile of sourceFiles) {
    fileMap.set(sourceFile.fileName, sourceFile);
  }

  // Create a custom CompilerHost to supply our in-memory files
  const compilerHost: ts.CompilerHost = {
    fileExists: (fileName) => fileMap.has(fileName),
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getNewLine: () => ts.sys.newLine,
    getSourceFile: (fileName) => fileMap.get(fileName) || undefined,
    readFile: (fileName) => fileMap.get(fileName)?.text || undefined,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    writeFile: (fileName, content) => {
      // This can be customized to write output files somewhere if needed
    },
  };

  // Collect the file names to pass to createProgram
  const fileNames = sourceFiles.map((sf) => sf.fileName);

  // Create the program
  return ts.createProgram(fileNames, options, compilerHost);
}

// Serialize a SourceFile
export function serializeSourceFile(sourceFile: ts.SourceFile): {
  fileName: string;
  content: string;
} {
  return {
    fileName: sourceFile.fileName,
    content: sourceFile.getFullText(),
  };
}

// Deserialize a SourceFile
export function deserializeSourceFile(
  serialized: { fileName: string; content: string },
  options: ts.CompilerOptions
): ts.SourceFile {
  return ts.createSourceFile(
    serialized.fileName,
    serialized.content,
    options.target || ts.ScriptTarget.ESNext
  );
}
