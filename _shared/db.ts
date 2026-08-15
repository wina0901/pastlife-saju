export interface Env { SUPABASE_URL:string; SUPABASE_SECRET_KEY:string }
export async function supa(env:Env, path:string, init:RequestInit={}){
  const headers=new Headers(init.headers); headers.set('apikey',env.SUPABASE_SECRET_KEY); headers.set('Authorization',`Bearer ${env.SUPABASE_SECRET_KEY}`); headers.set('Content-Type','application/json'); headers.set('Prefer',headers.get('Prefer')||'return=representation');
  const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{...init,headers});
  const text=await r.text(); const body=text?JSON.parse(text):null; if(!r.ok) throw new Error(body?.message||text||'DB error'); return body;
}
export function json(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8'}})}
export function slug(){return crypto.randomUUID().replaceAll('-','').slice(0,8)}
export async function sha256(text:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
