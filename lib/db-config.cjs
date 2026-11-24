const fs=require('node:fs');
function getDbOptions(env=process.env){
 let host=env.DB_HOST, port=env.DB_PORT, user=env.DB_USER, password=env.DB_PASSWORD, database=env.DB_NAME, mode=env.DB_SSL_MODE;
 if(!host && env.DATABASE_URL){const u=new URL(env.DATABASE_URL);host=u.hostname;port=u.port;user=decodeURIComponent(u.username);password=decodeURIComponent(u.password);database=decodeURIComponent(u.pathname.slice(1));mode=u.searchParams.has('sslaccept')||u.searchParams.has('ssl-mode')?'verify-ca':'disabled';}
 if(!host||!user||!database)throw new Error('Configure DB_HOST, DB_USER and DB_NAME in .env');
 if(!/^[a-zA-Z0-9_]+$/.test(database))throw new Error('Invalid DB_NAME');
 const sslMode=mode||'verify-ca';
 if(!['disabled','required','verify-ca','verify-full'].includes(sslMode))throw new Error('Invalid DB_SSL_MODE');
 const ca=env.DB_SSL_CA?.replace(/\\n/g,'\n')||(env.DB_SSL_CERT?fs.readFileSync(env.DB_SSL_CERT,'utf8'):undefined);
 return {host,port:Number(port||3306),user,password:password||'',database,ssl:sslMode==='disabled'?undefined:{rejectUnauthorized:true,...(ca?{ca}:{})},timezone:'Z',charset:'utf8mb4'};
}
module.exports={getDbOptions};
