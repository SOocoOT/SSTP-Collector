export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/en/")
    if (!resp.ok) {
      return new Response("Failed to fetch VPNGate", { status: 502 })
    }

    const html = await resp.text()

    // Regex برای پیدا کردن hostname های SSTP
    const regexHost = /SSTP\s*Hostname\s*:\s*([^\s<]+)/gi
    const regexCountry = /Country:\s*([A-Za-z\s]+)/gi
    const regexBandwidth = /([\d\.]+)\s*Mbps/gi
    const regexPing = /Ping:\s*([\d\.]+)\s*ms/gi

    const servers = []
    let match

    while ((match = regexHost.exec(html)) !== null) {
      servers.push({
        host: match[1],
        country: "-",   // بعداً می‌تونیم با regexCountry پر کنیم
        bandwidth: "-", // بعداً می‌تونیم با regexBandwidth پر کنیم
        ping: "-"       // بعداً می‌تونیم با regexPing پر کنیم
      })
    }

    // حذف تکراری‌ها
    const uniq = []
    const seen = new Set()
    for (const s of servers) {
      if (!seen.has(s.host)) {
        uniq.push(s)
        seen.add(s.host)
      }
    }

    // خروجی HTML
    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers</h2>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr><th>Hostname:Port</th><th>Country</th><th>Bandwidth</th><th>Ping</th></tr>
    `
    for (const s of uniq) {
      out += `<tr><td>${s.host}</td><td>${s.country}</td><td>${s.bandwidth}</td><td>${s.ping}</td></tr>`
    }
    out += `</table></body></html>`

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
