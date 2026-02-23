import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

// ── Raw PDF Generator (zero dependencies) ──
function encodeText(str: string): string {
  // Encode to PDFDocEncoding (WinAnsi) - escape special PDF chars
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // French accented chars → WinAnsi octal codes
    .replace(/é/g, '\\351')
    .replace(/è/g, '\\350')
    .replace(/ê/g, '\\352')
    .replace(/ë/g, '\\353')
    .replace(/à/g, '\\340')
    .replace(/â/g, '\\342')
    .replace(/ä/g, '\\344')
    .replace(/ù/g, '\\371')
    .replace(/û/g, '\\373')
    .replace(/ü/g, '\\374')
    .replace(/ô/g, '\\364')
    .replace(/î/g, '\\356')
    .replace(/ï/g, '\\357')
    .replace(/ç/g, '\\347')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/Â/g, '\\302')
    .replace(/É/g, '\\311')
    .replace(/—/g, '-')
    .replace(/'/g, "'")
    .replace(/«/g, '"')
    .replace(/»/g, '"');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).length > maxChars && current.length > 0) {
      lines.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const DIM_LABELS: Record<string, string> = {
  SOC: 'Sociabilité',
  ENG: 'Énergie',
  ATT: 'Attachement',
  SEN: 'Sensibilité',
  INT: 'Intelligence',
};

function generatePdfBuffer(data: {
  prenom: string;
  animalName: string;
  animalType: string;
  profileType: string;
  profileTitle: string;
  profileTagline: string;
  dimensions: Record<string, number>;
  strengths: string[];
  watchPoints: string[];
  tips: string[];
  desc: string;
}): Buffer {
  const name = data.animalName || 'Votre animal';
  const objects: string[] = [];
  const offsets: number[] = [];
  let objNum = 0;

  function addObj(content: string): number {
    objNum++;
    objects.push(`${objNum} 0 obj\n${content}\nendobj\n`);
    return objNum;
  }

  // Build page content streams
  function buildStream(lines: string[]): string {
    return lines.join('\n');
  }

  // ── Page 1: Cover ──
  const cover: string[] = [];
  // Dark background
  cover.push('0.067 0.067 0.067 rg'); // #111
  cover.push('0 0 595 842 re f');
  // Title
  cover.push('BT');
  cover.push('/F2 14 Tf');
  cover.push('0.53 0.53 0.53 rg');
  cover.push(`220 520 Td`);
  cover.push(`(${encodeText('Ame Animale')}) Tj`);
  cover.push('ET');
  // Profile title
  cover.push('BT');
  cover.push('/F2 28 Tf');
  cover.push('1 1 1 rg');
  const titleLines = wrapText(data.profileTitle || 'Profil', 30);
  let titleY = 480;
  for (const line of titleLines) {
    const xOff = Math.max(50, 297 - line.length * 7);
    cover.push(`${xOff} ${titleY} Td`);
    cover.push(`(${encodeText(line)}) Tj`);
    titleY -= 35;
    cover.push(`0 0 Td`);
  }
  cover.push('ET');
  // Tagline
  cover.push('BT');
  cover.push('/F1 12 Tf');
  cover.push('0.6 0.6 0.6 rg');
  cover.push(`100 ${titleY - 20} Td`);
  cover.push(`(${encodeText(data.profileTagline || '')}) Tj`);
  cover.push('ET');
  // Name
  cover.push('BT');
  cover.push('/F2 16 Tf');
  cover.push('1 1 1 rg');
  cover.push(`200 ${titleY - 70} Td`);
  cover.push(`(${encodeText(name)}) Tj`);
  cover.push('ET');
  // Footer
  cover.push('BT');
  cover.push('/F1 9 Tf');
  cover.push('0.4 0.4 0.4 rg');
  cover.push('210 50 Td');
  cover.push('(ameanimale.fr) Tj');
  cover.push('ET');

  // ── Page 2+: Content ──
  const content: string[] = [];
  let y = 780;
  const leftM = 50;
  const lineH = 14;
  const maxW = 80; // chars per line

  function addTitle(text: string) {
    if (y < 100) { y = 780; } // would need new page but keeping simple
    content.push('BT');
    content.push('/F2 16 Tf');
    content.push('0.067 0.067 0.067 rg');
    content.push(`${leftM} ${y} Td`);
    content.push(`(${encodeText(text)}) Tj`);
    content.push('ET');
    y -= 25;
  }

  function addText(text: string) {
    const lines = wrapText(text, maxW);
    for (const line of lines) {
      if (y < 50) { y = 780; }
      content.push('BT');
      content.push('/F1 10 Tf');
      content.push('0.27 0.27 0.27 rg');
      content.push(`${leftM} ${y} Td`);
      content.push(`(${encodeText(line)}) Tj`);
      content.push('ET');
      y -= lineH;
    }
  }

  function addBullet(prefix: string, text: string) {
    const lines = wrapText(prefix + ' ' + text, maxW - 4);
    for (let i = 0; i < lines.length; i++) {
      if (y < 50) { y = 780; }
      content.push('BT');
      content.push('/F1 10 Tf');
      content.push('0.27 0.27 0.27 rg');
      content.push(`${leftM + 10} ${y} Td`);
      content.push(`(${encodeText(lines[i])}) Tj`);
      content.push('ET');
      y -= lineH;
    }
  }

  // Analyse
  addTitle('Analyse');
  y -= 5;
  addText(data.desc || '');
  y -= 15;

  // Dimensions
  addTitle('Dimensions comportementales');
  y -= 5;
  const dims = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'];
  for (const k of dims) {
    const pct = data.dimensions?.[k] || 50;
    const label = DIM_LABELS[k] || k;
    // Label
    content.push('BT');
    content.push('/F1 10 Tf');
    content.push('0.33 0.33 0.33 rg');
    content.push(`${leftM} ${y} Td`);
    content.push(`(${encodeText(label)}) Tj`);
    content.push('ET');
    // Bar background
    content.push('0.93 0.93 0.93 rg');
    content.push(`${leftM + 110} ${y - 2} 280 10 re f`);
    // Bar fill
    const colors: Record<string, string> = {
      SOC: '0.231 0.510 0.965 rg',
      ENG: '0.961 0.620 0.043 rg',
      ATT: '0.937 0.267 0.267 rg',
      SEN: '0.545 0.361 0.965 rg',
      INT: '0.063 0.725 0.506 rg',
    };
    content.push(colors[k] || '0.5 0.5 0.5 rg');
    content.push(`${leftM + 110} ${y - 2} ${Math.max(5, (pct / 100) * 280)} 10 re f`);
    // Percentage text
    content.push('BT');
    content.push('/F2 10 Tf');
    content.push('0.2 0.2 0.2 rg');
    content.push(`${leftM + 400} ${y} Td`);
    content.push(`(${pct}%) Tj`);
    content.push('ET');
    y -= 22;
  }
  y -= 15;

  // Points forts
  if (data.strengths?.length) {
    addTitle('Points forts');
    y -= 5;
    for (const s of data.strengths) { addBullet('+', s); }
    y -= 15;
  }

  // Points de vigilance
  if (data.watchPoints?.length) {
    addTitle('Points de vigilance');
    y -= 5;
    for (const w of data.watchPoints) { addBullet('!', w); }
    y -= 15;
  }

  // Conseils
  if (data.tips?.length) {
    addTitle('Conseils personnalises');
    y -= 5;
    for (const t of data.tips) { addBullet('>', t); }
    y -= 15;
  }

  // Footer
  content.push('BT');
  content.push('/F1 8 Tf');
  content.push('0.7 0.7 0.7 rg');
  content.push('200 30 Td');
  content.push('(Ame Animale - ameanimale.fr) Tj');
  content.push('ET');

  // Build PDF structure
  const coverStream = buildStream(cover);
  const contentStream = buildStream(content);

  // Object 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  // Object 2: Pages
  addObj('<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>');
  // Object 3: Page 1 (cover)
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>`);
  // Object 4: Page 2 (content)
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>`);
  // Object 5: Cover stream
  addObj(`<< /Length ${coverStream.length} >>\nstream\n${coverStream}\nendstream`);
  // Object 6: Content stream
  addObj(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
  // Object 7: Font Helvetica
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  // Object 8: Font Helvetica-Bold
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // Assemble PDF
  let pdf = '%PDF-1.4\n';
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }
  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objNum + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 0; i < objNum; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objNum + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  return Buffer.from(pdf, 'binary');
}

// ── Email HTML ──
function buildEmailHTML(data: {
  prenom: string;
  animalName: string;
  animalType: string;
  profileType: string;
  profileTitle: string;
  profileEmoji: string;
  profileTagline: string;
  dimensions: Record<string, number>;
  strengths: string[];
  watchPoints: string[];
  tips: string[];
  desc: string;
}): string {
  const name = data.animalName || (data.animalType === 'chien' ? 'Votre chien' : 'Votre chat');
  const greeting = data.prenom ? `Bonjour ${data.prenom},` : 'Bonjour,';

  const dimRows = ['SOC', 'ENG', 'ATT', 'SEN', 'INT']
    .map((k) => {
      const pct = data.dimensions?.[k] || 50;
      const colors: Record<string, string> = { SOC: '#3b82f6', ENG: '#f59e0b', ATT: '#ef4444', SEN: '#8b5cf6', INT: '#10b981' };
      const labels: Record<string, string> = { SOC: 'Sociabilit\u00e9', ENG: '\u00c9nergie', ATT: 'Attachement', SEN: 'Sensibilit\u00e9', INT: 'Intelligence' };
      return `<tr>
        <td style="padding:6px 12px 6px 0;font-size:13px;font-weight:600;color:#555;width:110px;">${labels[k]}</td>
        <td style="padding:6px 0;"><div style="background:#f0f0f0;border-radius:10px;height:18px;width:100%;overflow:hidden;"><div style="background:${colors[k]};height:18px;border-radius:10px;width:${pct}%;"></div></div></td>
        <td style="padding:6px 0 6px 10px;font-size:13px;font-weight:700;color:#333;width:40px;text-align:right;">${pct}%</td>
      </tr>`;
    }).join('');

  const list = (items: string[], prefix: string) =>
    items.map((i) => `<li style="padding:4px 0;color:#333;">${prefix} ${i}</li>`).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#111;padding:32px 24px;text-align:center;">
    <div style="font-size:20px;font-weight:900;color:#fff;">Ame Animale</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Rapport de personnalite</div>
  </div>
  <div style="padding:24px 24px 16px;font-size:14px;color:#444;line-height:1.7;">
    ${greeting}<br>Voici le rapport complet de <strong>${name}</strong>. Le PDF est en piece jointe.
  </div>
  <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
    <div style="font-size:48px;margin-bottom:8px;">${data.profileEmoji}</div>
    <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:6px;">${name} est</div>
    <div style="font-size:28px;font-weight:900;color:#111;margin-bottom:6px;">${data.profileTitle}</div>
    <div style="font-size:14px;color:#666;font-style:italic;">${data.profileTagline}</div>
  </div>
  <div style="padding:24px;border-bottom:1px solid #eee;">
    <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Analyse</div>
    <div style="font-size:14px;color:#444;line-height:1.7;">${data.desc}</div>
  </div>
  <div style="padding:24px;border-bottom:1px solid #eee;">
    <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:16px;">Dimensions</div>
    <table style="width:100%;border-collapse:collapse;">${dimRows}</table>
  </div>
  ${data.strengths?.length ? `<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points forts</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(data.strengths, '&#10003;')}</ul></div>` : ''}
  ${data.watchPoints?.length ? `<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points de vigilance</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(data.watchPoints, '&#9888;')}</ul></div>` : ''}
  ${data.tips?.length ? `<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Conseils</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(data.tips, '&#10148;')}</ul></div>` : ''}
  <div style="background:#f8f7f3;padding:24px;text-align:center;">
    <div style="font-size:13px;color:#888;">Ame Animale - <a href="https://ameanimale.fr" style="color:#888;">ameanimale.fr</a></div>
    <div style="font-size:10px;color:#bbb;margin-top:12px;">Vous recevez cet email suite a votre achat. Contact : contact@ameanimale.fr</div>
  </div>
</div></body></html>`;
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const html = buildEmailHTML(data);
    const animalName = data.animalName || 'votre animal';

    // Generate PDF (raw, no dependencies)
    let pdfBuffer: Buffer | null = null;
    let pdfError: string | null = null;
    try {
      pdfBuffer = generatePdfBuffer(data);
      console.log('[send-report] PDF OK, size:', pdfBuffer.length);
    } catch (e: unknown) {
      pdfError = e instanceof Error ? e.message + '\n' + e.stack : String(e);
      console.error('[send-report] PDF FAILED:', pdfError);
    }

    const safeName = (animalName || 'animal').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') || 'animal';

    const { error } = await getResend().emails.send({
      from: '\u00c2me Animale <contact@ameanimale.fr>',
      to: [email],
      subject: `Rapport de ${animalName} - Ame Animale`,
      html,
      headers: {
        'X-Entity-Ref-ID': `rapport-${Date.now()}`,
      },
      ...(pdfBuffer ? {
        attachments: [
          { filename: `rapport-${safeName}.pdf`, content: pdfBuffer },
        ],
      } : {}),
    });

    if (error) {
      console.error('[send-report] Resend error:', JSON.stringify(error));
      return NextResponse.json({ error: 'Erreur envoi email', details: error, pdfError }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pdfAttached: !!pdfBuffer, pdfError });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err);
    console.error('[send-report] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
