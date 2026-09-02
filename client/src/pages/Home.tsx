import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Download,
  Flame,
  Headphones,
  Languages,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  UserRound,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Language = "Español" | "Català" | "English";

type Course = {
  language: Language;
  label: string;
  title: string;
  subtitle: string;
  progress: number;
  lessons: string;
  color: string;
  accent: string;
  tag: string;
};

const courses: Course[] = [
  {
    language: "Español",
    label: "ES",
    title: "Espanhol da rua",
    subtitle: "Falsos amigos e vida real",
    progress: 68,
    lessons: "4 de 6 lições",
    color: "bg-coral",
    accent: "text-coral",
    tag: "Em andamento",
  },
  {
    language: "Català",
    label: "CA",
    title: "Barcelona por dentro",
    subtitle: "Escola, bairro e comunidade",
    progress: 42,
    lessons: "3 de 8 lições",
    color: "bg-mint",
    accent: "text-ink",
    tag: "Próxima aula",
  },
  {
    language: "English",
    label: "EN",
    title: "English for your next move",
    subtitle: "Estudo, trabalho e internet",
    progress: 24,
    lessons: "2 de 8 lições",
    color: "bg-saffron",
    accent: "text-ink",
    tag: "Recomendado",
  },
];

const languageCopy: Record<Language, { greeting: string; prompt: string; phrase: string; translation: string; accent: string }> = {
  Español: {
    greeting: "¡Hola, Rafa! Vamos a desbloquear teu espanhol hoje.",
    prompt: "Diz em espanhol: 'Eu estou procurando um quarto perto do metrô.'",
    phrase: "Estoy buscando una habitación cerca del metro.",
    translation: "Estou procurando um quarto perto do metrô.",
    accent: "coral",
  },
  Català: {
    greeting: "Ei, Rafa! Avui practiquem una frase que vas a usar de veritat.",
    prompt: "Digues en català: 'Eu estudo no instituto perto de casa.'",
    phrase: "Estudio a l'institut a prop de casa.",
    translation: "Eu estudo no instituto perto de casa.",
    accent: "mint",
  },
  English: {
    greeting: "Hey Rafa! Let's practice the English you need for your next move.",
    prompt: "Say in English: 'Eu quero trabalhar remotamente.'",
    phrase: "I want to work remotely.",
    translation: "Eu quero trabalhar remotamente.",
    accent: "saffron",
  },
};

const navItems = [
  { label: "Início", icon: Compass },
  { label: "Minha rota", icon: Target },
  { label: "Biblioteca", icon: BookOpen },
  { label: "Comunidade", icon: MessageCircle },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Início");
  const [activeLanguage, setActiveLanguage] = useState<Language>("Español");
  const [isListening, setIsListening] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPhraseSaved, setIsPhraseSaved] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(68);
  const [practiceMinutes, setPracticeMinutes] = useState(222);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "tutor", text: "¡Hola, Rafa! Vamos a desbloquear teu espanhol hoje." },
    { from: "tutor", text: "Diz em espanhol: 'Eu estou procurando um quarto perto do metrô.'" },
  ]);
  const recognitionRef = useRef<{ start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onend: (() => void) | null } | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.language === activeLanguage) ?? courses[0],
    [activeLanguage],
  );
  const selectedCopy = languageCopy[activeLanguage];

  useEffect(() => {
    const savedPhrase = window.localStorage.getItem("open-tongue-saved-phrase");
    const savedGoal = window.localStorage.getItem("open-tongue-weekly-goal");
    setIsPhraseSaved(savedPhrase === selectedCopy.phrase);
    if (savedGoal) setWeeklyGoal(Number(savedGoal));
  }, [activeLanguage, selectedCopy.phrase]);

  function handleNav(label: string) {
    setActiveNav(label);
    if (label !== "Início") {
      toast(`${label} está entrando no ar`, {
        description: "Neste protótipo, esta área já está desenhada e será conectada ao conteúdo real.",
      });
    }
    setIsMobileMenuOpen(false);
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Microfone não disponível neste navegador", { description: "Você ainda pode escrever sua resposta no campo abaixo." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = activeLanguage === "Español" ? "es-ES" : activeLanguage === "Català" ? "ca-ES" : "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setMessage(transcript);
      toast("Te ouvi", { description: "Revise sua frase e envie quando estiver pronto." });
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
    toast("Microfone ativado", { description: "Fale uma frase curta; o tutor vai ouvir você." });
  }

  async function sendMessage() {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    const previousMessages = messages;
    setMessages((current) => [
      ...current,
      { from: "student", text: cleanMessage },
      { from: "tutor", text: "Estou pensando com você..." },
    ]);
    setPracticeMinutes((minutes) => minutes + 2);
    setWeeklyGoal((goal) => Math.min(100, goal + 1));
    setMessage("");
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: cleanMessage, language: activeLanguage, history: previousMessages.map((item) => ({ role: item.from === "tutor" ? "assistant" : "user", content: item.text })) }) });
      const data = await response.json() as { reply?: string };
      setMessages((current) => [...current.slice(0, -1), { from: "tutor", text: data.reply || "Vamos tentar de novo juntos?" }]);
    } catch {
      setMessages((current) => [...current.slice(0, -1), { from: "tutor", text: activeLanguage === "Català" ? "Molt bé! Ara prova d'utilitzar la frase model en una situació real." : activeLanguage === "English" ? "Nice! Now try the same idea using the model phrase above." : "Boa! Agora tenta falar a mesma ideia usando a frase-modelo acima." }]);
    }
  }

  function startLesson() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioContext = new AudioContextClass();
      [523.25, 659.25, 783.99].forEach((frequency: number, index: number) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + index * 0.08 + 0.28);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(audioContext.currentTime + index * 0.08);
        oscillator.stop(audioContext.currentTime + index * 0.08 + 0.3);
      });
    }
    toast("Aula desbloqueada", {
      description: `${selectedCourse.title} está pronta para você continuar.`,
    });
    toast("Conquista desbloqueada: coragem para falar", { description: "+25 XP · Seu primeiro passo já conta." });
    document.getElementById("tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function savePhrase() {
    const nextSaved = !isPhraseSaved;
    setIsPhraseSaved(nextSaved);
    if (nextSaved) {
      window.localStorage.setItem("open-tongue-saved-phrase", selectedCopy.phrase);
      toast("Dica salva na biblioteca", { description: "Você pode voltar a esta frase sempre que quiser." });
    } else {
      window.localStorage.removeItem("open-tongue-saved-phrase");
      toast("Dica removida", { description: "A frase saiu da sua biblioteca pessoal." });
    }
  }

  function adjustGoal() {
    const nextGoal = weeklyGoal >= 100 ? 50 : weeklyGoal + 10;
    setWeeklyGoal(nextGoal);
    window.localStorage.setItem("open-tongue-weekly-goal", String(nextGoal));
    toast("Meta atualizada", { description: nextGoal >= 100 ? "Meta fechada! Escolha 50% para começar um novo ciclo." : `Mais ${Math.max(5, 100 - nextGoal)}% para completar sua meta da semana.` });
  }

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-coral selection:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-ink/10 bg-[#f6f1e8] px-6 py-7 lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-ink text-paper shadow-[0_8px_20px_rgba(14,32,53,0.15)]">
              <Languages className="size-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-[21px] font-black leading-none tracking-tight">Lingua</p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">aberta</p>
            </div>
          </div>

          <div className="mt-14">
            <p className="mb-4 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Seu espaço</p>
            <nav className="space-y-1" aria-label="Navegação principal">
              {navItems.map(({ label, icon: Icon }) => {
                const isActive = activeNav === label;
                return (
                  <button
                    key={label}
                    onClick={() => handleNav(label)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      isActive ? "bg-ink text-paper shadow-[0_8px_20px_rgba(14,32,53,0.12)]" : "text-ink/60 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <Icon className={`size-[18px] ${isActive ? "text-saffron" : "text-ink/45 group-hover:text-coral"}`} />
                    {label}
                    {label === "Comunidade" && <span className="ml-auto size-2 rounded-full bg-coral" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="overflow-hidden rounded-2xl bg-ink p-4 text-paper shadow-[0_14px_30px_rgba(14,32,53,0.16)]">
              <div className="mb-7 flex items-start justify-between">
                <span className="rounded-full border border-white/20 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">Ritmo</span>
                <Zap className="size-4 text-saffron" fill="currentColor" />
              </div>
              <p className="font-display text-[21px] font-extrabold leading-[1.04]">Você está em uma sequência de 7 dias.</p>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex gap-1.5" aria-label="7 dias de sequência">
                  {[1, 1, 1, 1, 1, 1, 0].map((active, index) => (
                    <span key={index} className={`grid size-5 place-items-center rounded-full text-[9px] font-bold ${active ? "bg-saffron text-ink" : "border border-white/30 text-white/40"}`}>
                      {active ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[11px] text-white/50">+12 XP</span>
              </div>
            </div>
            <button className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white" onClick={() => toast("Perfil em breve", { description: "Aqui você vai editar seu ritmo, idiomas e objetivos." })}>
              <span className="grid size-9 place-items-center rounded-full bg-coral text-sm font-black text-white">R</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">Rafa Almeida</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.13em] text-ink/40">Nível A2 · BCN</span>
              </span>
              <ChevronDown className="size-4 text-ink/35" />
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-8 lg:px-10 lg:py-6">
            <div className="flex items-center gap-3 lg:hidden">
              <button className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white" aria-label="Abrir menu" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="size-5" />
              </button>
              <span className="font-display text-lg font-black">Open Tongue</span>
            </div>
            <div className="hidden items-center gap-3 text-sm text-ink/55 lg:flex">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/35">Quarta-feira, 18 de setembro</span>
              <span className="size-1 rounded-full bg-coral" />
              <span>Barcelona, 18º</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/30 sm:flex" onClick={() => toast("Modo dados reduzidos ativado", { description: "As próximas aulas serão preparadas para consumir menos dados." })}>
                <Download className="size-3.5" />
                Baixo consumo
              </button>
              <button className="relative grid size-10 place-items-center rounded-full border border-ink/10 bg-white transition hover:border-coral" aria-label="Abrir mensagens" onClick={() => toast("Você está em dia", { description: "Nenhuma nova mensagem da comunidade." })}>
                <MessageCircle className="size-[18px]" />
                <span className="absolute right-0.5 top-0.5 size-2 rounded-full border-2 border-paper bg-coral" />
              </button>
              <button className="grid size-10 place-items-center rounded-full bg-coral font-display text-lg font-black text-white shadow-[0_6px_15px_rgba(234,100,75,0.25)] lg:hidden" onClick={() => toast("Perfil em breve")} aria-label="Abrir perfil">R</button>
            </div>
          </header>

          <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <section className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-8 text-paper shadow-[0_20px_50px_rgba(14,32,53,0.14)] sm:px-10 sm:py-10 lg:min-h-[340px] lg:px-12 lg:py-12">
              <img src="/manus-storage/lingua-orbit_087ec75c.jpg" alt="Ondas de cor sobre Barcelona ao entardecer" className="absolute inset-0 size-full object-cover opacity-75 mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-transparent" />
              <div className="relative z-10 max-w-[510px]">
                <div className="mb-8 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm"><Sparkles className="size-3 text-saffron" /> Seu próximo passo</span>
                  <span className="font-mono text-[10px] text-white/40">01 / 03</span>
                </div>
                <h1 className="font-display text-[clamp(2.4rem,5vw,4.6rem)] font-black leading-[0.94] tracking-[-0.055em]">Fala com o mundo.<br /><span className="text-saffron">Começa por aqui.</span></h1>
                <p className="mt-5 max-w-[390px] text-[15px] leading-relaxed text-white/70">Aprenda os idiomas que fazem parte da sua vida em Barcelona — com aulas curtas, contexto real e um tutor que fala do seu jeito.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={startLesson} className="group inline-flex items-center gap-3 rounded-xl bg-saffron px-4 py-3 text-sm font-extrabold text-ink transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(255,194,74,0.25)] active:scale-[0.97]">Continuar aula <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></button>
                  <button onClick={() => document.getElementById("rota")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-white/50 hover:bg-white/10"><Play className="size-4 fill-current" /> Ver minha rota</button>
                </div>
              </div>
              <div className="absolute bottom-7 right-8 hidden max-w-[220px] rotate-[-4deg] rounded-2xl border border-white/20 bg-ink/60 p-4 backdrop-blur-md lg:block">
                <div className="mb-5 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">Frase do dia</span><Volume2 className="size-4 text-mint" /></div>
                <p className="font-display text-lg font-bold leading-tight">“O caminho muda quando você começa a falar.”</p>
                <p className="mt-2 text-xs text-white/45">— Català, provérbio popular</p>
              </div>
            </section>

            <section id="rota" className="mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Sua rota</p>
                  <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] sm:text-4xl">Um pouco por dia.</h2>
                </div>
                <button onClick={() => toast("Rota completa", { description: "Em breve: diagnóstico, metas vocacionais e trilhas personalizadas." })} className="group inline-flex items-center gap-2 text-sm font-extrabold text-ink/55 transition hover:text-coral">Ver rota completa <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {courses.map((course) => {
                  const isSelected = course.language === activeLanguage;
                  return (
                    <button key={course.language} onClick={() => setActiveLanguage(course.language)} className={`group rounded-2xl border p-5 text-left transition-all duration-200 ${isSelected ? "border-ink bg-white shadow-[0_14px_30px_rgba(14,32,53,0.08)]" : "border-ink/10 bg-transparent hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white/60"}`}>
                      <div className="flex items-start justify-between">
                        <span className={`grid size-11 place-items-center rounded-2xl text-sm font-black ${course.color} ${course.accent}`}>{course.label}</span>
                        {isSelected ? <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white">Agora</span> : <span className="font-mono text-[10px] text-ink/30">{course.tag}</span>}
                      </div>
                      <h3 className="mt-5 font-display text-[22px] font-extrabold tracking-[-0.03em]">{course.title}</h3>
                      <p className="mt-1 text-sm text-ink/50">{course.subtitle}</p>
                      <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40"><span>{course.lessons}</span><span className="font-bold text-ink/70">{course.progress}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full rounded-full ${course.color} transition-all duration-500`} style={{ width: `${course.progress}%` }} /></div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section id="tutor" className="mt-12 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_14px_30px_rgba(14,32,53,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-5 sm:px-7">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-mint"><Bot className="size-5 text-ink" /></div>
                    <div><p className="font-display text-lg font-extrabold leading-none">Fala comigo</p><p className="mt-1 text-xs text-ink/45">Seu tutor multimodal, sem julgamento.</p></div>
                  </div>
                  <div className="flex rounded-lg bg-paper p-1" role="tablist" aria-label="Idioma do tutor">
                    {(Object.keys(languageCopy) as Language[]).map((language) => <button key={language} onClick={() => { setActiveLanguage(language); setMessages([{ from: "tutor", text: languageCopy[language].greeting }, { from: "tutor", text: languageCopy[language].prompt }]); }} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${activeLanguage === language ? "bg-ink text-white" : "text-ink/45 hover:text-ink"}`} role="tab" aria-selected={activeLanguage === language}>{language}</button>)}
                  </div>
                </div>
                <div className="min-h-[310px] bg-[#fbfaf7] px-5 py-6 sm:px-7">
                  <div className="space-y-4">
                    {messages.map((item, index) => <div key={`${item.text}-${index}`} className={`flex ${item.from === "student" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.from === "student" ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm border border-ink/10 bg-white text-ink/80 shadow-sm"}`}>{item.text}</div></div>)}
                  </div>
                  <div className="mt-7 rounded-xl border border-ink/10 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-lg ${selectedCourse.color}`}><Sparkles className="size-3.5" /></span><span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">Dica rápida</span><button className={`ml-auto transition ${isPhraseSaved ? "text-coral" : "text-ink/35 hover:text-ink"}`} onClick={savePhrase} aria-label={isPhraseSaved ? "Remover frase da biblioteca" : "Salvar frase na biblioteca"}><BookOpen className="size-4" fill={isPhraseSaved ? "currentColor" : "none"} /></button></div>
                    <p className="mt-3 font-display text-[19px] font-extrabold leading-tight">{selectedCopy.phrase}</p>
                    <p className="mt-1 text-xs text-ink/45">{selectedCopy.translation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-ink/10 bg-white p-4 sm:p-5">
                  <button onClick={toggleListening} className={`grid size-11 shrink-0 place-items-center rounded-xl transition-all active:scale-95 ${isListening ? "bg-coral text-white shadow-[0_8px_18px_rgba(234,100,75,0.25)]" : "bg-paper text-ink hover:bg-mint"}`} aria-label={isListening ? "Parar de ouvir" : "Falar com o tutor"}>{isListening ? <span className="flex items-end gap-0.5"><span className="h-3 w-0.5 animate-pulse bg-white" /><span className="h-5 w-0.5 animate-pulse bg-white [animation-delay:100ms]" /><span className="h-4 w-0.5 animate-pulse bg-white [animation-delay:200ms]" /></span> : <Mic className="size-[18px]" />}</button>
                  <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} placeholder="Escreva ou toque no microfone..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink/35" aria-label="Mensagem para o tutor" />
                  <button onClick={sendMessage} className="grid size-10 place-items-center rounded-xl bg-ink text-white transition hover:bg-coral active:scale-95" aria-label="Enviar mensagem"><Send className="size-4" /></button>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl bg-mint p-6 sm:p-7">
                <div className="flex items-start justify-between"><span className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/55">Seu impacto</span><Flame className="size-5 text-coral" fill="currentColor" /></div>
                <div className="mt-14"><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Horas de prática</p><p className="mt-2 font-display text-[60px] font-black leading-none tracking-[-0.07em]">{String(Math.floor(practiceMinutes / 60)).padStart(2, "0")}<span className="text-3xl text-ink/35">h</span>{String(practiceMinutes % 60).padStart(2, "0")}</p><p className="mt-4 max-w-[220px] text-sm leading-relaxed text-ink/60">Você praticou mais que <strong className="text-ink">82% da comunidade</strong> esta semana.</p></div>
                <div className="mt-auto pt-10"><div className="flex items-center justify-between text-xs font-bold"><span>Meta semanal</span><span>{weeklyGoal}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${weeklyGoal}%` }} /></div><button onClick={adjustGoal} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">Ajustar minha meta <ArrowUpRight className="size-4" /></button></div>
              </div>
            </section>

            <section className="mt-12 border-t border-ink/10 pt-7">
              <div className="grid gap-5 md:grid-cols-3">
                <button onClick={() => toast("Modo offline preparado", { description: "O próximo módulo poderá ser baixado para estudar no metrô." })} className="group flex items-center gap-4 rounded-2xl border border-ink/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-saffron"><Download className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Estudar offline</p><p className="mt-1 text-xs text-ink/50">Baixe sua próxima lição</p></div><ChevronRight className="ml-auto size-4 text-ink/30 transition group-hover:translate-x-1" /></button>
                <button onClick={() => toast("Mapa da comunidade", { description: "Em breve: grupos de estudo por bairro e interesse." })} className="group flex items-center gap-4 rounded-2xl border border-ink/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral text-white"><MapPin className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Perto de você</p><p className="mt-1 text-xs text-ink/50">Encontre gente para praticar</p></div><ChevronRight className="ml-auto size-4 text-ink/30 transition group-hover:translate-x-1" /></button>
                <button onClick={() => toast("Diagnóstico em breve", { description: "Vamos medir seu ponto de partida em menos de 5 minutos." })} className="group flex items-center gap-4 rounded-2xl border border-ink/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white"><CircleHelp className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Descobrir meu nível</p><p className="mt-1 text-xs text-ink/50">Faça um diagnóstico rápido</p></div><ChevronRight className="ml-auto size-4 text-ink/30 transition group-hover:translate-x-1" /></button>
              </div>
            </section>

            <footer className="mt-14 flex flex-col gap-4 border-t border-ink/10 py-7 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em]">Feito para quem está construindo seu próximo capítulo.</p>
              <div className="flex gap-4"><button onClick={() => toast("Acessibilidade", { description: "Atalhos de teclado, alto contraste e modo sem animação estarão disponíveis." })} className="hover:text-ink">Acessibilidade</button><button onClick={() => toast("Privacidade", { description: "Seus dados de aprendizagem pertencem a você." })} className="hover:text-ink">Privacidade</button></div>
            </footer>
          </div>
        </main>
      </div>

      {isMobileMenuOpen && <div className="fixed inset-0 z-50 flex lg:hidden"><button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setIsMobileMenuOpen(false)} /><aside className="relative z-10 flex h-full w-[280px] flex-col bg-paper p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="font-display text-2xl font-black">Open Tongue</span><button className="grid size-9 place-items-center rounded-lg border border-ink/10" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X className="size-4" /></button></div><nav className="mt-12 space-y-2">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => handleNav(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold ${activeNav === label ? "bg-ink text-white" : "text-ink/60"}`}><Icon className="size-[18px]" />{label}</button>)}</nav><div className="mt-auto rounded-2xl bg-mint p-4"><Headphones className="size-5" /><p className="mt-4 font-display text-xl font-extrabold leading-tight">Seu tutor está pronto para ouvir.</p><button onClick={() => { setIsMobileMenuOpen(false); document.getElementById("tutor")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-4 text-sm font-extrabold underline underline-offset-4">Abrir tutor</button></div></aside></div>}
    </div>
  );
}

void RotateCcw;
void UserRound;
void Clock3;
void Volume2;
