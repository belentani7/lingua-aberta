// campus app: quiz player + stagger + audit (sin dependencias)
document.documentElement.classList.add('js');

const $ = (sel, root = document) => root.querySelector(sel);

function loadQuiz(url) {
  const box = $('.quiz-box');
  if (!box) return;
  fetch(url).then(r => r.json()).then(items => {
    let idx = 0, score = 0;
    const titulo = $('.quiz-titulo', box);
    const opciones = $('.opciones', box);
    const feedback = $('.feedback', box);
    const marcador = $('.marcador', box);
    const btn = $('.quiz-siguiente', box);
    const render = () => {
      const q = items[idx];
      titulo.textContent = `${idx + 1}/${items.length} · ${q.pregunta}`;
      opciones.innerHTML = '';
      q.opciones.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'opcion';
        b.textContent = o;
        b.addEventListener('click', () => {
          [...opciones.children].forEach((el, j) => {
            el.classList.add(j === q.correcta ? 'correcta' : 'fallo');
            el.disabled = true;
          });
          const ok = i === q.correcta;
          if (ok) score++;
          feedback.textContent = ok
            ? `Correcto. ${q.explicacion}`
            : `Incorrecto. ${q.explicacion}`;
          marcador.textContent = `Aciertos: ${score}`;
          btn.hidden = false;
        });
        opciones.appendChild(b);
      });
      btn.hidden = true;
    };
    btn.addEventListener('click', () => {
      idx++;
      if (idx >= items.length) {
        titulo.textContent = `Terminado: ${score}/${items.length}`;
        opciones.innerHTML = '';
        feedback.textContent = score >= items.length * 0.7
          ? 'Nivel superado.' : 'Repasa y vuelve a intentarlo.';
        btn.hidden = true;
        marcador.textContent = '';
        return;
      }
      render();
    });
    render();
  }).catch(() => {
    $('.quiz-titulo', box).textContent = 'Quiz no disponible offline.';
  });
}

// stagger sutil de tarjetas (respeta reduced-motion)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced) {
  document.querySelectorAll('.card').forEach((el, i) => {
    el.style.animation = 'rise var(--dur-slow) var(--ease-out) both';
    el.style.animationDelay = `${Math.min(i * 60, 300)}ms`;
  });
  const st = document.createElement('style');
  st.textContent = '@keyframes rise{from{opacity:0;transform:translateY(8px)}}';
  document.head.appendChild(st);
}

// auditoria rapida de accesibilidad (consola)
window.uiAudit = () => {
  const issues = [];
  document.querySelectorAll('img:not([alt])').forEach(() =>
    issues.push('img sin alt'));
  document.querySelectorAll('a, button').forEach(el => {
    const r = el.getBoundingClientRect();
    if ((r.width < 44 || r.height < 44) && !el.disabled)
      issues.push(`Target pequeno: ${el.tagName}`);
  });
  return issues;
};

// registro offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.querySelectorAll('.quiz-json').forEach(el => loadQuiz(el.dataset.src));
