-- Read-only check before adding a UNIQUE index. Do not delete duplicates automatically.
SELECT employee_code, COUNT(*) AS duplicate_count FROM employees GROUP BY employee_code HAVING COUNT(*)>1;
-- After reviewing duplicates and taking a backup, separately run:
-- ALTER TABLE employees ADD UNIQUE KEY uq_hrenter_employee_code (employee_code);
