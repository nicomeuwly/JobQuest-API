import { Elysia } from "elysia";
import { env } from "./env";
import { HttpError } from "./common/http-error";
import { authRoutes } from "./routes/auth.routes";
import { accountRoutes } from "./routes/account.routes";
import { jobsRoutes } from "./routes/jobs.routes";

const app = new Elysia({ prefix: "/api/v1" })
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { message: error.message };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { message: "Invalid request payload" };
    }

    console.error(error);
    set.status = 500;
    return { message: "Internal server error" };
  })
  .get("/health", () => ({ status: "ok" }))
  .use(authRoutes)
  .use(accountRoutes)
  .use(jobsRoutes)
  .listen(env.port);

console.log(`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
