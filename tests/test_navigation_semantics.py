"""Regresión estática mínima para una entrada de menú que parecía navegable.

Ejecutar: python -m unittest discover -s tests -p "test_navigation_semantics.py"
Este test comprueba el contrato de código, no sustituye una prueba E2E en navegador.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class FunctionalNavigationTest(unittest.TestCase):
    def test_juegos_opens_existing_games_route(self):
        home = (ROOT / "client/src/pages/Home.tsx").read_text(encoding="utf-8")
        app = (ROOT / "client/src/App.tsx").read_text(encoding="utf-8")

        self.assertIn('label: "Juegos"', home)
        self.assertIn('<Route path="/games">', app)
        self.assertRegex(
            home,
            r'if\s*\(label\s*===\s*"Juegos"\)\s*\{[^}]*navigate\("/games"\)',
            "El botón Juegos debe abrir /games, no solo mostrar un aviso.",
        )

    def test_minha_rota_reaches_the_existing_course_section(self):
        home = (ROOT / "client/src/pages/Home.tsx").read_text(encoding="utf-8")
        self.assertIn('id="rota"', home)
        self.assertRegex(
            home,
            r'if\s*\(label\s*===\s*"Minha rota"\)[\s\S]{0,320}getElementById\("rota"\)',
            "Minha rota debe llevar al bloque real de rutas.",
        )

    def test_unreleased_sections_are_not_clickable_navigation(self):
        home = (ROOT / "client/src/pages/Home.tsx").read_text(encoding="utf-8")
        self.assertIn('label: "Biblioteca", icon: BookOpen, available: false', home)
        self.assertIn('label: "Comunidade", icon: MessageCircle, available: false', home)
        self.assertIn('disabled={!available}', home)

    def test_unavailable_actions_are_not_fake_clickable_buttons(self):
        home = (ROOT / "client/src/pages/Home.tsx").read_text(encoding="utf-8")
        for fake_action in (
            'toast("Rota completa"',
            'toast("Modo offline preparado"',
            'toast("Mapa da comunidade"',
            'toast("Diagnóstico em breve"',
            'toast("Acessibilidade"',
            'toast("Privacidade"',
            'toast("Comunidade em desenvolvimento"',
        ):
            self.assertNotIn(fake_action, home)
        self.assertIn('aria-label="Mensagens em breve" disabled', home)
        self.assertIn('Diagnóstico em preparação', home)
        self.assertIn('Progresso local', home)


if __name__ == "__main__":
    unittest.main()
