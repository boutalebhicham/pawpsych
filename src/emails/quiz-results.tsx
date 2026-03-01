import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface QuizResultsEmailProps {
  petName: string;
  profileTitle: string;
  resultsUrl: string;
}

export default function QuizResultsEmail({
  petName = 'votre animal',
  profileTitle = 'Profil unique',
  resultsUrl = '#',
}: QuizResultsEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Les résultats de {petName} sont prêts — découvrez son profil !
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerAccent} />
            <Text style={brandName}>Âme Animale</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={pawEmoji}>🐾</Text>
            <Heading style={heroTitle}>
              Les résultats de {petName} sont prêts !
            </Heading>
            <Text style={profileTitleStyle}>{profileTitle}</Text>
            <Text style={heroSubtitle}>
              Nous avons analysé les réponses du questionnaire et créé le profil
              de personnalité de {petName}. Découvrez-le maintenant.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={resultsUrl} style={ctaButton}>
              Voir les résultats
            </Link>
            <Text style={ctaHint}>
              Ce lien est permanent — vous pouvez y revenir à tout moment.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Upsell */}
          <Section style={upsellSection}>
            <Text style={upsellTitle}>Envie d'aller plus loin ?</Text>
            <Text style={upsellText}>
              Le rapport complet inclut une analyse approfondie, des conseils
              personnalisés, un guide de compatibilité et un PDF détaillé à
              garder.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerBrand}>Âme Animale</Text>
            <Link href="https://ameanimale.fr" style={footerLink}>
              ameanimale.fr
            </Link>
            <Text style={footerLegal}>
              Vous recevez cet email car vous avez complété le questionnaire Âme
              Animale.
              <br />
              Contact : contact@ameanimale.fr
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──

const main: React.CSSProperties = {
  backgroundColor: '#f8f7f3',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const header: React.CSSProperties = {
  backgroundColor: '#111111',
  padding: '32px 24px 28px',
  textAlign: 'center' as const,
};

const headerAccent: React.CSSProperties = {
  height: '3px',
  backgroundColor: '#3b82f6',
  margin: '-32px -24px 20px',
  fontSize: '0',
  lineHeight: '0',
};

const brandName: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 900,
  color: '#ffffff',
  margin: '0',
  letterSpacing: '0.5px',
};

const heroSection: React.CSSProperties = {
  padding: '40px 32px 32px',
  textAlign: 'center' as const,
};

const pawEmoji: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 16px',
  lineHeight: '1',
};

const heroTitle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 900,
  color: '#111111',
  margin: '0 0 10px',
  lineHeight: '1.3',
};

const profileTitleStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 700,
  color: '#3b82f6',
  backgroundColor: '#eff6ff',
  padding: '6px 16px',
  borderRadius: '20px',
  margin: '0 0 16px',
};

const heroSubtitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#666666',
  margin: '0',
  lineHeight: '1.7',
};

const divider: React.CSSProperties = {
  borderColor: '#f0f0ee',
  margin: '0 24px',
};

const ctaSection: React.CSSProperties = {
  padding: '32px 32px',
  textAlign: 'center' as const,
};

const ctaButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 700,
  padding: '16px 40px',
  borderRadius: '8px',
  textDecoration: 'none',
};

const ctaHint: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  margin: '14px 0 0',
};

const upsellSection: React.CSSProperties = {
  padding: '24px 32px',
  backgroundColor: '#faf9f6',
  textAlign: 'center' as const,
};

const upsellTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#111111',
  margin: '0 0 8px',
};

const upsellText: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
  lineHeight: '1.6',
};

const footer: React.CSSProperties = {
  backgroundColor: '#faf9f6',
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #f0efeb',
};

const footerBrand: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#111111',
  margin: '0 0 4px',
};

const footerLink: React.CSSProperties = {
  fontSize: '13px',
  color: '#3b82f6',
  textDecoration: 'none',
};

const footerLegal: React.CSSProperties = {
  fontSize: '11px',
  color: '#bbbbbb',
  margin: '16px 0 0',
  lineHeight: '1.6',
};
