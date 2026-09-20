#!/usr/bin/env python3
"""Catalan Challenge: inmersion acelerada CA con pistas en portugues."""

import random
import time


class CatalanChallenge:
    def __init__(self):
        self.puntos = 0
        self.palabras = [
            {"ca": "Bon dia", "es": "Buenos días", "pt": "Bom dia", "tipo": "Saludo"},
            {"ca": "Merci / Gràcies", "es": "Gracias", "pt": "Obrigado", "tipo": "Cortesía"},
            {"ca": "Si us plau", "es": "Por favor", "pt": "Por favor", "tipo": "Cortesía"},
            {"ca": "Adéu", "es": "Adiós", "pt": "Tchau", "tipo": "Despedida"},
            {"ca": "Institut", "es": "Instituto", "pt": "Escola", "tipo": "Educación"},
            {"ca": "Deures", "es": "Deberes", "pt": "Tarefa", "tipo": "Educación"},
            {"ca": "Pati", "es": "Patio", "pt": "Pátio", "tipo": "Escuela"},
            {"ca": "Biblioteca", "es": "Biblioteca", "pt": "Biblioteca", "tipo": "Lugar"},
            {"ca": "Menjar", "es": "Comer", "pt": "Comer", "tipo": "Verbo"},
            {"ca": "Beure", "es": "Beber", "pt": "Beber", "tipo": "Verbo"},
        ]

    def jugar(self, ejercicios=7):
        print("\n=== CATALAN CHALLENGE (nivel A1) ===")
        print("Palabra en catalan + pista en portugues. Elige el ES correcto.")
        time.sleep(1)
        random.shuffle(self.palabras)
        for i, p in enumerate(self.palabras[:ejercicios]):
            print(f"\nEjercicio {i+1}/{ejercicios} [{p['tipo']}]")
            print(f"Catalan: {p['ca']}   (pista PT: {p['pt']})")
            opciones = [p["es"]] + random.sample(
                [w["es"] for w in self.palabras if w != p], 2)
            random.shuffle(opciones)
            for j, o in enumerate(opciones, 1):
                print(f"  {j}) {o}")
            try:
                r = int(input("Respuesta (1/2/3): "))
                if opciones[r - 1] == p["es"]:
                    self.puntos += 15
                    print(f"Correcto! +15")
                else:
                    print(f"Incorrecto. {p['ca']} = {p['es']}")
            except (ValueError, IndexError):
                print("Invalido.")
            time.sleep(1)
        pct = self.puntos / (ejercicios * 15) * 100
        print(f"\nRESULTADO: {self.puntos}/{ejercicios*15} ({pct:.0f}%)")
        print("Nivel A2 alcanzado!" if pct >= 80 else
              "A1 consolidado." if pct >= 60 else
              "Practica mas con Parla.cat.")


if __name__ == "__main__":
    CatalanChallenge().jugar()
