import Link from "next/link";
import {Header} from "@/components/Header";
import {countMaster} from "@/lib/master";
import {getSession} from "@/lib/auth";
import {employeeScope} from "@/lib/scope";
import {hasPermission} from "@/lib/permissions";
import {redirect} from "next/navigation";
export default async function Dashboard(){
 const session=await getSession();if(!session)redirect("/login");
 const scope=await employeeScope(session.userId);
 const specs=[{label:"Karyawan",table:"employees",permission:"employee.view",href:"/dashboard/master/employees",description:"Periksa identitas dan penempatan karyawan sebelum penggajian."},{label:"Brand",table:"brands",permission:"brand.view",href:"/dashboard/master/brands",description:"Lihat brand dalam cakupan akses Anda."},{label:"Company / CV",table:"companies",permission:"company.view",href:"/dashboard/master/companies",description:"Periksa badan usaha untuk administrasi keuangan."},{label:"Outlet",table:"outlets",permission:"outlet.view",href:"/dashboard/master/outlets",description:"Periksa lokasi kerja dan relasi organisasi."}] as const;
 const cards=await Promise.all(specs.map(async s=>({...s,value:await hasPermission(session.userId,s.permission)?await countMaster(s.table,scope):null})));
 const visible=cards.filter(c=>c.value!==null);
 return <><Header title="Dashboard Finance" subtitle="HR Enterprise · Finance & Tax"/><main className="container-page">
 <section className="card finance-hero"><h2>Administrasi keuangan karyawan</h2><p>Kelola referensi organisasi dan data pegawai sebagai dasar penggajian. Ringkasan berikut mengikuti hak akses akun Anda.</p></section>
 <div className="finance-grid">{visible.map(c=><div className="card finance-metric" key={c.table}><span>{c.label}</span><strong>{c.value}</strong></div>)}</div>
 <h2 style={{fontSize:17,margin:"24px 0 12px"}}>Master data keuangan</h2><div className="finance-links">{visible.map(c=><Link className="card finance-link" href={c.href} key={c.table}><strong>{c.label}</strong><p>{c.description}</p></Link>)}</div>
 <section className="card" style={{padding:20,marginTop:24}}><h2 style={{fontSize:16,margin:"0 0 8px"}}>Modul keuangan</h2><p style={{fontSize:14,color:"#687386",margin:0,lineHeight:1.6}}>Payroll, komponen gaji, BPJS, PPh 21, bonus, THR dan slip gaji belum tersedia pada versi ini. Tidak ada nominal keuangan yang dihitung atau ditampilkan sebelum modul tersebut tersedia.</p></section>
 </main></>;
}
