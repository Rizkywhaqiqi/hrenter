const {spawnSync}=require('node:child_process');
const {loadEnvConfig}=require('@next/env');
const {getDatabaseUrl}=require('../lib/db-config.cjs');
loadEnvConfig(process.cwd(),true);
const url=getDatabaseUrl();
if (!url) throw new Error('Create .env in the project root and fill DB_HOST, DB_USER, DB_PASSWORD and DB_NAME.');
if (new URL(url).pathname !== '/db_jojogrp') throw new Error('DB_NAME must be db_jojogrp for HREnter setup.');
process.env.DATABASE_URL=url;
const mode=process.argv[2] || 'setup';
const actions={migrate:[['db','push']],seed:[['generate'],['db','seed']],setup:[['db','push'],['db','seed']]};
if (!actions[mode]) throw new Error('Unknown setup command');
if (mode!=='migrate') {
 const email=process.env.SUPER_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL;
 const password=process.env.SUPER_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
 if (!email || !email.includes('@') || Buffer.byteLength(password)<16 || Buffer.byteLength(password)>72) throw new Error('Fill SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (16–72 bytes) in .env.');
}
for(const args of actions[mode]){
 const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),...args],{stdio:'inherit'});
 if(result.status!==0) process.exit(result.status||1);
}
