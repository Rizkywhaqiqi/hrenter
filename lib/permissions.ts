import {rows} from './db';
export async function isSystemAdmin(userId:string):Promise<boolean>{return !!(await rows("SELECT 1 FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id JOIN user_profiles p ON p.user_id=u.id WHERE u.id=? AND u.is_active=1 AND p.is_active=1 AND r.code='SUPER_ADMIN' AND r.is_active=1 LIMIT 1",[userId]))[0];}
export async function hasPermission(userId:string,code:string):Promise<boolean>{
 if(await isSystemAdmin(userId))return true;
 if(!(await rows('SELECT 1 FROM users u JOIN user_profiles p ON p.user_id=u.id WHERE u.id=? AND u.is_active=1 AND p.is_active=1',[userId]))[0])return false;
 const [override]=await rows('SELECT up.effect FROM user_permissions up JOIN app_permissions p ON p.id=up.permission_id WHERE up.user_id=? AND p.code=?',[userId,code]);
 if(override?.effect==='DENY')return false;if(override?.effect==='ALLOW')return true;
 return !!(await rows('SELECT 1 FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id JOIN role_permissions rp ON rp.role_id=r.id JOIN app_permissions p ON p.id=rp.permission_id WHERE ur.user_id=? AND r.is_active=1 AND p.code=? LIMIT 1',[userId,code]))[0];
}
