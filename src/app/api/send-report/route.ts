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
    .map((s) => `<li style="padding:4px 0;color:#333;">✅ ${s}</li>`)
    .join('');

  const watchList = data.watchPoints
    .map((w) => `<li style="padding:4px 0;color:#333;">⚠️ ${w}</li>`)
    .join('');

  const tipsList = data.tips
    .map((t) => `<li style="padding:4px 0;color:#333;">💡 ${t}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <!-- Header -->
    <div style="background:#111;padding:32px 24px;text-align:center;">
      <div style="font-size:24px;margin-bottom:8px;">🐾</div>
      <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Âme Animale</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Rapport de personnalité</div>
    </div>

    <!-- Profile Hero -->
    <div style="background:linear-gradient(135deg,#f8f7f3,#fff);padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
      <div style="font-size:48px;margin-bottom:8px;">${data.profileEmoji}</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:6px;">${name} est</div>
      <div style="font-size:28px;font-weight:900;color:#111;letter-spacing:-1px;margin-bottom:6px;">${data.profileTitle}</div>
      <div style="font-size:14px;color:#666;font-style:italic;">${data.profileTagline}</div>
    </div>

    <!-- Description -->
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">📋 Analyse</div>
      <div style="font-size:14px;color:#444;line-height:1.7;">${data.desc}</div>
    </div>

    <!-- Dimensions -->
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:16px;">📊 Dimensions comportementales</div>
      <table style="width:100%;border-collapse:collapse;">${dimBars}</table>
    </div>

    <!-- Strengths -->
    ${data.strengths.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">💪 Points forts</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${strengthsList}</ul>
    </div>` : ''}

    <!-- Watch Points -->
    ${data.watchPoints.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">👀 Points de vigilance</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${watchList}</ul>
    </div>` : ''}

    <!-- Tips -->
    ${data.tips.length > 0 ? `
    <div style="padding:24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:12px;">🎯 Conseils personnalisés</div>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;line-height:1.7;">${tipsList}</ul>
    </div>` : ''}

    <!-- Footer -->
    <div style="background:#f8f7f3;padding:24px;text-align:center;">
      <div style="font-size:13px;color:#888;line-height:1.6;">
        🐾 <strong>Âme Animale</strong> — Comprenez votre animal<br>
        <span style="font-size:12px;">ameanimale.fr</span>
      </div>
    </div>

  </div>
</body>
</html>`;
}

export const dynamic = 'force-dynamic';


// Generate PDF buffer from report data
async function generatePdfBuffer(data: {
  animalName: string;
  animalType: string;
  scores: Record<string, number>;
  profile: string;
  recommendations: string[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#4a6741')
       .text('Rapport de personnalité', { align: 'center' });
    doc.fontSize(18).fillColor('#333')
       .text(`${data.animalName} — Âme Animale`, { align: 'center' });
    doc.moveDown(1);

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#4a6741').lineWidth(2).stroke();
    doc.moveDown(1);

    // Animal type
    doc.fontSize(13).font('Helvetica').fillColor('#555')
       .text(`Type d'animal : ${data.animalType}`, { align: 'left' });
    doc.moveDown(0.5);

    // Profile
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333')
       .text('Profil de personnalité :', { underline: false });
    doc.fontSize(12).font('Helvetica').fillColor('#444')
       .text(data.profile);
    doc.moveDown(1);

    // Scores
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333')
       .text('Scores par dimension :');
    doc.moveDown(0.3);
    const dimLabels: Record<string, string> = {
      SOC: 'Sociabilité', ENG: 'Énergie', ATT: 'Attachement',
      SEN: 'Sensibilité', CUR: 'Curiosité', ADP: 'Adaptabilité'
    };
    for (const [key, value] of Object.entries(data.scores)) {
      const label = dimLabels[key] || key;
      const pct = Math.round(value * 100);
      doc.fontSize(11).font('Helvetica').fillColor('#555')
         .text(`  • ${label} : ${pct}%`);
    }
    doc.moveDown(1);

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333')
         .text('Recommandations :');
      doc.moveDown(0.3);
      for (const rec of data.recommendations) {
        doc.fontSize(11).font('Helvetica').fillColor('#444')
           .text(`  → ${rec}`);
      }
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#999').text('© Âme Animale — ameanimale.fr', { align: 'center' });

    doc.end();
  });
}

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
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePdfBuffer({
        animalName,
        animalType: data.animalType || '',
        scores: (data.scores || {}) as Record<string, number>,
        profile: data.profileDescription || data.profile || '',
        recommendations: data.recommendations || [],
      });
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
    }

    const { error } = await getResend().emails.send({
      from: 'Âme Animale <contact@ameanimale.fr>',
      headers: {
        'X-Mailer': 'Âme Animale v1.0',
        'List-Unsubscribe': '<mailto:contact@ameanimale.fr?subject=unsubscribe>',
      },
      to: [email],
      subject: `🐾 Rapport de personnalité de ${animalName} — Âme Animale`,
      html,
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
