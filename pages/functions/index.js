export async function onRequest(context) {
  return new Response("Shadollah !! Hello from Cloudflare Pages Function!", {
    headers: { "content-type": "text/plain; charset=utf-8" }
  })
}
