export function validateEmployee(body:unknown):string|null{
 if(!body||typeof body!=="object"||Array.isArray(body))return "Data karyawan tidak valid.";
 const b=body as Record<string,unknown>;
 const lengths:Record<string,number>={employee_code:50,full_name:100,email:100,phone:50,nik:50,birth_place:100,address:255,company_id:36,brand_id:36,outlet_id:36,department_id:36,position_id:36,supervisor_id:36};
 for(const [key,max] of Object.entries(lengths)){const v=b[key];if(v!=null&&(typeof v!=="string"||v.length>max))return "Field "+key+" tidak valid.";}
 for(const key of ["employee_code","full_name","company_id","brand_id","outlet_id"])if(typeof b[key]!=="string"||!(b[key] as string).trim())return "Field "+key+" wajib diisi.";
 if(b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email)))return "Email tidak valid.";
 if(b.gender!=null&&b.gender!==""&&!["MALE","FEMALE"].includes(String(b.gender)))return "Gender tidak valid.";
 if(!["ACTIVE","INACTIVE","RESIGNED","TERMINATED"].includes(String(b.employment_status)))return "Status karyawan tidak valid.";
 if(!["PERMANENT","CONTRACT","DAILY","PART_TIME","INTERNSHIP"].includes(String(b.employment_type)))return "Tipe karyawan tidak valid.";
 if(b.is_active!==undefined&&(typeof b.is_active!=="boolean"||b.is_active!==(b.employment_status==="ACTIVE")))return "Status aktif harus sesuai status kepegawaian.";
 for(const key of ["birth_date","join_date","resign_date"]){const v=b[key];if(v==null||v==="")continue;if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)return "Tanggal "+key+" tidak valid.";}
 if(b.join_date&&b.resign_date&&String(b.resign_date)<String(b.join_date))return "Tanggal keluar tidak boleh sebelum tanggal masuk.";
 if(["RESIGNED","TERMINATED"].includes(String(b.employment_status))&&!b.resign_date)return "Tanggal keluar wajib diisi.";
 if(b.employment_status==="ACTIVE"&&b.resign_date)return "Karyawan aktif tidak boleh memiliki tanggal keluar.";
 return null;
}
