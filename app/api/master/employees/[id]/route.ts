import {organizationWrite,Busy,audit} from "@/lib/security";
import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { validateEmployee } from "@/lib/employee-validation";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope, validEmployeeDestination } from "@/lib/scope";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("employee.update");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  if(req.headers.get("origin")!==new URL(req.url).origin)return json({error:"Forbidden"},403);
  try{return await organizationWrite(async()=>{
  const body = await req.json().catch(()=>null);
  const invalid=validateEmployee(body);if(invalid)return json({error:invalid},400);
  const {
    employee_code,
    full_name,
    email,
    phone,
    nik,
    gender,
    birth_date,
    birth_place,
    address,
    join_date,
    resign_date,
    employment_status,
    employment_type,
    company_id,
    brand_id,
    outlet_id,
    department_id,
    position_id,
    supervisor_id,
    is_active,
  } = body;

  if (!employee_code || !full_name) {
    return json({ error: "Kode karyawan dan nama wajib diisi." }, 400);
  }
  if (!company_id || !brand_id || !outlet_id) {
    return json(
      { error: "Company, Brand, dan Outlet wajib dipilih." },
      400
    );
  }

  const duplicate=await rows("SELECT id FROM employees WHERE employee_code=? AND id<>? LIMIT 1",[employee_code.trim(),(await params).id]);if(duplicate.length)return json({error:"Kode karyawan sudah digunakan."},409);
  for(const [table,id] of [["departments",department_id],["positions",position_id]]){if(id&&!(await rows("SELECT id FROM "+table+" WHERE id=? AND is_active=1",[id])).length)return json({error:"Departemen atau jabatan tidak aktif atau tidak ditemukan."},400);}
  if (!(await validEmployeeDestination(auth.userId!, company_id, brand_id, outlet_id))) return json({ error: "Akses atau relasi organisasi tidak valid." }, 403);
  if (supervisor_id && !((await listMaster("employees",await employeeScope(auth.userId!),supervisor_id)).find(e=>e.companyId===company_id&&e.isActive))) return json({ error: "Supervisor tidak valid." }, 400);
  const existing = (await listMaster("employees",await employeeScope(auth.userId!),(await params).id))[0];
  if (!existing) return json({ error: "Not found" }, 404);
  if (supervisor_id === existing.id) return json({ error: "Supervisor tidak valid." }, 400);
  const row = await saveMaster("employees",{
      employeeCode: employee_code.trim(),
      fullName: full_name.trim(),
      email: email || null,
      phone: phone || null,
      nik: nik || null,
      gender: gender || null,
      birthDate: birth_date ? new Date(birth_date) : null,
      birthPlace: birth_place || null,
      address: address || null,
      joinDate: join_date ? new Date(join_date) : null,
      resignDate: resign_date ? new Date(resign_date) : null,
      employmentStatus: employment_status,
      employmentType: employment_type,
      companyId: company_id,
      brandId: brand_id,
      outletId: outlet_id,
      departmentId: department_id || null,
      positionId: position_id || null,
      supervisorId: supervisor_id || null,
      isActive: employment_status === 'ACTIVE',
    },await employeeScope(auth.userId!),(await params).id);
  if (!row) return json({error:"Not found"},404);
  await audit(auth.userId!, "employee.update",String(row.id));
  return json({ data: row });
  });}catch(e){if(e instanceof Busy)return json({error:e.message},409);throw e;}
}