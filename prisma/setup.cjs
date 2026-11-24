const {spawnSync}=require('node:child_process');
const {loadEnvConfig}=require('@next/env');
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).pathname !== '/db_jojogrp') throw new Error('Expected db_jojogrp');
if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD || Buffer.byteLength(process.env.BOOTSTRAP_ADMIN_PASSWORD)<16 || Buffer.byteLength(process.env.BOOTSTRAP_ADMIN_PASSWORD)>72) throw new Error('Set valid bootstrap credentials before setup');
for(const args of [['validate'],['db','push'],['db','seed']]){
 const r=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),...args],{stdio:'inherit'});
 if(r.status!==0) process.exit(r.status||1);
}
