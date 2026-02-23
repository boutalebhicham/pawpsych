import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

// ═══════════════════════════════════════════════════════════════════
// RAW PDF GENERATOR — zero deps, multi-page, professional report
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
    .replace(/À/g, '\\300')
    .replace(/—/g, ' - ').replace(/–/g, '-').replace(/'/g, "'").replace(/'/g, "'")
    .replace(/«/g, '"').replace(/»/g, '"').replace(/…/g, '...')
    .replace(/\u00a0/g, ' ');
}

// Visual character count of an encoded string (handles \351 etc as 1 char)
function vLen(encoded: string): number {
  return encoded.replace(/\\[0-9]{3}/g, 'X').replace(/\\\\/g, 'X').replace(/\\[\(\)]/g, 'X').length;
}

function wrap(text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (vLen(enc(test)) > max && cur.length > 0) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Approximate text width in points (Helvetica metrics)
function tw(str: string, size: number, bold = false): number {
  const encoded = enc(str);
  const chars = vLen(encoded);
  const avg = bold ? 0.56 : 0.52;
  return chars * avg * size;
}

const DIM_COLORS: Record<string, string> = {
  SOC: '0.231 0.510 0.965 rg',
  ENG: '0.961 0.620 0.043 rg',
  ATT: '0.937 0.267 0.267 rg',
  SEN: '0.545 0.361 0.965 rg',
  INT: '0.063 0.725 0.506 rg',
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
  dimExplanations?: Record<string, string>;
  strengths: string[];
  watchPoints: string[];
  tips: string[];
  desc: string;
  analysis?: { home: string; humans: string; animals: string; intel: string; bond: string };
  activities?: string[];
  activityWhys?: string[];
  rewards?: string[];
  rewardWhys?: string[];
  mistakes?: string[];
  mistakeWhys?: string[];
  compat?: { home: string; kids: string; otherPets: string; ownerLevel: string };
  compatSubs?: { home: string; kids: string; otherPets: string; ownerLevel: string };
  summary?: string;
}

// ── PDF Page Builder ──
class PdfDoc {
  private pages: string[][] = [];
  private cur: string[] = [];
  y = 0;
  private W = 595;
  private H = 842;
  private MT = 60;
  private MB = 55;
  private ML = 55;
  private MR = 55;
  private CW: number;
  private pageN = 0;

  constructor() {
    this.CW = this.W - this.ML - this.MR;
  }

  get left() { return this.ML; }
  get right() { return this.W - this.MR; }
  get width() { return this.CW; }
  get center() { return this.W / 2; }

  // ── Page management ──
  newPage(dark = false) {
    if (this.cur.length > 0) this.pages.push(this.cur);
    this.cur = [];
    this.pageN++;
    this.y = this.H - this.MT;
    if (dark) {
      this.cur.push('0.067 0.067 0.067 rg');
      this.cur.push(`0 0 ${this.W} ${this.H} re f`);
    }
  }

  contentPage(secNum?: number, secTitle?: string) {
    this.newPage();
    // Top line
    this.rect(0, this.H - 42, this.W, 0.5, '0.88 0.88 0.86 rg');
    // Brand top-left
    this.txt('Ame Animale', this.ML, this.H - 32, 'F2', 7.5, '0.55 0.55 0.55');
    // Page number top-right
    this.txtR(String(this.pageN), this.right, this.H - 32, 'F1', 7.5, '0.55 0.55 0.55');
    this.y = this.H - this.MT - 10;

    if (secNum !== undefined && secTitle) {
      // Section header
      this.txt(`SECTION 0${secNum}`, this.ML, this.y, 'F1', 8, '0.55 0.55 0.55');
      this.y -= 18;
      // Title with left accent bar
      this.rect(this.ML - 2, this.y - 4, 3, 22, '0.067 0.067 0.067 rg');
      this.txt(secTitle.toUpperCase(), this.ML + 10, this.y, 'F2', 18, '0.067 0.067 0.067');
      this.y -= 14;
      // Underline
      this.rect(this.ML, this.y, this.CW, 1, '0.067 0.067 0.067 rg');
      this.y -= 22;
    }
  }

  checkSpace(need: number) {
    if (this.y - need < this.MB) {
      // New continuation page
      this.newPage();
      this.rect(0, this.H - 42, this.W, 0.5, '0.88 0.88 0.86 rg');
      this.txt('Ame Animale', this.ML, this.H - 32, 'F2', 7.5, '0.55 0.55 0.55');
      this.txtR(String(this.pageN), this.right, this.H - 32, 'F1', 7.5, '0.55 0.55 0.55');
      this.y = this.H - this.MT - 10;
    }
  }

  // ── Drawing primitives ──
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.cur.push(color);
    this.cur.push(`${x} ${y} ${w} ${h} re f`);
  }

  txt(str: string, x: number, y: number, font: string, size: number, color: string) {
    this.cur.push('BT');
    this.cur.push(`/${font} ${size} Tf`);
    this.cur.push(`${color} rg`);
    this.cur.push(`${x} ${y} Td`);
    this.cur.push(`(${enc(str)}) Tj`);
    this.cur.push('ET');
  }

  txtR(str: string, rx: number, y: number, font: string, size: number, color: string) {
    const w = tw(str, size, font === 'F2');
    this.txt(str, rx - w, y, font, size, color);
  }

  txtC(str: string, y: number, font: string, size: number, color: string) {
    const w = tw(str, size, font === 'F2');
    this.txt(str, this.center - w / 2, y, font, size, color);
  }

  // ── High-level components ──
  subTitle(title: string) {
    this.checkSpace(28);
    this.rect(this.left, this.y + 2, this.CW, 20, '0.965 0.961 0.953 rg');
    this.txt(title, this.left + 8, this.y + 5, 'F2', 11, '0.13 0.13 0.13');
    this.y -= 28;
  }

  para(text: string, indent = 0, fontSize = 9.5, color = '0.27 0.27 0.27') {
    const maxChars = Math.floor((this.CW - indent) / (fontSize * 0.5));
    const lines = wrap(text, maxChars);
    for (const line of lines) {
      this.checkSpace(13);
      this.txt(line, this.left + indent, this.y, 'F1', fontSize, color);
      this.y -= 13;
    }
  }

  paraItalic(text: string, indent = 0, fontSize = 9.5, color = '0.40 0.40 0.40') {
    const maxChars = Math.floor((this.CW - indent) / (fontSize * 0.5));
    const lines = wrap(text, maxChars);
    for (const line of lines) {
      this.checkSpace(13);
      this.txt(line, this.left + indent, this.y, 'F3', fontSize, color);
      this.y -= 13;
    }
  }

  bullet(label: string, text: string, labelColor = '0.27 0.27 0.27') {
    const maxChars = Math.floor((this.CW - 24) / (9.5 * 0.5));
    const lines = wrap(text, maxChars);
    for (let i = 0; i < lines.length; i++) {
      this.checkSpace(14);
      if (i === 0) {
        this.txt(label, this.left + 6, this.y, 'F2', 9.5, labelColor);
      }
      this.txt(lines[i], this.left + 24, this.y, 'F1', 9.5, '0.27 0.27 0.27');
      this.y -= 14;
    }
  }

  adviceItem(name: string, explanation: string, accentColor: string) {
    this.checkSpace(20);
    // Item name with arrow
    const nameLines = wrap(name, Math.floor(this.CW / (10 * 0.5)));
    for (let i = 0; i < nameLines.length; i++) {
      this.checkSpace(14);
      if (i === 0) {
        this.rect(this.left, this.y - 1, 3, 12, accentColor);
      }
      this.txt(nameLines[i], this.left + 12, this.y, 'F2', 10, '0.13 0.13 0.13');
      this.y -= 14;
    }
    // Explanation
    if (explanation) {
      this.y -= 2;
      this.paraItalic(explanation, 12, 8.5, '0.42 0.42 0.42');
    }
    this.y -= 8;
  }

  spacer(h: number) { this.y -= h; }

  footer() {
    this.rect(this.left, this.MB - 5, this.CW, 0.5, '0.90 0.90 0.88 rg');
    this.txtC('Ame Animale  -  ameanimale.fr', this.MB - 15, 'F1', 7, '0.60 0.60 0.60');
  }

  // ── Build final PDF binary ──
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

    // 1=Catalog, 2=Pages(placeholder), 3-5=Fonts
    addObj('<< /Type /Catalog /Pages 2 0 R >>');
    addObj('placeholder');
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

    const fontRes = '<< /F1 3 0 R /F2 4 0 R /F3 5 0 R >>';
    const pageObjNums: number[] = [];

    for (const page of this.pages) {
      const stream = page.join('\n');
      const sObj = addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pObj = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Contents ${sObj} 0 R /Resources << /Font ${fontRes} >> >>`);
      pageObjNums.push(pObj);
    }

    const kids = pageObjNums.map(n => `${n} 0 R`).join(' ');
    objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>\nendobj\n`;

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

// ── Generate the complete report PDF ──
function generatePdfBuffer(data: ReportData): Buffer {
  const name = data.animalName || 'Votre animal';
  const doc = new PdfDoc();
  const dims = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'];
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ════════════════════════════════════════════════════════════════
  // PAGE 1 — COUVERTURE
  // ════════════════════════════════════════════════════════════════
  doc.newPage(true);

  // Top decorative line
  doc.rect(55, 795, 485, 1.5, '0.20 0.20 0.20 rg');

  // Brand
  doc.txtC('AME ANIMALE', 710, 'F2', 11, '0.45 0.45 0.45');
  // Sub-brand
  doc.txtC('Rapport de personnalite', 694, 'F3', 9, '0.38 0.38 0.38');

  // Separator
  doc.rect(267, 678, 60, 0.5, '0.30 0.30 0.30 rg');

  // Profile type
  doc.txtC((data.profileType || '').toUpperCase(), 648, 'F2', 9, '0.50 0.50 0.50');

  // Profile title - large, centered
  const titleLines = wrap(data.profileTitle || 'Profil', 26);
  let ty = 610;
  for (const line of titleLines) {
    doc.txtC(line, ty, 'F2', 30, '1 1 1');
    ty -= 40;
  }

  // Tagline italic
  const tagLines = wrap(data.profileTagline || '', 55);
  ty -= 5;
  for (const line of tagLines) {
    doc.txtC(line, ty, 'F3', 11, '0.58 0.58 0.58');
    ty -= 16;
  }

  // Separator
  ty -= 15;
  doc.rect(267, ty, 60, 0.5, '0.25 0.25 0.25 rg');
  ty -= 30;

  // Animal info
  doc.txtC(`Rapport de ${name}`, ty, 'F1', 12, '0.65 0.65 0.65');
  ty -= 22;
  if (data.prenom) {
    doc.txtC(`Prepare pour ${data.prenom}`, ty, 'F3', 10, '0.45 0.45 0.45');
    ty -= 20;
  }
  doc.txtC(dateStr, ty - 5, 'F1', 9, '0.38 0.38 0.38');

  // Bottom
  doc.rect(55, 70, 485, 1.5, '0.20 0.20 0.20 rg');
  doc.txtC('ameanimale.fr', 52, 'F2', 9, '0.32 0.32 0.32');

  // ════════════════════════════════════════════════════════════════
  // PAGE 2 — SOMMAIRE
  // ════════════════════════════════════════════════════════════════
  doc.contentPage();

  doc.txt('SOMMAIRE', doc.left, doc.y, 'F2', 22, '0.067 0.067 0.067');
  doc.y -= 10;
  doc.rect(doc.left, doc.y, 60, 2, '0.067 0.067 0.067 rg');
  doc.y -= 35;

  const tocItems = [
    'Dimensions comportementales',
    'Analyse comportementale',
    'Points forts & Points de vigilance',
    'Conseils personnalises',
    'Compatibilite',
    'Synthese',
  ];

  for (let i = 0; i < tocItems.length; i++) {
    const num = `0${i + 1}`;
    // Number
    doc.txt(num, doc.left + 5, doc.y, 'F2', 14, '0.75 0.75 0.75');
    // Label
    doc.txt(tocItems[i], doc.left + 40, doc.y, 'F2', 13, '0.13 0.13 0.13');
    doc.y -= 12;
    // Separator line
    doc.rect(doc.left, doc.y, doc.width, 0.5, '0.92 0.92 0.90 rg');
    doc.y -= 22;
  }

  doc.footer();

  // ════════════════════════════════════════════════════════════════
  // SECTION 01 — DIMENSIONS COMPORTEMENTALES
  // ════════════════════════════════════════════════════════════════
  doc.contentPage(1, 'Dimensions comportementales');

  // Profile summary box
  doc.rect(doc.left, doc.y - 40, doc.width, 50, '0.965 0.961 0.953 rg');
  doc.txt((data.profileType || '').toUpperCase(), doc.left + 12, doc.y - 5, 'F2', 8, '0.50 0.50 0.50');
  doc.txt(data.profileTitle || '', doc.left + 12, doc.y - 20, 'F2', 15, '0.067 0.067 0.067');
  doc.txt(data.profileTagline || '', doc.left + 12, doc.y - 35, 'F3', 9, '0.42 0.42 0.42');
  doc.y -= 60;

  // Description
  doc.spacer(5);
  doc.para(data.desc || '');
  doc.spacer(15);

  // Dimension bars with explanations
  for (const k of dims) {
    const pct = data.dimensions?.[k] || 50;
    const label = DIM_LABELS[k] || k;
    const color = DIM_COLORS[k];
    const explanation = data.dimExplanations?.[k] || '';

    doc.checkSpace(60);

    // Label + percentage on same line
    doc.txt(label, doc.left, doc.y, 'F2', 10.5, '0.20 0.20 0.20');
    doc.txtR(`${pct}%`, doc.right, doc.y, 'F2', 10.5, '0.20 0.20 0.20');
    doc.y -= 14;

    // Bar background
    const barW = doc.width;
    doc.rect(doc.left, doc.y, barW, 7, '0.93 0.93 0.93 rg');
    // Bar fill
    const fillW = Math.max(4, (pct / 100) * barW);
    doc.rect(doc.left, doc.y, fillW, 7, color);
    doc.y -= 14;

    // Explanation text (smaller, gray)
    if (explanation) {
      doc.paraItalic(explanation, 4, 8.2, '0.45 0.45 0.45');
    }
    doc.spacer(10);
  }

  doc.footer();

  // ════════════════════════════════════════════════════════════════
  // SECTION 02 — ANALYSE COMPORTEMENTALE
  // ════════════════════════════════════════════════════════════════
  if (data.analysis) {
    doc.contentPage(2, 'Analyse comportementale');

    const sections = [
      { label: 'A la maison', text: data.analysis.home },
      { label: 'Avec les humains', text: data.analysis.humans },
      { label: 'Avec les autres animaux', text: data.analysis.animals },
      { label: 'Intelligence & apprentissage', text: data.analysis.intel },
      { label: 'Lien emotionnel', text: data.analysis.bond },
    ];

    for (const sec of sections) {
      if (!sec.text) continue;
      doc.subTitle(sec.label);
      doc.para(sec.text, 6);
      doc.spacer(12);
    }

    doc.footer();
  }

  // ════════════════════════════════════════════════════════════════
  // SECTION 03 — POINTS FORTS & POINTS DE VIGILANCE
  // ════════════════════════════════════════════════════════════════
  doc.contentPage(3, 'Points forts & Points de vigilance');

  if (data.strengths?.length) {
    doc.subTitle('Ce qui le definit positivement');
    doc.spacer(3);
    for (const s of data.strengths) {
      doc.bullet('+', s, '0.063 0.725 0.506');
    }
    doc.spacer(15);
  }

  if (data.watchPoints?.length) {
    doc.subTitle('Ce qui demande votre attention');
    doc.spacer(3);
    for (const w of data.watchPoints) {
      doc.bullet('!', w, '0.937 0.267 0.267');
    }
  }

  doc.footer();

  // ════════════════════════════════════════════════════════════════
  // SECTION 04 — CONSEILS PERSONNALISES
  // ════════════════════════════════════════════════════════════════
  doc.contentPage(4, 'Conseils personnalises');

  if (data.activities?.length) {
    doc.subTitle('Activites recommandees');
    doc.spacer(3);
    for (let i = 0; i < data.activities.length; i++) {
      doc.adviceItem(
        data.activities[i],
        data.activityWhys?.[i] || '',
        '0.231 0.510 0.965 rg'
      );
    }
    doc.spacer(10);
  }

  if (data.rewards?.length) {
    doc.subTitle('Meilleures recompenses');
    doc.spacer(3);
    for (let i = 0; i < data.rewards.length; i++) {
      doc.adviceItem(
        data.rewards[i],
        data.rewardWhys?.[i] || '',
        '0.961 0.620 0.043 rg'
      );
    }
    doc.spacer(10);
  }

  if (data.mistakes?.length) {
    doc.subTitle('Erreurs a eviter');
    doc.spacer(3);
    for (let i = 0; i < data.mistakes.length; i++) {
      doc.adviceItem(
        data.mistakes[i],
        data.mistakeWhys?.[i] || '',
        '0.937 0.267 0.267 rg'
      );
    }
  }

  doc.footer();

  // ════════════════════════════════════════════════════════════════
  // SECTION 05 — COMPATIBILITE
  // ════════════════════════════════════════════════════════════════
  if (data.compat) {
    doc.contentPage(5, 'Compatibilite');

    const items: { label: string; val: string; sub: string }[] = [
      { label: 'Logement ideal', val: data.compat.home, sub: data.compatSubs?.home || '' },
      { label: 'Avec les enfants', val: data.compat.kids, sub: data.compatSubs?.kids || '' },
      { label: 'Avec d\'autres animaux', val: data.compat.otherPets, sub: data.compatSubs?.otherPets || '' },
      { label: 'Niveau proprietaire', val: data.compat.ownerLevel, sub: data.compatSubs?.ownerLevel || '' },
    ];

    for (const item of items) {
      if (!item.val) continue;
      doc.checkSpace(55);

      // Card background
      doc.rect(doc.left, doc.y - 38, doc.width, 48, '0.965 0.961 0.953 rg');
      // Label (small, uppercase)
      doc.txt(item.label.toUpperCase(), doc.left + 12, doc.y - 2, 'F1', 7.5, '0.50 0.50 0.50');
      // Value (bold)
      doc.txt(item.val, doc.left + 12, doc.y - 16, 'F2', 12, '0.10 0.10 0.10');
      doc.y -= 42;

      // Sub-explanation below the card
      if (item.sub) {
        doc.spacer(2);
        doc.paraItalic(item.sub, 12, 8.2, '0.45 0.45 0.45');
      }
      doc.spacer(12);
    }

    doc.footer();
  }

  // ════════════════════════════════════════════════════════════════
  // SECTION 06 — SYNTHESE (page sombre)
  // ════════════════════════════════════════════════════════════════
  if (data.summary) {
    doc.newPage(true);

    // Top line
    doc.rect(55, 795, 485, 1.5, '0.20 0.20 0.20 rg');

    doc.txtC('SECTION 06', 740, 'F1', 7.5, '0.35 0.35 0.35');
    doc.txtC('SYNTHESE', 710, 'F2', 18, '0.55 0.55 0.55');
    doc.rect(267, 698, 60, 0.5, '0.30 0.30 0.30 rg');

    // Profile title
    doc.txtC(data.profileTitle || '', 660, 'F2', 22, '1 1 1');

    // Summary text
    const summaryLines = wrap(data.summary, 75);
    let sy = 620;
    for (const line of summaryLines) {
      doc.txtC(line, sy, 'F1', 10, '0.70 0.70 0.70');
      sy -= 16;
    }

    // Bottom
    doc.rect(55, 70, 485, 1.5, '0.20 0.20 0.20 rg');
    doc.txtC('Ame Animale  -  ameanimale.fr', 52, 'F1', 8, '0.30 0.30 0.30');
  }

  return doc.build();
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL HTML (unchanged)
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
      console.log('[send-report] PDF generated:', pdfBuffer.length, 'bytes,', 'pages:', Math.max(6, 7));
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
      headers: { 'X-Entity-Ref-ID': `rapport-${Date.now()}` },
      ...(pdfBuffer ? {
        attachments: [{ filename: `rapport-${safeName}.pdf`, content: pdfBuffer }],
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
