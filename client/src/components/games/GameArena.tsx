import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Gamepad2,
  Headphones,
  Languages,
  Lightbulb,
  Menu,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import GameCanvas from "@/components/GameCanvas";
import { trpc } from "@/lib/trpc";
import {
  type Lang,
  type GameId,
  type Feedback,
  type Word,
  LANGS,
  WORDS,
  GAME_META,
  LANG_NAMES,
  VOICE_LOCALES,
  getText,
  seededShuffle,
  speak,
  speakSequence,
  normalizeAnswer,
  pickVoice,
  makeUtterance,
} from "@/components/games/minigames";

interface GameArenaProps {
  onBack?: () => void;
  onProgress?: (data: { gameId: GameId; wordId: number; correct: boolean; xp: number }) => void;
  initialLanguage?: Lang;
  targetLanguage?: Lang;
}

export default function GameArena({
  onBack,
  onProgress,
  initialLanguage = "pt",
  targetLanguage = "ca",
}: GameArenaProps) {
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const queryGame = query.get("game") as GameId | null;
  const safeGame = queryGame && GAME_META.some((item) => item.id === queryGame) ? queryGame : "quiz";
  const [booted, setBooted] = useState(() => typeof window !== "undefined" && query.has("demo"));
  const [screen, setScreen] = useState<"home" | "game" | "lesson">(() => query.get("screen") === "lesson" ? "lesson" : queryGame ? "game" : "home");
  const [selectedGame, setSelectedGame] = useState<GameId>(safeGame);
  const [sourceLang, setSourceLang] = useState<Lang>(initialLanguage);
  const [targetLang, setTargetLang] = useState<Lang>(targetLanguage);
  const [wordIndex, setWordIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(3);
  const [xp, setXp] = useState(38);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lunaTalking, setLunaTalking] = useState(false);
  const [lunaText, setLunaText] = useState("Oi William. Avui desbloquegem paraules noves. Tu pots!");
  const [lunaParts, setLunaParts] = useState<{ text: string; lang: Lang }[]>([
    { text: "Oi William.", lang: "pt" },
    { text: "Avui desbloquegem paraules noves. Tu pots!", lang: "ca" },
  ]);
  const [showMenu, setShowMenu] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState("");
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [matchPick, setMatchPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [lessonStep, setLessonStep] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const utils = trpc.useContext();
  const startSession = trpc.games.startSession.useMutation();
  const saveProgress = trpc.games.saveProgress.useMutation();
  const { data: savedProgress } = trpc.games.progress.useQuery({ gameId: selectedGame, language: targetLanguage });

  useEffect(() => {
    if (savedProgress) {
      setScore(savedProgress.bestScore);
      setXp(savedProgress.totalXp > 0 ? savedProgress.totalXp % 100 : 0);
    }
  }, [savedProgress]);

  const word = WORDS[wordIndex % WORDS.length];
  const meta = GAME_META.find((item) => item.id === selectedGame) ?? GAME_META[0];
  const source = getText(word, sourceLang);
  const target = getText(word, targetLang);
  const phraseTokens = useMemo(() => seededShuffle(word.phrase.split(" "), word.id + 9), [word]);
  const anagramLetters = useMemo(() => seededShuffle(target.replace(/\s/g, "").split(""), word.id + 19), [target, word]);
  const matchWords = useMemo(() => seededShuffle(WORDS.slice(wordIndex % 4, (wordIndex % 4) + 4), word.id + 7), [word, wordIndex]);
  const hangWord = target.replace(/\s/g, "");
  const whackChoices = useMemo(() => {
    const others = WORDS.filter((item) => item.id !== word.id);
    const pool = seededShuffle(others, word.id + 23).slice(0, 5).map((item) => ({ id: item.id, label: getText(item, targetLang) }));
    const targetLabel = getText(word, targetLang);
    const all = seededShuffle([{ id: word.id, label: targetLabel }, ...pool], word.id + 31);
    return { choices: all, correctId: word.id };
  }, [word, targetLang]);

  useEffect(() => {
    if (!booted || !voiceOn) return;
    const timer = window.setTimeout(() => {
      speakSequence([{ text: "Oi William.", lang: "pt" }, { text: "Avui desbloquegem paraules noves. Tu pots!", lang: "ca" }]);
      setLunaTalking(true);
      window.setTimeout(() => setLunaTalking(false), 2600);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [booted, voiceOn]);

  useEffect(() => {
    if (feedback === "idle") return;
    const timer = window.setTimeout(() => setFeedback("idle"), 1400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const talkParts = useCallback((parts: { text: string; lang: Lang }[]) => {
    const visibleText = parts.map((part) => part.text).join(" ");
    setLunaText(visibleText);
    setLunaParts(parts);
    if (voiceOn && speakSequence(parts)) {
      setLunaTalking(true);
      window.setTimeout(() => setLunaTalking(false), Math.min(5000, Math.max(1600, visibleText.length * 42)));
    }
  }, [voiceOn]);

  const talk = useCallback((text: string, lang: Lang = "es") => talkParts([{ text, lang }]), [talkParts]);

  const resetRound = useCallback((nextIndex = wordIndex + 1) => {
    setWordIndex(nextIndex);
    setFeedback("idle");
    setFlipped(false);
    setTyped("");
    setSelectedLetters([]);
    setGuessed([]);
    setMatchPick(null);
    setMatched([]);
  }, [wordIndex]);

  const resolve = useCallback((correct: boolean, successText?: string, lang: Lang = "es") => {
    if (correct) {
      saveProgress.mutate({
        gameId: selectedGame,
        language: targetLanguage,
        score: 1,
        xpEarned: 9,
        correct: true,
        streak: streak + 1,
        wordId: word.id,
        completed: false,
      }, {
        onSuccess: () => utils.games.progress.invalidate({ gameId: selectedGame, language: targetLanguage }),
      });
    }
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
      setXp((value) => Math.min(100, value + 9));
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 900);
      talk(successText ?? "¡Muy bien! Esa palabra ya está en tu mapa mental.", lang);
      onProgress?.({ gameId: selectedGame, wordId: word.id, correct: true, xp: 9 });
    } else {
      setStreak(0);
      talkParts([
        { text: "Casi. La respuesta es", lang: "es" },
        { text: `${target}.`, lang: targetLang },
        { text: "Escúchala y vuelve a intentarlo.", lang: "es" },
      ]);
      onProgress?.({ gameId: selectedGame, wordId: word.id, correct: false, xp: 0 });
    }
  }, [selectedGame, word, target, targetLang, talk, talkParts, onProgress, saveProgress, utils, targetLanguage, streak]);

  const launchGame = useCallback((id: GameId) => {
    setSelectedGame(id);
    setScreen("game");
    resetRound(wordIndex);
    startSession.mutate({ gameId: id, language: targetLang });
    talk(`Vamos con ${GAME_META.find((item) => item.id === id)?.title ?? "la misión"}. Yo te acompaño.`, "es");
  }, [wordIndex, resetRound, talk, targetLang, startSession]);

  const next = useCallback(() => {
    resetRound();
    talk("Siguiente palabra. Mantén el ritmo, sin prisa.", "es");
  }, [resetRound, talk]);

  const checkTyped = useCallback(() => resolve(normalizeAnswer(typed) === normalizeAnswer(target)), [typed, target, resolve]);

  const handleLetter = useCallback((letter: string) => {
    if (guessed.includes(letter)) return;
    const nextGuessed = [...guessed, letter];
    setGuessed(nextGuessed);
    if (!hangWord.split("").some((char) => char.toLocaleLowerCase() === letter.toLocaleLowerCase())) {
      talk("Buena prueba. Esa letra no aparece; mira la pista.", "es");
      setFeedback("wrong");
      return;
    }
    if (hangWord.split("").every((char) => nextGuessed.includes(char.toLocaleLowerCase()))) resolve(true, "¡Palabra descubierta! Tu ortografía está despierta.");
  }, [guessed, hangWord, talk, resolve]);

  const swapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    talk(`Ruta cambiada: ${LANG_NAMES[targetLang]} hacia ${LANG_NAMES[sourceLang]}.`, "es");
  }, [sourceLang, targetLang, talk]);

  const lessonCards = [
    { title: "Llegar y saludar", body: "Bon dia, sóc en William. Em dic William.", note: "Català de bienvenida" },
    { title: "Pedir ayuda", body: "Em pots ajudar, si us plau?", note: "Una frase que abre puertas" },
    { title: "Moverte por la ciudad", body: "On és l'estació?", note: "Pregunta corta, gran autonomía" },
  ];

  if (!booted) {
    return (
      <div className="boot-screen" onClick={() => setBooted(true)} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setBooted(true)}>
        <GameCanvas />
        <div className="boot-glow" />
        <div className="boot-content">
          <div className="boot-mark"><img src="/manus-storage/belentani-mark_3f5c56fd.png" alt="" /></div>
          <p className="eyebrow">LINGUA ABERTA · MÓDULO POLYGLOT</p>
          <h1>PolyGlot<br /><span>William</span></h1>
          <p className="boot-subtitle">Un arcade de idiomas para llegar más lejos.</p>
          <div className="boot-language-row"><span>PT-BR</span><i /> <span>ES</span><i /> <span>CA</span><i /> <span>EN</span></div>
          <button className="boot-cta"><span className="pulse-dot" /> Toca para entrar <ChevronRight size={17} /></button>
          <p className="boot-hint">Audio opcional · diseñado para móvil</p>
        </div>
        <div className="boot-foot"><span>14:07</span><span>SYS READY</span><span>v.01</span></div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${celebrate ? "celebrate" : ""}`}>
      <GameCanvas />
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="scanlines" />
      <div className="app-wrap">
        <header className="topbar">
          <button className="brand" onClick={() => onBack?.()} aria-label="Volver a inicio">
            <span className="brand-icon"><img src="/manus-storage/belentani-mark_3f5c56fd.png" alt="" /></span>
            <span><strong>Lingua</strong><small>abierta</small></span>
          </button>
          <div className="top-status"><span className="status-light" /> online <b>WILLIAM</b></div>
          <button className="icon-button" onClick={() => setShowMenu((value) => !value)} aria-label="Abrir menú"><Menu size={19} /></button>
        </header>

        {showMenu && (
          <div className="menu-pop glass-panel">
            <button onClick={() => { setVoiceOn((value) => !value); setShowMenu(false); }}><span>{voiceOn ? <VolumeX size={16} /> : <Volume2 size={16} />} Voz de Luna</span><small>{voiceOn ? "ACTIVA" : "SILENCIADA"}</small></button>
            <button onClick={() => { setScreen("lesson"); setShowMenu(false); }}><span><BookOpen size={16} /> Lecciones</span><small>3 rutas</small></button>
            <button onClick={() => { setScreen("home"); setShowMenu(false); }}><span><RotateCcw size={16} /> Reiniciar ruta</span><small>desde cero</small></button>
          </div>
        )}

        <section className="luna-panel glass-panel">
          <div className={`luna-avatar ${lunaTalking ? "talking" : ""}`}><img src="/manus-storage/luna-avatar-v2_58aca287.png" alt="Luna, mentora de idiomas" /><span className="voice-ring" /></div>
          <div className="luna-copy"><div className="luna-name"><span>LUNA</span><em>IA AMIGA · {lunaParts.map((part) => VOICE_LOCALES[part.lang]).join(" + ")}</em><button onClick={() => voiceOn && speakSequence(lunaParts)} aria-label="Repetir mensaje"><Volume2 size={14} /></button></div><p>{lunaText}</p></div>
          <div className="luna-signal"><span /><span /><span /></div>
        </section>

        {screen === "home" && (
          <main>
            <section className="route-hero glass-panel" style={{ backgroundImage: "linear-gradient(90deg, rgba(12,4,25,.98) 0%, rgba(12,4,25,.82) 45%, rgba(12,4,25,.16) 100%), url('/manus-storage/catalonia-route-bg_bb5c81cf.png')" }}>
              <div className="hero-copy"><p className="kicker"><span className="map-pin-mark">+</span> RUTA ACTIVA · LLEGADA A CATALUÑA</p><h2>Aprende para <span>moverte</span> sin miedo.</h2><p>Microlecciones para tus primeras conversaciones, desde Brasil hasta tu nuevo mapa.</p><button className="primary-button" onClick={() => setScreen("lesson")}>Continuar ruta <ChevronRight size={17} /></button></div>
              <div className="hero-orbit"><span>CA</span><span>ES</span><span>EN</span><div>3</div></div>
            </section>

            <section className="progress-panel glass-panel">
              <div className="progress-head"><div><span className="eyebrow">PROGRESO DE HOY</span><strong>{xp}<small>/100 XP</small></strong></div><div className="streak"><Flame size={16} /> {streak} <small>racha</small></div></div>
              <div className="progress-track"><i style={{ width: `${xp}%` }} /></div>
              <div className="progress-meta"><span><Check size={13} /> 4 respuestas correctas</span><span><Zap size={13} /> +9 XP por acierto</span></div>
            </section>

            <div className="section-row"><div><span className="eyebrow">MODO ENTRENAMIENTO</span><h2>Elige tu misión</h2></div><span className="round-count">{score} aciertos</span></div>
            <section className="games-grid">
              {GAME_META.map((game) => <button key={game.id} className={`game-card glass-panel ${game.color}`} onClick={() => launchGame(game.id)}><span className="game-icon">{game.icon}</span><span className="game-title">{game.title}</span><span className="game-desc">{game.description}</span><span className="game-foot"><small>{game.detail}</small><ChevronRight size={15} /></span></button>)}
            </section>

            <section className="quick-lesson glass-panel" onClick={() => setScreen("lesson")} role="button" tabIndex={0}>
              <div className="lesson-art" style={{ backgroundImage: "linear-gradient(90deg, rgba(16,7,30,.92), rgba(16,7,30,.15)), url('/manus-storage/lesson-world_d9c40de2.png')" }}><span className="lesson-badge"><BookOpen size={13} /> LECCIÓN EXPRESS</span></div>
              <div className="lesson-copy"><span className="eyebrow">SIGUIENTE DESBLOQUEO</span><h3>Conversaciones del instituto</h3><p>3 min · 6 palabras · voz de Luna</p><span className="text-link">Abrir lección <ChevronRight size={14} /></span></div>
            </section>
            <section className="open-data-note glass-panel"><div className="open-data-mark"><Languages size={18} /></div><div><span className="eyebrow">CONTENIDO ABIERTO</span><h3>Más frases, sin encerrar el aprendizaje.</h3><p>La ruta está preparada para crecer con frases abiertas y revisadas de Tatoeba, con atribución y filtros por idioma.</p><a href="https://tatoeba.org/en/" target="_blank" rel="noreferrer">Ver banco abierto <ChevronRight size={14} /></a></div></section>
          </main>
        )}

        {screen === "lesson" && (
          <main className="lesson-screen">
            <button className="back-button" onClick={() => setScreen("home")}><ArrowLeft size={17} /> Volver al mapa</button>
            <div className="lesson-title-row"><div><span className="eyebrow">LECCIÓN {lessonStep + 1} / 3</span><h2>Primeras frases en catalán</h2></div><div className="lesson-xp"><Star size={15} /> +30 XP</div></div>
            <div className="lesson-progress"><i style={{ width: `${((lessonStep + 1) / 3) * 100}%` }} /></div>
            <section className="lesson-card glass-panel"><span className="lesson-number">0{lessonStep + 1}</span><div className="lesson-card-content"><span className="eyebrow">{lessonCards[lessonStep].note}</span><h3>{lessonCards[lessonStep].title}</h3><p className="lesson-phrase">{lessonCards[lessonStep].body}</p><button className="listen-line" onClick={() => talk(lessonCards[lessonStep].body, "ca")}><Headphones size={17} /> Escuchar a Luna <span>{lunaTalking ? "•••" : "0:04"}</span></button><div className="lesson-tip"><Lightbulb size={15} /><span>Piensa en una situación real donde usarías esta frase.</span></div></div></section>
            <div className="lesson-actions"><button className="secondary-button" onClick={() => talk("Repite la frase en voz alta. Tu acento mejora con cada intento.", "es")}><Mic2 size={17} /> Practicar</button><button className="primary-button" onClick={() => { if (lessonStep < 2) { setLessonStep((value) => value + 1); talk("Muy bien. Vamos a la siguiente situación.", "es"); } else { setLessonStep(0); setScreen("home"); talk("Ruta completada. Has ganado treinta puntos de experiencia.", "es"); } }}>{lessonStep < 2 ? "Siguiente" : "Completar ruta"} <ChevronRight size={17} /></button></div>
            <div className="coach-note glass-panel"><Sparkles size={17} /><p><strong>Luna dice:</strong> No busques hablar perfecto; busca conectar con alguien.</p></div>
          </main>
        )}

        {screen === "game" && (
          <main className="game-screen">
            <div className="game-topline"><button className="back-button" onClick={() => setScreen("home")}><ArrowLeft size={17} /> Misiones</button><span className={`game-chip ${meta.color}`}>{meta.icon} {meta.detail}</span></div>
            <section className="game-header glass-panel"><div><span className="eyebrow">MISIÓN {String((wordIndex % WORDS.length) + 1).padStart(2, "0")} · {word.topic.toUpperCase()}</span><h2>{meta.title}</h2><p>Ruta: {LANG_NAMES[sourceLang]} <span>→</span> {LANG_NAMES[targetLang]}</p></div><button className="swap-button" onClick={swapLanguages} aria-label="Cambiar dirección"><Languages size={18} /></button></section>
            <div className="game-progress"><div><span>RACHA</span><b>{streak}</b></div><div className="game-progress-track"><i style={{ width: `${Math.min(100, ((wordIndex % WORDS.length) + 1) * 12.5)}%` }} /></div><div><span>XP</span><b>{xp}</b></div></div>
            <section className={`play-card glass-panel ${feedback}`}>
              {selectedGame === "flash" && <div className="flash-game"><span className="game-instruction">TOCA LA TARJETA PARA GIRARLA</span><button className={`flash-card ${flipped ? "flipped" : ""}`} onClick={() => { setFlipped((value) => !value); talk(flipped ? source : target, flipped ? sourceLang : targetLang); }}><span className="flash-face front"><small>{LANG_NAMES[sourceLang]}</small><strong>{source}</strong><em>¿Qué significa?</em></span><span className="flash-face back"><small>{LANG_NAMES[targetLang]}</small><strong>{target}</strong><em>{word.hint}</em></span></button><div className="flash-actions"><button className="secondary-button" onClick={() => { setFlipped(true); talk(target, targetLang); }}><Volume2 size={16} /> Escuchar</button><button className="primary-button" onClick={() => resolve(true, "¡Guardada! Tu memoria está construyendo conexiones.")}>La recuerdo <Check size={16} /></button></div></div>}

              {selectedGame === "quiz" && <div className="quiz-game"><span className="game-instruction">ELIGE LA TRADUCCIÓN DE <b>{source}</b></span><div className="question-word">{source}<small>{LANG_NAMES[sourceLang]}</small></div><div className="answers">{seededShuffle(WORDS.filter((item) => item.id !== word.id).slice(0, 3).map((item) => getText(item, targetLang)).concat(target), word.id + 3).map((answer) => <button key={answer} className={feedback !== "idle" && normalizeAnswer(answer) === normalizeAnswer(target) ? "answer correct-answer" : "answer"} onClick={() => resolve(normalizeAnswer(answer) === normalizeAnswer(target))}>{answer}<ChevronRight size={16} /></button>)}</div><button className="listen-prompt" onClick={() => talk(source, sourceLang)}><Volume2 size={16} /> Escuchar palabra</button></div>}

              {selectedGame === "match" && <div className="match-game"><span className="game-instruction">CONECTA CADA PALABRA CON SU PAREJA</span><div className="match-grid">{matchWords.map((item) => <button key={`s-${item.id}`} className={`match-tile ${matchPick === `s-${item.id}` ? "selected" : ""} ${matched.includes(String(item.id)) ? "matched" : ""}`} onClick={() => setMatchPick(`s-${item.id}`)}>{getText(item, sourceLang)}</button>)}{matchWords.map((item) => <button key={`t-${item.id}`} className={`match-tile target ${matched.includes(String(item.id)) ? "matched" : ""}`} onClick={() => { if (matchPick === `s-${item.id}`) { setMatched((value) => [...value, String(item.id)]); setMatchPick(null); if (matched.length === 3) resolve(true, "¡Todas conectadas! Tu cerebro acaba de hacer clic."); } else { setFeedback("wrong"); talk("Mira las dos palabras. Prueba con otra pareja.", "es"); } }}>{getText(item, targetLang)}</button>)}</div><div className="match-status">{matched.length} / 4 parejas conectadas</div></div>}

              {selectedGame === "hang" && <div className="hang-game"><span className="game-instruction">DESCUBRE LA PALABRA · PISTA AMABLE</span><div className="hang-word">{hangWord.split("").map((letter, index) => <span key={`${letter}-${index}`}>{guessed.includes(letter.toLocaleLowerCase()) ? letter : "_"}</span>)}</div><p className="hint-line"><Lightbulb size={15} /> {word.hint}</p><div className="letter-grid">{"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => <button key={letter} disabled={guessed.includes(letter)} className={guessed.includes(letter) ? "used" : ""} onClick={() => handleLetter(letter)}>{letter}</button>)}</div></div>}

              {selectedGame === "anagram" && <div className="anagram-game"><span className="game-instruction">ORDENA LAS LETRAS DE <b>{LANG_NAMES[targetLang]}</b></span><div className="typed-answer">{selectedLetters.length ? selectedLetters.join("") : "_ _ _ _"}</div><div className="letter-bank">{anagramLetters.map((letter, index) => <button key={`${letter}-${index}`} disabled={selectedLetters.includes(`${letter}-${index}`)} onClick={() => setSelectedLetters((value) => [...value, letter])}>{letter}</button>)}</div><div className="game-actions"><button className="secondary-button" onClick={() => setSelectedLetters([])}><RotateCcw size={16} /> Limpiar</button><button className="primary-button" onClick={() => resolve(normalizeAnswer(selectedLetters.join("")) === normalizeAnswer(target))}>Comprobar <Check size={16} /></button></div></div>}

              {selectedGame === "listen" && <div className="listen-game"><span className="game-instruction">ESCUCHA A LUNA Y ESCRIBE LO QUE OYES</span><button className={`listen-orb ${lunaTalking ? "active" : ""}`} onClick={() => talk(target, targetLang)}><Headphones size={30} /><span>ESCUCHAR</span><small>{LANG_NAMES[targetLang]}</small></button><input value={typed} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => event.key === "Enter" && checkTyped()} placeholder="Escribe la palabra..." autoComplete="off" /><button className="primary-button wide" onClick={checkTyped}>Enviar respuesta <Send size={16} /></button></div>}

              {selectedGame === "order" && <div className="order-game"><span className="game-instruction">CONSTRUYE LA FRASE CORRECTA</span><div className="sentence-box">{selectedLetters.length ? selectedLetters.join(" ") : "Toca las palabras en orden"}</div><div className="word-bank">{phraseTokens.map((token, index) => <button key={`${token}-${index}`} disabled={selectedLetters.includes(token)} onClick={() => setSelectedLetters((value) => [...value, token])}>{token}</button>)}</div><div className="game-actions"><button className="secondary-button" onClick={() => setSelectedLetters([])}><RotateCcw size={16} /> Reiniciar</button><button className="primary-button" onClick={() => resolve(normalizeAnswer(selectedLetters.join(" ")) === normalizeAnswer(word.phrase), "¡Frase completa! Ya puedes usarla fuera del juego.", "es")}>Comprobar <Check size={16} /></button></div></div>}

              {selectedGame === "scene" && <div className="scene-game"><span className="game-instruction">SITUACIÓN REAL · EN EL INSTITUTO</span><div className="scene-bubble"><span className="scene-character">L</span><p>"Hola, soy nueva en la clase. ¿Cómo pregunto dónde está la estación?"</p></div><div className="scene-answers"><button onClick={() => resolve(true, "¡Exacto! Una frase educada y muy útil.", "es")}>On és l'estació? <Check size={16} /></button><button onClick={() => resolve(false)}>Tengo hambre, gracias.</button><button onClick={() => resolve(false)}>My name is station.</button></div><button className="hint-button" onClick={() => talk("La pista está en la palabra estación. Empieza con On és...", "es")}><CircleHelp size={15} /> Pedir una pista</button></div>}

              {selectedGame === "whack" && <div className="whack-game"><span className="game-instruction">GOLPEA LA TRADUCCIÓN CORRECTA DE <b>{source}</b></span><ArcadeTimer key={word.id} seconds={9} onExpire={() => { if (feedback === "idle") resolve(false); }} /><div className="mole-grid">{whackChoices.choices.map((choice) => <button key={choice.id} className={`mole ${feedback !== "idle" && choice.id === whackChoices.correctId ? "mole-hit" : ""}`} disabled={feedback !== "idle"} onClick={() => resolve(choice.id === whackChoices.correctId, "¡Topo atrapado! Tus reflejos están en racha.", "es")}>{choice.label}</button>)}</div></div>}

              {selectedGame === "fall" && <div className="fall-game"><span className="game-instruction">ATRAPA LA PALABRA QUE CAE · TRADUCCIÓN DE <b>{source}</b></span><ArcadeTimer key={word.id} seconds={7} onExpire={() => { if (feedback === "idle") resolve(false); }} /><div className="fall-lanes">{whackChoices.choices.map((choice, index) => <button key={choice.id} className={`fall-drop ${feedback !== "idle" && choice.id === whackChoices.correctId ? "drop-hit" : ""}`} style={{ animationDelay: `${index * 0.15}s` }} disabled={feedback !== "idle"} onClick={() => resolve(choice.id === whackChoices.correctId, "¡Atrapada al vuelo! Buen ojo.", "es")}>{choice.label}</button>)}</div></div>}

              {feedback !== "idle" && <div className="feedback-toast"><span className={feedback === "correct" ? "feedback-icon good" : "feedback-icon bad"}>{feedback === "correct" ? <Check size={18} /> : <X size={18} />}</span><span><strong>{feedback === "correct" ? "¡Bien hecho!" : "Casi, William"}</strong><small>{feedback === "correct" ? "Luna ha sumado XP a tu ruta." : `Prueba otra vez: ${target}.`}</small></span></div>}
            </section>
            <div className="next-row"><button className="soft-button" onClick={() => talk(`Pista: ${word.hint}`, "es")}><Lightbulb size={16} /> Pista</button><button className="next-button" onClick={next}>Siguiente misión <ChevronRight size={17} /></button></div>
          </main>
        )}

        <nav className="bottom-nav"><button className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}><Gamepad2 size={18} /><span>Jugar</span></button><button className={screen === "lesson" ? "active" : ""} onClick={() => setScreen("lesson")}><BookOpen size={18} /><span>Lecciones</span></button><button onClick={() => talk("Tu racha está en construcción. Vuelve mañana y suma una nueva chispa.", "es")}><Trophy size={18} /><span>Racha</span></button><button onClick={() => talk("Perfil de William: explorador de idiomas, nivel inicial.", "es")}><Star size={18} /><span>Perfil</span></button></nav>
      </div>
    </div>
  );
}

function ArcadeTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  useEffect(() => {
    if (left <= 0) {
      if (!expired.current) {
        expired.current = true;
        onExpire();
      }
      return;
    }
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left, onExpire]);
  return (
    <div className="arcade-timer">
      <i style={{ width: `${(left / seconds) * 100}%` }} />
      <b>{left}</b>
    </div>
  );
}

function MapPinIcon() {
  return <span className="map-pin-mark">+</span>;
}