import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type React from "react";

interface NotificationLayoutProps {
  heading: string;
  children: React.ReactNode;
  ctaUrl?: string;
  ctaLabel?: string;
  preview?: string;
}

const styles = {
  body: {
    fontFamily: "sans-serif",
    margin: 0,
    background: "#f5f5f7",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#ffffff",
  },
  header: {
    background: "#1a1a2e",
    color: "white",
    padding: "20px",
    textAlign: "center" as const,
  },
  headerTitle: {
    margin: 0,
    fontSize: "20px",
    color: "white",
  },
  main: {
    padding: "24px",
    background: "#ffffff",
  },
  heading: {
    color: "#1a1a2e",
    marginTop: 0,
  },
  ctaSection: {
    textAlign: "center" as const,
    marginTop: "24px",
  },
  cta: {
    display: "inline-block",
    background: "#1a1a2e",
    color: "white",
    padding: "12px 32px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  footer: {
    padding: "16px",
    textAlign: "center" as const,
    color: "#999",
    fontSize: "12px",
  },
  footerText: { margin: 0 },
};

/**
 * 共通レイアウト。既存 nodemailer 経由の HTML テンプレと見た目を一致させる。
 * 各 NotificationEvent / magic link が children に固有のボディを差し込む。
 */
export function NotificationLayout({
  heading,
  children,
  ctaUrl,
  ctaLabel,
  preview,
}: NotificationLayoutProps) {
  return (
    <Html lang="ja">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading as="h1" style={styles.headerTitle}>
              LUMINA
            </Heading>
          </Section>
          <Section style={styles.main}>
            <Heading as="h2" style={styles.heading}>
              {heading}
            </Heading>
            {children}
            {ctaUrl && ctaLabel ? (
              <Section style={styles.ctaSection}>
                <Button href={ctaUrl} style={styles.cta}>
                  {ctaLabel}
                </Button>
              </Section>
            ) : null}
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              このメールはLUMINAから自動送信されています。
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
