import { StreamWriter } from "@builder.io/qwik";
import { renderToStream } from "@builder.io/qwik/server";
import { getBase } from "./base";

/**
 * Render (SSR) a Qwik application in a Worker and stream it into a Response.
 *
 * @param request the request to the Worker.
 * @param env the Worker environment (contains service-bindings).
 * @param context the Worker context (contains waitUntil).
 * @param RootNode the root of the Qwik container to render.
 * @param manifest the Qwik manifest generated by the Qwik optimizing compiler.
 * @param containerTagName the tag that contains the rendered output. If not provided then `html`.
 * @returns a response object to return to the client
 */
export async function renderResponse(
	request: Request,
	env: Record<string, unknown>,
	context: ExecutionContext,
	RootNode: any,
	manifest: unknown,
	containerTagName?: string
) {
	const { writable, readable } = new TransformStream();
	const response = new HtmlResponse(readable);
	const stream = new SimpleStreamWriter(writable);
	const fragmentBase = getBase(request);
	renderToStream(RootNode, {
		streaming: {
			inOrder: {
				strategy: "auto",
			},
		},
		prefetchStrategy: {
			implementation: { linkInsert: "html-append" },
		},
		manifest,
		containerTagName,
		...(!containerTagName ? { containerAttributes: { lang: "en" } } : {}),
		stream,
		envData: { request, env, context, fragmentBase },
		qwikLoader: { include: "auto" },
		base: fragmentBase + "build/",
	}).finally(() => {
		stream.close();
	});
	return response;
}

class HtmlResponse extends Response {
	constructor(bodyInit: BodyInit) {
		super(bodyInit, {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	}
}

class SimpleStreamWriter implements StreamWriter {
	private writer = this.writable.getWriter();
	private encoder = new TextEncoder();
	constructor(private writable: WritableStream) {}

	write(chunk: string) {
		this.writer.write(
			typeof chunk === "string" ? this.encoder.encode(chunk) : chunk
		);
	}

	close() {
		this.writer.close();
	}
}
