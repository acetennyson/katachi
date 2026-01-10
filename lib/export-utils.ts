/**
 * Utility functions for exporting analytics data
 */

export function exportToCSV(data: any[], filename: string) {
  // Convert data to CSV format
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF(elementId: string, filename: string) {
  // Simple window.print() approach - works in all browsers
  if (typeof window === "undefined") return

  const element = document.getElementById(elementId)
  if (!element) {
    alert("Content not found. Please try again.")
    return
  }

  // Create a new window for printing
  const printWindow = window.open("", "", "width=800,height=600")
  if (!printWindow) {
    alert("Please allow popups to export PDF")
    return
  }

  // Copy styles and content
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join("\n")
      } catch (e) {
        return ""
      }
    })
    .join("\n")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        ${styles}
        @media print {
          body { margin: 0; padding: 20px; }
          button, .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <h1 style="text-align: center; margin-bottom: 20px;">Analytics Report</h1>
      <p style="text-align: center; color: #666; margin-bottom: 40px;">
        Generated on ${new Date().toLocaleDateString()}
      </p>
      ${element.innerHTML}
    </body>
    </html>
  `)

  printWindow.document.close()
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
    // Close after print dialog
    setTimeout(() => printWindow.close(), 100)
  }, 250)
}

export function formatDataForExport(data: any, type: "overview" | "pageviews" | "behavior" | "conversions") {
  switch (type) {
    case "overview":
      return [
        { Metric: "Total Visitors", Value: data.totals.uniqueVisitors },
        { Metric: "Total Sessions", Value: data.totals.totalSessions },
        { Metric: "Page Views", Value: data.totals.pageViews },
        { Metric: "Conversion Rate", Value: `${data.totals.conversionRate}%` },
        { Metric: "Revenue", Value: `$${data.totals.revenue.toFixed(2)}` },
        { Metric: "Avg Session Duration", Value: `${data.totals.avgSessionDuration}s` },
        { Metric: "Bounce Rate", Value: `${data.totals.avgBounceRate}%` },
      ]

    case "pageviews":
      return data.topPages.map((page: any) => ({
        Page: page.page,
        Views: page.views,
        "Unique Visitors": page.uniqueVisitors,
        "Avg Duration (s)": page.avgDuration,
      }))

    case "behavior":
      return Object.entries(data.eventTypes).map(([type, count]) => ({
        "Event Type": type,
        Count: count,
      }))

    case "conversions":
      return data.funnel.map((stage: any) => ({
        Stage: stage.stage,
        Users: stage.count,
        "Percentage": `${stage.percentage.toFixed(2)}%`,
      }))

    default:
      return []
  }
}

export function generateEmailReport(data: any, period: string): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .metric-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 10px 0; }
        .metric-label { color: #718096; font-size: 14px; }
        .metric-value { color: #1a202c; font-size: 32px; font-weight: bold; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #edf2f7; font-weight: 600; }
        .footer { text-align: center; color: #718096; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Analytics Report</h1>
          <p>Period: ${period}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <h2>Key Metrics</h2>
        <div class="metric-card">
          <div class="metric-label">Total Visitors</div>
          <div class="metric-value">${data.totals?.uniqueVisitors?.toLocaleString() || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Conversion Rate</div>
          <div class="metric-value">${data.totals?.conversionRate?.toFixed(2) || 0}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Revenue</div>
          <div class="metric-value">$${data.totals?.revenue?.toFixed(2) || 0}</div>
        </div>

        <h2>Top Pages</h2>
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Views</th>
              <th>Unique Visitors</th>
            </tr>
          </thead>
          <tbody>
            ${data.timeline?.slice(0, 10).map((item: any) => `
              <tr>
                <td>${item.page || "/"}</td>
                <td>${item.page_views || 0}</td>
                <td>${item.unique_visitors || 0}</td>
              </tr>
            `).join("") || ""}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automated report from your Analytics Dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `
  return html
}
