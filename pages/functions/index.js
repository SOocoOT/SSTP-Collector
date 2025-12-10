export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/en/")
    if (!resp.ok) {
      return new Response("Failed to fetch VPNGate HTML", { status: 502 })
    }

    const html = await resp.text()

    // Regex برای پیدا کردن بلوک‌های SSTP
    // هر بلوک شامل Hostname، Country، Bandwidth و Ping است
    const regexBlock = /SSTP[\s\S]*?Hostname\s*:\s*([^\s<]+)[\s\S]*?Country:\s*([A-Za-z\s]+)[\s\S]*?([\d\.]+)\s*Mbps[\s\S]*?Ping:\s*([\d\.]+)\s*ms/gi

    const servers = []
    let match
    while ((match = regexBlock.exec(html)) !== null) {
      servers.push({
        host: match[1],
        country: match[2].trim(),
        bandwidth: match[3] + " Mbps",
        ping: match[4] + " ms"
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

    if (uniq.length === 0) {
      return new Response("No SSTP servers found in HTML", { status: 404 })
    }

    // خروجی HTML
    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers (HTML)</h2>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr><th>Hostname:Port</th><th>Country</th><th>Bandwidth</th><th>Ping</th></tr>
    `
    for (const s of uniq) {
      out += `<tr><td>${s.host}</td><td>${s.country}</td><td>${s.bandwidth}</td><td>${s.ping}</td></tr>`
    }
    out += `</table><p>Total: ${uniq.length} servers</p></body></html>`

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
