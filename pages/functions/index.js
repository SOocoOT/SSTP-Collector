import cheerio from "cheerio"

export async function onRequest(context) {
  try {
    const resp = await fetch("https://www.vpngate.net/en/")
    if (!resp.ok) {
      return new Response("Failed to fetch VPNGate", { status: 502 })
    }

    const html = await resp.text()
    const $ = cheerio.load(html)

    const servers = []
    $("table").each((i, table) => {
      $(table).find("tr").each((j, tr) => {
        const tds = $(tr).find("td")
        if (!tds.length) return

        let country = ""
        let sessions = ""
        let bandwidth = ""
        let ping = ""
        let host = ""

        tds.each((k, td) => {
          const txt = $(td).text().replace(/\s+/g, " ").trim()

          // کشور
          if (!country) {
            const cands = [
              "Japan","Germany","Iran","United States","South Korea","France","Canada","China","India",
              "Russia","UK","Turkey","Brazil","Italy","Spain","Netherlands","Sweden","Norway",
              "Australia","Singapore","Thailand","Vietnam","Indonesia","Hong Kong","Taiwan","Mexico"
            ]
            const found = cands.find(c => txt.toLowerCase().includes(c.toLowerCase()))
            if (found) country = found
          }

          // Sessions
          if (!sessions && /sessions/i.test(txt)) {
            const m = txt.match(/(\d[\d,\.]*)\s+sessions/i)
            if (m) sessions = m[0]
          }

          // Bandwidth
          if (!bandwidth && /mbps/i.test(txt)) {
            const m = txt.match(/([\d\.]+)\s*mbps/i)
            if (m) bandwidth = `${m[1]} Mbps`
          }

          // Ping
          if (!ping && /ping:/i.test(txt)) {
            const m = txt.match(/ping:\s*([\d\.]+)\s*ms/i)
            if (m) ping = `${m[1]} ms`
          }

          // Hostname:Port
          if (!host && /MS-SSTP/i.test(txt)) {
            const m = txt.match(/SSTP\s*Hostname\s*:\s*([^\s<]+)/i)
            if (m) host = m[1]
          }
        })

        if (host && host.includes(":")) {
          servers.push({ country: country || "Unknown", host, sessions, bandwidth, ping })
        }
      })
    })

    // حذف تکراری‌ها
    const seen = new Set()
    const uniq = servers.filter(s => {
      if (seen.has(s.host)) return false
      seen.add(s.host)
      return true
    })

    // گروه‌بندی بر اساس کشور
    const grouped = {}
    for (const s of uniq) {
      grouped[s.country] = grouped[s.country] || []
      grouped[s.country].push(s)
    }

    // خروجی HTML
    let out = `
    <html><head><meta charset="utf-8"><title>VPNGate SSTP Servers</title></head><body>
    <h2>VPNGate SSTP Servers (Grouped by Country)</h2>
    `
    for (const [country, list] of Object.entries(grouped)) {
      out += `<h3>${country}</h3><table border="1" cellspacing="0" cellpadding="5">
        <tr><th>Hostname:Port</th><th>Sessions</th><th>Bandwidth</th><th>Ping</th></tr>`
      for (const s of list) {
        out += `<tr><td>${s.host}</td><td>${s.sessions || "-"}</td><td>${s.bandwidth || "-"}</td><td>${s.ping || "-"}</td></tr>`
      }
      out += `</table><br>`
    }
    out += `</body></html>`

    return new Response(out, { headers: { "content-type": "text/html; charset=utf-8" } })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
}
