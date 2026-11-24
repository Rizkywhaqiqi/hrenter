import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";
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
  const cb = await db.companyBrand.findUnique({
    where: {
      companyId_brandId: {
        companyId: company_id,
        brandId: brand_id,
      },
    },
  });
  if (!cb) {
    return json(
      {
        error:
          "Brand tersebut belum terdaftar untuk Company yang dipilih. Tambahkan relasi Company + Brand terlebih dahulu.",
      },
      400
    );
  }

  const row = await db.outlet.update({
    where: { id: (await params).id },
    data: {
      code,
      name,
      companyId: company_id,
      brandId: brand_id,
      address: address || null,
      phone: phone || null,
      isActive: is_active ?? true,
    },
    include: {
      company: { select: { id: true, code: true, name: true } },
      brand: { select: { id: true, code: true, name: true } },
    },
  });
  return json({ data: row });
}