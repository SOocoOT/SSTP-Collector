export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/en/")
    const html = await resp.text()

    const regexBlock = /SSTP[\s\S]*?Hostname\s*:\s*([^\s<]+)/gi
    const servers = []
    let match
    while ((match = regexBlock.exec(html)) !== null) {
      servers.push({ host: match[1] })
    }

    if (servers.length === 0) {
      return new Response(`
        <html><head><meta charset="utf-8"><title>No SSTP Servers</title></head><body>
        <h2>VPNGate SSTP Servers</h2>
        <p>در حال حاضر هیچ سرور SSTP فعال وجود ندارد. لطفاً بعداً دوباره امتحان کنید.</p>
        </body></html>
      `, { headers: { "content-type": "text/html; charset=utf-8" } })
    }

    // نمایش جدول اگر سرور پیدا شد
    let out = "<html><body><h2>SSTP Servers</h2><ul>"
    for (const s of servers) {
      out += `<li>${s.host}</li>`
    }
    out += "</ul></body></html>"

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
