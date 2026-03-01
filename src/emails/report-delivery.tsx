import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Dimension {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface ReportDeliveryEmailProps {
  prenom: string;
  animalName: string;
  animalType: string;
  profileTitle: string;
  profileTagline: string;
  profileEmoji: string;
  desc: string;
  dimensions: Record<string, number>;
  strengths: string[];
  watchPoints: string[];
  resultsUrl?: string;
}

const DIM_CONFIG: Record<string, { label: string; color: string }> = {
  SOC: { label: 'Sociabilité', color: '#3b82f6' },
  ENG: { label: 'Énergie', color: '#f59e0b' },
  ATT: { label: 'Attachement', color: '#ef4444' },
  SEN: { label: 'Sensibilité', color: '#8b5cf6' },
  INT: { label: 'Intelligence', color: '#10b981' },
};

export default function ReportDeliveryEmail({
  prenom = 'Client',
  animalName = 'votre animal',
  animalType = 'chien',
  profileTitle = 'Profil unique',
  profileTagline = '',
  profileEmoji = '🐾',
  desc = '',
  dimensions = { SOC: 70, ENG: 55, ATT: 80, SEN: 45, INT: 65 },
  strengths = [],
  watchPoints = [],
  resultsUrl,
}: ReportDeliveryEmailProps) {
  const dims: Dimension[] = ['SOC', 'ENG', 'ATT', 'SEN', 'INT'].map((k) => ({
    key: k,
    label: DIM_CONFIG[k].label,
    value: dimensions[k] || 50,
    color: DIM_CONFIG[k].color,
  }));

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Le rapport de {animalName} est prêt — {profileTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerAccent} />
            <Text style={brandName}>Âme Animale</Text>
            <Text style={brandSub}>Rapport de personnalité</Text>
          </Section>

          {/* Hero profile card */}
          <Section style={heroSection}>
            <Text style={emojiDisplay}>{profileEmoji}</Text>
            <Text style={profileLabel}>{animalName} est</Text>
            <Heading style={profileTitleStyle}>{profileTitle}</Heading>
            <Text style={taglineStyle}>{profileTagline}</Text>
          </Section>

          <Hr style={divider} />

          {/* Greeting + intro */}
          <Section style={contentSection}>
            <Text style={greeting}>
              {prenom ? `Bonjour ${prenom},` : 'Bonjour,'}
            </Text>
            <Text style={introText}>
              Le rapport complet de <strong>{animalName}</strong> est prêt ! Vous
              trouverez le <strong>PDF détaillé en pièce jointe</strong> de cet
              email. Voici un aperçu de son profil.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Description */}
          <Section style={contentSection}>
            <Text style={sectionTitle}>Analyse</Text>
            <Text style={descText}>{desc}</Text>
          </Section>

          <Hr style={divider} />

          {/* Dimensions */}
          <Section style={contentSection}>
            <Text style={sectionTitle}>Dimensions comportementales</Text>

            {dims.map((dim) => (
              <Section key={dim.key} style={dimRow}>
                <Row>
                  <Column style={dimLabelCol}>
                    <Text style={dimLabel}>{dim.label}</Text>
                  </Column>
                  <Column style={dimValueCol}>
                    <Text style={dimValue}>{dim.value}%</Text>
                  </Column>
                </Row>
                <Section style={barTrack}>
                  <Section
                    style={{
                      ...barFill,
                      backgroundColor: dim.color,
                      width: `${dim.value}%`,
                    }}
                  />
                </Section>
              </Section>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Strengths & Watch points */}
          {strengths.length > 0 && (
            <>
              <Section style={contentSection}>
                <Text style={sectionTitle}>Points forts</Text>
                {strengths.map((s, i) => (
                  <Section key={i} style={listItem}>
                    <Row>
                      <Column style={bulletCol}>
                        <Text style={bulletGreen}>✓</Text>
                      </Column>
                      <Column>
                        <Text style={listText}>{s}</Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {watchPoints.length > 0 && (
            <>
              <Section style={contentSection}>
                <Text style={sectionTitle}>Points de vigilance</Text>
                {watchPoints.map((w, i) => (
                  <Section key={i} style={listItem}>
                    <Row>
                      <Column style={bulletCol}>
                        <Text style={bulletOrange}>!</Text>
                      </Column>
                      <Column>
                        <Text style={listText}>{w}</Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Le rapport PDF complet est en pièce jointe avec toutes les
              sections : analyse comportementale, conseils personnalisés,
              compatibilité et synthèse.
            </Text>
            {resultsUrl && (
              <Link href={resultsUrl} style={ctaButton}>
                Voir les résultats en ligne
              </Link>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerBrand}>Âme Animale</Text>
            <Link href="https://ameanimale.fr" style={footerLink}>
              ameanimale.fr
            </Link>
            <Text style={footerLegal}>
              Vous recevez cet email suite à votre achat.
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

const brandSub: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.5)',
  margin: '4px 0 0',
};

const heroSection: React.CSSProperties = {
  padding: '36px 32px 28px',
  textAlign: 'center' as const,
  backgroundColor: '#faf9f6',
  borderBottom: '1px solid #f0efeb',
};

const emojiDisplay: React.CSSProperties = {
  fontSize: '56px',
  margin: '0 0 12px',
  lineHeight: '1',
};

const profileLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#999999',
  margin: '0 0 8px',
};

const profileTitleStyle: React.CSSProperties = {
  fontSize: '30px',
  fontWeight: 900,
  color: '#111111',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const taglineStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#666666',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '1.5',
};

const divider: React.CSSProperties = {
  borderColor: '#f0f0ee',
  margin: '0 24px',
};

const contentSection: React.CSSProperties = {
  padding: '24px 32px',
};

const greeting: React.CSSProperties = {
  fontSize: '15px',
  color: '#444444',
  margin: '0 0 8px',
  lineHeight: '1.7',
};

const introText: React.CSSProperties = {
  fontSize: '15px',
  color: '#444444',
  margin: '0',
  lineHeight: '1.7',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111111',
  margin: '0 0 16px',
};

const descText: React.CSSProperties = {
  fontSize: '14px',
  color: '#444444',
  lineHeight: '1.7',
  margin: '0',
};

const dimRow: React.CSSProperties = {
  marginBottom: '14px',
};

const dimLabelCol: React.CSSProperties = {
  width: '120px',
};

const dimLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#555555',
  margin: '0',
};

const dimValueCol: React.CSSProperties = {
  textAlign: 'right' as const,
};

const dimValue: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#333333',
  margin: '0',
};

const barTrack: React.CSSProperties = {
  backgroundColor: '#f0f0f0',
  borderRadius: '10px',
  height: '10px',
  width: '100%',
  overflow: 'hidden' as const,
  marginTop: '4px',
};

const barFill: React.CSSProperties = {
  height: '10px',
  borderRadius: '10px',
  minWidth: '10px',
};

const listItem: React.CSSProperties = {
  marginBottom: '8px',
};

const bulletCol: React.CSSProperties = {
  width: '28px',
  verticalAlign: 'top' as const,
};

const bulletGreen: React.CSSProperties = {
  width: '22px',
  height: '22px',
  lineHeight: '22px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0',
};

const bulletOrange: React.CSSProperties = {
  width: '22px',
  height: '22px',
  lineHeight: '22px',
  borderRadius: '50%',
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0',
};

const listText: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  margin: '0',
  lineHeight: '1.6',
  paddingLeft: '8px',
};

const ctaSection: React.CSSProperties = {
  padding: '28px 32px',
  textAlign: 'center' as const,
  backgroundColor: '#faf9f6',
};

const ctaText: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 20px',
  lineHeight: '1.6',
};

const ctaButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
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
