#!/usr/bin/env python3
"""Caza-Falsos Amigos: vocabulario critico PT->ES. Rondas A/B con feedback."""

import random
import time


class CazaFalsosAmigos:
    def __init__(self):
        self.puntos = 0
        self.falsos_amigos = [
            {"pt": "Embaraçada", "trampa": "Embarazada", "correcta": "Avergonzada", "ca": "Avergonyida"},
            {"pt": "Esquisito", "trampa": "Exquisito", "correcta": "Raro", "ca": "Estrany"},
            {"pt": "Oficina", "trampa": "Oficina", "correcta": "Taller mecánico", "ca": "Taller"},
            {"pt": "Polvo", "trampa": "Polvo", "correcta": "Suciedad (pols)", "ca": "Pols"},
            {"pt": "Sobrenome", "trampa": "Sobrenombre", "correcta": "Apellido", "ca": "Cognom"},
            {"pt": "Rato", "trampa": "Rato (tiempo)", "correcta": "Ratón", "ca": "Ratolí"},
            {"pt": "Vassoura", "trampa": "Basura", "correcta": "Escoba", "ca": "Escombra"},
            {"pt": "Propina", "trampa": "Propina", "correcta": "Soborno", "ca": "Suborn"},
            {"pt": "Apelido", "trampa": "Apellido", "correcta": "Apodo/mote", "ca": "Malnom"},
            {"pt": "Borracha", "trampa": "Borracha (ebria)", "correcta": "Goma de borrar", "ca": "Goma"},
        ]

    def jugar(self, rondas=5):
        print("\n=== CAZA-FALSOS AMIGOS ===")
        print("William dice una palabra en PORTUGUES. Elige la traduccion "
              "CORRECTA al ESPAÑOL. Una opcion es TRAMPA.")
        time.sleep(1)
        random.shuffle(self.falsos_amigos)
        for i, p in enumerate(self.falsos_amigos[:rondas]):
            print(f"\nRonda {i+1}/{rondas}: {p['pt']}")
            print(f"  A) {p['trampa']}   B) {p['correcta']}")
            r = input("Tu respuesta (A/B): ").upper().strip()
            if r == "B":
                self.puntos += 10
                print(f"  Correcto! +10. En catalan: {p['ca']}")
            else:
                print(f"  Falso amigo! '{p['trampa']}' significa otra cosa.")
                print(f"  Correcta: {p['correcta']}")
            print(f"  Puntos: {self.puntos}")
            time.sleep(0.8)
        print(f"\nRESULTADO: {self.puntos}/{rondas*10}")
        if self.puntos >= rondas * 8:
            print("Excelente: experto en falsos amigos.")
        elif self.puntos >= rondas * 5:
            print("Bien. Repasa la lista maestra.")
        else:
            print("Necesitas practica. Revisa la semana 2 del curso.")


if __name__ == "__main__":
    CazaFalsosAmigos().jugar()
