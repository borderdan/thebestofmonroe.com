import { Html, Body, Head, Heading, Container, Preview, Text, Section, Button } from '@react-email/components';
import * as React from 'react';

interface ReceiptTemplateProps {
  businessName: string;
  planName: string;
  amount: string;
  invoiceUrl: string;
}

export const ReceiptTemplate = ({ businessName, planName, amount, invoiceUrl }: ReceiptTemplateProps) => (
  <Html>
    <Head />
    <Preview>Your The Best of Monroe Subscription Receipt</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }}>
        <Section style={{ padding: '0 48px' }}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>Payment Received</Heading>
          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#525f7f' }}>
            Hi {businessName},
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#525f7f' }}>
            Thank you for your continued subscription to the The Best of Monroe <strong>{planName}</strong> tier. 
            We have successfully processed your payment of <strong>{amount}</strong>.
          </Text>
          <Button href={invoiceUrl} style={{ backgroundColor: '#000000', borderRadius: '5px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%', padding: '12px' }}>
            Download PDF Invoice
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ReceiptTemplate;
