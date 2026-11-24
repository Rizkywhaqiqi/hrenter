 "use client";
import {useState} from "react";

import {useRouter} from "next/navigation";
export default function Login(){
 const r=useRouter();const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");try { const result=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});if(!result.ok){setError("Email atau password salah.");return}r.replace("/dashboard");r.refresh(); } catch { setError("Gagal terhubung ke server."); } finally { setLoading(false); }}
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}><div className="card" style={{width:"100%",maxWidth:430,padding:32}}>
 <div style={{marginBottom:28}}><div style={{fontSize:13,color:"#2563eb",fontWeight:800,letterSpacing:".08em"}}>HRD ENTERPRISE</div><h1 style={{margin:"8px 0 6px",fontSize:28}}>Sign in</h1><p style={{margin:0,color:"#687386"}}>Human Resources Management System</p></div>
 <form onSubmit={submit} style={{display:"grid",gap:16}}><div><label className="label">Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
 <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
 {error&&<div style={{color:"#b91c1c",background:"#fef2f2",padding:12,borderRadius:10,fontSize:13}}>{error}</div>}
 <button className="btn btn-primary" disabled={loading}>{loading?"Signing in...":"Sign In"}</button></form></div></main>
}
