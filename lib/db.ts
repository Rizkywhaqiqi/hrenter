import {createPool,type Pool,type RowDataPacket,type ResultSetHeader,type PoolConnection} from 'mysql2/promise';
import {getDbOptions} from './db-config.cjs';
const globalDb=globalThis as typeof globalThis & {hrenterPool?:Pool};
export function getPool(){return globalDb.hrenterPool ??= createPool({...getDbOptions(),connectionLimit:5,maxIdle:2,idleTimeout:60000,connectTimeout:10000,waitForConnections:true});}
export type SqlValue=string|number|boolean|Date|null;
export async function rows<T extends RowDataPacket=RowDataPacket>(sql:string,params:SqlValue[]=[]):Promise<T[]>{const [result]=await getPool().execute<T[]>(sql,params);return result;}
export async function execute(sql:string,params:SqlValue[]=[]){const [result]=await getPool().execute<ResultSetHeader>(sql,params);return result;}
export async function transaction<T>(fn:(c:PoolConnection)=>Promise<T>){const c=await getPool().getConnection();try{await c.beginTransaction();const result=await fn(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
