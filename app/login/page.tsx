"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Complete todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Credenciales incorrectas.");
        toastError("Error de acceso", data.error || "Credenciales incorrectas.");
        setIsLoading(false);
        return;
      }

      toastSuccess("Bienvenido/a", `Sesión iniciada como ${data.user.name}`);
      router.push("/captacion");
      router.refresh();
    } catch {
      setErrorMsg("Error de conexión al servidor.");
      toastError("Error", "No se pudo conectar con el servidor.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[#07090e]">
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[20%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header Branding with Official Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl p-2 bg-[#12151f] border border-cyan-500/30 shadow-[0_0_35px_rgba(0,229,255,0.25)] mb-4">
            <img
              src="/logo.png"
              alt="Forthing Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
            EXPO AUTO CHINO <span className="text-cyan-400">2026</span>
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-widest text-gray-400 uppercase font-mono">
            SISTEMA DE CAPTACIÓN & SORTEO
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            SORTEO MAR DE LAS PAMPAS • FORTHING
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-[#0f121a]/95 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl shadow-black/90">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email de Usuario"
              type="email"
              placeholder="usuario@forthing.com.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-cyan-400" />}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-cyan-400" />}
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm font-bold mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              INGRESAR
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}


