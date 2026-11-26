import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {hasPermission,isSystemAdmin} from "@/lib/permissions";
import {Sidebar} from "@/components/Sidebar";
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const u=await getSession();if(!u)redirect("/login");
 const codes=["employee.view","brand.view","company.view","outlet.view","department.view","position.view","user.view"];
 const admin=await isSystemAdmin(u.userId);
 const permissions=(await Promise.all(codes.map(async code=>(code!=="user.view"||admin)&&(await hasPermission(u.userId,code))?code:null))).filter((code):code is string=>code!==null);
 return <><Sidebar email={u.email} permissions={permissions}/><div className="content finance-content">{children}</div></>;
}
