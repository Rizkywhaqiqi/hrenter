import { Header } from "@/components/Header";
import { db } from "@/lib/db";
export default async function Dashboard() {
  const [companies, brands, outlets, employees] = await Promise.all([
    db.company.count(),
    db.brand.count(),
    db.outlet.count(),
    db.employee.count(),
  ]);
 const cards=[["Companies",companies,"#2563eb"],["Brands",brands,"#7c3aed"],["Outlets",outlets,"#059669"],["Karyawan",employees,"#ea580c"]];
 return <><Header title="Dashboard" subtitle="Ringkasan HRD Enterprise"/><main className="container-page">
 <div className="dashboard-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16}}>{cards.map(([l,v,c])=><div className="card" key={String(l)} style={{padding:20}}><div style={{color:"#687386",fontSize:13}}>{l}</div><div style={{fontSize:32,fontWeight:800,marginTop:8,color:String(c)}}>{v}</div></div>)}</div>
 <div className="card" style={{marginTop:20,padding:24}}><h2 style={{margin:"0 0 8px",fontSize:18}}>HRD Enterprise — MVP</h2><p style={{color:"#687386",margin:0,lineHeight:1.6}}>Login, Dashboard, Master Data, dan fondasi User Management sudah disiapkan. Modul Payroll, Absensi, Cuti, THR/Bonus, BPJS, PPh21, Slip Gaji, Email Center dan Reports dikembangkan setelah MVP ini berjalan.</p></div>
 </main></>
}
