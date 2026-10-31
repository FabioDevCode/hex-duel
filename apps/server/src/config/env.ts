export type ServerEnv = {
  port: number;
  nodeEnv: string;
};

const parsePort = (raw: string | undefined): number => {
  const parsed = Number(raw ?? "2567");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid SERVER_PORT value: ${raw ?? "2567"}`);
  }
  return parsed;
};

export const loadEnv = (): ServerEnv => ({
  port: parsePort(process.env.SERVER_PORT),
  nodeEnv: process.env.NODE_ENV ?? "development",
});
