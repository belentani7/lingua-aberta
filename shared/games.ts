/** Shared game catalog metadata for the Lingua Abierta minigames. */

export type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  languages: string[];
};

export const GAME_CATALOG: GameCatalogItem[] = [
  { id: "flash", title: "Flashcards", description: "Gira, escucha y recuerda.", languages: ["Español", "Català", "English"] },
  { id: "quiz", title: "Opción múltiple", description: "Elige la traducción exacta.", languages: ["Español", "Català", "English"] },
  { id: "match", title: "Empareja", description: "Conecta palabra y significado.", languages: ["Español", "Català", "English"] },
  { id: "hang", title: "Ahorcado amable", description: "Descubre palabra con pistas.", languages: ["Español", "Català", "English"] },
  { id: "anagram", title: "Anagrama", description: "Ordena las letras a toda velocidad.", languages: ["Español", "Català", "English"] },
  { id: "listen", title: "Escucha y escribe", description: "Entrena oído y escritura.", languages: ["Español", "Català", "English"] },
  { id: "order", title: "Ordena la frase", description: "Construye una frase real.", languages: ["Español", "Català", "English"] },
  { id: "scene", title: "Situación real", description: "Responde como en la vida.", languages: ["Español", "Català", "English"] },
  { id: "whack", title: "Golpea al topo", description: "Toca la palabra correcta antes de que se esconda.", languages: ["Español", "Català", "English"] },
  { id: "fall", title: "Lluvia de palabras", description: "Atrapa la traducción que cae del cielo.", languages: ["Español", "Català", "English"] },
];