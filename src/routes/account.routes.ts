import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { HttpError } from "../common/http-error";
import { authenticate } from "../common/auth";

export const accountRoutes = new Elysia()
  .group("", (protectedRoutes) =>
    protectedRoutes
      .derive(async ({ headers }) => ({
        user: await authenticate(headers.authorization),
      }))
      .get("/account", ({ user }) => ({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))
      .patch(
        "/account",
        async ({ body, user }) => {
          if (!body.email && !body.newPassword) {
            throw new HttpError(400, "Nothing to update");
          }

          const data: { email?: string; password?: string } = {};

          if (body.email) {
            const normalizedEmail = body.email.toLowerCase().trim();
            if (normalizedEmail !== user.email) {
              const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
              if (existing) throw new HttpError(409, "Email already in use");
              data.email = normalizedEmail;
            }
          }

          if (body.newPassword) {
            if (!body.currentPassword) {
              throw new HttpError(400, "currentPassword is required to change password");
            }

            const validPassword = await Bun.password.verify(body.currentPassword, user.password);
            if (!validPassword) throw new HttpError(401, "Invalid current password");

            data.password = await Bun.password.hash(body.newPassword);
          }

          if (!data.email && !data.password) {
            return {
              id: user.id,
              email: user.email,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            };
          }

          return prisma.user.update({
            where: { id: user.id },
            data,
            select: { id: true, email: true, createdAt: true, updatedAt: true },
          });
        },
        {
          body: t.Object(
            {
              email: t.Optional(t.String({ format: "email", maxLength: 255 })),
              currentPassword: t.Optional(t.String({ minLength: 8, maxLength: 72 })),
              newPassword: t.Optional(t.String({ minLength: 8, maxLength: 72 })),
            },
            { additionalProperties: false }
          ),
        }
      )
      .delete(
        "/account",
        async ({ body, user, set }) => {
          const validPassword = await Bun.password.verify(body.password, user.password);
          if (!validPassword) throw new HttpError(401, "Invalid password");

          await prisma.user.delete({ where: { id: user.id } });
          set.status = 204;
          return null;
        },
        {
          body: t.Object(
            {
              password: t.String({ minLength: 8, maxLength: 72 }),
            },
            { additionalProperties: false }
          ),
        }
      )
  );
