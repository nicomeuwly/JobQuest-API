import { prisma } from "../lib/prisma";
import { verifyJwt } from "../lib/jwt";
import { HttpError } from "./http-error";

const extractBearerToken = (authorization?: string) => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const authenticate = async (authorization?: string) => {
  const token = extractBearerToken(authorization);
  if (!token) throw new HttpError(401, "Missing or invalid bearer token");

  const payload = await verifyJwt(token);
  if (!payload) throw new HttpError(401, "Invalid or expired token");

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, password: true, createdAt: true, updatedAt: true },
  });

  if (!user) throw new HttpError(401, "User no longer exists");

  return user;
};
