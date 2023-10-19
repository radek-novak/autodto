typescript compilercode 
https://basarat.gitbook.io/typescript/overview

older
https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

similar project
https://typedoc.org/options/input/


https://ts-ast-viewer.com/#


example command for testing `npm run autodto -- tests/koa-1/index.ts`

check the openapi file with https://editor.swagger.io/

OpenAPI has a specific format
1. generate OpenAPI format disregarding response type
2. generate JSON schema from typescript types
  There are tools for this, but they require symbol name, but there's no symbol name for this.
  I can get type as string or possibly as position in the code, but neither tool seems to be able to use this. They want a file and Symbol name. 
  a. I use the raw type and generate new Symbol just for the purpose of extraction by these tools
  b. I extract code from those tools that can use type and not symbol


I failed at 2a, it's not that easy to create the type. Gonna continue with 2b next time - that worked


### TODO
- folder structure
- read config file
- [x] get input file from local tsconfig
- [x] use CLI arguments for configuration
- account for arg in function calls (`res.json(obj)`)
- query params, request body, headers