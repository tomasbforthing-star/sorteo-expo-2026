"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  User,
  AtSign,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function PublicRegistroPage() {
  const [fullName, setFullName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{
    fullName: string;
    instagram: string;
  } | null>(null);

  const [eventInfo, setEventInfo] = useState({
    eventName: "EXPO CHINA 2026",
    lotteryName: "SORTEO MAR DE LAS PAMPAS",
    officialInstagram: "forthing.argentina",
  });

  useEffect(() => {
    fetch("/api/registro-publico")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEventInfo({
            eventName: data.eventName || "EXPO CHINA 2026",
            lotteryName: data.lotteryName || "SORTEO MAR DE LAS PAMPAS",
            officialInstagram: data.officialInstagram || "forthing.argentina",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage("Por favor, ingresá tu nombre y apellido completo.");
      return;
    }

    const cleanIg = instagram.trim().replace(/^@/, "");
    if (!cleanIg || cleanIg.length < 2) {
      setErrorMessage("Por favor, ingresá tu usuario de Instagram.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registro-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          instagram: cleanIg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "No se pudo completar el registro. Intentá nuevamente.");
        setIsSubmitting(false);
        return;
      }

      setSuccessData({
        fullName: data.participant?.fullName || fullName.trim(),
        instagram: data.participant?.instagram || cleanIg,
      });
      setFullName("");
      setInstagram("");
    } catch {
      setErrorMessage("Error de conexión al registrarte. Por favor, verificá tu conexión a internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setErrorMessage("");
    setFullName("");
    setInstagram("");
  };

  const instagramProfileUrl = `https://www.instagram.com/${eventInfo.officialInstagram.replace(/^@/, "")}/`;

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Main Header / Branding */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#090b10]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl p-1 bg-surface-card border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <img
                src="/logo.png"
                alt="Forthing Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]"
              />
            </div>
            <div>
              <div className="font-extrabold tracking-wider text-white text-sm sm:text-base font-mono">
                {eventInfo.eventName} <span className="text-cyan-400">FORTHING</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                Sorteo Oficial Mar de las Pampas
              </div>
            </div>
          </div>

          <a
            href={instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-pink-500/30 text-[11px] font-mono text-pink-300 hover:text-white hover:border-pink-500/60 transition"
          >
            <AtSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Seguinos:</span> @{eventInfo.officialInstagram}
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-lg w-full mx-auto px-4 py-8 sm:py-12 my-auto">
        {!successData ? (
          /* Registration Form Card */
          <div className="rounded-3xl bg-[#0e121b]/90 border border-white/15 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] space-y-6">
            {/* Header / Hero */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wide mb-1">
                <Gift className="w-3.5 h-3.5" />
                INSCRIPCIÓN OFICIAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white uppercase">
                PARTICIPÁ DEL <span className="text-cyan-400">SORTEO</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
                Ingresá tu nombre y usuario de Instagram para participar por increíbles premios de <strong>Forthing</strong>.
              </p>
            </div>

            {/* Error message alert */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-gray-300">
                  NOMBRE Y APELLIDO <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#141926] border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Instagram Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-gray-300">
                  USUARIO DE INSTAGRAM <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: juanperez (sin @)"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#141926] border border-white/15 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
                <p className="text-[11px] text-gray-400 pt-0.5">
                  Importante: Debés seguir a{" "}
                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 underline font-semibold hover:text-pink-300"
                  >
                    @{eventInfo.officialInstagram}
                  </a>{" "}
                  para validar tu participación.
                </p>
              </div>

              {/* Submit button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-black font-mono font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>REGISTRANDO...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>PARTICIPAR DEL SORTEO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-mono pt-2 border-t border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sorteo oficial verificado y auditado • Forthing</span>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="rounded-3xl bg-[#0e121b]/95 border border-cyan-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,229,255,0.2)] text-center space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                ✓ INSCRIPCIÓN EXITOSA
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white uppercase">
                ¡YA ESTÁS PARTICIPANDO!
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                Tu registro para el sorteo de <strong>Forthing</strong> en <strong>{eventInfo.eventName}</strong> fue guardado con éxito.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-4 rounded-2xl bg-[#141926] border border-white/10 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono">Participante:</span>
                <span className="font-bold text-white text-sm">{successData.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono">Instagram:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">@{successData.instagram}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono">Estado:</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">HABILITADO PARA EL SORTEO</span>
              </div>
            </div>

            {/* Instagram CTA */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-pink-500/25 space-y-3">
              <p className="text-xs text-gray-300 font-medium">
                Recordá que para ganar debés ser seguidor de nuestra cuenta oficial:
              </p>
              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(236,72,153,0.3)]"
              >
                <AtSign className="w-4 h-4" />
                <span>SEGUIR @{eventInfo.officialInstagram} EN INSTAGRAM</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Register another person button */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleReset}
                className="w-full font-mono text-xs"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                REGISTRAR A OTRA PERSONA
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-gray-500 font-mono border-t border-white/5 bg-[#06080c]/60">
        <p>© 2026 Forthing Argentina • {eventInfo.eventName} • Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
