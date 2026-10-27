import type { DocsPageContent } from "../types";

export const billing: DocsPageContent = {
  navTitle: "Credits & Billing",
  title: "Credits and Billing",
  description:
    "ZroImg bills in credits: per image, per video second or request, and per AI polish. Learn how costs are estimated and charged, refunds, check-ins and packages.",
  body: `
## What are credits {#points}
Credits are ZroImg's unified billing unit. Web generation, the infinite canvas, AI prompt polish and the open API all share the same credit balance, which you can view on the [Dashboard](/dashboard) or in the account menu at the top.
ZroImg requires no subscription: you pay only for the credits you use and top up when you run low.
## Pricing units {#pricing-units}
The unit price of each model is configured by the platform and may change as models are adjusted. The estimated cost shown in the generation interface and on the [Pricing page](/pricing) is authoritative; this page only explains the calculation rules.
| Type | Billing unit | Calculation |
| --- | --- | --- |
| Image generation | Per image (image) | Credits per image × number of images; models that use reference images may charge extra for each reference image |
| Video generation (per second) | Per second (second) | Credits per second × video duration; unit prices may differ by resolution |
| Video generation (per request) | Per request (request) | A fixed number of credits per video, regardless of duration |
| AI prompt polish | Per request (request) | A fixed number of credits per polish, shown on the button |
> [!NOTE]
> The same model may have different unit prices for different quality levels and resolutions. Before you submit, the interface shows "Estimated cost: N credits", which is calculated by the server.
## When you are charged {#when-charged}
1. Before you submit a task, the interface shows the estimated cost based on the selected model and parameters.
2. When you click generate, the server calculates the final credits at the current price; the task is created and charged immediately only if your balance is sufficient. If your balance is insufficient, no task is created and nothing is charged.
3. The price is locked once the task is created; later model price changes do not affect it.
4. Task succeeds: the charge is final and does not change.
## Automatic refunds on failure {#refunds}
If a generation fails (for example, due to an upstream model error or a generation timeout), the credits charged for that task are **automatically refunded in full** to your balance; no manual request is needed. Failed AI polish requests are refunded automatically as well.
Each refund happens only once, and you can see failed tasks and their failure reasons in your [Creation history](/history). If you believe a charge is incorrect, contact us via [Feedback](/tickets) and include the task ID.
> [!TIP]
> Tasks submitted through the open API follow the same rules: failed tasks are refunded automatically. Combined with the \`Idempotency-Key\` request header, network retries won't result in duplicate charges either. See the [API overview](/docs/api/overview#idempotency).
## Getting credits {#get-points}
### Sign-up bonus {#signup-bonus}
New users may receive sign-up bonus credits to get familiar with the generation workflow. Whether a bonus is offered, and how much, is shown on the sign-up page.
### Daily check-in {#check-in}
You can check in once a day on the [Dashboard](/dashboard) to claim credits; the page shows how many credits you can claim each day and your check-ins for the week. The check-in feature and reward amounts are configured by the platform and may change.
### Buy credit packages {#packages}
Choose a package on [Buy credits](/credits) and pay with Alipay / WeChat Pay. Credits are added automatically once payment succeeds, and your order history is available in [My orders](/billing). See the [Pricing page](/pricing) for current packages and prices.
## FAQ {#faq}
### Can the estimated cost differ from the actual charge? {#faq-estimate}
The estimated cost uses the same calculation rules as submission. The final charge differs only if a price change happens to occur after you view the estimate and before you submit; once a task is created, the price at creation time applies.
### If I close the page mid-generation, am I still charged? {#faq-close}
Tasks run on the server, so closing the page doesn't affect generation and doesn't trigger a refund. You can view the result in your creation history when it's done; if the task ultimately fails, credits are refunded automatically.
### Are API and web credits separate? {#faq-api}
No. API keys belong to your account and consume the same credit balance. You can check it with the [balance endpoint](/docs/api/balance).
`,
};
