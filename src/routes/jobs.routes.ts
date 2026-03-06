import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { parseDate } from "../common/parse-date";
import { HttpError } from "../common/http-error";
import { authenticate } from "../common/auth";

const contractTypeSchema = t.Union([t.Literal("CDD"), t.Literal("CDI")]);
const jobStatusSchema = t.Union([
  t.Literal("SAVED"),
  t.Literal("SENDED"),
  t.Literal("NEGATIVE"),
  t.Literal("POSITIVE"),
]);

export const jobsRoutes = new Elysia()
  .group("", (protectedRoutes) =>
    protectedRoutes
      .derive(async ({ headers }) => ({
        user: await authenticate(headers.authorization),
      }))
      .post(
        "/jobs",
        async ({ body, user, set }) => {
          const job = await prisma.job.create({
            data: {
              title: body.title.trim(),
              company: body.company.trim(),
              department: body.department?.trim() || null,
              location: body.location.trim(),
              rate: body.rate.trim(),
              contractType: body.contractType,
              link: body.link.trim(),
              status: body.status ?? "SAVED",
              deadline: parseDate(body.deadline),
              sentAt: parseDate(body.sentAt),
              userId: user.id,
            },
          });

          set.status = 201;
          return job;
        },
        {
          body: t.Object(
            {
              title: t.String({ minLength: 1, maxLength: 255 }),
              company: t.String({ minLength: 1, maxLength: 255 }),
              department: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
              location: t.String({ minLength: 1, maxLength: 255 }),
              rate: t.String({ minLength: 1, maxLength: 100 }),
              contractType: contractTypeSchema,
              link: t.String({ minLength: 1, maxLength: 1000 }),
              status: t.Optional(jobStatusSchema),
              deadline: t.Optional(t.String()),
              sentAt: t.Optional(t.String()),
            },
            { additionalProperties: false }
          ),
        }
      )
      .get(
        "/jobs",
        async ({ query, user }) =>
          prisma.job.findMany({
            where: {
              userId: user.id,
              ...(query.status ? { status: query.status } : {}),
            },
            orderBy: { updatedAt: "desc" },
          }),
        {
          query: t.Object(
            {
              status: t.Optional(jobStatusSchema),
            },
            { additionalProperties: false }
          ),
        }
      )
      .get(
        "/jobs/:id",
        async ({ params, user }) => {
          const job = await prisma.job.findFirst({
            where: { id: params.id, userId: user.id },
          });

          if (!job) throw new HttpError(404, "Job not found");
          return job;
        },
        {
          params: t.Object({
            id: t.String({ format: "uuid" }),
          }),
        }
      )
      .patch(
        "/jobs/:id",
        async ({ params, body, user }) => {
          const existing = await prisma.job.findFirst({
            where: { id: params.id, userId: user.id },
            select: { id: true },
          });

          if (!existing) throw new HttpError(404, "Job not found");

          const updateData: Record<string, unknown> = {};
          if (body.title !== undefined) updateData.title = body.title.trim();
          if (body.company !== undefined) updateData.company = body.company.trim();
          if (body.department !== undefined) updateData.department = body.department?.trim() || null;
          if (body.location !== undefined) updateData.location = body.location.trim();
          if (body.rate !== undefined) updateData.rate = body.rate.trim();
          if (body.contractType !== undefined) updateData.contractType = body.contractType;
          if (body.link !== undefined) updateData.link = body.link.trim();
          if (body.status !== undefined) updateData.status = body.status;
          if (body.deadline !== undefined) updateData.deadline = parseDate(body.deadline);
          if (body.sentAt !== undefined) updateData.sentAt = parseDate(body.sentAt);

          if (Object.keys(updateData).length === 0) {
            throw new HttpError(400, "Nothing to update");
          }

          return prisma.job.update({
            where: { id: params.id },
            data: updateData,
          });
        },
        {
          params: t.Object({
            id: t.String({ format: "uuid" }),
          }),
          body: t.Object(
            {
              title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
              company: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
              department: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
              location: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
              rate: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
              contractType: t.Optional(contractTypeSchema),
              link: t.Optional(t.String({ minLength: 1, maxLength: 1000 })),
              status: t.Optional(jobStatusSchema),
              deadline: t.Optional(t.String()),
              sentAt: t.Optional(t.String()),
            },
            { additionalProperties: false }
          ),
        }
      )
      .patch(
        "/jobs/:id/status",
        async ({ params, body, user }) => {
          const existing = await prisma.job.findFirst({
            where: { id: params.id, userId: user.id },
            select: { id: true },
          });

          if (!existing) throw new HttpError(404, "Job not found");

          return prisma.job.update({
            where: { id: params.id },
            data: {
              status: body.status,
              sentAt: body.sentAt ? parseDate(body.sentAt) : body.status === "SENDED" ? new Date() : undefined,
            },
          });
        },
        {
          params: t.Object({
            id: t.String({ format: "uuid" }),
          }),
          body: t.Object(
            {
              status: jobStatusSchema,
              sentAt: t.Optional(t.String()),
            },
            { additionalProperties: false }
          ),
        }
      )
      .delete(
        "/jobs/:id",
        async ({ params, user, set }) => {
          const existing = await prisma.job.findFirst({
            where: { id: params.id, userId: user.id },
            select: { id: true },
          });

          if (!existing) throw new HttpError(404, "Job not found");

          await prisma.job.delete({ where: { id: params.id } });
          set.status = 204;
          return null;
        },
        {
          params: t.Object({
            id: t.String({ format: "uuid" }),
          }),
        }
      )
  );
