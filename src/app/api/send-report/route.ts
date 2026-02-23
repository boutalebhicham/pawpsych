import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

// ═══════════════════════════════════════════════════════════════════
// RAW PDF GENERATOR — zero dependencies, multi-page, professional
// ═══════════════════════════════════════════════════════════════════

function enc(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/é/g, '\\351').replace(/è/g, '\\350').replace(/ê/g, '\\352').replace(/ë/g, '\\353')
    .replace(/à/g, '\\340').replace(/â/g, '\\342').replace(/ä/g, '\\344')
    .replace(/ù/g, '\\371').replace(/û/g, '\\373').replace(/ü/g, '\\374')
    .replace(/ô/g, '\\364').replace(/î/g, '\\356').replace(/ï/g, '\\357')
    .replace(/ç/g, '\\347').replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/Â/g, '\\302').replace(/É/g, '\\311').replace(/È/g, '\\310')
    .replace(/Ê/g, '\\312').replace(/Ô/g, '\\324').replace(/Î/g, '\\316')
    .replace(/—/g, ' - ').replace(/–/g, '-').replace(/'/g, "'").replace(/'/g, "'")
    .replace(/«/g, '"').replace(/»/g, '"').replace(/…/g, '...')
    .replace(/\u00a0/g, ' ');
}

function wrap(text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).length > max && cur.length > 0) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Approximate width of a string in Helvetica at size 1pt
function textWidth(s: string, bold = false): number {
  // Simplified Helvetica metric: avg 0.52 per char, bold 0.54
  return s.length * (bold ? 0.54 : 0.52);
}

const DIM_COLORS: Record<string, { r: number; g: number; b: number; pdf: string }> = {
  SOC: { r: 59, g: 130, b: 246, pdf: '0.231 0.510 0.965 rg' },
  ENG: { r: 245, g: 158, b: 11, pdf: '0.961 0.620 0.043 rg' },
  ATT: { r: 239, g: 68, b: 68, pdf: '0.937 0.267 0.267 rg' },
  SEN: { r: 139, g: 92, b: 246, pdf: '0.545 0.361 0.965 rg' },
  INT: { r: 16, g: 185, b: 129, pdf: '0.063 0.725 0.506 rg' },
};

const DIM_LABELS: Record<string, string> = {
  SOC: 'Sociabilite', ENG: 'Energie', ATT: 'Attachement', SEN: 'Sensibilite', INT: 'Intelligence',
};

interface ReportData {
  prenom: string;
  animalName: string;
  animalType: string;
  profileType: string;
  profileTitle: string;
  profileTagline: string;
  profileEmoji: string;
  dimensions: Record<string, number>;
  strengths: string[];
  watchPoints: string[];
  tips: string[];
  desc: string;
  analysis?: { home: string; humans: string; animals: string; intel: string; bond: string };
  activities?: string[];
  rewards?: string[];
  mistakes?: string[];
  compat?: { home: string; kids: string; otherPets: string; ownerLevel: string };
  summary?: string;
}

// ── PDF Page Builder ──
class PdfDoc {
  private pages: string[][] = [];
  private cur: string[] = [];
  y = 0;
  private pageW = 595;
  private pageH = 842;
  private mTop = 60;
  private mBottom = 60;
  private mLeft = 55;
  private mRight = 55;
  private contentW: number;
  private pageCount = 0;
  private brandName: string;

  constructor(brand: string) {
    this.brandName = brand;
    this.contentW = this.pageW - this.mLeft - this.mRight;
  }

  get left() { return this.mLeft; }
  get right() { return this.pageW - this.mRight; }
  get width() { return this.contentW; }

  newPage(dark = false) {
    if (this.cur.length > 0) this.pages.push(this.cur);
    this.cur = [];
    this.pageCount++;
    this.y = this.pageH - this.mTop;
    if (dark) {
      this.cur.push('0.067 0.067 0.067 rg');
      this.cur.push(`0 0 ${this.pageW} ${this.pageH} re f`);
    }
  }

  newContentPage() {
    this.newPage();
    // Header line
    this.cur.push('0.90 0.90 0.88 rg');
    this.cur.push(`0 ${this.pageH - 40} ${this.pageW} 0.5 re f`);
    // Brand name top-left
    this.text(this.brandName, this.mLeft, this.pageH - 30, 'F2', 8, '0.6 0.6 0.6');
    // Page number top-right
    this.text(`${this.pageCount}`, this.pageW - this.mRight - 10, this.pageH - 30, 'F1', 8, '0.6 0.6 0.6');
    this.y = this.pageH - this.mTop - 15;
  }

  checkSpace(need: number) {
    if (this.y - need < this.mBottom) {
      this.newContentPage();
    }
  }

  // ── Primitives ──
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.cur.push(`${color}`);
    this.cur.push(`${x} ${y} ${w} ${h} re f`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, width = 0.5) {
    this.cur.push(`${color.replace(' rg', ' RG')}`);
    this.cur.push(`${width} w`);
    this.cur.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(str: string, x: number, y: number, font: string, size: number, color: string) {
    this.cur.push('BT');
    this.cur.push(`/${font} ${size} Tf`);
    this.cur.push(`${color}`);
    this.cur.push(`${x} ${y} Td`);
    this.cur.push(`(${enc(str)}) Tj`);
    this.cur.push('ET');
  }

  textRight(str: string, x: number, y: number, font: string, size: number, color: string) {
    const w = textWidth(str, font === 'F2') * size;
    this.text(str, x - w, y, font, size, color);
  }

  textCenter(str: string, cx: number, y: number, font: string, size: number, color: string) {
    const w = textWidth(str, font === 'F2') * size;
    this.text(str, cx - w / 2, y, font, size, color);
  }

  // ── High-level ──
  sectionTitle(title: string) {
    this.checkSpace(35);
    // Colored accent bar on left
    this.rect(this.left - 4, this.y - 2, 3, 18, '0.067 0.067 0.067 rg');
    this.text(title.toUpperCase(), this.left + 6, this.y, 'F2', 14, '0.067 0.067 0.067 rg');
    this.y -= 30;
  }

  subTitle(title: string) {
    this.checkSpace(25);
    this.text(title, this.left, this.y, 'F2', 11, '0.20 0.20 0.20 rg');
    this.y -= 18;
  }

  paragraph(txt: string, indent = 0) {
    const maxChars = Math.floor((this.contentW - indent) / 5.2);
    const lines = wrap(txt, maxChars);
    for (const line of lines) {
      this.checkSpace(14);
      this.text(line, this.left + indent, this.y, 'F1', 10, '0.27 0.27 0.27 rg');
      this.y -= 14;
    }
  }

  paragraphItalic(txt: string, indent = 0) {
    const maxChars = Math.floor((this.contentW - indent) / 5.2);
    const lines = wrap(txt, maxChars);
    for (const line of lines) {
      this.checkSpace(14);
      this.text(line, this.left + indent, this.y, 'F3', 10, '0.40 0.40 0.40 rg');
      this.y -= 14;
    }
  }

  bullet(prefix: string, txt: string, prefixColor = '0.27 0.27 0.27 rg') {
    const maxChars = Math.floor((this.contentW - 20) / 5.2);
    const lines = wrap(txt, maxChars);
    for (let i = 0; i < lines.length; i++) {
      this.checkSpace(15);
      if (i === 0) {
        this.text(prefix, this.left + 6, this.y, 'F2', 10, prefixColor);
      }
      this.text(lines[i], this.left + 22, this.y, 'F1', 10, '0.27 0.27 0.27 rg');
      this.y -= 15;
    }
  }

  spacer(h: number) { this.y -= h; }

  // ── Build final PDF ──
  build(): Buffer {
    if (this.cur.length > 0) this.pages.push(this.cur);

    const objects: string[] = [];
    const offsets: number[] = [];
    let objN = 0;
    function addObj(c: string): number {
      objN++;
      objects.push(`${objN} 0 obj\n${c}\nendobj\n`);
      return objN;
    }

    const streamObjs: number[] = [];
    const pageObjNums: number[] = [];

    // Reserve object numbers: 1=catalog, 2=pages, then fonts, then pages+streams
    // We'll build in order: fonts first, then pages

    // Fonts: 3=Helvetica, 4=Helvetica-Bold, 5=Helvetica-Oblique
    addObj('<< /Type /Catalog /Pages 2 0 R >>'); // 1
    addObj('placeholder'); // 2 - pages, will replace
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'); // 5

    const fontRes = '<< /F1 3 0 R /F2 4 0 R /F3 5 0 R >>';

    // For each page: create stream obj, then page obj
    for (const page of this.pages) {
      const stream = page.join('\n');
      const sObj = addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      streamObjs.push(sObj);
      const pObj = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageW} ${this.pageH}] /Contents ${sObj} 0 R /Resources << /Font ${fontRes} >> >>`);
      pageObjNums.push(pObj);
    }

    // Fix pages object (obj 2)
    const kids = pageObjNums.map(n => `${n} 0 R`).join(' ');
    objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>\nendobj\n`;

    // Assemble
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    for (let i = 0; i < objects.length; i++) {
      offsets[i] = pdf.length;
      pdf += objects[i];
    }
    const xrefOff = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${objN + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 0; i < objN; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n';
    pdf += `<< /Size ${objN + 1} /Root 1 0 R >>\n`;
    pdf += 'startxref\n';
    pdf += `${xrefOff}\n`;
    pdf += '%%EOF\n';

    return Buffer.from(pdf, 'binary');
  }
}

// ── Generate the report PDF ──
function generatePdfBuffer(data: ReportData): Buffer {
  const name = data.animalName || 'Votre animal';
  const doc = new PdfDoc('Ame Animale');
  const dims = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'];

  // ════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════
  doc.newPage(true);

  // Decorative top accent line
  doc.rect(55, 790, 485, 1.5, '0.25 0.25 0.25 rg');

  // Brand
  doc.textCenter('AME ANIMALE', 297, 720, 'F2', 12, '0.45 0.45 0.45 rg');

  // Thin separator
  doc.rect(247, 705, 100, 0.5, '0.3 0.3 0.3 rg');

  // Profile type label
  doc.textCenter(data.profileType?.toUpperCase() || '', 297, 670, 'F2', 10, '0.55 0.55 0.55 rg');

  // Profile title - large
  const titleLines = wrap(data.profileTitle || 'Profil', 28);
  let ty = 620;
  for (const line of titleLines) {
    doc.textCenter(line, 297, ty, 'F2', 32, '1 1 1 rg');
    ty -= 42;
  }

  // Tagline - italic
  const tagLines = wrap(data.profileTagline || '', 50);
  ty -= 10;
  for (const line of tagLines) {
    doc.textCenter(line, 297, ty, 'F3', 12, '0.60 0.60 0.60 rg');
    ty -= 18;
  }

  // Separator
  ty -= 20;
  doc.rect(247, ty, 100, 0.5, '0.25 0.25 0.25 rg');
  ty -= 30;

  // Animal info
  doc.textCenter(`Rapport de personnalite de ${name}`, 297, ty, 'F1', 12, '0.70 0.70 0.70 rg');
  ty -= 25;
  if (data.prenom) {
    doc.textCenter(`Prepare pour ${data.prenom}`, 297, ty, 'F3', 10, '0.50 0.50 0.50 rg');
    ty -= 20;
  }
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.textCenter(dateStr, 297, ty - 10, 'F1', 9, '0.40 0.40 0.40 rg');

  // Bottom decorative line
  doc.rect(55, 75, 485, 1.5, '0.25 0.25 0.25 rg');
  doc.textCenter('ameanimale.fr', 297, 55, 'F1', 9, '0.35 0.35 0.35 rg');

  // ════════════════════════════════════════
  // PAGE 2 — PROFIL & DIMENSIONS
  // ════════════════════════════════════════
  doc.newContentPage();

  // Profile summary box with subtle background
  doc.rect(doc.left - 5, doc.y - 55, doc.width + 10, 65, '0.97 0.97 0.96 rg');
  doc.text(data.profileType?.toUpperCase() || '', doc.left + 10, doc.y - 5, 'F2', 9, '0.55 0.55 0.55 rg');
  doc.text(data.profileTitle || '', doc.left + 10, doc.y - 22, 'F2', 16, '0.067 0.067 0.067 rg');
  doc.text(data.profileTagline || '', doc.left + 10, doc.y - 42, 'F3', 10, '0.45 0.45 0.45 rg');
  doc.y -= 75;

  // Description
  doc.spacer(5);
  doc.paragraph(data.desc || '');
  doc.spacer(20);

  // Dimensions section
  doc.sectionTitle('Dimensions comportementales');
  doc.spacer(5);

  for (const k of dims) {
    const pct = data.dimensions?.[k] || 50;
    const label = DIM_LABELS[k] || k;
    const color = DIM_COLORS[k];

    doc.checkSpace(30);

    // Label
    doc.text(label, doc.left, doc.y, 'F2', 10, '0.33 0.33 0.33 rg');
    // Percentage
    doc.textRight(`${pct}%`, doc.right, doc.y, 'F2', 10, '0.20 0.20 0.20 rg');

    doc.y -= 14;

    // Bar background (rounded look via thin rect)
    const barX = doc.left;
    const barW = doc.width - 50;
    const barH = 8;
    doc.rect(barX, doc.y, barW, barH, '0.93 0.93 0.93 rg');

    // Bar fill
    const fillW = Math.max(4, (pct / 100) * barW);
    doc.rect(barX, doc.y, fillW, barH, color.pdf);

    doc.y -= 22;
  }

  // ════════════════════════════════════════
  // PAGE 3 — ANALYSE COMPORTEMENTALE
  // ════════════════════════════════════════
  if (data.analysis) {
    doc.spacer(10);
    doc.checkSpace(50);
    doc.sectionTitle('Analyse comportementale');
    doc.spacer(5);

    const sections = [
      { label: 'A la maison', text: data.analysis.home },
      { label: 'Avec les humains', text: data.analysis.humans },
      { label: 'Avec les autres animaux', text: data.analysis.animals },
      { label: 'Intelligence & apprentissage', text: data.analysis.intel },
      { label: 'Lien emotionnel', text: data.analysis.bond },
    ];

    for (const sec of sections) {
      if (!sec.text) continue;
      doc.checkSpace(50);
      doc.subTitle(sec.label);
      doc.paragraph(sec.text, 4);
      doc.spacer(12);
    }
  }

  // ════════════════════════════════════════
  // PAGE 4 — POINTS FORTS & VIGILANCE
  // ════════════════════════════════════════
  if (data.strengths?.length) {
    doc.spacer(10);
    doc.sectionTitle('Points forts');
    doc.spacer(3);
    for (const s of data.strengths) {
      doc.bullet('+', s, '0.063 0.725 0.506 rg');
    }
  }

  if (data.watchPoints?.length) {
    doc.spacer(15);
    doc.sectionTitle('Points de vigilance');
    doc.spacer(3);
    for (const w of data.watchPoints) {
      doc.bullet('!', w, '0.937 0.267 0.267 rg');
    }
  }

  // ════════════════════════════════════════
  // PAGE 5 — CONSEILS PERSONNALISES
  // ════════════════════════════════════════
  if (data.activities?.length || data.rewards?.length || data.mistakes?.length) {
    doc.spacer(15);
    doc.sectionTitle('Conseils personnalises');
    doc.spacer(5);

    if (data.activities?.length) {
      doc.subTitle('Activites recommandees');
      for (const a of data.activities) {
        doc.bullet('>', a, '0.231 0.510 0.965 rg');
      }
      doc.spacer(10);
    }

    if (data.rewards?.length) {
      doc.subTitle('Meilleures recompenses');
      for (const r of data.rewards) {
        doc.bullet('>', r, '0.961 0.620 0.043 rg');
      }
      doc.spacer(10);
    }

    if (data.mistakes?.length) {
      doc.subTitle('Erreurs a eviter');
      for (const m of data.mistakes) {
        doc.bullet('!', m, '0.937 0.267 0.267 rg');
      }
      doc.spacer(10);
    }
  }

  // ════════════════════════════════════════
  // COMPATIBILITE
  // ════════════════════════════════════════
  if (data.compat) {
    doc.spacer(10);
    doc.sectionTitle('Compatibilite');
    doc.spacer(5);

    const items = [
      { label: 'Logement ideal', val: data.compat.home },
      { label: 'Avec les enfants', val: data.compat.kids },
      { label: 'Avec d\'autres animaux', val: data.compat.otherPets },
      { label: 'Niveau proprietaire', val: data.compat.ownerLevel },
    ];

    for (const item of items) {
      if (!item.val) continue;
      doc.checkSpace(30);
      // Gray background card
      doc.rect(doc.left, doc.y - 8, doc.width, 25, '0.97 0.97 0.96 rg');
      doc.text(item.label, doc.left + 10, doc.y, 'F2', 10, '0.33 0.33 0.33 rg');
      doc.text(item.val, doc.left + 180, doc.y, 'F1', 10, '0.20 0.20 0.20 rg');
      doc.y -= 32;
    }
  }

  // ════════════════════════════════════════
  // SYNTHESE (dark page)
  // ════════════════════════════════════════
  if (data.summary) {
    doc.newPage(true);

    // Decorative top line
    doc.rect(55, 790, 485, 1.5, '0.25 0.25 0.25 rg');

    doc.textCenter('SYNTHESE', 297, 700, 'F2', 14, '0.55 0.55 0.55 rg');
    doc.rect(257, 688, 80, 0.5, '0.3 0.3 0.3 rg');

    // Summary text in white, centered block
    const summaryLines = wrap(data.summary, 70);
    let sy = 650;
    for (const line of summaryLines) {
      doc.textCenter(line, 297, sy, 'F1', 11, '0.80 0.80 0.80 rg');
      sy -= 18;
    }

    // Bottom
    doc.rect(55, 75, 485, 1.5, '0.25 0.25 0.25 rg');
    doc.textCenter('Ame Animale - ameanimale.fr', 297, 55, 'F1', 9, '0.35 0.35 0.35 rg');
  }

  return doc.build();
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL HTML
// ═══════════════════════════════════════════════════════════════════
function buildEmailHTML(data: ReportData): string {
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
    <div style="font-size:20px;font-weight:900;color:#fff;">\u00c2me Animale</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Rapport de personnalit\u00e9</div>
  </div>
  <div style="padding:24px 24px 16px;font-size:14px;color:#444;line-height:1.7;">
    ${greeting}<br>Voici le rapport complet de <strong>${name}</strong>. Le PDF est en pi\u00e8ce jointe.
  </div>
  <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
    <div style="font-size:48px;margin-bottom:8px;">${data.profileEmoji || ''}</div>
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
    <div style="font-size:13px;color:#888;">\u00c2me Animale - <a href="https://ameanimale.fr" style="color:#888;">ameanimale.fr</a></div>
    <div style="font-size:10px;color:#bbb;margin-top:12px;">Vous recevez cet email suite \u00e0 votre achat. Contact : contact@ameanimale.fr</div>
  </div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════════
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data: ReportData = await req.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const html = buildEmailHTML(data);
    const animalName = data.animalName || 'votre animal';

    let pdfBuffer: Buffer | null = null;
    let pdfError: string | null = null;
    try {
      pdfBuffer = generatePdfBuffer(data);
      console.log('[send-report] PDF OK, size:', pdfBuffer.length, 'bytes');
    } catch (e: unknown) {
      pdfError = e instanceof Error ? e.message + '\n' + e.stack : String(e);
      console.error('[send-report] PDF FAILED:', pdfError);
    }

    const safeName = (animalName || 'animal').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') || 'animal';

    const { error } = await getResend().emails.send({
      from: '\u00c2me Animale <contact@ameanimale.fr>',
      to: [email],
      subject: `Rapport de ${animalName} - \u00c2me Animale`,
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
