# AutoDTO

Generate typed axios client and OpenAPI documentation from existing application code. It reads the type of the endpoint response, so it always stays up-to-date. It requires manual work of marking each endpoint response with a special comment.

```typescript
router.get("/", async (ctx, next) => {
  // @autodto GET /
  ctx.body = "Hello World";
});

router.get("/data", async (ctx, next) => {
  // @autodto GET /data
  ctx.body = await datafetch();
});
```

The tradeoff here is in the endpoint path change, which needs to be updated manually. However, changes to the type of the response are more common and sneakier, and those are automatically reflected when generating the documentation.

## Install

```
npm i -D autodto
```

## Developing

```sh
# /
npm build

npm pack
# creates a file
# autodto-<version>.tgz

```

```sh
# in test folder, eg. tests/koa-1
# file create when building the main project
npm install ../../autodto-<version>.tgz

# will build the openapi.json and autodto/client.*
npm run autodto

```