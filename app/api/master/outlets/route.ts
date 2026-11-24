import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("outlet.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await listMaster("outlets", await employeeScope(auth.userId!));
  return json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission("outlet.create");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);
  if (!(await isSystemAdmin(auth.userId!))) return json({ error: "Forbidden" }, 403);

  const body = await req.json();
  const { code, name, company_id, brand_id, address, phone, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }
  if (!company_id || !brand_id) {
    return json({ error: "Company dan Brand wajib dipilih." }, 400);
  }

  // Validate company-brand relation exists
  const [cb] = await rows("SELECT 1 FROM company_brands WHERE company_id=? AND brand_id=?",[company_id,brand_id]);
  if (!cb) {
    return json(
      {
        error:
          "Brand tersebut belum terdaftar untuk Company yang dipilih. Tambahkan relasi Company + Brand terlebih dahulu.",
      },
      400
    );
  }

  const row = await saveMaster("outlets",{
      code,
      name,
      companyId: company_id,
      brandId: brand_id,
      address: address || null,
      phone: phone || null,
      isActive: is_active ?? true,
    },await employeeScope(auth.userId!));
  if (!row) return json({error:"Not found"},404);
  return json({ data: row }, 201);
}