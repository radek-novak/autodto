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
- [x] read config file
- [x] get input file from local tsconfig
- [x] use CLI arguments for configuration
- account for arg in function calls (`res.json(obj)`)
- query params, request body, headers
- build client
- build client definitions
- 

## Operation

1. In the host folder: read the program using local TS and local tsconfig
2. Genral code:extract types below the special comments into a autodto data structure

Use this data structure for openapi, typed axios interface...


#### Client

Client will be generated from a template .js file, into which a JSON will be injected. It should be a JS file, because it's possible that consuming project won't be able compile TS to JS for a possible build folder or node module and also for the case the client needs to be used by a JS project.
The client builder shouldn't import JSON file inside of it, because JSON imports may not work in everywhere (would need to test ES modules, Node, Webpack, Rollup, esbuild, swc...).
A variant would be a client file and a definitions js file, which would be imported by the client file. There would be no advantage over current solution, but it requires import, and choosing import method that would work both for browser and node, so better avoid it.
