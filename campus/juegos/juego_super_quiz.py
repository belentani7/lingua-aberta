#!/usr/bin/env python3
"""Super Quiz Integral: todo en uno (mate, idiomas, ciencias, cultura)."""

import random
import time


class SuperQuizIntegral:
    def __init__(self):
        self.puntos = 0
        self.correctas = 0
        self.preguntas = [
            {"t": "MATE", "p": "Si 2x + 5 = 15, ¿cuánto vale x?",
             "o": ["5", "10", "7.5"], "c": 0,
             "e": "2x = 10, entonces x = 5."},
            {"t": "MATE", "p": "¿Cómo se dice 'ecuación' en portugués?",
             "o": ["Equação", "Equacion", "Equassion"], "c": 0,
             "e": "Equação, con tilde en la a."},
            {"t": "IDIOMA", "p": "¿Qué significa 'Embaraçada'?",
             "o": ["Embarazada", "Avergonzada", "Enfadada"], "c": 1,
             "e": "Falso amigo: avergonzada."},
            {"t": "IDIOMA", "p": "'Esquisito' en portugués significa...",
             "o": ["Exquisito", "Raro", "Especial"], "c": 1,
             "e": "Raro/extraño."},
            {"t": "CATALÁN", "p": "¿'Deberes' en catalán?",
             "o": ["Deberes", "Deures", "Treballs"], "c": 1,
             "e": "Deures."},
            {"t": "CATALÁN", "p": "'Institut' significa...",
             "o": ["Instituto", "Hospital", "Biblioteca"], "c": 0,
             "e": "Instituto, igual que en portugués."},
            {"t": "INGLÉS", "p": "Traduce: 'School'",
             "o": ["Escuela", "Trabajo", "Casa"], "c": 0,
             "e": "School = escuela (escola en PT)."},
            {"t": "INGLÉS", "p": "'Homework' significa...",
             "o": ["Trabajo en casa", "Tarea/deberes", "Examen"], "c": 1,
             "e": "Deberes escolares."},
            {"t": "CIENCIA", "p": "'Célula' en inglés es...",
             "o": ["Cell", "Sell", "Cellar"], "c": 0,
             "e": "Cell."},
            {"t": "CIENCIA", "p": "'Átomo' en catalán se escribe...",
             "o": ["Átomo", "Àtom", "Atom"], "c": 1,
             "e": "Àtom, con acento grave."},
            {"t": "GRAMÁTICA", "p": "En español, 'hay' expresa...",
             "o": ["Posesión", "Existencia", "Acción"], "c": 1,
             "e": "Hay = existe/existen (há/tem en PT)."},
            {"t": "GRAMÁTICA", "p": "El verbo 'ser' en catalán es...",
             "o": ["Ser", "Ésser/Ser", "Estar"], "c": 1,
             "e": "Ésser o Ser, ambas válidas."},
            {"t": "ESCUELA", "p": "'Pati' en catalán significa...",
             "o": ["Patio", "Clase", "Examen"], "c": 0,
             "e": "Patio (recreio en PT)."},
            {"t": "ESCUELA", "p": "'Examen' en catalán es...",
             "o": ["Prova", "Examen", "Ambas son correctas"], "c": 2,
             "e": "Se usan Prova y Examen."},
            {"t": "CULTURA", "p": "Idioma cooficial en Cataluña además del español:",
             "o": ["Portugués", "Catalán", "Francés"], "c": 1,
             "e": "Catalán."},
        ]

    def jugar(self):
        print("\n=== SUPER QUIZ INTEGRAL ===")
        print("15 preguntas: matematicas, idiomas, ciencias, cultura.")
        time.sleep(1)
        random.shuffle(self.preguntas)
        for i, q in enumerate(self.preguntas):
            print(f"\nPregunta {i+1}/15 [{q['t']}]")
            print(q["p"])
            for j, o in enumerate(q["o"], 1):
                print(f"  {j}) {o}")
            try:
                r = int(input("Respuesta (numero): "))
                if r - 1 == q["c"]:
                    self.puntos += 10
                    self.correctas += 1
                    print(f"Correcto! +10. {q['e']}")
                else:
                    print(f"Incorrecto. Era: {q['o'][q['c']]}. {q['e']}")
            except (ValueError, IndexError):
                print(f"Invalido. Era: {q['o'][q['c']]}")
            time.sleep(0.8)
        pct = self.correctas / 15 * 100
        print(f"\nRESULTADO: {self.correctas}/15 ({pct:.0f}%) · {self.puntos} pts")
        nivel = ("EXPERTO" if pct >= 90 else "AVANZADO" if pct >= 70 else
                 "INTERMEDIO" if pct >= 50 else "PRINCIPIANTE")
        print(f"Nivel: {nivel}")
        if self.correctas < 8:
            print("Recomendacion: repasa falsos amigos y usa Parla.cat "
                  "para catalan basico.")


if __name__ == "__main__":
    SuperQuizIntegral().jugar()
