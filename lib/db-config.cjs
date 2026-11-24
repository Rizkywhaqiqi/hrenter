const fs=require('node:fs');
const {X509Certificate}=require('node:crypto');
const projectCa="-----BEGIN CERTIFICATE-----\nMIIERDCCAqygAwIBAgIUYwyMXn0YdW3VDGdVWUZqvF5ISDwwDQYJKoZIhvcNAQEM\nBQAwOjE4MDYGA1UEAwwvMDFlMGVkZmEtN2UzMC00MzJjLTljM2YtZWU0ZGI3ZGZj\nZGJlIFByb2plY3QgQ0EwHhcNMjYxMTE2MDEyMDU1WhcNMzYxMTEzMDEyMDU1WjA6\nMTgwNgYDVQQDDC8wMWUwZWRmYS03ZTMwLTQzMmMtOWMzZi1lZTRkYjdkZmNkYmUg\nUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAMUzf6iJ\nWfN6u02QOy/fG0qwHmLNs3vzNEiS9h7L8LhPtDUmUIphXD5D1tLDdjLzOg1eOxL6\ns8vcL3Eb+BkWQ2YCA9iPdvbXwNXuYUwhZLW+yjE4vgJRN+36bOAzokrnm3hkLgl3\nqX+huPo/NGy+hOZkD483KINGZtQd5OftS8KUU5I/IpxD00lWS75WZRQ5Xdojdl13\nLAfq8oVbInIeaUIwGxxA2VeJGpTtyE/in7SLya7U8EWqfqizwBbsY4VAXrHPqxlT\nqSeyNAPdLmSw8tNwe+tmhVXyegZuhRMPLJOtIniQJoj9aM6pAw03hMn1EFrO6j8C\nrLvRMNYnL/ae2v7A3EOzoGVTDh3lJrwsqHq3UfH5Nb677ahtI2TlwbFMqUoa+dfp\nMAqb/1eji8tVpzqhRrWxY35Bn8+3mqiToPBlK/izC4unBMUe4+EMH/wyE7aTRe+m\ngxmbZznEQmzsx/MZPVMXV1FIzAGNJGSv5C9CLUD3serHq5g4VVLzxqHCOQIDAQAB\no0IwQDAdBgNVHQ4EFgQUgR8zDYPtwo0rua1rRXkeSUEaARMwEgYDVR0TAQH/BAgw\nBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAKTzoyphB5HI\njB9ifZiiqRExvXpwZYol2nm0ufJqtbaoHv/44PlVQnZld884+/sFL3AhXx26tzYl\nX2hpgunZspBW/FoTQLjf7zBON3SaVLQs8tC87Uskfi/3dAKkYbwjqRk3cO258qkm\nOi/vYliYc7nMrsnAbVgNigva6UGCK16WrifzGfHVJf9A/02GTQojGM/ubbkX+Nus\n/aXf8sj9iXxtkgejcVIC1GOtGJsKoJzSu4UMOT9XD1ryxIeJ472gBTKKU3rFQ1ha\nrtaXHWyVmqMXsoQeWsAi2psyQBEp8Rkac5UGLoL3AyPXmxFQjGWfSK9gfOREoI9Y\nk4NH9VtBYc3FzpUxesGEGnmQElfsP87qdapD24Ye51K7Y4jGuobpgvZNTErGPuNC\n0uCceiL6rEcjuNni00S7bw3LterwacZbDr2CNnKxgeYGsBtVFjA0Vptuxtyg4n3L\n5AwDqBislAvWO9v1YikP0LB+/SwBk9VWtErdpF1e1CL4SU73a/CNDg==\n-----END CERTIFICATE-----";
const projectHosts=new Set(['public-jojogrp-jojogrp.i.aivencloud.com','jojogrp-jojogrp.i.aivencloud.com']);
function getDbOptions(env=process.env){
 let host=env.DB_HOST, port=env.DB_PORT, user=env.DB_USER, password=env.DB_PASSWORD, database=env.DB_NAME, mode=env.DB_SSL_MODE;
 if(!host && env.DATABASE_URL){const u=new URL(env.DATABASE_URL);host=u.hostname;port=u.port;user=decodeURIComponent(u.username);password=decodeURIComponent(u.password);database=decodeURIComponent(u.pathname.slice(1));mode=u.searchParams.has('sslaccept')||u.searchParams.has('ssl-mode')?'verify-ca':'disabled';}
 if(!host||!user||!database)throw new Error('Configure DB_HOST, DB_USER and DB_NAME in .env');
 if(!/^[a-zA-Z0-9_]+$/.test(database))throw new Error('Invalid DB_NAME');
 const sslMode=projectHosts.has(host.toLowerCase()) && (!mode || mode==='disabled') ? 'verify-ca' : (mode||'verify-ca');
 if(!['disabled','required','verify-ca','verify-full'].includes(sslMode))throw new Error('Invalid DB_SSL_MODE');
 const inline=env.DB_SSL_CA?.replace(/\\n/g,'\n').trim();
 let ca;
 if(sslMode!=='disabled'){
   if(inline && inline.includes('-----END CERTIFICATE-----')) ca=inline;
   else if(env.DB_SSL_CERT) ca=fs.readFileSync(env.DB_SSL_CERT,'utf8');
   else if(projectHosts.has(host.toLowerCase())) ca=projectCa;
   if(ca) { try { new X509Certificate(ca); } catch { throw new Error('Invalid CA certificate. Clear DB_SSL_CA and DB_SSL_CERT to use the bundled Aiven CA for this project.'); } }
 }
 return {host,port:Number(port||3306),user,password:password||'',database,ssl:sslMode==='disabled'?undefined:{rejectUnauthorized:true,...(ca?{ca}:{})},timezone:'Z',charset:'utf8mb4'};
}
module.exports={getDbOptions};
