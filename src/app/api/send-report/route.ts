import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

const DIM_LABELS: Record<string, string> = {
  SOC: 'Sociabilite',
  ENG: 'Energie',
  ATT: 'Attachement',
  SEN: 'Sensibilite',
  INT: 'Intelligence',
};

// ── Simple PDF Generation ──
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
    try {
      const chunks: Uint8Array[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (c: Uint8Array) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e: Error) => reject(e));

      const name = data.animalName || 'Votre animal';
      const pw = 495; // page width minus margins

      // ── PAGE 1: COVER ──
      doc.rect(0, 0, 595, 842).fill('#111');
      doc.fillColor('#888').font('Helvetica').fontSize(14).text('Ame Animale', 50, 300, { width: pw, align: 'center' });
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(28).text(data.profileTitle || 'Profil', 50, 340, { width: pw, align: 'center' });
      doc.fillColor('#aaa').font('Helvetica').fontSize(13).text(data.profileTagline || '', 50, 390, { width: pw, align: 'center' });
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text(name, 50, 450, { width: pw, align: 'center' });
      doc.fillColor('#666').font('Helvetica').fontSize(9).text('ameanimale.fr', 50, 780, { width: pw, align: 'center' });

      // ── PAGE 2: CONTENT ──
      doc.addPage();

      // Analyse
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(18).text('Analyse');
      doc.moveDown(0.5);
      doc.fillColor('#444').font('Helvetica').fontSize(10).text(data.desc || '', { width: pw, lineGap: 3 });

      // Dimensions
      doc.moveDown(1);
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(16).text('Dimensions');
      doc.moveDown(0.5);
      const dims = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'];
      for (const k of dims) {
        const pct = data.dimensions?.[k] || 50;
        doc.fillColor('#444').font('Helvetica').fontSize(10)
          .text(DIM_LABELS[k] + ': ' + pct + '%', { width: pw });
      }

      // Points forts
      if (data.strengths?.length) {
        doc.moveDown(1);
        doc.fillColor('#111').font('Helvetica-Bold').fontSize(16).text('Points forts');
        doc.moveDown(0.3);
        for (const s of data.strengths) {
          doc.fillColor('#444').font('Helvetica').fontSize(10).text('  + ' + s, { width: pw, lineGap: 2 });
        }
      }

      // Points de vigilance
      if (data.watchPoints?.length) {
        doc.moveDown(1);
        doc.fillColor('#111').font('Helvetica-Bold').fontSize(16).text('Points de vigilance');
        doc.moveDown(0.3);
        for (const w of data.watchPoints) {
          doc.fillColor('#444').font('Helvetica').fontSize(10).text('  ! ' + w, { width: pw, lineGap: 2 });
        }
      }

      // Conseils
      if (data.tips?.length) {
        doc.moveDown(1);
        doc.fillColor('#111').font('Helvetica-Bold').fontSize(16).text('Conseils');
        doc.moveDown(0.3);
        for (const t of data.tips) {
          doc.fillColor('#444').font('Helvetica').fontSize(10).text('  > ' + t, { width: pw, lineGap: 2 });
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fillColor('#bbb').font('Helvetica').fontSize(8).text('Ame Animale - ameanimale.fr', { width: pw, align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
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
    <div style="font-size:10px;color:#bbb;margin-top:12px;">Vous recevez cet email suite a votre achat sur ameanimale.fr. Contact : contact@ameanimale.fr</div>
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

    // Generate PDF
    let pdfBuffer: Buffer | null = null;
    let pdfError: string | null = null;
    try {
      pdfBuffer = await generatePdfBuffer(data);
      console.log('[send-report] PDF OK, size:', pdfBuffer.length);
    } catch (e: unknown) {
      pdfError = e instanceof Error ? e.message : String(e);
      console.error('[send-report] PDF FAILED:', pdfError);
    }

    const safeName = (animalName || 'animal').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') || 'animal';

    const emailPayload: Parameters<typeof getResend extends () => infer R ? R['emails']['send'] : never>[0] = {
      from: '\u00c2me Animale <contact@ameanimale.fr>',
      to: [email],
      subject: `Rapport de ${animalName} - Ame Animale`,
      html,
      headers: {
        'X-Entity-Ref-ID': `rapport-${Date.now()}`,
      },
    };

    if (pdfBuffer) {
      (emailPayload as Record<string, unknown>).attachments = [
        { filename: `rapport-${safeName}.pdf`, content: pdfBuffer },
      ];
    }

    const { error } = await getResend().emails.send(emailPayload as Parameters<ReturnType<typeof getResend>['emails']['send']>[0]);

    if (error) {
      console.error('[send-report] Resend error:', error);
      return NextResponse.json({ error: 'Erreur envoi email', details: error, pdfError }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pdfAttached: !!pdfBuffer, pdfError });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[send-report] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
