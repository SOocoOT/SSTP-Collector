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

    // هدر اولین خطه
    const headers = lines[0].split(",")
    const idxHost = headers.indexOf("HostName")
    const idxIP = headers.indexOf("IP")
    const idxCountry = headers.indexOf("CountryLong")
    const idxSpeed = headers.indexOf("Speed")
    const idxPing = headers.indexOf("Ping")
    const idxProto = headers.findIndex(h => h.toLowerCase().includes("vpn"))

    const servers = []
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",")
      if (parts.length < headers.length) continue

      const proto = idxProto !== -1 ? parts[idxProto] : ""
      if (!/MS-?SSTP/i.test(proto)) continue

      const host = idxHost !== -1 ? parts[idxHost] : (idxIP !== -1 ? parts[idxIP] : "")
      if (!host) continue

      servers.push({
        host: host.includes(":") ? host : host + ":443",
        country: idxCountry !== -1 ? parts[idxCountry] : "-",
        bandwidth: idxSpeed !== -1 ? parts[idxSpeed] + " kbps" : "-",
        ping: idxPing !== -1 ? parts[idxPing] + " ms" : "-"
      })
    }

    if (servers.length === 0) {
      return new Response("No SSTP servers found", { status: 404 })
    }

    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers</h2>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr><th>Hostname:Port</th><th>Country</th><th>Bandwidth</th><th>Ping</th></tr>
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
