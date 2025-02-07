// ********************************************
// This code was provided by Cloudflare Workers
// ********************************************

import { getAssetFromKV, Options } from "@cloudflare/kv-asset-handler";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

export const handleStaticAssets = async (
  request: Request,
  env: Record<string, unknown>,
  context: ExecutionContext
) => {
  const options: Partial<Options> = {};

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }
    const page = await getAssetFromKV(
      {
        request,
        waitUntil: context.waitUntil,
      },
      options
    );

    // allow headers to be altered
    const response = new Response(page.body, page);

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");
    response.headers.set("Feature-Policy", "none");

    return response;
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        const notFoundResponse = await getAssetFromKV(
          {
            request,
            waitUntil: context.waitUntil,
          },
          {
            mapRequestToAsset: (req) =>
              new Request(`${new URL(req.url).origin}/404.html`, req),
          }
        );

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        console.error(e);
      }
    }

    const message = e instanceof Error ? e.message : `${e}`;
    return new Response(message, { status: 500 });
  }
};
