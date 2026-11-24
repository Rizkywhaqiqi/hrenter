"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Edit, Plus, RefreshCw, X } from "lucide-react";

const emptyForm = { code: "", name: "", legal_name: "", npwp: "", phone: "", email: "", is_active: true };

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiFetch("/api/master/companies");
      setRows(data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setError(""); setEditingId(null); setForm(emptyForm); setShow(true);
  }
  function startEdit(row: any) {
    setError(""); setEditingId(row.id); setForm({
      code: row.code ?? "", name: row.name ?? "", legal_name: row.legalName ?? "",
      npwp: row.npwp ?? "", phone: row.phone ?? "", email: row.email ?? "", is_active: row.isActive !== false,
    }); setShow(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancel() { setShow(false); setEditingId(null); setForm(emptyForm); setError(""); }

  async function save() {
    setError("");
    const payload = { code: form.code.trim(), name: form.name.trim(), legal_name: form.legal_name.trim() || null, npwp: form.npwp.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active };
    if (!payload.code || !payload.name) { setError("Code dan Name wajib diisi."); return; }
    try {
      if (editingId) {
        await apiFetch(`/api/master/companies/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/master/companies", { method: "POST", body: JSON.stringify(payload) });
      }
      cancel(); await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return <><Header title="Company" subtitle="Master Data Company"/><main className="container-page">
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div><h2 style={{margin:0,fontSize:18}}>Company</h2></div><div style={{display:"flex",gap:8}}><button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/>Refresh</button><button className="btn btn-primary" onClick={startAdd}><Plus size={16}/>Tambah</button></div></div>
    {show && <div className="card" style={{padding:20,marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {[["code","Code"],["name","Name"],["legal_name","Legal Name"],["npwp","NPWP"],["phone","Phone"],["email","Email"]].map(([key,label])=><div key={key}><label className="label">{label}</label><input className="input" value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>)}
    </div><label style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/>Aktif</label>{error&&<div style={{color:"#b91c1c",marginTop:12}}>{error}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><button className="btn btn-primary" onClick={save}>{editingId?"Update":"Simpan"}</button><button className="btn btn-secondary" onClick={cancel}><X size={16}/>Batal</button></div></div>}
    {error&&!show&&<div style={{color:"#b91c1c",background:"#fef2f2",padding:12,borderRadius:10,marginBottom:12}}>{error}</div>}
    <div className="card table-wrap"><table className="table"><thead><tr><th>Code</th><th>Name</th><th>Legal Name</th><th>NPWP</th><th>Phone</th><th>Email</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{loading?<tr><td colSpan={8}>Loading...</td></tr>:rows.length===0?<tr><td colSpan={8}>Belum ada data.</td></tr>:rows.map(r=><tr key={r.id}><td>{r.code??'-'}</td><td>{r.name??'-'}</td><td>{r.legalName??'-'}</td><td>{r.npwp??'-'}</td><td>{r.phone??'-'}</td><td>{r.email??'-'}</td><td>{r.isActive?"Aktif":"Nonaktif"}</td><td><button className="btn btn-secondary" onClick={()=>startEdit(r)}><Edit size={15}/>Edit</button></td></tr>)}</tbody></table></div>
  </main></>;
}
