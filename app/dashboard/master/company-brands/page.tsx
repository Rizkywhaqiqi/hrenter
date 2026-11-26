"use client";
import {useEffect,useState} from "react";
import {Header} from "@/components/Header";
type Option={id:string;code:string;name:string;legalName?:string;isActive:boolean};
type LinkRow={companyId:string;brandId:string;company:Option;brand:Option};
async function api(path:string,options?:RequestInit){const r=await fetch("/api/master/"+path,{...options,headers:{"Content-Type":"application/json"}});const data=await r.json();if(!r.ok)throw Error(data.error||"Request failed");return data;}
export default function Page(){
 const [companies,setCompanies]=useState<Option[]>([]),[brands,setBrands]=useState<Option[]>([]),[links,setLinks]=useState<LinkRow[]>([]);
 const [brand,setBrand]=useState(""),[company,setCompany]=useState(""),[manage,setManage]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function load(){setBusy(true);setError("");try{const l=await api("company-brands");setLinks(l.data||[]);setManage(l.canManage===true);if(l.canManage){const [b,c]=await Promise.all([api("brands"),api("companies")]);setBrands(b.data||[]);setCompanies(c.data||[]);}}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 const available=companies.filter(c=>c.isActive&&!links.some(l=>l.brandId===brand&&l.companyId===c.id));
 async function save(){setBusy(true);setError("");setMessage("");try{await api("company-brands",{method:"POST",body:JSON.stringify({brand_id:brand,company_id:company})});setCompany("");setMessage("Relasi berhasil disimpan.");await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <><Header title="Relasi Brand–CV" subtitle="Satu brand dapat memiliki beberapa badan usaha"/><main className="container-page">
 <button className="btn btn-secondary" disabled={busy} onClick={load}>Refresh</button>
 {manage&&<div className="card" style={{padding:20,margin:"16px 0",display:"grid",gap:12}}>
 <label>Brand<select className="input" value={brand} disabled={busy} onChange={e=>{setBrand(e.target.value);setCompany("")}}><option value="">Pilih brand</option>{brands.filter(b=>b.isActive).map(b=><option key={b.id} value={b.id}>{b.code} — {b.name}</option>)}</select></label>
 <label>Company / CV<select className="input" value={company} disabled={busy||!brand} onChange={e=>setCompany(e.target.value)}><option value="">{brand?"Pilih CV yang belum terhubung":"Pilih brand dahulu"}</option>{available.map(c=><option key={c.id} value={c.id}>{c.code} — {c.legalName||c.name}</option>)}</select></label>
 <button className="btn btn-primary" disabled={busy||!brand||!available.some(c=>c.id===company)} onClick={save}>Tambahkan relasi</button></div>}
 {error&&<p role="alert" style={{color:"#b91c1c"}}>{error}</p>}{message&&<p role="status">{message}</p>}
 <div className="card table-wrap"><table className="table"><thead><tr><th>Brand</th><th>Company / CV</th></tr></thead><tbody>{links.map(l=><tr key={l.brandId+":"+l.companyId}><td>{l.brand?.name||l.brandId}</td><td>{l.company?.name||l.companyId}</td></tr>)}{!links.length&&<tr><td colSpan={2}>{busy?"Memuat...":"Belum ada relasi."}</td></tr>}</tbody></table></div></main></>;
}
