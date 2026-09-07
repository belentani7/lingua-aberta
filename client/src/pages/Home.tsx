import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Download,
  Flame,
  Gamepad2,
  Headphones,
  Languages,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Play,
  Send,
  Sparkles,
  Target,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Language = "Español" | "Català" | "English";

type Course = {
  language: Language;
  courseSlug: string;
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
    courseSlug: "espanol-de-la-calle",
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
    courseSlug: "barcelona-por-dentro",
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
    courseSlug: "english-next-move",
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
    greeting: "¡Hola, William! Vamos a desbloquear teu espanhol hoje.",
    prompt: "Diz em espanhol: 'Eu estou procurando um quarto perto do metrô.'",
    phrase: "Estoy buscando una habitación cerca del metro.",
    translation: "Estou procurando um quarto perto do metrô.",
    accent: "coral",
  },
  Català: {
    greeting: "Ei, William! Avui practiquem una frase que vas a usar de veritat.",
    prompt: "Digues en català: 'Eu estudo no instituto perto de casa.'",
    phrase: "Estudio a l'institut a prop de casa.",
    translation: "Eu estudo no instituto perto de casa.",
    accent: "mint",
  },
  English: {
    greeting: "Hey William! Let's practice the English you need for your next move.",
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
  { label: "Juegos", icon: Gamepad2 },
];

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const dashboardQuery = trpc.learner.dashboard.useQuery(undefined, { enabled: isAuthenticated });
  const providerQuery = trpc.platform.status.useQuery();
  const [activeLanguage, setActiveLanguage] = useState<Language>("Español");
  const historyQuery = trpc.tutor.history.useQuery({ language: activeLanguage }, { enabled: isAuthenticated });
  const messageMutation = trpc.tutor.message.useMutation();
  const progressMutation = trpc.learner.updateProgress.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();
  const synthesizeMutation = trpc.voice.synthesize.useMutation();

  const [activeNav, setActiveNav] = useState("Início");
  const [isListening, setIsListening] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ from: "tutor" | "student"; text: string }>>([
    { from: "tutor", text: "E aí William, beleza? Bem-vindo. Como foi seu dia em Barcelona?" },
    { from: "tutor", text: "Hoje vamos praticar uma frase para pedir ajuda no instituto. Bora tentar?" },
  ]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const profile = dashboardQuery.data?.profile;
  const profileName = profile?.displayName || user?.name || "William Danilo Guimarães Santos";
  const coursesForDisplay = useMemo(() => courses.map((course) => {
    const persisted = dashboardQuery.data?.progress.find((item) => item.language === course.language);
    return persisted ? { ...course, progress: persisted.progressPercent, lessons: `${persisted.completedLessons} de ${persisted.totalLessons} lições` } : course;
  }), [dashboardQuery.data?.progress]);

  const selectedCourse = useMemo(
    () => coursesForDisplay.find((course) => course.language === activeLanguage) ?? coursesForDisplay[0],
    [activeLanguage, coursesForDisplay],
  );
  const selectedCopy = languageCopy[activeLanguage];

  useEffect(() => {
    if (!historyQuery.data?.messages?.length) return;
    setMessages(historyQuery.data.messages.filter((item) => item.role === "user" || item.role === "assistant").map((item) => ({ from: item.role === "user" ? "student" : "tutor", text: item.content })));
  }, [historyQuery.data]);

  function handleNav(label: string) {
    setActiveNav(label);
    if (label !== "Início") {
      toast(`${label} está entrando no ar`, {
        description: "Esta área está preparada para receber os próximos módulos do instituto.",
      });
    }
    setIsMobileMenuOpen(false);
  }

  async function toggleListening() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (dashboardQuery.isLoading) {
      toast("Preparando tu espacio", { description: "Espera un segundo mientras cargamos tu perfil protegido." });
      return;
    }
    if (!profile?.guardianConsent) {
      toast("La voz requiere acompañamiento adulto", { description: "Pide a tu tutor legal que active el modo de voz desde la configuración familiar." });
      return;
    }
    if (isListening) {
      recorderRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => event.data.size > 0 && audioChunksRef.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        transcribeMutation.mutate({ audioBase64: base64, mimeType: "audio/webm", language: activeLanguage }, {
          onSuccess: (data) => { setMessage(data.text); toast("Te ouvi", { description: "Revise a transcrição e envie quando quiser." }); },
          onError: (error) => toast("Não consegui transcrever", { description: error.message }),
        });
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setIsListening(true);
      toast("Microfone ativado", { description: "Fale uma frase curta. Toque novamente para enviar a gravação." });
    } catch {
      toast("Microfone bloqueado", { description: "Permita o acesso ao microfone no navegador para praticar por voz." });
    }
  }

  function sendMessage() {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setMessages((current) => [...current, { from: "student", text: cleanMessage }]);
    setMessage("");
    messageMutation.mutate({ language: activeLanguage, message: cleanMessage }, {
      onSuccess: (data) => {
        setMessages((current) => [...current, { from: "tutor", text: data.text }]);
        synthesizeMutation.mutate({ language: activeLanguage, text: data.text }, {
          onSuccess: (audio) => {
            if (audio.available && audio.audioUrl) new Audio(audio.audioUrl).play().catch(() => undefined);
            else if (typeof window !== "undefined" && "speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(data.text);
              utterance.lang = activeLanguage === "Català" ? "ca-ES" : activeLanguage === "Español" ? "es-ES" : "en-GB";
              window.speechSynthesis.speak(utterance);
            }
          },
        });
      },
      onError: (error) => toast("O tutor precisa de uma nova tentativa", { description: error.message }),
    });
  }

  function startLesson() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const current = dashboardQuery.data?.progress.find((item) => item.language === activeLanguage);
    progressMutation.mutate({ language: activeLanguage, courseSlug: selectedCourse.courseSlug, progressPercent: Math.min(100, selectedCourse.progress + 5), completedLessons: current?.completedLessons || selectedCourse.progress >= 68 ? (current?.completedLessons || 4) + 1 : 1, totalLessons: current?.totalLessons || 8 }, { onSuccess: () => dashboardQuery.refetch() });
    toast("Aula desbloqueada", {
      description: `${selectedCourse.title} está pronta para você continuar.`,
    });
    document.getElementById("tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <button className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white" onClick={() => isAuthenticated ? logout() : startLogin()}>
              <span className="grid size-9 place-items-center rounded-full bg-coral text-sm font-black text-white">{profileName.slice(0, 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{profileName}</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.13em] text-ink/40">Nível {profile?.cefrLevel || "A2"} · BCN</span>
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
              <span className="font-display text-lg font-black">Lingua aberta</span>
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
              {!isAuthenticated && !loading && <button className="hidden rounded-full bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-coral sm:block" onClick={() => startLogin()}>Entrar</button>}
              <button className="grid size-10 place-items-center rounded-full bg-coral font-display text-lg font-black text-white shadow-[0_6px_15px_rgba(234,100,75,0.25)] lg:hidden" onClick={() => isAuthenticated ? logout() : startLogin()} aria-label={isAuthenticated ? "Sair" : "Entrar"}>{profileName.slice(0, 1)}</button>
            </div>
          </header>

          <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white/60 px-5 py-2.5 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink/55"><span className={`size-2 shrink-0 rounded-full ${providerQuery.data?.localConfigured ? "bg-mint" : "bg-saffron"}`} /><span className="truncate">Tutor conectado · {providerQuery.data?.localConfigured ? "Ollama local" : "modo seguro"}</span></div>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-ink/35 sm:block">{providerQuery.data?.speechToText || "Whisper"} · {providerQuery.data?.textToSpeech || "voz"}</span>
          </div>

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
                {coursesForDisplay.map((course) => {
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
                    <div><div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg font-extrabold leading-none">Fala comigo</p><span className="rounded-full bg-ink/5 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-ink/45">Conta juvenil protegida</span></div><p className="mt-1 text-xs text-ink/45">Seu tutor multimodal, sem julgamento.</p></div>
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
                    <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-lg ${selectedCourse.color}`}><Sparkles className="size-3.5" /></span><span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">Dica rápida</span><button className="ml-auto text-ink/35 hover:text-ink" onClick={() => toast("Dica salva", { description: "Você pode revisitar esta frase na sua biblioteca." })}><BookOpen className="size-4" /></button></div>
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
                <div className="mt-14"><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Horas de prática</p><p className="mt-2 font-display text-[60px] font-black leading-none tracking-[-0.07em]">03<span className="text-3xl text-ink/35">h</span>42</p><p className="mt-4 max-w-[220px] text-sm leading-relaxed text-ink/60">Você praticou mais que <strong className="text-ink">82% da comunidade</strong> esta semana.</p></div>
                <div className="mt-auto pt-10"><div className="flex items-center justify-between text-xs font-bold"><span>Meta semanal</span><span>68%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full w-[68%] rounded-full bg-ink" /></div><button onClick={() => toast("Meta atualizada", { description: "Mais 18 minutos e você fecha sua meta da semana." })} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">Ajustar minha meta <ArrowUpRight className="size-4" /></button></div>
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

      {isMobileMenuOpen && <div className="fixed inset-0 z-50 flex lg:hidden"><button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setIsMobileMenuOpen(false)} /><aside className="relative z-10 flex h-full w-[280px] flex-col bg-paper p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="font-display text-2xl font-black">Lingua aberta</span><button className="grid size-9 place-items-center rounded-lg border border-ink/10" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X className="size-4" /></button></div><nav className="mt-12 space-y-2">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => handleNav(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold ${activeNav === label ? "bg-ink text-white" : "text-ink/60"}`}><Icon className="size-[18px]" />{label}</button>)}</nav><div className="mt-auto rounded-2xl bg-mint p-4"><Headphones className="size-5" /><p className="mt-4 font-display text-xl font-extrabold leading-tight">Seu tutor está pronto para ouvir.</p><button onClick={() => { setIsMobileMenuOpen(false); document.getElementById("tutor")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-4 text-sm font-extrabold underline underline-offset-4">Abrir tutor</button></div></aside></div>}
    </div>
  );
}
