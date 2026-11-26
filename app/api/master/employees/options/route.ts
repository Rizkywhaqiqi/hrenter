import {getApiSession,json} from "@/lib/api";
import {hasPermission} from "@/lib/permissions";
import {employeeScope} from "@/lib/scope";
import {listMaster} from "@/lib/master";
export async function GET(){
 const auth=await getApiSession();
 if(!auth.userId)return json({error:auth.error||"Unauthorized"},401);
 const allowed=await Promise.all(["employee.create","employee.update"].map(p=>hasPermission(auth.userId!,p)));
 if(!allowed.some(Boolean)){if(!await hasPermission(auth.userId,"employee.view"))return json({error:"Forbidden"},403);return json({data:{companies:[],brands:[],outlets:[],departments:[],positions:[],links:[],supervisors:[],canCreate:false,canEdit:false}});}
 const scope=await employeeScope(auth.userId);
 const [companies,brands,outlets,departments,positions,employees,links]=await Promise.all([
 listMaster("companies",scope),listMaster("brands",scope),listMaster("outlets",scope),listMaster("departments",scope),listMaster("positions",scope),listMaster("employees",scope),listMaster("company_brands",scope)]);
 return json({data:{canCreate:allowed[0],canEdit:allowed[1],companies:companies.map(({id,code,name,legalName,isActive})=>({id,code,name,legalName,isActive})),brands,outlets,departments,positions,links,supervisors:employees.map(({id,employeeCode,fullName,companyId,isActive})=>({id,employeeCode,fullName,companyId,isActive}))}});
}
