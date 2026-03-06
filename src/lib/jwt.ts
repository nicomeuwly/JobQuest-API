import { env } from "../env";

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

const encoder = new TextEncoder();

const toBase64Url = (input: ArrayBuffer | string) => {
  const bytes =
    typeof input === "string"
      ? encoder.encode(input)
      : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (input: string) => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  return atob(base64 + "=".repeat(padLength));
};

const importSigningKey = async () =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(env.jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

export const signJwt = async (subject: string, email: string) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: subject,
    email,
    iat: now,
    exp: now + env.jwtExpiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await importSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));

  return `${message}.${toBase64Url(signature)}`;
};

export const verifyJwt = async (token: string): Promise<JwtPayload | null> => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await importSigningKey();

  const signatureRaw = fromBase64Url(encodedSignature);
  const signatureBytes = new Uint8Array(signatureRaw.length);
  for (let i = 0; i < signatureRaw.length; i += 1) {
    signatureBytes[i] = signatureRaw.charCodeAt(i);
  }

  const validSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(message)
  );

  if (!validSignature) return null;

  const payloadJson = fromBase64Url(encodedPayload);
  const payload = JSON.parse(payloadJson) as JwtPayload;

  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
};
