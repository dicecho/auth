import { createContext } from "@dicecho-auth/api/context";
import { appRouter } from "@dicecho-auth/api/routers/index";
import { auth } from "@dicecho-auth/auth";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@dicecho-auth/config/env";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

// Support both cookies and bearer tokens for cross-origin authentication
app.use(
  "/*",
  cors({
    origin: (() => {
      const list = (env.CORS_ORIGIN || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      if (list.length > 0) return list;
      // sensible local default to avoid silent credential drops
      return ["http://localhost:3001", "http://127.0.0.1:3001"];
    })(),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"], // Added Cookie header
    exposeHeaders: ["set-auth-token", "Set-Cookie"], // Expose cookie headers
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
