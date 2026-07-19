import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Send, X, Sparkles } from 'lucide-react';
import { API_BASE } from '../../config/apiBase';
import { scrollToId } from '../../hooks/useSmoothScroll';

// Take the visitor to a section — smooth-scroll on the one-page site, else route to it.
function goToSection(target) {
  if (!target) return null;
  const el = document.getElementById(target);
  if (el) {
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return el;
  }
  // section not on this route → go home (sections live on the one-page site)
  window.location.assign('/#' + target);
  return null;
}

// Strip markdown so the spoken/caption text stays clean.
function cleanForSpeech(s = '') {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*#`_>|]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
const TTS = typeof window !== 'undefined' ? window.speechSynthesis : null;
const SPEECH_SUPPORTED = Boolean(SR && TTS);

// Scroll-narration copy for each section of the one-page site.
const SECTION_INFO = {
  home: { title: 'AI Research Lab', text: "Welcome! I'm ARIA. Tap me to talk, or just ask about any section." },
  about: { title: 'Research Profile', text: 'Who Anjaneyulu is — a B.Tech AI & ML student and full-stack builder.' },
  skills: { title: 'Skill Modules', text: 'His toolkit — languages, AI/ML, frontend, backend, cloud and tools.' },
  projects: { title: 'Research Projects', text: 'The intelligent systems he has built — hover a card to dive in.' },
  certificates: { title: 'Certifications', text: 'Verified certificates and achievements earned along the journey.' },
  hackathons: { title: 'Hackathon Arena', text: 'Competitive wins — including 1st Runner-Up at the WebX Challenge.' },
  workshops: { title: 'Workshops', text: 'Hands-on AI sessions and events he has taken part in.' },
  contact: { title: 'Comms Channel', text: "Ready to connect? Ask me and I'll take you to Contact." },
};
const SECTION_ORDER = Object.keys(SECTION_INFO);

/** Small robotic head (SVG) with glowing eyes + antenna. */
function GuideBot({ talking, ring }) {
  return (
    <svg width="52" height="56" viewBox="0 0 60 64" fill="none" aria-hidden="true">
      <line x1="30" y1="6" x2="30" y2="16" stroke={ring} strokeWidth="2" />
      <circle cx="30" cy="5" r="4" fill="#d946ef">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <rect x="10" y="16" width="40" height="34" rx="12" fill="url(#va-shell)" stroke={ring} strokeWidth="1.5" />
      <rect x="16" y="23" width="28" height="18" rx="8" fill="#050914" />
      <circle cx="24" cy="32" r="3.4" fill={ring}>
        <animate attributeName="r" values="3.4;0.6;3.4" dur={talking ? '0.5s' : '4s'} repeatCount="indefinite" />
      </circle>
      <circle cx="36" cy="32" r="3.4" fill={ring}>
        <animate attributeName="r" values="3.4;0.6;3.4" dur={talking ? '0.5s' : '4s'} repeatCount="indefinite" />
      </circle>
      <rect x="6" y="27" width="4" height="12" rx="2" fill="#6366f1" />
      <rect x="50" y="27" width="4" height="12" rx="2" fill="#6366f1" />
      <rect x="24" y="44" width="12" height="2" rx="1" fill={ring} opacity="0.7" />
      <defs>
        <linearGradient id="va-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8eefc" />
          <stop offset="1" stopColor="#aab6d6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * ARIA — one assistant robot (bottom-left) that does two jobs:
 *   1) Narrates each section as you scroll (text hologram).
 *   2) Is a phone-call voice assistant: auto-greets + listens on the first
 *      gesture, hands-free half-duplex turn-taking, agentic navigation, memory.
 * Falls back to a text chat where Web Speech is unavailable (e.g. Firefox).
 */
export function VoiceAssistant() {
  const [status, setStatus] = useState('idle'); // idle|connecting|listening|thinking|speaking|error|unsupported
  const [open, setOpen] = useState(false);       // call panel open?
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [userCaption, setUserCaption] = useState('');
  const [ariaCaption, setAriaCaption] = useState('');
  const [log, setLog] = useState([]);
  const [typed, setTyped] = useState('');

  // scroll narration
  const [section, setSection] = useState('home');
  const [narrating, setNarrating] = useState(false);
  const ratios = useRef({});
  const narrateTimer = useRef();

  // guide pointer (flies to the section ARIA is talking about)
  const [pointer, setPointer] = useState(null); // { id, x, y, label }
  const pointerTimer = useRef();
  const logRef = useRef(null);

  const recogRef = useRef(null);
  const wantListenRef = useRef(false);
  const silenceRef = useRef(null);
  const transcriptRef = useRef('');
  const historyRef = useRef([]);
  const voiceRef = useRef(null);
  const armedRef = useRef(false);
  const statusRef = useRef('idle');
  const mutedRef = useRef(false);
  const callActiveRef = useRef(false);

  const setStat = (s) => { statusRef.current = s; setStatus(s); };
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ---------- section narration (scroll) ----------
  useEffect(() => {
    const els = SECTION_ORDER.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { ratios.current[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
        let best = null, bestR = 0.12;
        for (const id of SECTION_ORDER) {
          const r = ratios.current[id] || 0;
          if (r > bestR) { bestR = r; best = id; }
        }
        if (best) {
          setSection((prev) => {
            if (prev !== best) {
              setNarrating(true);
              clearTimeout(narrateTimer.current);
              narrateTimer.current = setTimeout(() => setNarrating(false), 2200);
            }
            return best;
          });
        }
      },
      { threshold: [0.12, 0.3, 0.55, 0.8] }
    );
    els.forEach((el) => io.observe(el));
    return () => { io.disconnect(); clearTimeout(narrateTimer.current); };
  }, []);

  // ---------- guide pointer ----------
  const computePoint = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 48, Math.max(48, r.left + Math.min(140, r.width / 2)));
    const y = Math.max(104, Math.min(window.innerHeight - 70, r.top + 64));
    return { x, y };
  };
  const pointAt = useCallback((id) => {
    clearTimeout(pointerTimer.current);
    const p = computePoint(id);
    if (p) setPointer({ id, ...p, label: SECTION_INFO[id]?.title || id });
    pointerTimer.current = setTimeout(() => setPointer(null), 6500);
  }, []);
  // keep the pointer glued to its target while the page scrolls
  useEffect(() => {
    if (!pointer) return;
    const upd = () => {
      const p = computePoint(pointer.id);
      if (p) setPointer((prev) => (prev ? { ...prev, ...p } : prev));
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    const iv = setInterval(upd, 300); // covers Lenis smooth-scroll frames
    return () => {
      window.removeEventListener('scroll', upd);
      window.removeEventListener('resize', upd);
      clearInterval(iv);
    };
  }, [pointer?.id]);

  // ---------- auto-scroll the chat to newest ----------
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, userCaption, ariaCaption]);

  // ---------- pick a natural voice ----------
  useEffect(() => {
    if (!TTS) return;
    const pick = () => {
      const voices = TTS.getVoices();
      if (!voices.length) return;
      const pref = voices.find((v) =>
        /aria|jenny|zira|samantha|female|google us english/i.test(v.name) && /^en/i.test(v.lang)
      );
      voiceRef.current = pref || voices.find((v) => /^en/i.test(v.lang)) || voices[0];
    };
    pick();
    TTS.addEventListener?.('voiceschanged', pick);
    return () => TTS.removeEventListener?.('voiceschanged', pick);
  }, []);

  const speak = useCallback((text, onDone) => {
    setAriaCaption(text);
    setLog((l) => [...l, { role: 'assistant', text }].slice(-8));
    if (!TTS || mutedRef.current) { onDone?.(); return; }
    try { TTS.cancel(); } catch { /* noop */ }
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 1.02;
    u.pitch = 1.05;
    u.onend = () => onDone?.();
    u.onerror = () => onDone?.();
    setStat('speaking');
    TTS.speak(u);
  }, []);

  const beginListen = useCallback(() => {
    if (!SR || !callActiveRef.current) return;
    transcriptRef.current = '';
    setUserCaption('');
    wantListenRef.current = true;
    setStat('listening');
    try { recogRef.current?.start(); } catch { /* already started */ }
  }, []);

  const stopListen = useCallback(() => {
    wantListenRef.current = false;
    clearTimeout(silenceRef.current);
    try { recogRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const ask = useCallback((text) => {
    const clean = text.trim();
    if (!clean) { beginListen(); return; }
    setUserCaption(clean);
    setLog((l) => [...l, { role: 'user', text: clean }].slice(-8));
    historyRef.current = [...historyRef.current, { role: 'user', content: clean }].slice(-16);
    setStat('thinking');

    fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: historyRef.current }),
    })
      .then((r) => r.json())
      .then((data) => {
        const reply = cleanForSpeech(data?.reply || "Sorry, I didn't catch that — could you repeat?");
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }].slice(-16);
        if (data?.action?.type === 'navigate') {
          const t = data.action.target;
          goToSection(t);
          // point at the section once the smooth-scroll has settled
          setTimeout(() => pointAt(t), 850);
        }
        speak(reply, () => { if (callActiveRef.current) beginListen(); });
      })
      .catch(() => {
        speak('I had trouble reaching the lab servers. Please try again.', () => {
          if (callActiveRef.current) beginListen();
        });
      });
  }, [speak, beginListen]);

  // ---------- recognizer ----------
  useEffect(() => {
    if (!SR) { setStat('unsupported'); return; }
    const recog = new SR();
    recog.lang = 'en-US';
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      transcriptRef.current = (transcriptRef.current + ' ' + final).trim();
      const shown = (transcriptRef.current + ' ' + interim).trim();
      if (shown) setUserCaption(shown);
      clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        const text = transcriptRef.current.trim();
        if (text && statusRef.current === 'listening') {
          transcriptRef.current = '';
          stopListen();
          ask(text);
        }
      }, 1100);
    };
    recog.onend = () => {
      if (wantListenRef.current && callActiveRef.current) {
        try { recog.start(); } catch { /* noop */ }
      }
    };
    recog.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        callActiveRef.current = false;
        setCallActive(false);
        setStat('error');
        setAriaCaption('Microphone access is blocked. Enable it in your browser, or type to me below.');
        setOpen(true);
      }
    };
    recogRef.current = recog;
    return () => { try { recog.abort(); } catch { /* noop */ } };
  }, [ask, stopListen]);

  // ---------- call control ----------
  const startCall = useCallback(() => {
    setOpen(true);
    callActiveRef.current = true;
    setCallActive(true);
    setStat('connecting');
    const greeting = "Hi! I'm ARIA, the lab's research assistant. How can I help you?";
    historyRef.current = [];
    if (SPEECH_SUPPORTED) {
      speak(greeting, () => { if (callActiveRef.current) beginListen(); });
    } else {
      setStat('unsupported');
      setAriaCaption(greeting + ' (Voice is unavailable in this browser — type below.)');
      setLog((l) => [...l, { role: 'assistant', text: greeting }].slice(-8));
    }
  }, [speak, beginListen]);

  const endCall = useCallback(() => {
    callActiveRef.current = false;
    setCallActive(false);
    setOpen(false);
    stopListen();
    try { TTS?.cancel(); } catch { /* noop */ }
    setStat('idle');
    setUserCaption('');
  }, [stopListen]);

  // ARIA is silent until the user taps the robot — no auto-greeting, no
  // auto-listening. This just cleans up audio/mic when the component unmounts.
  useEffect(() => {
    return () => {
      try { TTS?.cancel(); } catch { /* noop */ }
      try { recogRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);

  const sendTyped = (e) => {
    e?.preventDefault();
    const t = typed.trim();
    if (!t) return;
    setTyped('');
    if (!callActiveRef.current) { callActiveRef.current = true; setCallActive(true); setOpen(true); }
    stopListen();
    ask(t);
  };

  const statusLabel = {
    idle: 'Tap to talk',
    connecting: 'Connecting…',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    error: 'Mic blocked',
    unsupported: 'Text mode',
  }[status];

  const ring =
    status === 'listening' ? '#22d3ee'
    : status === 'speaking' ? '#d946ef'
    : status === 'thinking' ? '#818cf8'
    : '#22d3ee';

  const info = SECTION_INFO[section] || SECTION_INFO.home;
  const talking = narrating || status === 'speaking' || status === 'listening';

  return (
    <>
      {/* --------- Guide pointer: flies to the section ARIA is talking about --------- */}
      <AnimatePresence>
        {pointer && (
          <motion.div
            className="pointer-events-none fixed z-[80]"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.25 }}
            style={{ left: pointer.x, top: pointer.y, transition: 'left 0.28s ease, top 0.28s ease' }}
          >
            {/* pulsing reticle */}
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <motion.span
                className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ border: '2px solid #22d3ee' }}
                animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                transition={{ duration: 1.3, repeat: Infinity }}
              />
              <div className="h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 18px 4px rgba(34,211,238,0.8)' }} />
              {/* crosshair */}
              <span className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-cyan-300/70" />
              <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-cyan-300/70" />
              {/* label */}
              <div className="absolute left-6 top-3 whitespace-nowrap rounded-lg holo-chip px-2.5 py-1 text-xs font-semibold text-cyan-100">
                {pointer.label}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-[60] flex flex-row-reverse items-end gap-3">
      {/* robot */}
      <motion.button
        onClick={() => (callActive ? setOpen((o) => !o) : startCall())}
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl holo-panel"
        style={{ boxShadow: `0 0 30px -6px ${ring}` }}
        title={callActive ? 'ARIA — tap to open' : 'ARIA — tap to talk'}
        aria-label="ARIA assistant"
      >
        <GuideBot talking={talking} ring={ring} />
        {(status === 'listening' || status === 'speaking' || status === 'connecting') && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ border: `2px solid ${ring}` }}
            animate={{ scale: [1, 1.14], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* panel: call UI when active, else scroll narration */}
      <AnimatePresence mode="wait">
        {callActive && open ? (
          <motion.div
            key="call"
            initial={{ opacity: 0, x: 12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.96 }}
            className="holo-speech mb-1 w-[min(88vw,340px)] rounded-2xl p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg holo-chip text-cyan-300">
                <Sparkles size={15} />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-cyan-100">ARIA · Research Assistant</div>
                <div className="text-[11px] text-cyan-300/70">{statusLabel}</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white/80"><X size={16} /></button>
            </div>

            <div className="mb-3 flex h-12 items-end justify-center gap-1.5 rounded-xl holo-chip py-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{ background: ring }}
                  animate={{ height: status === 'listening' || status === 'speaking' ? [6, 8 + ((i * 7) % 22), 6] : 6 }}
                  transition={{ duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>

            <div ref={logRef} className="mb-3 max-h-40 space-y-2 overflow-y-auto pr-1 text-sm scroll-smooth">
              {log.slice(-6).map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <span className={'inline-block rounded-xl px-3 py-1.5 ' + (m.role === 'user' ? 'bg-cyan-500/15 text-cyan-50' : 'holo-chip text-cyan-100')}>
                    {m.text}
                  </span>
                </div>
              ))}
              {userCaption && status === 'listening' && (
                <div className="text-right italic text-cyan-300/60">{userCaption}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted((m) => !m)}
                className="grid h-10 w-10 place-items-center rounded-xl holo-chip text-cyan-200 hover:border-cyan-400"
                title={muted ? 'Unmute ARIA' : 'Mute ARIA'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={endCall}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/90 text-sm font-semibold text-white hover:bg-rose-500"
              >
                <PhoneOff size={16} /> End call
              </button>
            </div>

            <form onSubmit={sendTyped} className="mt-2 flex items-center gap-2">
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="…or type a message"
                className="h-10 flex-1 rounded-xl holo-chip bg-transparent px-3 text-sm text-cyan-50 placeholder:text-cyan-300/40 focus:border-cyan-400 focus:outline-none"
              />
              <button type="submit" className="grid h-10 w-10 place-items-center rounded-xl holo-chip text-cyan-200 hover:border-cyan-400">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key={'narrate-' + section}
            initial={{ opacity: 0, x: 12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="holo-speech mb-1 max-w-[13rem] cursor-pointer rounded-2xl px-3.5 py-2.5"
            onClick={() => startCall()}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-cyan-300/80">
              <Sparkles size={12} /> ARIA · guide
            </div>
            <div className="text-sm font-semibold text-cyan-100">{info.title}</div>
            <p className="mt-0.5 text-[13px] leading-snug text-cyan-50/85">{info.text}</p>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300/70">
              <Phone size={11} /> Tap to talk
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
