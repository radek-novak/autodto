import * as Koa from "koa";
import * as Router from "koa-router";
import userRoutes from "./user";

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
  // @autodto GET /
  ctx.body = "Hello World";
});

router.get("/data", async (ctx, next) => {
  // @autodto GET /data
  ctx.body = await datafetch();
});

router.use("/user", userRoutes);

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
