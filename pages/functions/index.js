export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/api/iphone/")
    if (!resp.ok) {
      return new Response("Failed to fetch VPNGate CSV", { status: 502 })
    }

    const raw = await resp.text()
    const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("*"))

    if (lines.length < 2) {
      return new Response("CSV empty or invalid", { status: 500 })
    }

    const headers = lines[0].split(",")
    const sample = lines.slice(1, 6)

    let out = `
    <html><head><meta charset="utf-8"><title>Debug VPNGate CSV</title></head><body>
    <h2>CSV Headers</h2>
    <pre>${headers.join("\n")}</pre>
    <h2>Sample Rows</h2>
    <pre>${sample.join("\n")}</pre>
    <p>Total lines: ${lines.length}</p>
    </body></html>
    `

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
