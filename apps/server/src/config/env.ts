export type ServerEnv = {
  port: number;
  apiPort: number;
  nodeEnv: string;
};

const parsePort = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port value: ${raw ?? fallback}`);
  }
  return parsed;
};

export const loadEnv = (): ServerEnv => ({
  port: parsePort(process.env.SERVER_PORT, 2567),
  apiPort: parsePort(process.env.API_PORT, 2568),
  nodeEnv: process.env.NODE_ENV ?? "development",
});
