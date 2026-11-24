export const fields = {
  "companies": {
    "id": "id",
    "code": "code",
    "name": "name",
    "legalName": "legal_name",
    "npwp": "npwp",
    "phone": "phone",
    "email": "email",
    "isActive": "is_active",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  },
  "brands": {
    "id": "id",
    "code": "code",
    "name": "name",
    "isActive": "is_active",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  },
  "company_brands": {
    "companyId": "company_id",
    "brandId": "brand_id",
    "createdAt": "created_at"
  },
  "outlets": {
    "id": "id",
    "code": "code",
    "name": "name",
    "address": "address",
    "phone": "phone",
    "isActive": "is_active",
    "companyId": "company_id",
    "brandId": "brand_id",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  },
  "departments": {
    "id": "id",
    "code": "code",
    "name": "name",
    "isActive": "is_active",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  },
  "positions": {
    "id": "id",
    "code": "code",
    "name": "name",
    "level": "level",
    "isActive": "is_active",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  },
  "employees": {
    "id": "id",
    "employeeCode": "employee_code",
    "fullName": "full_name",
    "email": "email",
    "phone": "phone",
    "nik": "nik",
    "gender": "gender",
    "birthDate": "birth_date",
    "birthPlace": "birth_place",
    "address": "address",
    "joinDate": "join_date",
    "resignDate": "resign_date",
    "employmentStatus": "employment_status",
    "employmentType": "employment_type",
    "isActive": "is_active",
    "companyId": "company_id",
    "brandId": "brand_id",
    "outletId": "outlet_id",
    "departmentId": "department_id",
    "positionId": "position_id",
    "supervisorId": "supervisor_id",
    "createdAt": "created_at",
    "updatedAt": "updated_at"
  }
} as const;
