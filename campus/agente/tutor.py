#!/usr/bin/env python3
"""EDU FORGE — agente tutor vivo dentro de GitHub (caja Linux ya existente).

Vive en GitHub Actions (ubuntu-latest = caja Linux del runner). Dos trabajos:

  1. tutor-issue: responde issues etiquetados 'tutor' (o que mencionan
     @tutor) con una respuesta didactica. Intenta IA gratuita sin key
     (Pollinations, endpoint OpenAI-compatible); si no hay red/modelo,
     responde desde el banco didactico local (cero dependencias de pago).
  2. capsula-diaria: cada dia publica una capsula didactica en
     campus/capsulas/YYYY-MM-DD.md y hace commit (el agente "vive":
     el repo se mueve solo, con evidencia en el historial).

Cero secretos: usa GITHUB_TOKEN efimero del runner (no se commitea nada).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CAPSULAS = {
    "es": "Cápsula del día: un prompt útil es ROL + TAREA + CONTEXTO + FORMATO. "
          "Prueba: 'Actúa como orientador laboral. Dime 5 preguntas de "
          "entrevista para camarero en Barcelona. Responde en lista.'",
    "ca": "Càpsula del dia: per aprendre català, escolta 10 minuts de Parla.cat "
          "i repeteix en veu alta. La constància guanya a la intensitat.",
    "pt": "Cápsula do dia: revise 5 falsos amigos PT->ES. 'Embaraçada' NÃO é "
          "'embarazada': é 'avergonzada'. Um por dia, sem pressa.",
    "en": "Daily capsule: learn by evidence. After each lesson, write 3 lines "
          "in your own words. Teaching someone else is the fastest way to learn.",
}


def pollinations(prompt: str) -> str | None:
    """IA gratuita sin API key (fallback a banco local si falla)."""
    try:
        req = urllib.request.Request(
            "https://text.pollinations.ai/openai",
            data=json.dumps({
                "model": "openai",
                "messages": [
                    {"role": "system",
                     "content": "Eres un tutor educativo breve y preciso. "
                                "Respondes en el idioma del usuario, max 200 palabras."},
                    {"role": "user", "content": prompt}],
                "temperature": 0.4,
            }).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
        msg = data["choices"][0]["message"]["content"].strip()
        return msg[:1500] or None
    except Exception:
        return None


def gh(*args: str) -> str:
    out = subprocess.run(["gh", *args], capture_output=True, text=True)
    return out.stdout.strip()


def tutor_issue() -> None:
    ev = json.loads(Path(os.environ["GITHUB_EVENT_PATH"])
                    .read_text(encoding="utf-8"))
    issue = ev.get("issue") or ev.get("pull_request")
    if not issue:
        print("sin issue en el evento"); return
    numero = issue["number"]
    cuerpo = issue.get("body") or ""
    if not cuerpo.strip():
        return
    resp = pollinations(
        f"Pregunta de un estudiante (responde como tutor del campus, "
        f"en el mismo idioma de la pregunta, con un ejemplo concreto):\n\n{cuerpo}")
    if not resp:
        resp = ("(Respuesta del banco didactico local — modo offline)\n\n"
                "No he podido conectar con un modelo externo, pero tu "
                "pregunta queda registrada. Revisa `campus/cursos/` para "
                "material relacionado y vuelve a etiquetar `tutor` si "
                "necesitas profundizar.")
    gh("issue", "comment", str(numero), "--body", resp[:5000])
    print(f"[tutor] respondida la issue #{numero}")


def capsula_diaria() -> None:
    """Propone una cápsula mediante PR, respetando la protección de main."""
    hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    langs = ["es", "ca", "pt", "en"]
    lang = langs[datetime.now(timezone.utc).day % len(langs)]
    rama = f"bot/capsula-{hoy}"
    remoto = subprocess.run(
        ["git", "ls-remote", "--exit-code", "--heads", "origin", rama],
        capture_output=True, text=True, check=False, timeout=30,
    )
    if remoto.returncode == 0:
        print(f"[capsula] rama ya existe: {rama}; sin duplicados")
        return
    if remoto.returncode != 2:
        raise RuntimeError("No se pudo verificar la rama remota del agente")

    carpeta = Path("campus/capsulas")
    carpeta.mkdir(parents=True, exist_ok=True)
    archivo = carpeta / f"{hoy}.md"
    if archivo.exists():
        print("[capsula] ya existe para hoy")
        return

    archivo.write_text(
        f"# Cápsula {hoy} [{lang.upper()}]\n\n{CAPSULAS[lang]}\n\n"
        "*Generada por el agente tutor; pendiente de revisión en PR.*\n",
        encoding="utf-8",
    )
    subprocess.run(["git", "config", "user.name", "Belentani Tutor Bot"], check=True)
    subprocess.run(["git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], check=True)
    subprocess.run(["git", "switch", "-c", rama], check=True)
    subprocess.run(["git", "add", str(archivo)], check=True)
    subprocess.run(
        ["git", "commit", "-m", f"docs(capsula): {hoy} [{lang}]"],
        check=True,
    )
    subprocess.run(["git", "push", "--set-upstream", "origin", rama], check=True)
    # La acción requiere habilitar creación de PRs por GitHub Actions en settings.
    pr = subprocess.run(
        [
            "gh", "pr", "create", "--base", "main", "--head", rama,
            "--title", f"docs(capsula): {hoy} [{lang}]",
            "--body", "Cápsula didáctica diaria. Revisar contenidos antes de fusionar; no se ha modificado main directamente.",
        ],
        capture_output=True, text=True, check=False, timeout=45,
    )
    if pr.returncode != 0:
        # The capsule is already preserved on a review branch. Repository
        # settings may prohibit GITHUB_TOKEN from opening pull requests.
        # Report this as a warning, not as a failed content-generation job.
        print("::warning::La cápsula fue guardada en una rama, pero GitHub Actions no puede crear PRs.")
        print(f"[capsula] revisión manual: {rama}; habilitar creación de PRs para automatizarla")
        return
    print(f"[capsula] PR creado para {hoy} [{lang}]: {pr.stdout.strip()}")

def main() -> int:
    modo = sys.argv[1] if len(sys.argv) > 1 else os.environ.get(
        "TUTOR_MODE", "capsula")
    if modo == "issue":
        tutor_issue()
    else:
        capsula_diaria()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
