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

The tradeoff here is in the endpoint path change, which if 

## Install

```
npm i -D autodto
```

