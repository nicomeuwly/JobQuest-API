import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { signJwt } from "../lib/jwt";
import { HttpError } from "../common/http-error";
import { buildAuthCookie, clearAuthCookie } from "../common/cookies";

export const authRoutes = new Elysia()
  .post(
    "/auth/register",
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        throw new HttpError(409, "Email already in use");
      }

      const hashedPassword = await Bun.password.hash(body.password);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });

      const token = await signJwt(user.id, user.email);
      set.headers["Set-Cookie"] = buildAuthCookie(token);
      set.status = 201;

      return { user, token };
    },
    {
      body: t.Object(
        {
          email: t.String({ format: "email", maxLength: 255 }),
          password: t.String({ minLength: 8, maxLength: 72 }),
        },
        { additionalProperties: false }
      ),
    }
  )
  .post(
    "/auth/login",
    async ({ body, set }) => {
      const user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase().trim() },
      });

      if (!user) throw new HttpError(401, "Invalid credentials");

      const validPassword = await Bun.password.verify(body.password, user.password);
      if (!validPassword) throw new HttpError(401, "Invalid credentials");

      const token = await signJwt(user.id, user.email);
      set.headers["Set-Cookie"] = buildAuthCookie(token);

      return {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    },
    {
      body: t.Object(
        {
          email: t.String({ format: "email", maxLength: 255 }),
          password: t.String({ minLength: 8, maxLength: 72 }),
        },
        { additionalProperties: false }
      ),
    }
  )
  .post("/auth/logout", ({ set }) => {
    set.headers["Set-Cookie"] = clearAuthCookie();
    set.status = 204;
    return null;
  });
