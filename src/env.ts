const jwtSecret = Bun.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

export const env = {
  port: Number(Bun.env.PORT ?? 3000),
  jwtSecret,
  jwtExpiresInSeconds: Number(Bun.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7),
};
