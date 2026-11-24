 "use client";
import {useEffect,useState} from "react";
import {Header} from "@/components/Header";
import {Plus,RefreshCw} from "lucide-react";
type U={id:string,email:string|null,full_name:string|null,role_code:string|null,role_name:string|null,is_active:boolean};
export default function UsersPage(){
 const [users,setUsers]=useState<U[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[show,setShow]=useState(false);
 const [form,setForm]=useState({email:"",full_name:"",password:""});
 async function load(){setLoading(true);const res=await fetch("/api/admin/users",{cache:"no-store"});const j=await res.json();if(!res.ok)setError(j.error||"Gagal");else setUsers(j.users||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function create(){setError("");const res=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const j=await res.json();if(!res.ok){setError(j.error||"Gagal membuat user");return}setForm({email:"",full_name:"",password:""});setShow(false);load()}
 return <><Header title="User Management" subtitle="Kelola user dan akses aplikasi"/><main className="container-page">
 <div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:16}}><div><h2 style={{margin:0,fontSize:18}}>Daftar User</h2><p style={{margin:"5px 0 0",color:"#687386",fontSize:13}}>SUPER_ADMIN menjadi administrator awal. OWNER akan diatur dari User Management.</p></div><div style={{display:"flex",gap:8}}><button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/>Refresh</button><button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={16}/>Tambah User</button></div></div>
 {show&&<div className="card" style={{padding:20,marginBottom:16}}><h3 style={{marginTop:0}}>Tambah User</h3><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}><div><label className="label">Nama</label><input className="input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></div><div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div><label className="label">Password sementara</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div></div>{error&&<div style={{color:"#b91c1c",marginTop:12}}>{error}</div>}<button className="btn btn-primary" style={{marginTop:14}} onClick={create}>Buat User</button></div>}
 {error&&!show&&<div style={{color:"#b91c1c",background:"#fef2f2",padding:12,borderRadius:10,marginBottom:12}}>{error}</div>}
 <div className="card table-wrap"><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
 {loading?<tr><td colSpan={5}>Loading...</td></tr>:users.length===0?<tr><td colSpan={5}>Belum ada user.</td></tr>:users.map(u=><tr key={u.id}><td><strong>{u.full_name||"-"}</strong></td><td>{u.email||"-"}</td><td>{u.role_code?<span className="badge">{u.role_code}</span>:<span style={{color:"#98a2b3"}}>Belum ada role</span>}</td><td>{u.is_active?"Aktif":"Nonaktif"}</td><td><button className="btn btn-secondary" onClick={()=>alert("Fitur atur akses akan segera datang.")}>Atur Akses</button></td></tr>)}
 </tbody></table></div></main></>
}
