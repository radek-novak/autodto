import * as Router from "koa-router";
import { getUser } from "./lib/user";

const router = new Router();

router.get("/:id", async (ctx, next) => {
  // @autodto GET /user/:id
  ctx.body = await getUser(ctx.params.id);
});

export default router.routes();
