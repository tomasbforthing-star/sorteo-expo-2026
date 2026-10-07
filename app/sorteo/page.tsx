"use client";
import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/ToastContext";

interface WinnerItem {
  position: number;
  fullName: string;
  instagram: string;
}

interface SorteoData {
  eligibleCount: number;
  lastLottery: {
    id: string;
    winners: WinnerItem[];
    alternates: WinnerItem[];
  } | null;
}

export default function SorteoPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<SorteoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animation Stage: "IDLE" | "PREPARING" | "SPINNING" | "REVEAL_WINNERS" | "FINISHED"
  const [stage, setStage] = useState<
    "IDLE" | "PREPARING" | "SPINNING" | "REVEAL_WINNERS" | "FINISHED"
  >("IDLE");

  // Result state
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [alternates, setAlternates] = useState<WinnerItem[]>([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [animatingUsername, setAnimatingUsername] = useState("buscando_usuario");

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sorteo");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      console.error("Error fetching sorteo data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000;
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

  const handleStartDraw = async () => {
    setIsExecuting(true);
    setStage("PREPARING");

    try {
      // 1. Ejecutar sorteo del lado servidor
      const res = await fetch("/api/sorteo", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        toastError("Error", json.error || "No se pudo realizar el sorteo.");
        setStage("IDLE");
        setIsExecuting(false);
        setIsConfirmOpen(false);
        return;
      }

      setWinners(json.winners || []);
      setAlternates(json.alternates || []);
      setIsConfirmOpen(false);

      // 2. Ruleta animada de usernames
      setTimeout(() => {
        setStage("SPINNING");

        let spinCount = 0;
        const pool = [
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
          "julian_spider",
          "dibu_23",
        ];

        const interval = setInterval(() => {
          spinCount++;
          const randomName = pool[Math.floor(Math.random() * pool.length)];
          setAnimatingUsername(randomName);

          if (spinCount > 28) {
            clearInterval(interval);

            // 3. Revelar Ganador #1
            setStage("REVEAL_WINNERS");
            setCurrentWinnerIndex(1);
            triggerConfetti();

            // 4. Revelar Ganador #2 a los 2.5s
            setTimeout(() => {
              setCurrentWinnerIndex(2);
              triggerConfetti();

              // 5. Revelar Ganador #3 a los 2.5s
              setTimeout(() => {
                setCurrentWinnerIndex(3);
                triggerConfetti();

                // 6. Revelar Suplentes y Pantalla Final
                setTimeout(() => {
                  setStage("FINISHED");
                  triggerConfetti();
                  toastSuccess("¡Sorteo Completado!", "Ganadores y suplentes seleccionados.");
                  fetchStatus();
                }, 3000);
              }, 2500);
            }, 2500);
          }
        }, 75);
      }, 1800);
    } catch {
      toastError("Error", "Error de red durante el sorteo.");
      setStage("IDLE");
      setIsExecuting(false);
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
    return <Loading text="Cargando motor de sorteo..." />;
  }

  const eligibleCount = data.eligibleCount || 0;
  const canDraw = eligibleCount >= 10;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 min-h-[85vh] flex flex-col justify-between">
      {/* Title & Fullscreen toggle */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <span className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase">
            EXPO AUTO CHINO 2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase mt-0.5">
            SORTEO <span className="text-cyan-400">MAR DE LAS PAMPAS</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-surface border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-white transition cursor-pointer"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* DYNAMIC STAGE */}
      <div className="my-auto py-6">
        {/* STAGE: IDLE */}
        {stage === "IDLE" && (
          <Card
            glow={canDraw}
            className="p-10 text-center bg-gradient-to-r from-[#0d121c] via-[#101926] to-[#0c141e] border-cyan-500/40 max-w-2xl mx-auto"
          >
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
              PARTICIPANTES HABILITADOS
            </p>
            <p className="text-6xl sm:text-7xl font-black font-mono text-cyan-400 my-3">
              {eligibleCount.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-8">
              Universo de participantes pertenecientes a jornadas cerradas y registros web.
            </p>

            {!canDraw && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-xs">
                  Se requieren al menos <strong>10 participantes habilitados</strong> para sortear.
                </span>
              </div>
            )}

            <Button
              variant="gold"
              size="xl"
              disabled={!canDraw}
              onClick={() => setIsConfirmOpen(true)}
              className="text-lg px-12 py-5 shadow-[0_0_35px_rgba(255,183,3,0.45)] cursor-pointer"
              leftIcon={<Trophy className="w-6 h-6 text-black" />}
            >
              REALIZAR SORTEO
            </Button>
          </Card>
        )}

        {/* STAGE: PREPARING */}
        {stage === "PREPARING" && (
          <div className="text-center space-y-4 animate-in fade-in duration-300 py-12">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-wider uppercase text-cyan-300 animate-pulse">
              PREPARANDO SORTEO...
            </h2>
            <p className="text-xs font-mono text-gray-400">
              Cargando participantes habilitados de jornadas cerradas
            </p>
          </div>
        )}

        {/* STAGE: SPINNING (Ruleta rápida de nombres) */}
        {stage === "SPINNING" && (
          <div className="text-center space-y-6 animate-in fade-in duration-300 py-10">
            <h2 className="text-2xl sm:text-4xl font-black font-mono tracking-wider uppercase text-amber-300 animate-pulse">
              BUSCANDO GANADORES...
            </h2>

            <div className="p-8 rounded-3xl bg-surface-card border-2 border-cyan-400/60 shadow-[0_0_60px_rgba(0,229,255,0.3)] max-w-lg mx-auto">
              <p className="text-3xl sm:text-5xl font-black font-mono text-cyan-400">
                @{animatingUsername}
              </p>
            </div>
          </div>
        )}

        {/* STAGE: REVEAL WINNERS (Uno por uno con expectativa) */}
        {stage === "REVEAL_WINNERS" && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                ESTADÍA EN MAR DE LAS PAMPAS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-mono uppercase text-white mt-1">
                🎉 REVELANDO GANADORES 🎉
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {winners.slice(0, currentWinnerIndex).map((w, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-gradient-to-b from-[#251d10] to-[#12131c] border-2 border-amber-400/80 p-8 shadow-[0_0_40px_rgba(255,183,3,0.35)] animate-in zoom-in-75 duration-500 flex flex-col items-center text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black font-black font-mono text-2xl shadow-lg mb-3">
                    #{index + 1}
                  </div>
                  <div className="text-[11px] uppercase font-mono font-bold tracking-widest text-amber-300 mb-1">
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

        {/* STAGE: FINISHED (Ganadores 1..3 + Suplentes 4..10) */}
        {stage === "FINISHED" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 3 Ganadores Titulares */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-amber-300">
                  GANADORES TITULARES (ESTADÍA)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {winners.map((w) => (
                  <div
                    key={w.position}
                    className="rounded-2xl bg-gradient-to-b from-[#221c10] to-[#12131a] border-2 border-amber-400/60 p-6 text-center shadow-[0_0_25px_rgba(255,183,3,0.2)]"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-black font-mono font-black text-lg mb-2">
                      #{w.position}
                    </div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300">
                      GANADOR #{w.position}
                    </div>
                    <p className="text-lg font-black text-white mt-1">{w.fullName}</p>
                    <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                      @{w.instagram}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Suplentes (4 al 10) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-purple-300">
                  SUPLENTES (ORDEN 4 AL 10)
                </h2>
              </div>

              <Card className="p-0 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1118] text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3 font-bold">POSICIÓN</th>
                      <th className="px-6 py-3 font-bold">USUARIO DE INSTAGRAM</th>
                      <th className="px-6 py-3 font-bold">NOMBRE COMPLETO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {alternates.map((a) => (
                      <tr key={a.position} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-3 font-bold text-purple-400">
                          {a.position}
                        </td>
                        <td className="px-6 py-3 font-bold text-cyan-400">
                          @{a.instagram}
                        </td>
                        <td className="px-6 py-3 text-gray-200">
                          {a.fullName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Botón para volver a la pantalla de sorteo inicial */}
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStage("IDLE")}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Volver a Pantalla de Sorteo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <footer className="border-t border-white/10 pt-4 text-center text-xs text-gray-500 font-mono">
        EXPO AUTO CHINO 2026 • FORTHING ARGENTINA
      </footer>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !isExecuting && setIsConfirmOpen(false)}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-4">
            <Trophy className="h-9 w-9 stroke-[2.5]" />
          </div>

          <h3 className="text-2xl font-black text-white font-mono uppercase">
            REALIZAR SORTEO
          </h3>

          <p className="text-sm text-gray-300 my-4 leading-relaxed">
            ¿Confirmás que querés realizar el sorteo oficial? El sistema seleccionará <strong>3 ganadores titulares</strong> y <strong>7 suplentes</strong> de forma aleatoria.
          </p>

          <div className="flex items-center gap-3 w-full mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isExecuting}
              className="flex-1"
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              variant="gold"
              onClick={handleStartDraw}
              isLoading={isExecuting}
              className="flex-1 font-bold"
            >
              CONFIRMAR
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
