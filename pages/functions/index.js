export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/api/iphone/")
    if (!resp.ok) {
      return new Response("Failed to fetch VPNGate CSV", { status: 502 })
    }

    const text = await resp.text()
    const lines = text.split("\n").filter(l => l && !l.startsWith("*"))

    const servers = []
    for (const line of lines) {
      const parts = line.split(",")
      if (parts.length > 14 && parts[14].includes("MS-SSTP")) {
        servers.push({
          host: parts[1] + ":" + parts[2],   // IP:Port
          country: parts[6],
          bandwidth: parts[11] + " kbps",
          ping: parts[12] + " ms"
        })
      }
    }

    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers (CSV)</h2>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr><th>Hostname:Port</th><th>Country</th><th>Bandwidth</th><th>Ping</th></tr>
    `
    for (const s of servers) {
      out += `<tr><td>${s.host}</td><td>${s.country}</td><td>${s.bandwidth}</td><td>${s.ping}</td></tr>`
    }
    out += `</table></body></html>`

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
