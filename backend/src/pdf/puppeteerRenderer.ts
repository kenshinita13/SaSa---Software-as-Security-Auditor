import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface ReportData {
  agencyName: string;
  brandHexColor: string;
  logoUrl?: string;
  targetUrl: string;
  score: number;
  date: string;
  findings: Array<{
    category: string;
    title: string;
    description: string;
    evidence: string;
  }>;
}

/**
 * Compiles the HTML template and renders a PDF using Puppeteer.
 * @returns Buffer containing the PDF data
 */
export async function generatePdfReport(data: ReportData): Promise<Buffer> {
  // 1. Load HTML template
  const templatePath = path.resolve(__dirname, '../../../../pdf-template/report-template.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  // 2. Determine score color
  let scoreColor = '#ef4444'; // Red < 50
  if (data.score >= 80) scoreColor = '#22c55e'; // Green
  else if (data.score >= 50) scoreColor = '#eab308'; // Yellow

  // 3. Build Logo HTML
  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="Agency Logo" class="h-12 object-contain" />`
    : `<div class="h-12 flex items-center text-2xl font-black" style="color: ${data.brandHexColor}">${data.agencyName}</div>`;

  // 4. Build Findings HTML
  let findingsHtml = '';
  if (data.findings.length === 0) {
    findingsHtml = `
      <div class="p-6 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
        <h3 class="font-bold text-lg mb-2">✅ No Vulnerabilities Detected</h3>
        <p>The application passed all OWASP Top 10 automated checks.</p>
      </div>`;
  } else {
    for (const f of data.findings) {
      findingsHtml += `
        <div class="p-4 border rounded-lg shadow-sm bg-white break-inside-avoid">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg text-gray-900">${f.title}</h3>
            <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">${f.category}</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">${f.description}</p>
          <div class="bg-gray-50 border p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto">
            ${f.evidence.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </div>
      `;
    }
  }

  // 5. Inject variables
  html = html
    .replace(/{{BRAND_HEX}}/g, data.brandHexColor)
    .replace(/{{LOGO_HTML}}/g, logoHtml)
    .replace(/{{AGENCY_NAME}}/g, data.agencyName)
    .replace(/{{TARGET_URL}}/g, data.targetUrl)
    .replace(/{{SCORE}}/g, data.score.toString())
    .replace(/{{SCORE_COLOR}}/g, scoreColor)
    .replace(/{{DATE}}/g, data.date)
    .replace(/{{FINDINGS_HTML}}/g, findingsHtml);

  // 6. Render PDF
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Wait until networkidle0 to ensure Tailwind CDN loads
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}
