import { manifest } from "@qwik-client-manifest";
import { Footer } from "./root";
import { renderResponse } from "helpers";

export default {
	fetch(
		request: Request,
		env: Record<string, unknown>,
		context: ExecutionContext
	): Promise<Response> {
		return renderResponse(
			request,
			env,
			context,
			<Footer />,
			manifest,
			"footer"
		);
	},
};
