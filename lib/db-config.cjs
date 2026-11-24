function getDatabaseUrl(env=process.env) {
  if (!env.DB_HOST) return env.DATABASE_URL;
  const name=env.DB_NAME || 'db_jojogrp';
  const port=env.DB_PORT || '3306';
  if (!env.DB_USER || !/^\d+$/.test(port) || !/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Check DB_USER, DB_PORT and DB_NAME');
  const url=new URL('mysql://localhost');
  url.hostname=env.DB_HOST;
  url.port=port;
  url.username=encodeURIComponent(env.DB_USER);
  url.password=encodeURIComponent(env.DB_PASSWORD || '');
  url.pathname='/'+name;
  const mode=env.DB_SSL_MODE || 'verify-ca';
  if (!['disabled','required','verify-ca','verify-full'].includes(mode)) throw new Error('Invalid DB_SSL_MODE');
  if (mode!=='disabled') {
    url.searchParams.set('sslaccept','strict');
    if (env.DB_SSL_CERT) url.searchParams.set('sslcert',env.DB_SSL_CERT);
  }
  return url.toString();
}
module.exports={getDatabaseUrl};
