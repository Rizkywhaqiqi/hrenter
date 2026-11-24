import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {Sidebar} from "@/components/Sidebar";
export default async function DashboardLayout({children}:{children:React.ReactNode}){const u=await getSession();if(!u)redirect("/login");return <><Sidebar email={u.email}/><div className="content" style={{marginLeft:260,minHeight:"100vh"}}>{children}</div></>}
