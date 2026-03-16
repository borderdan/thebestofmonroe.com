import { Html, Body, Head, Heading, Container, Preview, Text, Section, Button } from '@react-email/components';
import * as React from 'react';

interface WelcomeTemplateProps {
  businessName: string;
  dashboardUrl: string;
}

export const WelcomeTemplate = ({ businessName, dashboardUrl }: WelcomeTemplateProps) => (
  <Html>
    <Head />
    <Preview>Welcome to The Best of Monroe - Workspace initialized</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }}>
        <Section style={{ padding: '0 48px' }}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>Welcome to The Best of Monroe</Heading>
          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#525f7f' }}>
            Hello {businessName},
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#525f7f' }}>
            Your tenant workspace is active. You can now configure your point of sale, manage inventory, and handle SAT compliance.
          </Text>
          <Button href={dashboardUrl} style={{ backgroundColor: '#000000', borderRadius: '5px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%', padding: '12px', marginTop: '24px' }}>
            Access Dashboard
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeTemplate;