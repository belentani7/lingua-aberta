#!/usr/bin/env python3
"""Trilingue Express: traduccion rapida PT->ES con rachas (PT/ES/CA/EN)."""

import random
import time


class TrilingueExpress:
    def __init__(self):
        self.puntos = 0
        self.racha = 0
        self.max_racha = 0
        self.vocab = [
            {"pt": "Casa", "es": "Casa", "ca": "Casa", "en": "House"},
            {"pt": "Escola", "es": "Escuela", "ca": "Escola", "en": "School"},
            {"pt": "Livro", "es": "Libro", "ca": "Llibre", "en": "Book"},
            {"pt": "Água", "es": "Agua", "ca": "Aigua", "en": "Water"},
            {"pt": "Amigo", "es": "Amigo", "ca": "Amic", "en": "Friend"},
            {"pt": "Comida", "es": "Comida", "ca": "Menjar", "en": "Food"},
            {"pt": "Trabalho", "es": "Trabajo", "ca": "Feina", "en": "Work"},
            {"pt": "Tempo", "es": "Tiempo/Clima", "ca": "Temps", "en": "Time/Weather"},
        ]

    def jugar(self):
        print("\n=== TRILINGUE EXPRESS ===")
        print("Traduce del PORTUGUES al ESPAÑOL. Racha = bonus +5.")
        time.sleep(1)
        random.shuffle(self.vocab)
        for i, p in enumerate(self.vocab):
            print(f"\nPalabra {i+1}/{len(self.vocab)} | racha: {self.racha}")
            print(f"Portugues: {p['pt']}")
            opciones = [p["es"]] + random.sample(
                [w["es"] for w in self.vocab if w != p], 2)
            random.shuffle(opciones)
            for j, o in enumerate(opciones, 1):
                print(f"  {j}) {o}")
            try:
                r = int(input("Respuesta (1/2/3): "))
                if opciones[r - 1] == p["es"]:
                    bonus = 5 if self.racha else 0
                    self.puntos += 10 + bonus
                    self.racha += 1
                    self.max_racha = max(self.max_racha, self.racha)
                    print(f"Correcto! +{10 + bonus}  CA: {p['ca']}  EN: {p['en']}")
                else:
                    print(f"Incorrecto. Era: {p['es']}")
                    self.racha = 0
            except (ValueError, IndexError):
                print(f"Invalido. Era: {p['es']}")
                self.racha = 0
            time.sleep(1)
        print(f"\nRESULTADO: {self.puntos} puntos, mejor racha {self.max_racha}")
        print("Poliglota natural!" if self.max_racha >= 5 else
              "Tu cerebro trilingue funciona." if self.max_racha >= 3 else
              "Sigue practicando vocabulario basico.")


if __name__ == "__main__":
    TrilingueExpress().jugar()
