import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const campus=resolve(dirname(fileURLToPath(import.meta.url)),"../campus");
const read=p=>readFileSync(resolve(campus,p),"utf8");
const pages=["index.html","empezar.html","metodo.html"];
test("institutional pages have semantic navigation, meta descriptions and no broken local routes",()=>{
 for(const page of pages){
  const html=read(page);
  assert.match(html,/<main\\b/);
  assert.match(html,/<h1\\b/);
  assert.match(html,/<meta name="description"/);
  assert.match(html,/institutional\\.css/);
  for(const matched of html.matchAll(/\\b(?:href|src)="([^"]+)"/g)){
   const href=matched[1]; if(/^(https?:|mailto:|data:|#)/i.test(href))continue;
   const cleaned=href.split(/[?#]/)[0]; if(!cleaned)continue;
   assert.ok(!cleaned.includes(".."),page+": path traversal "+cleaned);
   assert.ok(existsSync(resolve(campus,cleaned)),page+": missing "+cleaned);
  }
 }
});
test("quick-start links to the three real syllabi, not an absent practice route",()=>{
 const html=read("empezar.html");
 for(const name of ["falsos-amigos-pt-es","catalan-a1-brasileiros","espanol-academico-eso"]){assert.ok(html.includes('cursos/'+name+'/syllabus.md'));}
 assert.doesNotMatch(read("index.html"),/pratica-rapida\\.html/);
});
test("offline app cache includes the new institutional pages and stylesheet",()=>{
 const sw=read("sw.js"); for(const path of ["empezar.html","metodo.html","institutional.css"]){assert.ok(sw.includes('"./'+path+'"'));}
 assert.match(sw,/lingua-aberta-campus-v4/);
});
