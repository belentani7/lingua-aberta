#!/usr/bin/env python3
"""Mate-Escape: ecuaciones contrarreloj con vocabulario ES/PT integrado."""

import random
import time


class MateEscape:
    def __init__(self):
        self.puntos = 0
        self.vidas = 3
        self.glosario = {
            "ecuación": "equação", "despejar": "isolar", "solución": "solução",
            "incógnita": "incógnita", "sumar": "somar", "restar": "subtrair",
            "multiplicar": "multiplicar", "dividir": "dividir",
        }

    def generar(self, nivel):
        if nivel == 1:
            x = random.randint(1, 10)
            a = random.randint(1, 9)
            return f"x + {a} = {x + a}", x
        if nivel == 2:
            x = random.randint(1, 8)
            a = random.randint(2, 5)
            b = random.randint(1, 10)
            return f"{a}x + {b} = {a * x + b}", x
        x = random.randint(2, 10)
        a = random.randint(2, 6)
        b = random.randint(1, 8)
        return f"{a}x - {b} = {a * x - b}", x

    def jugar(self):
        print("\n=== MATE-ESCAPE ===")
        print("Resuelve antes de 15s. 3 vidas. Vocabulario ES->PT:")
        for es, pt in self.glosario.items():
            print(f"  {es} = {pt}")
        time.sleep(1.5)
        nivel = 1
        while self.vidas > 0 and nivel <= 3:
            print(f"\nNIVEL {nivel} | vidas: {self.vidas}")
            ec, sol = self.generar(nivel)
            t0 = time.time()
            try:
                r = int(input(f"Resuelve: {ec}  x = "))
                dt = time.time() - t0
                if dt > 15:
                    print("Tiempo agotado!")
                    self.vidas -= 1
                elif r == sol:
                    self.puntos += nivel * 10
                    print(f"Correcto! +{nivel*10} ({dt:.1f}s)")
                    nivel += 1
                else:
                    print(f"Incorrecto. x = {sol}")
                    self.vidas -= 1
            except ValueError:
                print("Numero valido, por favor.")
                self.vidas -= 1
            time.sleep(1)
        print(f"\nRESULTADO: {self.puntos} puntos, vidas {self.vidas}")
        print("Genio!" if self.puntos >= 50 else
              "Muy bien, sigue practicando." if self.puntos >= 30 else
              "Repasa ecuaciones de primer grado.")


if __name__ == "__main__":
    MateEscape().jugar()
