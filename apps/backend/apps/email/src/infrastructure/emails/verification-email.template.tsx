import * as React from 'react';
import {
  Body,
  Text,
  Head,
  Html,
  Button,
  Section,
  Heading,
  Container,
} from '@react-email/components';

interface VerificationEmailProps {
  translations: {
    body: string;
    subject: string;
    warning: string;
    button: string;
    footer: string;
  };
  verificationCode: string;
  verificationLink?: string;
}

export const VerificationEmail = ({
  translations,
  verificationCode,
  verificationLink,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{translations.subject}</Heading>
        <Text style={paragraph}>{translations.body}</Text>

        <Section style={codeContainer}>
          <code style={code}>{verificationCode}</code>
        </Section>

        <Text style={paragraph}>{translations.warning}</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={verificationLink}>
            {translations.button}
          </Button>
        </Section>

        <Text style={footerText}>{translations.footer}</Text>
      </Container>
    </Body>
  </Html>
);

VerificationEmail.PreviewProps = {
  verificationCode: 'VERIFY123',
  verificationLink: 'https://example.com/verify',
  translations: {
    body: 'Enter your verification code below to verify your email address:',
    subject: 'Verify your email address',
    warning:
      "If you didn't request this verification, you can safely ignore this email.",
    button: 'Verify Email Address',
    footer:
      "If you didn't request this verification, you can safely ignore this email.",
  },
} as VerificationEmailProps;

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  padding: '40px 0',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px',
  maxWidth: '560px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#1a1a1a',
  textAlign: 'center' as const,
  padding: '0 0 20px',
};

const paragraph = {
  margin: '0 0 20px',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4a5568',
  textAlign: 'center' as const,
};

const codeContainer = {
  margin: '30px 0',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
  maxWidth: '100%',
  padding: '0 20px',
};

const code = {
  fontFamily: 'monospace',
  fontWeight: '500',
  padding: '16px',
  backgroundColor: '#f8fafc',
  fontSize: '14px',
  borderRadius: '8px',
  color: '#1a1a1a',
  border: '1px solid #e2e8f0',
  display: 'inline-block',
  width: '100%',
  wordWrap: 'break-word',
  boxSizing: 'border-box' as const,
  lineHeight: '1.5',
};

const buttonContainer = {
  padding: '20px 0 30px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
  border: 'none',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const footerText = {
  fontSize: '14px',
  color: '#718096',
  textAlign: 'center' as const,
  margin: '30px 0 0',
};
