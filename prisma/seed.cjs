const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const roles = ['SUPER_ADMIN','OWNER','HR_MANAGER','HR_STAFF','FINANCE','SUPERVISOR','EMPLOYEE'];
const permissions = ['user.view','user.create', ...['brand','company','department','employee','outlet','position'].flatMap(m => ['view','create','update'].map(a => m+'.'+a))];
async function main() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!email || !email.includes('@') || Buffer.byteLength(password)<16 || Buffer.byteLength(password)>72) throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a 16-72 byte BOOTSTRAP_ADMIN_PASSWORD');
  if (new URL(process.env.DATABASE_URL).pathname !== '/db_jojogrp') throw new Error('Unexpected database; refusing bootstrap');
  await db.$transaction(async tx => {
    const existing = await tx.user.findUnique({where:{email},include:{userRoles:{include:{role:true}},userProfile:true}});
    if (existing && (!existing.isActive || !existing.userProfile?.isActive || !existing.userRoles.some(r=>r.role.code==='SUPER_ADMIN' && r.role.isActive))) throw new Error('Existing account is not an active Super Admin; refusing elevation');
    for (const code of roles) await tx.appRole.upsert({where:{code},update:{},create:{code,name:code.replaceAll('_',' ')}});
    const role = await tx.appRole.findUniqueOrThrow({where:{code:'SUPER_ADMIN'}});
    if (!role.isActive) throw new Error('SUPER_ADMIN role is inactive');
    for (const code of permissions) {
      const p=await tx.appPermission.upsert({where:{code},update:{},create:{code,name:code}});
      await tx.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:p.id}},update:{},create:{roleId:role.id,permissionId:p.id}});
    }
    if (!existing) {
      const passwordHash=await bcrypt.hash(password,12);
      await tx.user.create({data:{email,passwordHash,fullName:'Super Admin',userProfile:{create:{fullName:'Super Admin'}},userRoles:{create:{roleId:role.id}}}});
    }
  },{timeout:60000});
  console.log('Bootstrap complete; existing accounts and passwords preserved.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
