"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Edit, Plus, RefreshCw, X } from "lucide-react";

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

type Company = {
  id: string;
  code: string | null;
  name: string | null;
};

type Brand = {
  id: string;
  code: string | null;
  name: string | null;
};

type Outlet = {
  id: string;
  code: string | null;
  name: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  company_id: string;
  brand_id: string;
  company: Company | null;
  brand: Brand | null;
};

type OutletQueryRow = {
  id: string;
  code: string | null;
  name: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  company_id: string;
  brand_id: string;
  companies?: Company | Company[] | null;
  brands?: Brand | Brand[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function Page() {
  const [rows, setRows] = useState<Outlet[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [companyBrandIds, setCompanyBrandIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    company_id: "",
    brand_id: "",
    address: "",
    phone: "",
    is_active: true,
  });

  const companyOptions = useMemo(
    () =>
      [...companies].sort((a, b) =>
        `${a.code ?? ""} ${a.name ?? ""}`.localeCompare(
          `${b.code ?? ""} ${b.name ?? ""}`,
        ),
      ),
    [companies],
  );

  const brandOptions = useMemo(() => {
    const source = form.company_id
      ? brands.filter((brand) => companyBrandIds.has(brand.id))
      : brands;

    return [...source].sort((a, b) =>
      `${a.code ?? ""} ${a.name ?? ""}`.localeCompare(
        `${b.code ?? ""} ${b.name ?? ""}`,
      ),
    );
  }, [brands, companyBrandIds, form.company_id]);

  async function loadMasters() {
    setLoadingMaster(true);
    setError("");

    const [cRes, bRes, cbRes] = await Promise.all([
      apiFetch("/api/master/companies"),
      apiFetch("/api/master/brands"),
      apiFetch("/api/master/company-brands"),
    ]);
    setCompanies(cRes.data || []);
    setBrands(bRes.data || []);
    const cbr = cbRes.data || [];
    const allowedBrandIds = new Set<string>(
      cbr
        .filter((item: any) => item.companyId === form.company_id)
        .map((item: any) => item.brandId)
    );
    setCompanyBrandIds(allowedBrandIds);

    setLoadingMaster(false);
  }

  async function loadCompanyBrands(companyId: string) {
    if (!companyId) {
      setCompanyBrandIds(new Set());
      return;
    }
    try {
      const { data } = await apiFetch("/api/master/company-brands");
      const cbr = data || [];
      setCompanyBrandIds(
        new Set(
          cbr
            .filter((item: any) => item.companyId === companyId)
            .map((item: any) => item.brandId)
        )
      );
    } catch (e: any) {
      setError(e.message);
      setCompanyBrandIds(new Set());
    }
  }

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data } = await apiFetch("/api/master/outlets");
      setRows((data || []).map((row: any) => ({ ...row, company_id: row.companyId, brand_id: row.brandId, is_active: row.isActive })));
    } catch (e: any) { setError(e.message); setRows([]); }
    finally { setLoading(false); }
  }

  async function loadAll() {
    await Promise.all([load(), loadMasters()]);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({
      code: "",
      name: "",
      company_id: "",
      brand_id: "",
      address: "",
      phone: "",
      is_active: true,
    });
    setCompanyBrandIds(new Set());
  }

  async function handleCompanyChange(companyId: string) {
    setForm((current) => ({
      ...current,
      company_id: companyId,
      brand_id: "",
    }));
    setError("");
    await loadCompanyBrands(companyId);
  }

  function startAdd() {
    setError("");
    setEditingId(null);
    resetForm();
    setShow(true);
  }

  function startEdit(row: Outlet) {
    setError("");
    setEditingId(row.id);
    setForm({ code: row.code ?? "", name: row.name ?? "", company_id: row.company_id ?? "", brand_id: row.brand_id ?? "", address: row.address ?? "", phone: row.phone ?? "", is_active: row.is_active !== false });
    setShow(true);
    loadCompanyBrands(row.company_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShow(false);
    setEditingId(null);
    resetForm();
    setError("");
  }

  async function save() {
    setError("");

    if (!form.code.trim()) {
      setError("Code Outlet wajib diisi.");
      return;
    }

    if (!form.name.trim()) {
      setError("Nama Outlet wajib diisi.");
      return;
    }

    if (!form.company_id) {
      setError("Company / CV wajib dipilih.");
      return;
    }

    if (!form.brand_id) {
      setError("Brand wajib dipilih.");
      return;
    }

    if (!companyBrandIds.has(form.brand_id)) {
      setError(
        "Brand tersebut belum terdaftar untuk Company / CV yang dipilih. Tambahkan relasi Company + Brand terlebih dahulu.",
      );
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      company_id: form.company_id,
      brand_id: form.brand_id,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      is_active: form.is_active,
    };

    try {
      await apiFetch(editingId ? "/api/master/outlets/" + editingId : "/api/master/outlets", { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      cancelForm();
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <Header title="Outlet" subtitle="Master Data Outlet" />

      <main className="container-page">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Outlet</h2>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              Setiap outlet wajib dikaitkan ke Company/CV dan Brand yang sudah
              memiliki relasi.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={loadAll}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (show) cancelForm(); else startAdd();
              }}
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>

        {show && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <div>
                <label className="label">Code</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  placeholder="OUT-001"
                />
              </div>

              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Nama Outlet"
                />
              </div>

              <div>
                <label className="label">Company / CV</label>
                <select
                  className="input"
                  value={form.company_id}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  disabled={loadingMaster}
                >
                  <option value="">Pilih Company / CV</option>
                  {companyOptions.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.code ? `${company.code} — ` : ""}
                      {company.name ?? "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Brand</label>
                <select
                  className="input"
                  value={form.brand_id}
                  onChange={(e) =>
                    setForm({ ...form, brand_id: e.target.value })
                  }
                  disabled={loadingMaster || !form.company_id}
                >
                  <option value="">
                    {form.company_id
                      ? brandOptions.length > 0
                        ? "Pilih Brand"
                        : "Belum ada Brand untuk Company ini"
                      : "Pilih Company terlebih dahulu"}
                  </option>
                  {brandOptions.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.code ? `${brand.code} — ` : ""}
                      {brand.name ?? "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Alamat outlet"
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="Nomor telepon"
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Aktif
              </label>
            </div>

            {error && (
              <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button
              className="btn btn-primary"
              onClick={save}
              disabled={loadingMaster || !form.company_id || !form.brand_id}
            >
              {editingId ? "Update" : "Simpan"}
            </button><button className="btn btn-secondary" onClick={cancelForm}><X size={16}/>Batal</button></div>
          </div>
        )}

        {error && !show && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Company / CV</th>
                <th>Brand</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>Belum ada data.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code ?? "-"}</td>
                    <td>{row.name ?? "-"}</td>
                    <td>
                      {row.company?.code ? `${row.company.code} — ` : ""}
                      {row.company?.name ?? "-"}
                    </td>
                    <td>
                      {row.brand?.code ? `${row.brand.code} — ` : ""}
                      {row.brand?.name ?? "-"}
                    </td>
                    <td>{row.address ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.is_active ? "Aktif" : "Nonaktif"}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startEdit(row)}
                      >
                        <Edit size={15} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
