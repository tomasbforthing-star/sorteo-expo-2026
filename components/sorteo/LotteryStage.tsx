"use client";
import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Award,
  ChevronRight,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ParticipantSummary {
  fullName: string;
  instagram: string;
}

interface SorteoData {
  eligibleCount: number;
  config: {
    eventName: string;
    lotteryName: string;
    officialInstagram: string;
    winnersCount: number;
    alternatesCount: number;
  };
}

export function LotteryStage() {
  const [data, setData] = useState<SorteoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animation Stage: "IDLE" | "PREPARING" | "SPINNING" | "REVEAL_WINNERS" | "REVEAL_ALTERNATES" | "FINISHED"
  const [stage, setStage] = useState<
    "IDLE" | "PREPARING" | "SPINNING" | "REVEAL_WINNERS" | "REVEAL_ALTERNATES" | "FINISHED"
  >("IDLE");

  // Lottery result data
  const [winners, setWinners] = useState<ParticipantSummary[]>([]);
  const [alternates, setAlternates] = useState<ParticipantSummary[]>([]);

  // Sequential reveal state
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [animatingUsername, setAnimatingUsername] = useState("usuario_candidato");

  const stageContainerRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sorteo");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error fetching stage status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const triggerConfetti = () => {
    const end = Date.now() + 3.5 * 1000;
    const colors = ["#00e5ff", "#06d6a0", "#ffb703", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const startLotteryAnimation = async () => {
    setStage("PREPARING");

    try {
      // 1. Llamar al backend para ejecutar el sorteo
      const res = await fetch("/api/sorteo", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "No se pudo realizar el sorteo.");
        setStage("IDLE");
        return;
      }

      setWinners(json.winners || []);
      setAlternates(json.alternates || []);

      // 2. Transición a Spinning
      setTimeout(() => {
        setStage("SPINNING");

        // Simular ruleta rápida de usernames
        let spinCount = 0;
        const poolUsernames = [
          "martinperez_ok",
          "valen_rossi22",
          "carlos_gomez",
          "sofia_mendoza",
          "lucas_alvarez",
          "camila_torres",
          "gonzalo_h",
          "antonela_r",
          "fede_rodriguez",
          "flor_fernandez",
        ];

        const interval = setInterval(() => {
          spinCount++;
          const randomName =
            poolUsernames[Math.floor(Math.random() * poolUsernames.length)];
          setAnimatingUsername(randomName);

          if (spinCount > 25) {
            clearInterval(interval);
            // 3. Comenzar revelación secuencial de ganadores
            setStage("REVEAL_WINNERS");
            setCurrentWinnerIndex(1); // Ganador 1
            triggerConfetti();

            // Ganador 2 después de 2.5s
            setTimeout(() => {
              setCurrentWinnerIndex(2);
              triggerConfetti();

              // Ganador 3 después de 2.5s
              setTimeout(() => {
                setCurrentWinnerIndex(3);
                triggerConfetti();

                // Revelar Suplentes después de 3s
                setTimeout(() => {
                  setStage("FINISHED");
                  triggerConfetti();
                }, 3000);
              }, 2500);
            }, 2500);
          }
        }, 80);
      }, 1800);
    } catch {
      alert("Error de red durante el sorteo.");
      setStage("IDLE");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="text-center font-mono text-cyan-400">
          <Sparkles className="w-10 h-10 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">
            CONECTANDO A PANTALLA DE EVENTO...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageContainerRef}
      className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden select-none"
    >
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[10%] w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[10%] w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Top Bar for TV Display */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 text-black font-black text-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)]">
            EC
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-widest font-mono text-white">
              {data.config.eventName}
            </div>
            <div className="text-xs sm:text-sm font-bold tracking-widest text-cyan-400 uppercase font-mono">
              {data.config.lotteryName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card border border-white/10 font-mono text-xs text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>EN VIVO</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
            title="Pantalla Completa"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Dynamic Stage */}
      <main className="relative z-10 my-auto py-8 flex flex-col items-center justify-center text-center max-w-6xl mx-auto w-full">
        {/* STAGE: IDLE */}
        {stage === "IDLE" && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 max-w-2xl">
            <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_50px_rgba(255,183,3,0.3)]">
              <Trophy className="w-20 h-20 stroke-[1.5]" />
            </div>

            <div>
              <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight uppercase text-white">
                SORTEO OFICIAL
              </h1>
              <p className="text-lg sm:text-xl font-bold text-cyan-400 font-mono mt-2">
                ESTADÍA EN MAR DE LAS PAMPAS
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card/90 border border-white/15 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4 divide-x divide-white/10">
                <div>
                  <p className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">
                    Participantes Habilitados
                  </p>
                  <p className="text-4xl font-black font-mono text-cyan-400 mt-1">
                    {data.eligibleCount.toLocaleString("es-AR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                    Premios a Sortear
                  </p>
                  <p className="text-4xl font-black font-mono text-amber-300 mt-1">
                    {data.config.winnersCount} Estadías
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="gold"
                size="xl"
                onClick={startLotteryAnimation}
                disabled={data.eligibleCount < 10}
                className="text-xl px-12 py-5 shadow-[0_0_40px_rgba(255,183,3,0.5)] cursor-pointer"
                leftIcon={<Sparkles className="w-6 h-6 text-black" />}
              >
                INICIAR SORTEO EN PANTALLA
              </Button>
              {data.eligibleCount < 10 && (
                <p className="text-xs text-rose-400 font-mono mt-2">
                  Se requieren al menos 10 participantes en jornadas cerradas.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STAGE: PREPARING */}
        {stage === "PREPARING" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-wider uppercase text-cyan-300 animate-pulse">
              PREPARANDO SORTEO...
            </h2>
            <p className="text-sm font-mono text-gray-400">
              Validando participantes de Base Master y generando secuencia segura
            </p>
          </div>
        )}

        {/* STAGE: SPINNING */}
        {stage === "SPINNING" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl sm:text-4xl font-black font-mono tracking-wider uppercase text-amber-300 animate-pulse">
              BUSCANDO GANADORES...
            </h2>

            <div className="p-8 rounded-3xl bg-surface-card border-2 border-cyan-400/50 shadow-[0_0_60px_rgba(0,229,255,0.3)] min-w-[320px] sm:min-w-[480px]">
              <p className="text-3xl sm:text-5xl font-black font-mono text-cyan-400">
                @{animatingUsername}
              </p>
            </div>
          </div>
        )}

        {/* STAGE: REVEAL WINNERS (Sequential 1, 2, 3) */}
        {stage === "REVEAL_WINNERS" && (
          <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-amber-300 tracking-wider">
                🎉 GANADORES OFICIALES 🎉
              </h2>
              <p className="text-sm font-mono text-cyan-300 mt-1 uppercase">
                ESTADÍA EN MAR DE LAS PAMPAS
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {winners.slice(0, currentWinnerIndex).map((w, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-gradient-to-b from-[#221c10] to-[#12131a] border-2 border-amber-400/60 p-8 shadow-[0_0_40px_rgba(255,183,3,0.3)] animate-in zoom-in-75 duration-500 flex flex-col items-center text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black font-black font-mono text-2xl shadow-lg mb-4">
                    #{index + 1}
                  </div>
                  <div className="text-xs uppercase font-mono font-bold tracking-widest text-amber-300 mb-1">
                    GANADOR #{index + 1}
                  </div>
                  <p className="text-2xl font-black text-white">{w.fullName}</p>
                  <p className="text-lg font-mono font-bold text-cyan-400 mt-1">
                    @{w.instagram}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE: FINISHED (Winners 1-3 + Alternates 4-10) */}
        {stage === "FINISHED" && (
          <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-amber-300 tracking-wider">
                🎉 GANADORES & SUPLENTES 🎉
              </h2>
              <p className="text-sm font-mono text-cyan-300 mt-1 uppercase">
                EXPO CHINA 2026 • RESULTADO OFICIAL
              </p>
            </div>

            {/* Top 3 Winners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {winners.map((w, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-gradient-to-b from-[#251d0f] to-[#12131c] border-2 border-amber-400 p-6 shadow-[0_0_35px_rgba(255,183,3,0.35)] flex flex-col items-center text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-black font-black font-mono text-xl shadow-lg mb-3">
                    #{index + 1}
                  </div>
                  <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-amber-300 mb-1">
                    GANADOR TITULAR
                  </span>
                  <p className="text-xl font-black text-white">{w.fullName}</p>
                  <p className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                    @{w.instagram}
                  </p>
                </div>
              ))}
            </div>

            {/* Alternates 4 to 10 */}
            <div className="rounded-2xl bg-surface-card/90 border border-white/15 p-6 backdrop-blur-xl text-left">
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-purple-300">
                  SUPLENTES (ORDEN DE PRELACIÓN 4 AL 10)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {alternates.map((a, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-surface-light border border-white/10 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-purple-400 font-bold mb-1">
                      <span>#{index + 4} Suplente</span>
                    </div>
                    <p className="font-bold text-white truncate">{a.fullName}</p>
                    <p className="text-cyan-400 font-semibold truncate">
                      @{a.instagram}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Replay / Reset action */}
            <div className="pt-2 flex justify-center gap-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStage("IDLE")}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Volver a Pantalla Inicial
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-mono border-t border-white/10 pt-4 gap-2">
        <div>© 2026 FORTHING ARGENTINA • EXPO CHINA 2026</div>
        <div className="text-cyan-400 font-semibold">
          SORTEO MAR DE LAS PAMPAS • @{data.config.officialInstagram}
        </div>
      </footer>
    </div>
  );
}
