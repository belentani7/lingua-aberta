import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "campus", "cursos");
const courses = [
  {id:"catalan-a1-brasileiros", weeks:4, minWords:620, examLength:24, threshold:17,
    contentMarkers:["Bon dia","Deures","menjo","Gira a l'esquerra"]},
  {id:"espanol-academico-eso", weeks:3, minWords:750, examLength:18, threshold:13,
    contentMarkers:["Lectura crítica","refutación","Defender una propuesta"]},
];
const read = (id, file) => readFileSync(join(base,id,file),"utf8");

test("seven original, substantial and navigable lessons exist, not placeholder headings", () => {
  let totalWeeks = 0;
  for (const c of courses) {
    const syllabus = read(c.id,"syllabus.md");
    assert.ok(syllabus.split(/\s+/).length >= 450, c.id + " syllabus must be real");
    assert.match(syllabus, /no certificación|no constituye un examen oficial|no acredita/i);
    for (let i=1;i<=c.weeks;i++) {
      const name="semana-"+String(i).padStart(2,"0")+".md";
      const file=read(c.id,name);
      assert.ok(file.trim().split(/\s+/).length >= c.minWords, c.id + "/" + name + " incomplete");
      assert.ok(file.includes("(syllabus.md)"), c.id + "/" + name + " has no way back");
      assert.ok(syllabus.includes("("+name+")"), c.id + " missing week link "+name);
      assert.ok(file.includes("Soluciones") || file.includes("soluciones") || file.includes("Clave") ||
        file.includes("Rúbrica") || file.includes("rúbrica"),
        c.id + "/" + name + " has no answer key or review guidance");
      totalWeeks++;
    }
    for (const marker of c.contentMarkers) {
      const joined=Array.from({length:c.weeks},(_,i)=>read(c.id,"semana-"+String(i+1).padStart(2,"0")+".md")).join("\n");
      assert.ok(joined.includes(marker), c.id+" missing core topic "+marker);
    }
  }
  assert.equal(totalWeeks,7);
});

test("both complete contextual quizzes give specific feedback and unbiased answer slots", () => {
  for (const c of courses) {
    const rows=JSON.parse(read(c.id,"quiz.json"));
    assert.equal(rows.length,c.examLength,c.id+" question count");
    assert.equal(new Set(rows.map(q=>q.pregunta.toLowerCase().trim())).size,c.examLength);
    const answers=[0,1,2,3].map(pos=>rows.filter(q=>q.correcta===pos).length);
    assert.ok(Math.max(...answers)-Math.min(...answers)<=1,c.id+" one-position bias");
    for(const [i,q] of rows.entries()) {
      assert.ok(q.pregunta.length>15,c.id+" short question "+i);
      assert.ok(q.explicacion.length>=50,c.id+" missing useful feedback "+i);
      assert.equal(q.opciones.length,4,c.id+" options "+i);
      assert.equal(new Set(q.opciones).size,4,c.id+" duplicate options "+i);
      assert.ok(Number.isInteger(q.correcta)&&q.correcta>=0&&q.correcta<4,c.id+" invalid answer "+i);
      assert.ok(!/[<>]/.test(q.pregunta+q.explicacion),c.id+" unsafe markup "+i);
    }
    const pct=Math.round(c.threshold/c.examLength*100);
    assert.ok(pct>=70&&pct<80,c.id+" claimed threshold should be approximately 70%");
  }
});

test("campus program and student-facing counts agree with real exams", () => {
  const html=readFileSync(join(root,"campus","index.html"),"utf8");
  assert.match(html,/4 semanas · 16 h · evaluación de 24 preguntas/);
  assert.match(html,/3 semanas · 10 h · evaluación de 18 preguntas/);
  assert.doesNotMatch(html,/4 semanas · 16 h · quiz 5 items|3 semanas · 10 h · quiz 3 items/);
  assert.match(read("catalan-a1-brasileiros","syllabus.md"),/24 preguntas/);
  assert.match(read("espanol-academico-eso","syllabus.md"),/18 preguntas/);
});

test("course promises remain honest about minors, audio and non-certification", () => {
  const cat=read("catalan-a1-brasileiros","syllabus.md");
  const eso=read("espanol-academico-eso","syllabus.md");
  assert.match(cat,/no.*certificad|no.*certificaci/i);
  assert.match(eso,/no acredita un nivel B1|no certificaci/i);
  assert.match(cat,/no solicita datos reales de estudiantes/);
  assert.match(eso,/grabaci|grabar/i);
  assert.match(read("catalan-a1-brasileiros","semana-04.md"),/ciudad inventada|ciutat|ficticio|ficticia/i);
  assert.match(read("espanol-academico-eso","semana-01.md"),/cifras.*ficticias|situación ficticia/i);
});
