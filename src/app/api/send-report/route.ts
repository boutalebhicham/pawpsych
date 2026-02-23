import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

const DIM_LABELS: Record<string, string> = {
  SOC: 'Sociabilité',
  ENG: 'Énergie',
  ATT: 'Attachement',
  SEN: 'Sensibilité',
  INT: 'Intelligence',
};

const DIM_COLORS: Record<string, string> = {
  SOC: '#3b82f6',
  ENG: '#f59e0b',
  ATT: '#ef4444',
  SEN: '#8b5cf6',
  INT: '#10b981',
};

// ── PDF Generation ──
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
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const name = data.animalName || (data.animalType === 'chien' ? 'Votre chien' : 'Votre chat');
    const W = 595.28;
    const M = 50;
    const pageW = W - M * 2;

    // ── COVER PAGE ──
    doc.rect(0, 0, W, 841.89).fill('#111111');
    doc.font('Helvetica').fontSize(14).fillColor('#666666').text('Ame Animale', M, 280, { width: pageW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#ffffff').text(data.profileTitle, M, 320, { width: pageW, align: 'center' });
    doc.font('Helvetica').fontSize(14).fillColor('#999999').text(data.profileTagline, M, 380, { width: pageW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text(name, M, 440, { width: pageW, align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text('Rapport de personnalite - ameanimale.fr', M, 780, { width: pageW, align: 'center' });

    // ── PAGE 2: ANALYSE ──
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#111111').text('Analyse', M, M);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor('#444444').text(data.desc, { width: pageW, lineGap: 4 });

    // ── DIMENSIONS ──
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text('Dimensions comportementales');
    doc.moveDown(0.8);

    const dims = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'];
    for (const k of dims) {
      const pct = data.dimensions[k] || 50;
      const y = doc.y;
      doc.font('Helvetica').fontSize(11).fillColor('#555555').text(DIM_LABELS[k] + ':', M, y, { continued: false });
      // Bar background
      const barX = M + 120;
      const barW = 280;
      const barH = 12;
      doc.save();
      doc.roundedRect(barX, y + 2, barW, barH, 6).fill('#eeeeee');
      doc.roundedRect(barX, y + 2, Math.max(8, (pct / 100) * barW), barH, 6).fill(DIM_COLORS[k]);
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text(pct + '%', barX + barW + 12, y);
      doc.x = M;
      doc.y = y + 26;
    }

    // ── POINTS FORTS ──
    if (data.strengths && data.strengths.length > 0) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text('Points forts');
      doc.moveDown(0.3);
      for (const s of data.strengths) {
        doc.font('Helvetica').fontSize(11).fillColor('#444444').text('  +  ' + s, { width: pageW, lineGap: 2 });
      }
    }

    // ── POINTS DE VIGILANCE ──
    if (data.watchPoints && data.watchPoints.length > 0) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text('Points de vigilance');
      doc.moveDown(0.3);
      for (const w of data.watchPoints) {
        doc.font('Helvetica').fontSize(11).fillColor('#444444').text('  !  ' + w, { width: pageW, lineGap: 2 });
      }
    }

    // ── CONSEILS ──
    if (data.tips && data.tips.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text('Conseils personnalises');
      doc.moveDown(0.3);
      for (const t of data.tips) {
        doc.font('Helvetica').fontSize(11).fillColor('#444444').text('  >  ' + t, { width: pageW, lineGap: 2 });
      }
    }

    // ── FOOTER ──
    doc.moveDown(3);
    doc.font('Helvetica').fontSize(9).fillColor('#999999').text('Ame Animale - ameanimale.fr', M, undefined, { width: pageW, align: 'center' });

    doc.end();
  });
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

  const dimBars = ['SOC', 'ENG', 'ATT', 'SEN', 'INT']
    .map((k) => {
      const pct = data.dimensions[k] || 50;
      const color = DIM_COLORS[k];
      return `
      <tr>
        <td style="padding:6px 12px 6px 0;font-size:13px;font-weight:600;color:#555;width:110px;">${DIM_LABELS[k]}</td>
        <td style="padding:6px 0;">
          <div style="background:#f0f0f0;border-radius:10px;height:18px;width:100%;overflow:hidden;">
            <div style="background:${color};height:18px;border-radius:10px;width:${pct}%;"></div>
          </div>
        </td>
        <td style="padding:6px 0 6px 10px;font-size:13px;font-weight:700;color:#333;width:40px;text-align:right;">${pct}%</td>
      </tr>`;
    })
    .join('');

  const strengthsList = data.strengths
    .map((s) => `<li style="padding:4px 0;color:#333;">&#10003; ${s}</li>`)
    .join('');

  const watchList = data.watchPoints
    .map((w) => `<li style="padding:4px 0;color:#333;">&#9888; ${w}</li>`)
    .join('');

  const tipsList = data.tips
    .map((t) => `<li style="padding:4px 0;color:#333;">&#10148; ${t}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <div style="background:#111;padding:32px 24px;text-align:center;">
      <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Ame Animale</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Rapport de personnalite</div>
    </div>

    <div style="padding:24px 24px 16px;font-size:14px;color:#444;line-height:1.7;">
      ${greeting}<br>Voici le rapport de personnalite complet de <strong>${name}</strong>. Vous trouverez egalement le rapport en PDF en piece jointe.
    </div>

    <div style="background:linear-gradient(135deg,#f8f7f3,#fff);padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
      <div style="font-size:48px;margin-bottom:8px;">${data.profileEmoji}</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:6px;">${name} est</div>
      <div style="font-size:28px;font-weight:900;color:#111;letter-spacing:-1px;margin-bottom:6px;">${data.profileTitle}</div>
      <div style="font-size:14px;color:#666;font-style:italic;">${data.profileTagline}</div>
    </div>

    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Analyse</div>
      <div style="font-size:14px;color:#444;line-height:1.7;">${data.desc}</div>
    </div>

    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:16px;">Dimensions comportementales</div>
      <table style="width:100%;border-collapse:collapse;">${dimBars}</table>
    </div>

    ${data.strengths.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points forts</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${strengthsList}</ul>
    </div>` : ''}

    ${data.watchPoints.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Points de vigilance</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${watchList}</ul>
    </div>` : ''}

    ${data.tips.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">Conseils personnalises</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${tipsList}</ul>
    </div>` : ''}

    <div style="background:#f8f7f3;padding:24px;text-align:center;">
      <div style="font-size:13px;color:#888;line-height:1.6;">
        <strong>Ame Animale</strong> — Comprenez votre animal<br>
        <a href="https://ameanimale.fr" style="color:#888;font-size:12px;">ameanimale.fr</a>
      </div>
      <div style="font-size:10px;color:#bbb;margin-top:12px;">
        Vous recevez cet email car vous avez achete un rapport sur ameanimale.fr.<br>
        Pour toute question : contact@ameanimale.fr
      </div>
    </div>

  </div>
</body>
</html>`;
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
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const html = buildEmailHTML(data);
    const animalName = data.animalName || 'votre animal';

    // Generate PDF attachment
    let pdfBase64: string | null = null;
    try {
      const buf = await generatePdfBuffer(data);
      pdfBase64 = buf.toString('base64');
      console.log('PDF generated successfully, size:', buf.length, 'bytes');
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
    }

    const safeName = (animalName || 'animal').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ\s-]/g, '').replace(/\s+/g, '-');

    const { error } = await getResend().emails.send({
      from: 'Âme Animale <contact@ameanimale.fr>',
      to: [email],
      subject: `Rapport de personnalité de ${animalName} — Âme Animale`,
      html,
      headers: {
        'X-Entity-Ref-ID': `rapport-${Date.now()}`,
        'List-Unsubscribe': '<mailto:contact@ameanimale.fr?subject=unsubscribe>',
      },
      attachments: pdfBase64
        ? [{ filename: `rapport-${safeName}.pdf`, content: Buffer.from(pdfBase64, 'base64') }]
        : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Send report error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
