import * as Koa from "koa";
import * as Router from "koa-router";
import { getUser } from "./lib/user";

const app = new Koa();
const router = new Router();

async function datafetch() {
  return new Promise((resolve: (value: string[]) => void, reject) => {
    setTimeout(() => {
      resolve(["a", "b", "c"]);
    }, 1000);
  });
}

router.get("/", async (ctx, next) => {
  // @autodto
  ctx.body = "Hello World";
});

router.get("/data", async (ctx, next) => {
  // @autodto
  ctx.body = await datafetch();
});

router.get("/user/:id", async (ctx, next) => {
  // @autodto
  ctx.body = await getUser(ctx.params.id);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
