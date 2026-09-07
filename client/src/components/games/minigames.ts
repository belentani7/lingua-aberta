// Minigames types and logic for Lingua Abierta
// Adapted from william.game (PolyGlot William)

export type Lang = "pt" | "es" | "ca" | "en";
export type GameId =
  | "flash"
  | "quiz"
  | "match"
  | "hang"
  | "anagram"
  | "listen"
  | "order"
  | "scene"
  | "whack"
  | "fall";
export type Feedback = "idle" | "correct" | "wrong";

export type Word = {
  id: number;
  topic: string;
  pt: string;
  es: string;
  ca: string;
  en: string;
  phrase: string;
  hint: string;
};

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "pt", label: "Português", flag: "BR" },
  { id: "es", label: "Español", flag: "ES" },
  { id: "ca", label: "Català", flag: "CA" },
  { id: "en", label: "English", flag: "EN" },
];

// Vocabulary adapted for Brazilian student in Catalonia (ESO 2/3)
export const WORDS: Word[] = [
  { id: 1, topic: "llegada", pt: "olá", es: "hola", ca: "hola", en: "hello", phrase: "Hola, sóc en William.", hint: "Un saludo simple para conocer a alguien." },
  { id: 2, topic: "llegada", pt: "obrigado", es: "gracias", ca: "gràcies", en: "thank you", phrase: "Gràcies per ajudar-me.", hint: "Una palabra para agradecer." },
  { id: 3, topic: "instituto", pt: "escola", es: "escuela", ca: "escola", en: "school", phrase: "La meva escola és aquí.", hint: "Donde estudias cada día." },
  { id: 4, topic: "ciudad", pt: "estação", es: "estación", ca: "estació", en: "station", phrase: "On és l'estació?", hint: "Un lugar donde esperas el tren o metro." },
  { id: 5, topic: "comida", pt: "água", es: "agua", ca: "aigua", en: "water", phrase: "Vull una mica d'aigua.", hint: "La bebes cuando tienes sed." },
  { id: 6, topic: "amistad", pt: "amigo", es: "amigo", ca: "amic", en: "friend", phrase: "Vols ser el meu amic?", hint: "Persona con quien compartes tiempo." },
  { id: 7, topic: "ciudad", pt: "esquerda", es: "izquierda", ca: "esquerra", en: "left", phrase: "Gira a l'esquerra.", hint: "La dirección opuesta a la derecha." },
  { id: 8, topic: "instituto", pt: "professor", es: "profesor", ca: "professor", en: "teacher", phrase: "La professora explica molt bé.", hint: "Persona que enseña en clase." },
  { id: 9, topic: "ciudad", pt: "rua", es: "calle", ca: "carrer", en: "street", phrase: "El carrer és llarg.", hint: "Por donde caminas en la ciudad." },
  { id: 10, topic: "casa", pt: "casa", es: "casa", ca: "casa", en: "house", phrase: "La meva casa és gran.", hint: "Donde vives con tu familia." },
  { id: 11, topic: "tiempo", pt: "hoje", es: "hoy", ca: "avui", en: "today", phrase: "Avui fa sol.", hint: "El día actual." },
  { id: 12, topic: "comida", pt: "pão", es: "pan", ca: "pa", en: "bread", phrase: "El pa olor a forn.", hint: "Alimento básico, a menudo en el desayuno." },
  { id: 13, topic: "familia", pt: "mãe", es: "madre", ca: "mare", en: "mother", phrase: "La meva mare m'espera.", hint: "La mamá." },
  { id: 14, topic: "familia", pt: "pai", es: "padre", ca: "pare", en: "father", phrase: "El meu pare treballa.", hint: "El papá." },
  { id: 15, topic: "estudio", pt: "livro", es: "libro", ca: "llibre", en: "book", phrase: "El llibre és a la taula.", hint: "Para leer y estudiar." },
  { id: 16, topic: "estudio", pt: "caderno", es: "cuaderno", ca: "quadern", en: "notebook", phrase: "Escric al quadern.", hint: "Para tomar apuntes en clase." },
  { id: 17, topic: "estudio", pt: "caneta", es: "bolígrafo", ca: "bolígraf", en: "pen", phrase: "El bolígraf és blau.", hint: "Para escribir." },
  { id: 18, topic: "ciudad", pt: "ônibus", es: "autobús", ca: "autobús", en: "bus", phrase: "L'autobús arriba ara.", hint: "Transporte público urbano." },
  { id: 19, topic: "comida", pt: "almoço", es: "almuerzo", ca: "dinar", en: "lunch", phrase: "El dinar és a l'una.", hint: "La comida del mediodía." },
  { id: 20, topic: "amistad", pt: "brincar", es: "jugar", ca: "jugar", en: "play", phrase: "Vols jugar amb mi?", hint: "Divertirse con amigos." },
];

export const GAME_META: { id: GameId; icon: string; title: string; description: string; color: string; detail: string }[] = [
  { id: "flash", icon: "◈", title: "Flashcards", description: "Gira, escucha y recuerda.", color: "coral", detail: "Memoria" },
  { id: "quiz", icon: "?", title: "Opción múltiple", description: "Elige la traducción exacta.", color: "cyan", detail: "Precisión" },
  { id: "match", icon: "⌘", title: "Empareja", description: "Conecta palabra y significado.", color: "gold", detail: "Conexiones" },
  { id: "hang", icon: "_", title: "Ahorcado amable", description: "Descubre palabra con pistas.", color: "green", detail: "Ortografía" },
  { id: "anagram", icon: "↯", title: "Anagrama", description: "Ordena las letras a toda velocidad.", color: "pink", detail: "Agilidad" },
  { id: "listen", icon: "◉", title: "Escucha y escribe", description: "Entrena oído y escritura.", color: "violet", detail: "Comprensión" },
  { id: "order", icon: "≡", title: "Ordena la frase", description: "Construye una frase real.", color: "blue", detail: "Expresión" },
  { id: "scene", icon: "✦", title: "Situación real", description: "Responde como en la vida.", color: "lime", detail: "Confianza" },
  { id: "whack", icon: "●", title: "Golpea al topo", description: "Toca la palabra correcta antes de que se esconda.", color: "coral", detail: "Reflejos" },
  { id: "fall", icon: "☄", title: "Lluvia de palabras", description: "Atrapa la traducción que cae del cielo.", color: "cyan", detail: "Rapidez" },
];

export const LANG_NAMES: Record<Lang, string> = { pt: "Português", es: "Español", ca: "Català", en: "English" };
export const VOICE_LOCALES: Record<Lang, string> = { pt: "pt-BR", es: "es-ES", ca: "ca-ES", en: "en-US" };

export function getText(word: Word, lang: Lang): string {
  return word[lang];
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let value = seed * 9301 + 49297;
  for (let i = result.length - 1; i > 0; i -= 1) {
    value = (value * 233280 + 12345) % 1000000;
    const j = Math.floor((value / 1000000) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const locale = VOICE_LOCALES[lang].toLowerCase();
  return voices.find((voice) => voice.lang.toLowerCase() === locale)
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(`${locale.split("-")[0]}-`));
}

export function makeUtterance(text: string, lang: Lang, rate = 0.92): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LOCALES[lang];
  utterance.rate = rate;
  utterance.pitch = 1.06;
  utterance.volume = 0.96;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  return utterance;
}

export function speak(text: string, lang: Lang, rate = 0.92): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(makeUtterance(text, lang, rate));
  return true;
}

export function speakSequence(parts: { text: string; lang: Lang }[], rate = 0.92): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !parts.length) return false;
  window.speechSynthesis.cancel();
  let cursor = 0;
  const playNext = () => {
    const part = parts[cursor++];
    if (!part) return;
    const utterance = makeUtterance(part.text, part.lang, rate);
    utterance.onend = playNext;
    window.speechSynthesis.speak(utterance);
  };
  playNext();
  return true;
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,']/g, "");
}