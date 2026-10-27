import type { DocsPageContent } from "../types";

export const apiBalance: DocsPageContent = {
  navTitle: "Credit Balance",
  title: "Credit Balance API",
  description:
    "GET /open/v1/balance returns the credit balance of the account that owns the API key. The API and web app share one balance; use it for pre-checks or alerts.",
  body: `
## Get balance {#get-balance}
~~~http
GET /open/v1/balance
~~~
Returns the currently available credits of the account that owns the API key. The API and the web app share the same credit balance.
::: example balance
## Response {#response}
~~~json
{
  "points": 1280
}
~~~
| Field | Type | Description |
| --- | --- | --- |
| \`points\` | integer | Currently available credits |
## Usage tips {#tips}
- Check your balance before batch submissions to avoid running into \`402 insufficient_points\` midway.
- Check your balance on a schedule and remind yourself to [buy credits](/credits) when it drops below a threshold.
- The balance endpoint is also the simplest way to verify that an API key is valid: an invalid key returns \`401 invalid_api_key\`.
`,
};
