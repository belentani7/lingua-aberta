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
        self.assertRegex(app, r'<Route\s+path=\{"?/games"?\}')
        self.assertRegex(
            home,
            r'if\s*\(label\s*===\s*"Juegos"\)\s*\{[^}]*navigate\("/games"\)',
            "El botón Juegos debe abrir /games, no solo mostrar un aviso.",
        )


if __name__ == "__main__":
    unittest.main()
