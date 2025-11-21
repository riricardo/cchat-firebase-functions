import { Client } from "@elastic/elasticsearch";

export function createElasticClient() {
  const host = process.env.ES_HOST;
  const user = process.env.ES_USER;
  const pass = process.env.ES_PASS;

  if (!host) throw new Error("Missing ES_HOST env");
  if (!user) throw new Error("Missing ES_USER env");
  if (!pass) throw new Error("Missing ES_PASS env");

  return new Client({
    node: host,
    auth: {
      username: user,
      password: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
