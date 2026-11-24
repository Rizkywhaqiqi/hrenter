 "use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {LayoutDashboard,Users,Building2,Store,BriefcaseBusiness,UserRound,LogOut} from "lucide-react";

const groups=[
 {title:"Overview",items:[["Dashboard","/dashboard",LayoutDashboard]]},
 {title:"Master Data",items:[["Company","/dashboard/master/companies",Building2],["Brand","/dashboard/master/brands",BriefcaseBusiness],["Outlet","/dashboard/master/outlets",Store],["Department","/dashboard/master/departments",BriefcaseBusiness],["Position","/dashboard/master/positions",BriefcaseBusiness],["Karyawan","/dashboard/master/employees",UserRound]]},
 {title:"Administration",items:[["User Management","/dashboard/users",Users]]}
];
export function Sidebar({email}:{email?:string}){
 const p=usePathname(),r=useRouter();
 async function logout(){const res=await fetch("/api/auth/logout",{method:"POST"});if(!res.ok)return;r.replace("/login");r.refresh()}
 return <aside className="sidebar" style={{width:260,background:"#101828",color:"#fff",minHeight:"100vh",position:"fixed",left:0,top:0,bottom:0,display:"flex",flexDirection:"column"}}>
  <div style={{padding:"24px 20px",borderBottom:"1px solid #243044"}}><div style={{fontWeight:900,letterSpacing:".05em"}}>HRD ENTERPRISE</div><div style={{color:"#98a2b3",fontSize:12,marginTop:4}}>Human Resources</div></div>
  <nav style={{padding:14,overflowY:"auto",flex:1}}>{groups.map(g=><div key={g.title} style={{marginBottom:22}}><div style={{color:"#667085",fontSize:10,fontWeight:800,letterSpacing:".09em",padding:"0 10px 8px"}}>{g.title}</div>
   {g.items.map(([label,href,Icon]:any)=>{const active=p===href||(href!=="/dashboard"&&p.startsWith(href));return <Link key={href} href={href} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",borderRadius:9,marginBottom:3,textDecoration:"none",color:active?"#fff":"#c6cedb",background:active?"#1d4ed8":"transparent",fontSize:14,fontWeight:active?700:500}}><Icon size={17}/>{label}</Link>})}
  </div>)}</nav>
  <div style={{borderTop:"1px solid #243044",padding:14}}><div style={{fontSize:12,color:"#98a2b3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:8}}>{email||"User"}</div><button onClick={logout} className="btn" style={{width:"100%",background:"#182230",color:"#d0d5dd",justifyContent:"flex-start"}}><LogOut size={16}/>Logout</button></div>
 </aside>
}
