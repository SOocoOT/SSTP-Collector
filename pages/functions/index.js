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
      if (parts.length > 14 && /MS-?SSTP/i.test(parts[14])) {
        servers.push({
          host: parts[1] + ":" + parts[2],
          country: parts[6],
          bandwidth: parseInt(parts[11], 10) || 0,
          ping: parseInt(parts[12], 10) || 0
        })
      }
    }

    // سورت: اول کشور، بعد سرعت نزولی
    servers.sort((a, b) => {
      if (a.country < b.country) return -1
      if (a.country > b.country) return 1
      return b.bandwidth - a.bandwidth
    })

    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers (CSV)</h2>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr><th>Hostname:Port</th><th>Country</th><th>Bandwidth (kbps)</th><th>Ping (ms)</th></tr>
    `
    for (const s of servers) {
      out += `<tr><td>${s.host}</td><td>${s.country}</td><td>${s.bandwidth}</td><td>${s.ping}</td></tr>`
    }
    out += `</table><p>Total: ${servers.length} servers</p></body></html>`

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
