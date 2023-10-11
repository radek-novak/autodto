import * as Router from "koa-router";
import { getUser } from "./lib/user";

const router = new Router();

router.get("/:id", async (ctx, next) => {
  // @autodto GET /user/:id
  ctx.body = await getUser(ctx.params.id);
});

router.get("/:id/more", async (ctx, next) => {
  const user = Math.random() > 0.5 ? await getUser(ctx.params.id) : null;
  const n = Math.random() > 0.5 ? "n" : Math.random() > 0.5 ? undefined : null;

  // @autodto GET /user/:id/rand
  ctx.body = {
    user,
    n,
  };
});

export default router.routes();
