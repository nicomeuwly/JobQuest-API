import { env } from "../env";

export const buildAuthCookie = (token: string) => {
  const maxAge = env.jwtExpiresInSeconds;
  const secure = env.cookieSecure ? " Secure;" : "";

  return `${env.cookieName}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;${secure}`;
};

export const clearAuthCookie = () => {
  const secure = env.cookieSecure ? " Secure;" : "";

  return `${env.cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;${secure}`;
};
