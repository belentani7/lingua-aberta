import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { courseCompletion, learningCourses, readLocalProgress } from "@/lib/local-learning";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
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
  Play,
  Send,
  Sparkles,
  Target,
  Volume2,
  X,
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
    progress: 0,
    lessons: "0 de 2 lições",
    color: "bg-coral",
    accent: "text-coral",
    tag: "Para começar",
  },
  {
    language: "Català",
    courseSlug: "barcelona-por-dentro",
    label: "CA",
    title: "Barcelona por dentro",
    subtitle: "Escola, bairro e comunidade",
    progress: 0,
    lessons: "0 de 2 lições",
    color: "bg-mint",
    accent: "text-ink",
    tag: "Disponível",
  },
  {
    language: "English",
    courseSlug: "english-next-move",
    label: "EN",
    title: "English for your next move",
    subtitle: "Estudo, trabalho e internet",
    progress: 0,
    lessons: "0 de 2 lições",
    color: "bg-saffron",
    accent: "text-ink",
    tag: "Recomendado",
  },
];

const languageCopy: Record<Language, { greeting: string; prompt: string; phrase: string; translation: string; accent: string }> = {
  Español: {
    greeting: "Olá! Vamos praticar espanhol com frases reais.",
    prompt: "Diz em espanhol: 'Eu estou procurando um quarto perto do metrô.'",
    phrase: "Estoy buscando una habitación cerca del metro.",
    translation: "Estou procurando um quarto perto do metrô.",
    accent: "coral",
  },
  Català: {
    greeting: "Ei! Avui practiquem una frase útil en català.",
    prompt: "Digues en català: 'Eu estudo no instituto perto de casa.'",
    phrase: "Estudio a l'institut a prop de casa.",
    translation: "Eu estudo no instituto perto de casa.",
    accent: "mint",
  },
  English: {
    greeting: "Hello! Practice English with real-world phrases.",
    prompt: "Say in English: 'Eu quero trabalhar remotamente.'",
    phrase: "I want to work remotely.",
    translation: "Eu quero trabalhar remotamente.",
    accent: "saffron",
  },
};

const navItems = [
  { label: "Início", icon: Compass, available: true },
  { label: "Minha rota", icon: Target, available: true },
  { label: "Biblioteca", icon: BookOpen, available: false },
  { label: "Comunidade", icon: MessageCircle, available: false },
  { label: "Juegos", icon: Gamepad2, available: true },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [localProgress] = useState(() => readLocalProgress());
  const [activeLanguage, setActiveLanguage] = useState<Language>("Español");

  const [activeNav, setActiveNav] = useState("Início");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ from: "tutor" | "student"; text: string }>>([
    { from: "tutor", text: "Olá! Sou o tutor guiado local de Lingua Aberta. Posso ajudar a praticar as frases do currículo disponível neste navegador. Não sou uma IA generativa." },
  ]);
  const profileName = "Estudante";
  const coursesForDisplay = useMemo(() => courses.map((course) => {
    const current = courseCompletion(course.courseSlug, localProgress);
    return { ...course, progress: current.percent,
      lessons: `${current.completed} de ${current.total} lições`,
      tag: current.completed ? "Em andamento" : "Começar" };
  }), [localProgress]);

  const selectedCourse = useMemo(
    () => coursesForDisplay.find((course) => course.language === activeLanguage) ?? coursesForDisplay[0],
    [activeLanguage, coursesForDisplay],
  );
  const selectedCopy = languageCopy[activeLanguage];

  function handleNav(label: string) {
    if (label === "Juegos") {
      setIsMobileMenuOpen(false);
      navigate("/games");
      return;
    }
    setIsMobileMenuOpen(false);
    if (label === "Minha rota") {
      setActiveNav(label);
      document.getElementById("rota")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (label === "Início") {
      setActiveNav(label);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggleListening() {
    const text = [...messages].reverse().find((item) => item.from === "tutor")?.text;
    if (!text || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      toast("Leitura por voz indisponível", { description: "Você ainda pode praticar as lições e frases por escrito." });
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
    utterance.lang = "pt-BR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    toast("Lendo tutor guiado", { description: "A voz utiliza os recursos disponíveis no seu navegador." });
  }

  function sendMessage() {
    const clean = message.trim().slice(0, 500);
    if (!clean) return;
    const firstLesson = learningCourses[activeLanguage].lessons[0];
    const firstPhrase = firstLesson.phrases[0];
    const reply = /pron[uú]n|fala|listen|ouvir|sound/i.test(clean)
      ? `Pratique esta frase em ${activeLanguage}: ${firstPhrase.text}. Toque em 'Ouvir' na lição para escutar o navegador.`
      : `Tutoria guiada local (sem IA remota): comece por "${firstLesson.title}". Exemplo: "${firstPhrase.text}" significa "${firstPhrase.translation}". Abra a lição e faça os exercícios para registrar progresso real.`;
    setMessages((current) => [...current.slice(-17), { from: "student" as const, text: clean }, { from: "tutor" as const, text: reply }]);
    setMessage("");
  }

  function startLesson() {
    navigate(`/study/${selectedCourse.courseSlug}`);
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
              {navItems.map(({ label, icon: Icon, available }) => {
                const isActive = activeNav === label;
                return (
                  <button
                    key={label}
                    onClick={() => handleNav(label)}
                    disabled={!available}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive ? "bg-ink text-paper shadow-[0_8px_20px_rgba(14,32,53,0.12)]" : "text-ink/60 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <Icon className={`size-[18px] ${isActive ? "text-saffron" : "text-ink/45 group-hover:text-coral"}`} />
                    {label}
                    {!available && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide opacity-60">Em breve</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="rounded-2xl bg-ink p-5 text-paper">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">Aprendizagem local</p>
              <p className="mt-3 text-xl font-extrabold">Seu progresso é real e privado.</p>
              <p className="mt-2 text-sm text-white/70">
                {Object.values(localProgress).reduce((sum, ids) => sum + ids.length, 0)} lições concluídas neste navegador. Nenhuma conta necessária.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-3 px-3 py-2">
              <span className="grid size-9 place-items-center rounded-full bg-coral text-sm font-black text-white">E</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{profileName}</span>
                <span className="block text-xs text-ink/50">Modo local · sem cadastro</span>
              </span>
            </div>
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
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/35">Campus linguístico aberto</span>
              <span className="size-1 rounded-full bg-coral" />
              <span>Aulas em PT · ES · CA · EN</span>
            </div>
            <div className="flex items-center gap-3">
              <span title="Os exercícios MIARA do currículo funcionam sem API de IA." className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink/65 sm:flex">
                <Download className="size-3.5" />
                Baixo consumo
              </span>
              <button type="button" className="relative grid size-10 place-items-center rounded-full border border-ink/10 bg-white disabled:cursor-not-allowed disabled:opacity-45" aria-label="Mensagens em breve" disabled title="Mensagens ainda não disponíveis">
                <MessageCircle className="size-[18px]" />
              </button>
              <span className="hidden rounded-full bg-ink px-3 py-2 text-xs font-bold text-white sm:block">Sem conta</span>
              <span className="grid size-10 place-items-center rounded-full bg-coral font-display text-lg font-black text-white shadow-[0_6px_15px_rgba(234,100,75,0.25)] lg:hidden" aria-label="Modo local sem cadastro">E</span>
            </div>
          </header>

          <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white/60 px-5 py-2.5 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink/55"><span className="size-2 shrink-0 rounded-full bg-mint" /><span className="truncate">Tutor guiado local · sem IA remota</span></div>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-ink/35 sm:block">Voz de leitura: recursos do navegador</span>
          </div>

          <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <section className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-8 text-paper shadow-[0_20px_50px_rgba(14,32,53,0.14)] sm:px-10 sm:py-10 lg:min-h-[340px] lg:px-12 lg:py-12">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,rgba(106,205,220,0.35),transparent_55%),radial-gradient(ellipse_at_72%_80%,rgba(233,173,87,0.15),transparent_60%)]" />
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
                <span className="text-sm font-semibold text-ink/50">Diagnóstico em preparação</span>
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
                    <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-lg ${selectedCourse.color}`}><Sparkles className="size-3.5" /></span><span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">Dica rápida</span><button className="ml-auto text-ink/35 hover:text-ink" onClick={startLesson}><BookOpen className="size-4" /></button></div>
                    <p className="mt-3 font-display text-[19px] font-extrabold leading-tight">{selectedCopy.phrase}</p>
                    <p className="mt-1 text-xs text-ink/45">{selectedCopy.translation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-ink/10 bg-white p-4 sm:p-5">
                  <button onClick={toggleListening} className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper text-ink hover:bg-mint" aria-label="Ouvir tutor guiado em voz alta"><Volume2 className="size-[18px]" /></button>
                  <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} placeholder="Escreva para o tutor guiado local..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink/35" aria-label="Mensagem para o tutor" />
                  <button onClick={sendMessage} className="grid size-10 place-items-center rounded-xl bg-ink text-white transition hover:bg-coral active:scale-95" aria-label="Enviar mensagem"><Send className="size-4" /></button>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl bg-mint p-6 sm:p-7">
                <div className="flex items-start justify-between"><span className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/55">Seu impacto</span><Flame className="size-5 text-coral" fill="currentColor" /></div>
                <div className="mt-14">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Lições concluídas neste navegador</p>
                  <p className="mt-2 font-display text-[60px] font-black leading-none">{Object.values(localProgress).reduce((sum, ids) => sum + ids.length, 0)}</p>
                  <p className="mt-3 text-sm text-ink/60">Sem estatísticas inventadas ou comparações com outros estudantes.</p>
                </div>
                <div className="mt-auto pt-10">
                  <div className="flex items-center justify-between text-xs font-bold"><span>Progresso no idioma selecionado</span><span>{selectedCourse.progress}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-ink" style={{ width: `${selectedCourse.progress}%` }} /></div>
                  <button onClick={startLesson} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">Continuar aprendendo <ArrowUpRight className="size-4" /></button>
                </div>
              </div>
            </section>

            <section className="mt-12 border-t border-ink/10 pt-7">
              <div className="grid gap-5 md:grid-cols-3">
                <article className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/40 p-4 text-left"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-saffron"><Download className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Estudar offline</p><p className="mt-1 text-xs text-ink/50">Download em preparação</p></div><span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-ink/50">Em breve</span></article>
                <article className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/40 p-4 text-left"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral text-white"><MapPin className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Perto de você</p><p className="mt-1 text-xs text-ink/50">Grupos em preparação</p></div><span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-ink/50">Em breve</span></article>
                <article className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/40 p-4 text-left"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white"><CircleHelp className="size-5" /></div><div className="min-w-0"><p className="font-display text-[17px] font-extrabold">Descobrir meu nível</p><p className="mt-1 text-xs text-ink/50">Avaliação em preparação</p></div><span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-ink/50">Em breve</span></article>
              </div>
            </section>

            <footer className="mt-14 flex flex-col gap-4 border-t border-ink/10 py-7 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em]">Feito para quem está construindo seu próximo capítulo.</p>
              <div className="flex gap-4"><span title="Novos ajustes de leitura em desenvolvimento">Acessibilidade em evolução</span><span title="O progresso de aprendizagem desta experiência é guardado localmente neste navegador">Progresso local</span></div>
            </footer>
          </div>
        </main>
      </div>

      {isMobileMenuOpen && <div className="fixed inset-0 z-50 flex lg:hidden"><button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setIsMobileMenuOpen(false)} /><aside className="relative z-10 flex h-full w-[280px] flex-col bg-paper p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="font-display text-2xl font-black">Lingua aberta</span><button className="grid size-9 place-items-center rounded-lg border border-ink/10" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X className="size-4" /></button></div><nav className="mt-12 space-y-2">{navItems.map(({ label, icon: Icon, available }) => <button key={label} onClick={() => handleNav(label)} disabled={!available} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold disabled:cursor-not-allowed disabled:opacity-50 ${activeNav === label ? "bg-ink text-white" : "text-ink/60"}`}><Icon className="size-[18px]" />{label}{!available && <span className="ml-auto text-xs">Em breve</span>}</button>)}</nav><div className="mt-auto rounded-2xl bg-mint p-4"><Headphones className="size-5" /><p className="mt-4 font-display text-xl font-extrabold leading-tight">Seu tutor está pronto para ouvir.</p><button onClick={() => { setIsMobileMenuOpen(false); document.getElementById("tutor")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-4 text-sm font-extrabold underline underline-offset-4">Abrir tutor</button></div></aside></div>}
    </div>
  );
}
