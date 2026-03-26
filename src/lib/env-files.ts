export function getEnvFileOrder(nodeEnv: string | undefined): string[] {
  if (nodeEnv === "production") {
    return [".env.production.local", ".env.production", ".env.local", ".env"];
  }

  if (nodeEnv === "test") {
    return [".env.test.local", ".env.test", ".env"];
  }

  return [
    ".env.develpment.local",
    ".env.develpment",
    ".env.development.local",
    ".env.development",
    ".env.local",
    ".env",
  ];
}
