import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("outlet.update");
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
  const [cb] = await rows("SELECT 1 FROM company_brands cb JOIN companies c ON c.id=cb.company_id AND c.is_active=1 JOIN brands b ON b.id=cb.brand_id AND b.is_active=1 WHERE cb.company_id=? AND cb.brand_id=?",[company_id,brand_id]);
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
    },await employeeScope(auth.userId!),(await params).id);
  if (!row) return json({error:"Not found"},404);
  return json({ data: row });
}