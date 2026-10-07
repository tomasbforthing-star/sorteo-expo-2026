"use client";
import React, { useState, useEffect, useRef } from "react";
import { User, AtSign, Phone, CheckCircle2, AlertTriangle, Calendar, Lock, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContext";

interface JornadaStatus {
  id: string;
  number: number;
  name: string;
  status: "PENDIENTE" | "ABIERTA" | "CERRADA";
  participantsCount: number;
}

export default function CaptacionPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const fullNameRef = useRef<HTMLInputElement>(null);

  // Day selection state
  const [jornadas, setJornadas] = useState<JornadaStatus[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoadingJornadas, setIsLoadingJornadas] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [followsInstagram, setFollowsInstagram] = useState(false);

  // Public link copy state
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successBanner, setSuccessBanner] = useState<{
    name: string;
    ig: string;
    jornada: string;
  } | null>(null);

  const fetchJornadas = async () => {
    setIsLoadingJornadas(true);
    try {
      const res = await fetch("/api/captacion");
      if (res.ok) {
        const data = await res.json();
        const list: JornadaStatus[] = data.jornadas || [];
        setJornadas(list);

        // Auto-select first active or available day
        const openDay = list.find((j) => j.status === "ABIERTA");
        if (openDay) {
          setSelectedDay(openDay.number);
        } else {
          // If Day 1 is closed and Day 2 is open/pending, select Day 2, etc.
          const j1 = list.find((j) => j.number === 1);
          const j2 = list.find((j) => j.number === 2);
          if (j1?.status === "CERRADA" && j2?.status !== "CERRADA") {
            setSelectedDay(2);
          } else if (j2?.status === "CERRADA") {
            setSelectedDay(3);
          } else {
            setSelectedDay(1);
          }
        }
      }
    } catch {
      console.error("Error fetching jornadas for captacion");
    } finally {
      setIsLoadingJornadas(false);
    }
  };

  useEffect(() => {
    fetchJornadas();
    fullNameRef.current?.focus();
  }, []);

  const j1 = jornadas.find((j) => j.number === 1);
  const j2 = jornadas.find((j) => j.number === 2);
  const j3 = jornadas.find((j) => j.number === 3);

  // Eligibility checks
  const isDay1Disabled = j1?.status === "CERRADA";
  const isDay2Disabled = j1?.status !== "CERRADA" || j2?.status === "CERRADA";
  const isDay3Disabled = j2?.status !== "CERRADA" || j3?.status === "CERRADA";

  const getDayStatusText = (dayNum: number) => {
    if (dayNum === 1) {
      if (j1?.status === "CERRADA") return "CERRADO";
      if (j1?.status === "ABIERTA") return "ABIERTO";
      return "DISPONIBLE";
    }
    if (dayNum === 2) {
      if (j1?.status !== "CERRADA") return "BLOQUEADO (Cerrar Día 1)";
      if (j2?.status === "CERRADA") return "CERRADO";
      if (j2?.status === "ABIERTA") return "ABIERTO";
      return "DISPONIBLE";
    }
    if (dayNum === 3) {
      if (j2?.status !== "CERRADA") return "BLOQUEADO (Cerrar Día 2)";
      if (j3?.status === "CERRADA") return "CERRADO";
      if (j3?.status === "ABIERTA") return "ABIERTO";
      return "DISPONIBLE";
    }
    return "";
  };

  const isCurrentSelectionLocked = () => {
    if (selectedDay === 1 && isDay1Disabled) return true;
    if (selectedDay === 2 && isDay2Disabled) return true;
    if (selectedDay === 3 && isDay3Disabled) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessBanner(null);

    if (isCurrentSelectionLocked()) {
      setErrorMessage(`El Día ${selectedDay} no está habilitado para carga.`);
      toastError("Atención", `El Día ${selectedDay} no está habilitado.`);
      return;
    }

    if (fullName.trim().length < 3) {
      setErrorMessage("El nombre completo debe tener al menos 3 caracteres.");
      return;
    }

    if (!instagram.trim()) {
      setErrorMessage("Ingrese el usuario de Instagram.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Ingrese el número de celular.");
      return;
    }

    if (!followsInstagram) {
      setErrorMessage("Debe confirmar que el participante sigue nuestra cuenta oficial de Instagram.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/captacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          instagram,
          phone,
          followsInstagram,
          dayNumber: selectedDay,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Error al registrar participante.");
        toastError("Error", data.error || "No se pudo registrar.");
        setIsSubmitting(false);
        return;
      }

      // Feedback de éxito
      setSuccessBanner({
        name: data.participant.fullName,
        ig: data.participant.instagram,
        jornada: data.participant.jornada,
      });
      toastSuccess("✓ Participante Registrado", `${data.participant.fullName} ya está participando.`);

      // Limpiar inmediatamente el formulario
      setFullName("");
      setInstagram("");
      setPhone("");
      setFollowsInstagram(false);

      // Devolver foco inmediatamente al primer campo
      setTimeout(() => {
        fullNameRef.current?.focus();
      }, 50);

      fetchJornadas();
    } catch {
      setErrorMessage("Error de conexión al servidor.");
      toastError("Error", "Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (typeof window === "undefined") return;
    const publicUrl = `${window.location.origin}/registro`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedPublicLink(true);
    toastSuccess("Link Copiado", "El link público de inscripción fue copiado al portapapeles.");
    setTimeout(() => setCopiedPublicLink(false), 2500);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
      {/* Title section */}
      <div className="text-center mb-5">
        <span className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase">
          EXPO CHINA 2026
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono uppercase mt-1">
          SORTEO <span className="text-cyan-400">MAR DE LAS PAMPAS</span>
        </h1>
      </div>

      {/* Public Link Card for Easy Sharing */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,229,255,0.07)]">
        <div className="text-left space-y-0.5">
          <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            LINK PÚBLICO DEL SORTEO
          </p>
          <p className="text-[11px] text-gray-400 font-sans">
            Compartí <strong className="text-cyan-300 font-mono">/registro</strong> para que la gente se anote directamente.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopyPublicLink}
          className="shrink-0 font-mono text-xs text-cyan-300 hover:text-white border-cyan-500/40"
          leftIcon={copiedPublicLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copiedPublicLink ? "COPIADO" : "COPIAR LINK"}
        </Button>
      </div>

      {/* Selector de Jornada / Día */}
      <div className="mb-6 p-3.5 rounded-2xl bg-surface-card border border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase font-mono text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Cargar en Jornada:
          </span>
          <Badge variant={isCurrentSelectionLocked() ? "rose" : "cyan"} size="sm">
            {getDayStatusText(selectedDay)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((num) => {
            const isSelected = selectedDay === num;
            const isLocked =
              (num === 1 && isDay1Disabled) ||
              (num === 2 && isDay2Disabled) ||
              (num === 3 && isDay3Disabled);

            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setSelectedDay(num);
                  setErrorMessage("");
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    : isLocked
                    ? "bg-surface-light text-gray-500 border border-white/5 opacity-60"
                    : "bg-surface text-gray-300 hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                <span className="flex items-center gap-1">
                  {isLocked && <Lock className="w-3 h-3 text-rose-400" />}
                  DÍA {num}
                </span>
                <span className="text-[10px] font-normal opacity-80">
                  {num === 1
                    ? j1?.status === "CERRADA"
                      ? "Cerrado"
                      : "Día 1"
                    : num === 2
                    ? j1?.status !== "CERRADA"
                      ? "Bloqueado"
                      : j2?.status === "CERRADA"
                      ? "Cerrado"
                      : "Día 2"
                    : j2?.status !== "CERRADA"
                    ? "Bloqueado"
                    : j3?.status === "CERRADA"
                    ? "Cerrado"
                    : "Día 3"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success alert banner */}
      {successBanner && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-extrabold text-white uppercase tracking-wider font-mono">
              ✓ PARTICIPANTE REGISTRADO
            </p>
            <p className="text-emerald-300 mt-0.5">
              <strong>{successBanner.name}</strong> (@{successBanner.ig}) en <strong>{successBanner.jornada}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="rounded-2xl bg-[#0e1118]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre completo */}
          <Input
            ref={fullNameRef}
            label="Nombre Completo"
            placeholder="Ej: Juan Pérez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            disabled={isSubmitting || isCurrentSelectionLocked()}
            required
            autoComplete="name"
          />

          {/* Instagram */}
          <Input
            label="Usuario de Instagram"
            placeholder="usuario (sin @)"
            prefixText="@"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            disabled={isSubmitting || isCurrentSelectionLocked()}
            required
            autoComplete="off"
            autoCapitalize="none"
          />

          {/* Celular */}
          <Input
            label="Número de Celular"
            placeholder="Ej: +54 9 11 1234-5678"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            disabled={isSubmitting || isCurrentSelectionLocked()}
            required
            autoComplete="tel"
          />

          {/* Checkbox confirmación */}
          <div className="p-4 rounded-xl bg-surface-light/70 border border-white/10">
            <Checkbox
              checked={followsInstagram}
              onChange={setFollowsInstagram}
              disabled={isSubmitting || isCurrentSelectionLocked()}
              label={
                <span className="text-xs sm:text-sm font-medium">
                  Confirmo que el participante sigue nuestra cuenta oficial de Instagram.
                </span>
              }
            />
          </div>

          {/* Mensaje de error / advertencia de bloqueo */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isCurrentSelectionLocked() && !errorMessage && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                {selectedDay === 2
                  ? "Para cargar en el Día 2, primero debe cerrarse el Día 1 en PARTICIPANTES."
                  : selectedDay === 3
                  ? "Para cargar en el Día 3, primero debe cerrarse el Día 2 en PARTICIPANTES."
                  : "Este día ya fue cerrado."}
              </span>
            </div>
          )}

          {/* Botón grande */}
          <Button
            type="submit"
            variant="glow"
            size="xl"
            disabled={isSubmitting || isCurrentSelectionLocked()}
            isLoading={isSubmitting}
            className="w-full text-base sm:text-lg"
          >
            {isSubmitting ? "REGISTRANDO..." : `REGISTRAR PARTICIPANTE (DÍA ${selectedDay})`}
          </Button>
        </form>
      </div>
    </div>
  );
}
