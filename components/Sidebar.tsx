"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useState} from "react";
import {LayoutDashboard,Users,Building2,Store,BriefcaseBusiness,UserRound,LogOut,Menu,X,Wallet} from "lucide-react";
const groups=[
 {title:"Overview",items:[{label:"Dashboard Finance",href:"/dashboard",icon:LayoutDashboard,permission:null}]},
 {title:"Master organisasi",items:[
 {label:"Karyawan",href:"/dashboard/master/employees",icon:UserRound,permission:"employee.view"},
 {label:"Brand",href:"/dashboard/master/brands",icon:BriefcaseBusiness,permission:"brand.view"},
 {label:"Company / CV",href:"/dashboard/master/companies",icon:Building2,permission:"company.view"},
 {label:"Relasi Brand–CV",href:"/dashboard/master/company-brands",icon:Building2,permission:"company.view"},
 {label:"Outlet",href:"/dashboard/master/outlets",icon:Store,permission:"outlet.view"},
 {label:"Departemen",href:"/dashboard/master/departments",icon:BriefcaseBusiness,permission:"department.view"},
 {label:"Jabatan",href:"/dashboard/master/positions",icon:BriefcaseBusiness,permission:"position.view"}]},
 {title:"Administrasi",items:[{label:"User Management",href:"/dashboard/users",icon:Users,permission:"user.view"}]}
];
export function Sidebar({email,permissions}:{email?:string;permissions:string[]}){
 const p=usePathname(),r=useRouter(),[open,setOpen]=useState(false);
 async function logout(){const res=await fetch("/api/auth/logout",{method:"POST"});if(!res.ok)return;r.replace("/login");r.refresh()}
 return <><button className="mobile-nav-toggle btn btn-secondary" aria-label={open?"Tutup navigasi":"Buka navigasi"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?<X size={20}/>:<Menu size={20}/>}</button>{open&&<button className="nav-overlay" aria-label="Tutup navigasi" onClick={()=>setOpen(false)}/>}
 <aside className={"sidebar finance-sidebar"+(open?" nav-open":"")}>
 <div className="finance-brand"><Wallet size={24}/><div><strong>HR ENTERPRISE</strong><small>Finance &amp; Tax</small></div></div>
 <nav aria-label="Navigasi utama">{groups.map(g=>{const items=g.items.filter(i=>!i.permission||permissions.includes(i.permission));return items.length?<div className="nav-group" key={g.title}><div className="nav-heading">{g.title}</div>{items.map(({label,href,icon:Icon})=>{const active=p===href||(href!=="/dashboard"&&p.startsWith(href+"/"));return <Link key={href} href={href} onClick={()=>setOpen(false)} className={"nav-link"+(active?" active":"")} aria-current={active?"page":undefined}><Icon size={17}/>{label}</Link>})}</div>:null})}</nav>
 <div className="nav-account"><div title={email}>{email||"User"}</div><button onClick={logout} className="btn"><LogOut size={16}/>Keluar</button></div></aside></>;
}
