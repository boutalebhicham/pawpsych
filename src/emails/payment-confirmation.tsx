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

interface PaymentConfirmationEmailProps {
  prenom: string;
  animalName: string;
  animalType: string;
  profileEmoji?: string;
}

export default function PaymentConfirmationEmail({
  prenom = 'Client',
  animalName = 'votre animal',
  animalType = 'chien',
  profileEmoji = '🐾',
}: PaymentConfirmationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Paiement confirmé — le rapport de {animalName} arrive !</Preview>
      <Body style={main}>
        {/* Header */}
        <Container style={container}>
          <Section style={header}>
            <Text style={headerAccent} />
            <Text style={brandName}>Âme Animale</Text>
            <Text style={brandSub}>Confirmation de commande</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={checkIcon}>✓</Text>
            <Heading style={heroTitle}>Paiement confirmé</Heading>
            <Text style={heroSubtitle}>
              Merci {prenom} ! Votre commande a bien été enregistrée.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Order summary */}
          <Section style={orderSection}>
            <Text style={sectionLabel}>RÉCAPITULATIF</Text>

            <Section style={orderCard}>
              <Text style={orderEmoji}>{profileEmoji}</Text>
              <Text style={orderProduct}>
                Rapport de personnalité — {animalName}
              </Text>
              <Text style={orderDetail}>
                Analyse complète pour votre {animalType}
              </Text>
              <Hr style={orderDivider} />
              <Text style={orderPrice}>14,99 €</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* What's next */}
          <Section style={nextSection}>
            <Text style={sectionLabel}>ET MAINTENANT ?</Text>

            <Section style={stepRow}>
              <Text style={stepNumber}>1</Text>
              <Section>
                <Text style={stepTitle}>Analyse en cours</Text>
                <Text style={stepDesc}>
                  Notre algorithme analyse les réponses du questionnaire de{' '}
                  {animalName}.
                </Text>
              </Section>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>2</Text>
              <Section>
                <Text style={stepTitle}>Rapport généré</Text>
                <Text style={stepDesc}>
                  Un rapport PDF complet est en cours de création avec le profil
                  détaillé.
                </Text>
              </Section>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>3</Text>
              <Section>
                <Text style={stepTitle}>Livraison par email</Text>
                <Text style={stepDesc}>
                  Vous recevrez votre rapport complet dans quelques instants à
                  cette adresse.
                </Text>
              </Section>
            </Section>
          </Section>

          <Hr style={divider} />

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
  padding: '40px 32px 32px',
  textAlign: 'center' as const,
};

const checkIcon: React.CSSProperties = {
  width: '56px',
  height: '56px',
  lineHeight: '56px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 auto 16px',
  textAlign: 'center' as const,
};

const heroTitle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#111111',
  margin: '0 0 8px',
};

const heroSubtitle: React.CSSProperties = {
  fontSize: '16px',
  color: '#555555',
  margin: '0',
  lineHeight: '1.6',
};

const divider: React.CSSProperties = {
  borderColor: '#f0f0ee',
  margin: '0 24px',
};

const orderSection: React.CSSProperties = {
  padding: '28px 32px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  color: '#999999',
  margin: '0 0 16px',
};

const orderCard: React.CSSProperties = {
  backgroundColor: '#faf9f6',
  borderRadius: '12px',
  padding: '20px 24px',
  border: '1px solid #f0efeb',
};

const orderEmoji: React.CSSProperties = {
  fontSize: '32px',
  margin: '0 0 8px',
};

const orderProduct: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111111',
  margin: '0 0 4px',
};

const orderDetail: React.CSSProperties = {
  fontSize: '14px',
  color: '#777777',
  margin: '0',
};

const orderDivider: React.CSSProperties = {
  borderColor: '#eeeee8',
  margin: '14px 0',
};

const orderPrice: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#111111',
  margin: '0',
  textAlign: 'right' as const,
};

const nextSection: React.CSSProperties = {
  padding: '28px 32px',
};

const stepRow: React.CSSProperties = {
  marginBottom: '18px',
};

const stepNumber: React.CSSProperties = {
  display: 'inline-block',
  width: '28px',
  height: '28px',
  lineHeight: '28px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0 12px 0 0',
  verticalAlign: 'top',
};

const stepTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#111111',
  margin: '0 0 2px',
  display: 'inline-block',
};

const stepDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#777777',
  margin: '0',
  lineHeight: '1.5',
  paddingLeft: '40px',
};

const footer: React.CSSProperties = {
  backgroundColor: '#faf9f6',
  padding: '28px 32px',
  textAlign: 'center' as const,
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
