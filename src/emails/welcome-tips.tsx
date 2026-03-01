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

interface WelcomeTipsEmailProps {
  prenom: string;
  animalName: string;
  animalType: string;
  profileTitle: string;
  profileEmoji: string;
  tips: string[];
  activities?: string[];
  strengths?: string[];
  resultsUrl?: string;
}

export default function WelcomeTipsEmail({
  prenom = 'Client',
  animalName = 'votre animal',
  animalType = 'chien',
  profileTitle = 'Profil unique',
  profileEmoji = '🐾',
  tips = [],
  activities = [],
  strengths = [],
  resultsUrl,
}: WelcomeTipsEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Nos meilleurs conseils pour {animalName} — profitez de votre rapport !
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerAccent} />
            <Text style={brandName}>Âme Animale</Text>
            <Text style={brandSub}>Guide personnalisé</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={emojiLarge}>{profileEmoji}</Text>
            <Heading style={heroTitle}>
              Les clés pour comprendre {animalName}
            </Heading>
            <Text style={heroSubtitle}>
              {prenom}, voici un guide rapide basé sur le profil «{' '}
              {profileTitle} » de {animalName}.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Strengths recap */}
          {strengths.length > 0 && (
            <>
              <Section style={contentSection}>
                <Row style={sectionHeader}>
                  <Column style={iconCol}>
                    <Text style={sectionIcon}>⭐</Text>
                  </Column>
                  <Column>
                    <Text style={sectionTitle}>
                      Ce qui rend {animalName} unique
                    </Text>
                  </Column>
                </Row>

                {strengths.slice(0, 3).map((s, i) => (
                  <Section key={i} style={strengthCard}>
                    <Row>
                      <Column style={strengthBulletCol}>
                        <Text style={strengthBullet}>{i + 1}</Text>
                      </Column>
                      <Column>
                        <Text style={strengthText}>{s}</Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <>
              <Section style={contentSection}>
                <Row style={sectionHeader}>
                  <Column style={iconCol}>
                    <Text style={sectionIcon}>💡</Text>
                  </Column>
                  <Column>
                    <Text style={sectionTitle}>Conseils du jour</Text>
                  </Column>
                </Row>

                {tips.slice(0, 4).map((tip, i) => (
                  <Section key={i} style={tipCard}>
                    <Text style={tipText}>
                      <span style={tipArrow}>→</span> {tip}
                    </Text>
                  </Section>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <>
              <Section style={contentSection}>
                <Row style={sectionHeader}>
                  <Column style={iconCol}>
                    <Text style={sectionIcon}>🎯</Text>
                  </Column>
                  <Column>
                    <Text style={sectionTitle}>Activités recommandées</Text>
                  </Column>
                </Row>

                <Section style={activitiesGrid}>
                  {activities.slice(0, 4).map((act, i) => (
                    <Section key={i} style={activityPill}>
                      <Text style={activityText}>{act}</Text>
                    </Section>
                  ))}
                </Section>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaTitle}>Votre rapport complet</Text>
            <Text style={ctaText}>
              Le rapport PDF envoyé par email contient bien plus : analyse
              détaillée, compatibilité, erreurs à éviter et une synthèse
              complète du profil de {animalName}.
            </Text>
            {resultsUrl && (
              <Link href={resultsUrl} style={ctaButton}>
                Revoir les résultats
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
};

const emojiLarge: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 16px',
  lineHeight: '1',
};

const heroTitle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#111111',
  margin: '0 0 12px',
  lineHeight: '1.3',
};

const heroSubtitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#666666',
  margin: '0',
  lineHeight: '1.6',
};

const divider: React.CSSProperties = {
  borderColor: '#f0f0ee',
  margin: '0 24px',
};

const contentSection: React.CSSProperties = {
  padding: '28px 32px',
};

const sectionHeader: React.CSSProperties = {
  marginBottom: '16px',
};

const iconCol: React.CSSProperties = {
  width: '36px',
  verticalAlign: 'middle' as const,
};

const sectionIcon: React.CSSProperties = {
  fontSize: '22px',
  margin: '0',
  lineHeight: '1',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111111',
  margin: '0',
};

const strengthCard: React.CSSProperties = {
  marginBottom: '10px',
  backgroundColor: '#f0fdf4',
  borderRadius: '10px',
  padding: '14px 16px',
  borderLeft: '3px solid #10b981',
};

const strengthBulletCol: React.CSSProperties = {
  width: '30px',
  verticalAlign: 'top' as const,
};

const strengthBullet: React.CSSProperties = {
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

const strengthText: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  margin: '0',
  lineHeight: '1.5',
};

const tipCard: React.CSSProperties = {
  marginBottom: '8px',
  backgroundColor: '#fffbeb',
  borderRadius: '10px',
  padding: '14px 18px',
  borderLeft: '3px solid #f59e0b',
};

const tipText: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  margin: '0',
  lineHeight: '1.6',
};

const tipArrow: React.CSSProperties = {
  color: '#f59e0b',
  fontWeight: 700,
};

const activitiesGrid: React.CSSProperties = {
  padding: '0',
};

const activityPill: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#eff6ff',
  borderRadius: '20px',
  padding: '10px 18px',
  margin: '0 8px 8px 0',
  border: '1px solid #dbeafe',
};

const activityText: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#3b82f6',
  margin: '0',
};

const ctaSection: React.CSSProperties = {
  padding: '32px 32px',
  textAlign: 'center' as const,
  backgroundColor: '#faf9f6',
};

const ctaTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111111',
  margin: '0 0 8px',
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
