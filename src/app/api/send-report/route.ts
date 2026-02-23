import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

// ═══════════════════════════════════════════════════════════════════
//  RAW PDF GENERATOR — zero deps, pro multi-page report
// ═══════════════════════════════════════════════════════════════════

// Helvetica character widths (per 1000 em units)
const HW: Record<string, number> = {
  ' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,"'":191,
  '(':333,')':333,'*':389,'+':584,',':278,'-':333,'.':278,'/':278,
  '0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,
  ':':278,';':278,'<':584,'=':584,'>':584,'?':556,'@':1015,
  'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,
  'J':500,'K':667,'L':556,'M':833,'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,
  'T':611,'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,
  'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,'i':222,
  'j':222,'k':500,'l':222,'m':833,'n':556,'o':556,'p':556,'q':556,'r':333,'s':500,'t':278,
  'u':556,'v':500,'w':722,'x':500,'y':500,'z':500,
};

/** Accurate text width in points using Helvetica metrics */
function tw(str: string, size: number, bold = false): number {
  let w = 0;
  for (const ch of str) {
    // Strip combining accents to get base char width
    const base = ch.normalize('NFD').charAt(0);
    const cw = HW[base] ?? 556;
    w += cw;
  }
  if (bold) w *= 1.058;
  return (w / 1000) * size;
}

function enc(s: string): string {
  return s
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    .replace(/é/g,'\\351').replace(/è/g,'\\350').replace(/ê/g,'\\352').replace(/ë/g,'\\353')
    .replace(/à/g,'\\340').replace(/â/g,'\\342').replace(/ä/g,'\\344')
    .replace(/ù/g,'\\371').replace(/û/g,'\\373').replace(/ü/g,'\\374')
    .replace(/ô/g,'\\364').replace(/î/g,'\\356').replace(/ï/g,'\\357')
    .replace(/ç/g,'\\347').replace(/œ/g,'oe').replace(/æ/g,'ae')
    .replace(/Â/g,'\\302').replace(/É/g,'\\311').replace(/È/g,'\\310')
    .replace(/Ê/g,'\\312').replace(/Ô/g,'\\324').replace(/Î/g,'\\316').replace(/À/g,'\\300')
    .replace(/—/g,' - ').replace(/–/g,'-').replace(/\u2019/g,"'").replace(/\u2018/g,"'")
    .replace(/\u00ab/g,'"').replace(/\u00bb/g,'"').replace(/\u2026/g,'...')
    .replace(/\u00a0/g,' ');
}

function wrap(text: string, maxPt: number, fontSize: number, bold = false): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (tw(test, fontSize, bold) > maxPt && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const DIM_COLORS: Record<string, string> = {
  SOC: '0.231 0.510 0.965 rg', ENG: '0.961 0.620 0.043 rg',
  ATT: '0.937 0.267 0.267 rg', SEN: '0.545 0.361 0.965 rg',
  INT: '0.063 0.725 0.506 rg',
};
const DIM_LABELS: Record<string, string> = {
  SOC:'Sociabilite', ENG:'Energie', ATT:'Attachement', SEN:'Sensibilite', INT:'Intelligence',
};

interface ReportData {
  prenom: string; animalName: string; animalType: string; race?: string;
  profileType: string; profileTitle: string; profileTagline: string; profileEmoji: string;
  dimensions: Record<string, number>;
  dimExplanations?: Record<string, string>;
  strengths: string[]; watchPoints: string[]; tips: string[]; desc: string;
  analysis?: { home: string; humans: string; animals: string; intel: string; bond: string };
  activities?: string[]; activityWhys?: string[];
  rewards?: string[];  rewardWhys?: string[];
  mistakes?: string[]; mistakeWhys?: string[];
  compat?: { home: string; kids: string; otherPets: string; ownerLevel: string };
  compatSubs?: { home: string; kids: string; otherPets: string; ownerLevel: string };
  ageNote?: { badge: string; text: string } | null;
  breedNote?: string | null;
  summary?: string;
}

// ── PDF Document Builder ──
class P {
  private pgs: string[][] = [];
  private c: string[] = [];
  y = 0;
  private W = 595; private H = 842;
  private ML = 60; private MR = 60; private MT = 65; private MB = 55;
  private CW: number;
  private pN = 0;

  constructor() { this.CW = this.W - this.ML - this.MR; }

  get l() { return this.ML; }
  get r() { return this.W - this.MR; }
  get w() { return this.CW; }
  get cx() { return this.W / 2; }

  // ── Pages ──
  dark() {
    if (this.c.length) this.pgs.push(this.c);
    this.c = []; this.pN++; this.y = this.H - this.MT;
    this.c.push('0.067 0.067 0.067 rg');
    this.c.push(`0 0 ${this.W} ${this.H} re f`);
  }

  page(sn?: number, st?: string) {
    if (this.c.length) this.pgs.push(this.c);
    this.c = []; this.pN++; this.y = this.H - this.MT;
    // Header bar
    this.c.push('0.965 0.961 0.953 rg');
    this.c.push(`0 ${this.H - 44} ${this.W} 44 re f`);
    this._t('Ame Animale', this.ML, this.H - 28, 'F2', 8, '0.45 0.45 0.45');
    this._tR(String(this.pN), this.r, this.H - 28, 'F1', 8, '0.45 0.45 0.45');
    this.y = this.H - this.MT - 10;

    if (sn !== undefined && st) {
      this._t(`SECTION 0${sn}`, this.l, this.y + 2, 'F1', 7, '0.50 0.50 0.50');
      this.y -= 22;
      this._t(st.toUpperCase(), this.l, this.y, 'F2', 17, '0.067 0.067 0.067');
      this.y -= 8;
      this.R(this.l, this.y, this.w, 1.5, '0.067 0.067 0.067 rg');
      this.y -= 25;
    }
  }

  cont() {
    if (this.c.length) this.pgs.push(this.c);
    this.c = []; this.pN++;
    this.c.push('0.965 0.961 0.953 rg');
    this.c.push(`0 ${this.H - 44} ${this.W} 44 re f`);
    this._t('Ame Animale', this.ML, this.H - 28, 'F2', 8, '0.45 0.45 0.45');
    this._tR(String(this.pN), this.r, this.H - 28, 'F1', 8, '0.45 0.45 0.45');
    this.y = this.H - this.MT - 10;
  }

  need(h: number) { if (this.y - h < this.MB) this.cont(); }

  // ── Primitives ──
  R(x: number, y: number, w: number, h: number, col: string) {
    this.c.push(col); this.c.push(`${x} ${y} ${w} ${h} re f`);
  }

  _t(s: string, x: number, y: number, f: string, sz: number, col: string) {
    this.c.push(`BT /${f} ${sz} Tf ${col} rg ${x} ${y} Td (${enc(s)}) Tj ET`);
  }

  _tR(s: string, rx: number, y: number, f: string, sz: number, col: string) {
    this._t(s, rx - tw(s, sz, f === 'F2'), y, f, sz, col);
  }

  _tC(s: string, y: number, f: string, sz: number, col: string) {
    this._t(s, this.cx - tw(s, sz, f === 'F2') / 2, y, f, sz, col);
  }

  // ── Components ──
  sub(title: string) {
    this.need(30);
    this.R(this.l, this.y - 3, this.w, 22, '0.965 0.961 0.953 rg');
    this._t(title, this.l + 10, this.y + 1, 'F2', 10.5, '0.13 0.13 0.13');
    this.y -= 30;
  }

  par(text: string, indent = 0, sz = 9.5, col = '0.27 0.27 0.27', font = 'F1') {
    const lines = wrap(text, this.w - indent, sz, font === 'F2');
    for (const ln of lines) {
      this.need(14);
      this._t(ln, this.l + indent, this.y, font, sz, col);
      this.y -= 14;
    }
  }

  parI(text: string, indent = 0, sz = 9, col = '0.42 0.42 0.42') {
    const lines = wrap(text, this.w - indent, sz);
    for (const ln of lines) {
      this.need(13);
      this._t(ln, this.l + indent, this.y, 'F3', sz, col);
      this.y -= 13;
    }
  }

  bul(label: string, text: string, lCol = '0.27 0.27 0.27') {
    const lines = wrap(text, this.w - 22, 9.5);
    for (let i = 0; i < lines.length; i++) {
      this.need(15);
      if (i === 0) this._t(label, this.l + 4, this.y, 'F2', 10, lCol);
      this._t(lines[i], this.l + 22, this.y, 'F1', 9.5, '0.27 0.27 0.27');
      this.y -= 15;
    }
  }

  advice(name: string, why: string, accent: string) {
    this.need(22);
    // Accent bar + name
    this.R(this.l, this.y - 1, 3, 13, accent);
    const nLines = wrap(name, this.w - 16, 10, true);
    for (const ln of nLines) {
      this.need(14);
      this._t(ln, this.l + 14, this.y, 'F2', 10, '0.13 0.13 0.13');
      this.y -= 14;
    }
    if (why) {
      this.y -= 2;
      this.parI(why, 14, 8.2, '0.45 0.45 0.45');
    }
    this.y -= 10;
  }

  sp(h: number) { this.y -= h; }

  foot() {
    this.R(this.l, this.MB - 8, this.w, 0.5, '0.90 0.90 0.88 rg');
    this._tC('Ame Animale  -  ameanimale.fr', this.MB - 20, 'F1', 7, '0.55 0.55 0.55');
  }

  // ── Build PDF binary ──
  build(): Buffer {
    if (this.c.length) this.pgs.push(this.c);
    const objs: string[] = []; const offs: number[] = [];
    let n = 0;
    const add = (c: string) => { n++; objs.push(`${n} 0 obj\n${c}\nendobj\n`); return n; };

    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('placeholder');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

    const fr = '<< /F1 3 0 R /F2 4 0 R /F3 5 0 R >>';
    const pNums: number[] = [];
    for (const pg of this.pgs) {
      const s = pg.join('\n');
      const sO = add(`<< /Length ${s.length} >>\nstream\n${s}\nendstream`);
      pNums.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Contents ${sO} 0 R /Resources << /Font ${fr} >> >>`));
    }
    objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${pNums.map(x=>`${x} 0 R`).join(' ')}] /Count ${this.pgs.length} >>\nendobj\n`;

    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    for (let i = 0; i < objs.length; i++) { offs[i] = pdf.length; pdf += objs[i]; }
    const xo = pdf.length;
    pdf += `xref\n0 ${n+1}\n0000000000 65535 f \n`;
    for (let i = 0; i < n; i++) pdf += String(offs[i]).padStart(10,'0')+' 00000 n \n';
    pdf += `trailer\n<< /Size ${n+1} /Root 1 0 R >>\nstartxref\n${xo}\n%%EOF\n`;
    return Buffer.from(pdf, 'binary');
  }
}

// ── Build the complete PDF ──
function generatePdfBuffer(d: ReportData): Buffer {
  const name = d.animalName || 'Votre animal';
  const p = new P();
  const dims = ['SOC','ENG','ATT','SEN','INT'];
  const date = new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  const hasContext = !!(d.ageNote || d.breedNote);
  const secOffset = hasContext ? 1 : 0;

  // ──────────────────────────────────────────────────
  //  PAGE 1 — COUVERTURE
  // ──────────────────────────────────────────────────
  p.dark();

  // Subtle top line
  p.R(60, 800, 475, 1, '0.18 0.18 0.18 rg');

  // Brand — centered
  p._tC('AME ANIMALE', 720, 'F2', 11, '0.42 0.42 0.42');
  p._tC('Rapport de personnalite', 704, 'F3', 9, '0.35 0.35 0.35');

  // Small separator
  p.R(277, 690, 40, 0.5, '0.28 0.28 0.28 rg');

  // Profile type
  p._tC((d.profileType||'').toUpperCase(), 660, 'F2', 9, '0.48 0.48 0.48');

  // Title lines
  const tLines = wrap(d.profileTitle||'Profil', 380, 30, true);
  let ty = 618;
  for (const ln of tLines) { p._tC(ln, ty, 'F2', 30, '1 1 1'); ty -= 40; }

  // Tagline
  const tagLines = wrap(d.profileTagline||'', 400, 11);
  ty -= 8;
  for (const ln of tagLines) { p._tC(ln, ty, 'F3', 11, '0.55 0.55 0.55'); ty -= 16; }

  // Separator
  ty -= 20;
  p.R(277, ty, 40, 0.5, '0.22 0.22 0.22 rg');
  ty -= 35;

  // Animal info
  p._tC(`Rapport de ${name}`, ty, 'F1', 12, '0.60 0.60 0.60');
  ty -= 22;
  if (d.prenom) {
    p._tC(`Prepare pour ${d.prenom}`, ty, 'F3', 10, '0.42 0.42 0.42');
    ty -= 22;
  }
  p._tC(date, ty, 'F1', 9, '0.35 0.35 0.35');

  // Bottom
  p.R(60, 65, 475, 1, '0.18 0.18 0.18 rg');
  p._tC('ameanimale.fr', 48, 'F2', 9, '0.30 0.30 0.30');

  // ──────────────────────────────────────────────────
  //  PAGE 2 — SOMMAIRE
  // ──────────────────────────────────────────────────
  p.page();

  p._t('SOMMAIRE', p.l, p.y, 'F2', 22, '0.067 0.067 0.067');
  p.y -= 10;
  p.R(p.l, p.y, 50, 2.5, '0.067 0.067 0.067 rg');
  p.y -= 40;

  const toc = [
    'Dimensions comportementales',
    ...(hasContext ? ['Contexte de lecture'] : []),
    'Analyse comportementale',
    'Points forts & Points de vigilance',
    'Conseils personnalises',
    'Compatibilite',
    'Synthese',
  ];

  for (let i = 0; i < toc.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    // Number in large light gray
    p._t(num, p.l, p.y, 'F2', 16, '0.82 0.82 0.80');
    // Label
    p._t(toc[i], p.l + 42, p.y + 1, 'F2', 12, '0.13 0.13 0.13');
    p.y -= 14;
    // Thin line
    p.R(p.l, p.y, p.w, 0.5, '0.92 0.92 0.90 rg');
    p.y -= 24;
  }

  p.foot();

  // ──────────────────────────────────────────────────
  //  SECTION 01 — DIMENSIONS
  // ──────────────────────────────────────────────────
  p.page(1, 'Dimensions comportementales');

  // Profile summary box
  p.R(p.l, p.y - 48, p.w, 58, '0.965 0.961 0.953 rg');
  p._t((d.profileType||'').toUpperCase(), p.l + 14, p.y - 4, 'F1', 7.5, '0.50 0.50 0.50');
  p._t(d.profileTitle||'', p.l + 14, p.y - 20, 'F2', 15, '0.067 0.067 0.067');
  p._t(d.profileTagline||'', p.l + 14, p.y - 38, 'F3', 9.5, '0.40 0.40 0.40');
  p.y -= 68;

  // Description
  p.sp(5);
  p.par(d.desc||'');
  p.sp(18);

  // Dimension bars + explanations
  for (const k of dims) {
    const pct = d.dimensions?.[k] || 50;
    const label = DIM_LABELS[k]||k;
    const expl = d.dimExplanations?.[k]||'';

    p.need(70);

    // Label + percentage
    p._t(label, p.l, p.y, 'F2', 11, '0.13 0.13 0.13');
    p._tR(`${pct}%`, p.r, p.y, 'F2', 11, '0.13 0.13 0.13');
    p.y -= 15;

    // Bar
    p.R(p.l, p.y, p.w, 8, '0.93 0.93 0.93 rg');
    p.R(p.l, p.y, Math.max(4, (pct/100)*p.w), 8, DIM_COLORS[k]||'0.5 0.5 0.5 rg');
    p.y -= 16;

    // Explanation
    if (expl) { p.parI(expl, 0, 8.2, '0.45 0.45 0.45'); }
    p.sp(14);
  }

  p.foot();

  // ──────────────────────────────────────────────────
  //  SECTION 02 — CONTEXTE DE LECTURE (si dispo)
  // ──────────────────────────────────────────────────
  if (hasContext) {
    p.page(2, 'Contexte de lecture');

    if (d.ageNote) {
      p.sub(`Lecture selon l'age  -  ${d.ageNote.badge}`);
      p.sp(2);
      p.par(d.ageNote.text, 6);
      p.sp(20);
    }

    if (d.breedNote) {
      p.sub(`Contexte de race  -  ${d.race || ''}`);
      p.sp(2);
      p.par(d.breedNote, 6);
      p.sp(10);
    }

    p.foot();
  }

  // ──────────────────────────────────────────────────
  //  SECTION — ANALYSE COMPORTEMENTALE
  // ──────────────────────────────────────────────────
  if (d.analysis) {
    p.page(2 + secOffset, 'Analyse comportementale');

    const secs = [
      { t: 'A la maison', txt: d.analysis.home },
      { t: 'Avec les humains', txt: d.analysis.humans },
      { t: 'Avec les autres animaux', txt: d.analysis.animals },
      { t: 'Intelligence & apprentissage', txt: d.analysis.intel },
      { t: 'Lien emotionnel', txt: d.analysis.bond },
    ];

    for (const s of secs) {
      if (!s.txt) continue;
      p.sub(s.t);
      p.par(s.txt, 8);
      p.sp(14);
    }

    p.foot();
  }

  // ──────────────────────────────────────────────────
  //  SECTION — POINTS FORTS & VIGILANCE
  // ──────────────────────────────────────────────────
  p.page(3 + secOffset, 'Points forts & Points de vigilance');

  if (d.strengths?.length) {
    p.sub('Ce qui le definit positivement');
    p.sp(4);
    for (const s of d.strengths) p.bul('+', s, '0.063 0.725 0.506');
    p.sp(18);
  }

  if (d.watchPoints?.length) {
    p.sub('Ce qui demande votre attention');
    p.sp(4);
    for (const w of d.watchPoints) p.bul('!', w, '0.937 0.267 0.267');
  }

  p.foot();

  // ──────────────────────────────────────────────────
  //  SECTION — CONSEILS PERSONNALISES
  // ──────────────────────────────────────────────────
  p.page(4 + secOffset, 'Conseils personnalises');

  if (d.activities?.length) {
    p.sub('Activites recommandees');
    p.sp(4);
    for (let i = 0; i < d.activities.length; i++)
      p.advice(d.activities[i], d.activityWhys?.[i]||'', '0.231 0.510 0.965 rg');
    p.sp(12);
  }

  if (d.rewards?.length) {
    p.sub('Meilleures recompenses');
    p.sp(4);
    for (let i = 0; i < d.rewards.length; i++)
      p.advice(d.rewards[i], d.rewardWhys?.[i]||'', '0.961 0.620 0.043 rg');
    p.sp(12);
  }

  if (d.mistakes?.length) {
    p.sub('Erreurs a eviter');
    p.sp(4);
    for (let i = 0; i < d.mistakes.length; i++)
      p.advice(d.mistakes[i], d.mistakeWhys?.[i]||'', '0.937 0.267 0.267 rg');
  }

  p.foot();

  // ──────────────────────────────────────────────────
  //  SECTION — COMPATIBILITE
  // ──────────────────────────────────────────────────
  if (d.compat) {
    p.page(5 + secOffset, 'Compatibilite');

    const items: {l:string;v:string;s:string}[] = [
      {l:'Logement ideal', v:d.compat.home, s:d.compatSubs?.home||''},
      {l:'Avec les enfants', v:d.compat.kids, s:d.compatSubs?.kids||''},
      {l:'Avec d\'autres animaux', v:d.compat.otherPets, s:d.compatSubs?.otherPets||''},
      {l:'Niveau proprietaire', v:d.compat.ownerLevel, s:d.compatSubs?.ownerLevel||''},
    ];

    for (const it of items) {
      if (!it.v) continue;
      p.need(60);

      // Card
      p.R(p.l, p.y - 30, p.w, 40, '0.965 0.961 0.953 rg');
      p._t(it.l.toUpperCase(), p.l + 14, p.y - 4, 'F1', 7.5, '0.48 0.48 0.48');
      p._t(it.v, p.l + 14, p.y - 20, 'F2', 12, '0.067 0.067 0.067');
      p.y -= 38;

      // Sub-explanation
      if (it.s) {
        p.sp(4);
        p.parI(it.s, 14, 8.2, '0.45 0.45 0.45');
      }
      p.sp(16);
    }

    p.foot();
  }

  // ──────────────────────────────────────────────────
  //  SYNTHESE (page sombre)
  // ──────────────────────────────────────────────────
  if (d.summary) {
    p.dark();

    p.R(60, 800, 475, 1, '0.18 0.18 0.18 rg');

    p._tC(`SECTION 0${6 + secOffset}`, 740, 'F1', 7.5, '0.35 0.35 0.35');
    p._tC('SYNTHESE', 715, 'F2', 18, '0.50 0.50 0.50');
    p.R(277, 703, 40, 0.5, '0.28 0.28 0.28 rg');

    // Title
    p._tC(d.profileTitle||'', 670, 'F2', 20, '1 1 1');

    // Summary text
    const sLines = wrap(d.summary, 400, 10);
    let sy = 635;
    for (const ln of sLines) {
      p._tC(ln, sy, 'F1', 10, '0.68 0.68 0.68');
      sy -= 16;
    }

    p.R(60, 65, 475, 1, '0.18 0.18 0.18 rg');
    p._tC('Ame Animale  -  ameanimale.fr', 48, 'F1', 8, '0.28 0.28 0.28');
  }

  return p.build();
}

// ═══════════════════════════════════════════════════════════════════
//  EMAIL HTML
// ═══════════════════════════════════════════════════════════════════
function buildEmailHTML(d: ReportData): string {
  const name = d.animalName || (d.animalType === 'chien' ? 'Votre chien' : 'Votre chat');
  const greeting = d.prenom ? `Bonjour ${d.prenom},` : 'Bonjour,';
  const dimRows = ['SOC','ENG','ATT','SEN','INT'].map(k => {
    const pct = d.dimensions?.[k]||50;
    const c: Record<string,string> = {SOC:'#3b82f6',ENG:'#f59e0b',ATT:'#ef4444',SEN:'#8b5cf6',INT:'#10b981'};
    const l: Record<string,string> = {SOC:'Sociabilit\u00e9',ENG:'\u00c9nergie',ATT:'Attachement',SEN:'Sensibilit\u00e9',INT:'Intelligence'};
    return `<tr><td style="padding:6px 12px 6px 0;font-size:13px;font-weight:600;color:#555;width:110px;">${l[k]}</td><td style="padding:6px 0;"><div style="background:#f0f0f0;border-radius:10px;height:18px;width:100%;overflow:hidden;"><div style="background:${c[k]};height:18px;border-radius:10px;width:${pct}%;"></div></div></td><td style="padding:6px 0 6px 10px;font-size:13px;font-weight:700;color:#333;width:40px;text-align:right;">${pct}%</td></tr>`;
  }).join('');
  const list = (items: string[], pre: string) => items.map(i => `<li style="padding:4px 0;color:#333;">${pre} ${i}</li>`).join('');

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
    <div style="font-size:48px;margin-bottom:8px;">${d.profileEmoji||''}</div>
    <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:6px;">${name} est</div>
    <div style="font-size:28px;font-weight:900;color:#111;margin-bottom:6px;">${d.profileTitle}</div>
    <div style="font-size:14px;color:#666;font-style:italic;">${d.profileTagline}</div>
  </div>
  <div style="padding:24px;border-bottom:1px solid #eee;">
    <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Analyse</div>
    <div style="font-size:14px;color:#444;line-height:1.7;">${d.desc}</div>
  </div>
  <div style="padding:24px;border-bottom:1px solid #eee;">
    <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:16px;">Dimensions</div>
    <table style="width:100%;border-collapse:collapse;">${dimRows}</table>
  </div>
  ${d.strengths?.length?`<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points forts</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(d.strengths,'&#10003;')}</ul></div>`:''}
  ${d.watchPoints?.length?`<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points de vigilance</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(d.watchPoints,'&#9888;')}</ul></div>`:''}
  ${d.tips?.length?`<div style="padding:24px;border-bottom:1px solid #eee;"><div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Conseils</div><ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${list(d.tips,'&#10148;')}</ul></div>`:''}
  <div style="background:#f8f7f3;padding:24px;text-align:center;">
    <div style="font-size:13px;color:#888;">\u00c2me Animale - <a href="https://ameanimale.fr" style="color:#888;">ameanimale.fr</a></div>
    <div style="font-size:10px;color:#bbb;margin-top:12px;">Vous recevez cet email suite \u00e0 votre achat. Contact : contact@ameanimale.fr</div>
  </div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
//  API ROUTE
// ═══════════════════════════════════════════════════════════════════
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data: ReportData = await req.json();
    const { email } = data;
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });

    const html = buildEmailHTML(data);
    const animalName = data.animalName || 'votre animal';

    let pdfBuffer: Buffer | null = null;
    let pdfError: string | null = null;
    try {
      pdfBuffer = generatePdfBuffer(data);
      console.log('[send-report] PDF OK:', pdfBuffer.length, 'bytes');
    } catch (e: unknown) {
      pdfError = e instanceof Error ? e.message+'\n'+e.stack : String(e);
      console.error('[send-report] PDF FAILED:', pdfError);
    }

    const safeName = (animalName||'animal').replace(/[^a-zA-Z0-9\s-]/g,'').replace(/\s+/g,'-')||'animal';

    const { error } = await getResend().emails.send({
      from: '\u00c2me Animale <contact@ameanimale.fr>',
      to: [email],
      subject: `Rapport de ${animalName} - \u00c2me Animale`,
      html,
      headers: { 'X-Entity-Ref-ID': `rapport-${Date.now()}` },
      ...(pdfBuffer ? { attachments: [{ filename: `rapport-${safeName}.pdf`, content: pdfBuffer }] } : {}),
    });

    if (error) {
      console.error('[send-report] Resend error:', JSON.stringify(error));
      return NextResponse.json({ error: 'Erreur envoi email', details: error, pdfError }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pdfAttached: !!pdfBuffer, pdfError });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message+'\n'+err.stack : String(err);
    console.error('[send-report] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
