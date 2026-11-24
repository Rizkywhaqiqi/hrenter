import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";
import { employeeScope, validEmployeeDestination } from "@/lib/scope";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("employee.update");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const body = await req.json();
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

  if (!(await validEmployeeDestination(auth.userId!, company_id, brand_id, outlet_id))) return json({ error: "Akses atau relasi organisasi tidak valid." }, 403);
  if (supervisor_id && !(await db.employee.findFirst({ where: { AND: [await employeeScope(auth.userId!), { id: supervisor_id, companyId: company_id }] }, select: { id: true } }))) return json({ error: "Supervisor tidak valid." }, 400);
  const existing = await db.employee.findFirst({ where: { AND: [await employeeScope(auth.userId!), { id: (await params).id }] }, select: { id: true } });
  if (!existing) return json({ error: "Not found" }, 404);
  if (supervisor_id === existing.id) return json({ error: "Supervisor tidak valid." }, 400);
  const row = await db.employee.update({
    where: { id: (await params).id },
    data: {
      employeeCode: employee_code,
      fullName: full_name,
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
      isActive: is_active ?? true,
    },
    include: {
      company: { select: { id: true, code: true, name: true } },
      brand: { select: { id: true, code: true, name: true } },
      outlet: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, code: true, name: true } },
      position: { select: { id: true, code: true, name: true } },
    },
  });
  return json({ data: row });
}