"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/ToastContext";
import { formatDate, formatTime } from "@/lib/utils";

interface ParticipantItem {
  id: string;
  fullName: string;
  instagram: string;
  phone: string;
  jornadaName: string;
  jornadaNumber: number;
  createdAt: string;
}

interface SummaryStats {
  totalParticipants: number;
  todayParticipants: number;
  day1Count: number;
  day2Count: number;
  day3Count: number;
  activeJornada: {
    id: string;
    name: string;
    number: number;
    count: number;
  } | null;
}

export default function ParticipantesPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalParticipants: 0,
    todayParticipants: 0,
    day1Count: 0,
    day2Count: 0,
    day3Count: 0,
    activeJornada: null,
  });

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("all"); // "all", "1", "2", "3"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Close Altas Modal States
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccessData, setCloseSuccessData] = useState<{
    jornadaName: string;
    count: number;
  } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalParticipants: data.stats?.totalParticipants || 0,
          todayParticipants: data.stats?.participantsToday || 0,
          day1Count: data.stats?.day1Count || 0,
          day2Count: data.stats?.day2Count || 0,
          day3Count: data.stats?.day3Count || 0,
          activeJornada: data.stats?.activeJornada || null,
        });
      }
    } catch {
      console.error("Error loading stats");
    }
  };

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedDay !== "all") params.set("dayNumber", selectedDay);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/participantes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error("Error fetching participants:", e);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedDay, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchParticipants();
  };

  const handleConfirmCloseAltas = async () => {
    if (!stats.activeJornada) return;
    setIsClosing(true);

    try {
      const res = await fetch("/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jornadaId: stats.activeJornada.id,
          action: "CLOSE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError("Error", data.error || "No se pudo cerrar la jornada.");
        setIsClosing(false);
        return;
      }

      setCloseSuccessData({
        jornadaName: stats.activeJornada.name,
        count: stats.activeJornada.count,
      });

      setIsCloseModalOpen(false);
      toastSuccess("Cierre Completado", "Los participantes fueron incorporados a la Base Master.");
      fetchStats();
      fetchParticipants();
    } catch {
      toastError("Error", "Error de red.");
    } finally {
      setIsClosing(false);
    }
  };

  // Dinámico según el filtro seleccionado
  const getSelectedDayIndicatorTitle = () => {
    if (selectedDay === "1") return "PARTICIPANTES DÍA 1";
    if (selectedDay === "2") return "PARTICIPANTES DÍA 2";
    if (selectedDay === "3") return "PARTICIPANTES DÍA 3";
    return "TOTAL PARTICIPANTES";
  };

  const getSelectedDayIndicatorValue = () => {
    if (selectedDay === "1") return stats.day1Count;
    if (selectedDay === "2") return stats.day2Count;
    if (selectedDay === "3") return stats.day3Count;
    return stats.totalParticipants;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Metrics Cards & Cierre de Altas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Indicador Dinámico según filtro */}
        <div className="p-5 rounded-2xl bg-surface-card border border-cyan-500/40 shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
            {getSelectedDayIndicatorTitle()}
          </p>
          <p className="text-4xl font-black font-mono text-cyan-400 mt-1">
            {getSelectedDayIndicatorValue().toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
            PARTICIPANTES DE HOY
          </p>
          <p className="text-4xl font-black font-mono text-emerald-400 mt-1">
            {stats.todayParticipants.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
            DÍA ACTUAL
          </p>
          <p className="text-2xl font-black font-mono text-white mt-2">
            {stats.activeJornada ? (
              <span className="text-cyan-300">{stats.activeJornada.name}</span>
            ) : (
              <span className="text-rose-400">JORNADA CERRADA</span>
            )}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-white/10 flex items-center justify-center">
          <Button
            variant="danger"
            size="lg"
            disabled={!stats.activeJornada}
            onClick={() => setIsCloseModalOpen(true)}
            className="w-full text-sm font-bold"
            leftIcon={<Lock className="w-4 h-4" />}
          >
            CERRAR ALTAS DEL DÍA
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter tabs con conteos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { label: "TODOS", value: "all", count: stats.totalParticipants },
              { label: "DÍA 1", value: "1", count: stats.day1Count },
              { label: "DÍA 2", value: "2", count: stats.day2Count },
              { label: "DÍA 3", value: "3", count: stats.day3Count },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedDay(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedDay === tab.value
                    ? "bg-primary text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                    : "bg-surface-light text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    selectedDay === tab.value ? "bg-black/20 text-black font-extrabold" : "bg-white/10 text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por Nombre, @instagram o Celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </form>
        </div>
      </Card>

      {/* Participants Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <Loading text="Cargando participantes..." />
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-300">
              No se encontraron participantes
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Probá modificando el filtro de día o término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1118] text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">NOMBRE</th>
                  <th className="px-6 py-4 font-bold">INSTAGRAM</th>
                  <th className="px-6 py-4 font-bold">CELULAR</th>
                  <th className="px-6 py-4 font-bold">DÍA</th>
                  <th className="px-6 py-4 font-bold">FECHA / HORA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {p.fullName}
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                      @{p.instagram}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300 whitespace-nowrap">
                      {p.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="purple" size="sm">
                        {p.jornadaName}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                      {formatDate(p.createdAt)} {formatTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0c0e15]">
            <span className="text-xs text-gray-400 font-mono">
              Página {page} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal: CERRAR ALTAS */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => !isClosing && setIsCloseModalOpen(false)}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-4">
            <ShieldAlert className="h-9 w-9 stroke-[2.5]" />
          </div>

          <h3 className="text-2xl font-black text-white font-mono uppercase">
            CERRAR ALTAS
          </h3>

          <p className="text-sm text-gray-300 mt-2">
            Estás por cerrar las altas del día.
          </p>

          <div className="my-4 p-4 rounded-xl bg-surface-light border border-white/10 w-full text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              Se han captado
            </p>
            <p className="text-4xl font-black text-cyan-400 font-mono my-1">
              {stats.activeJornada?.count || 0}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              participantes
            </p>
          </div>

          <div className="flex items-center gap-3 w-full mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCloseModalOpen(false)}
              disabled={isClosing}
              className="flex-1"
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmCloseAltas}
              isLoading={isClosing}
              className="flex-1 font-bold"
            >
              CERRAR ALTAS
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal: CIERRE COMPLETADO */}
      <Modal
        isOpen={closeSuccessData !== null}
        onClose={() => setCloseSuccessData(null)}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
            <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
          </div>

          <h3 className="text-2xl font-black text-white font-mono uppercase">
            ✓ CIERRE COMPLETADO
          </h3>

          <div className="my-4 p-4 rounded-2xl bg-[#0c161d] border border-cyan-500/40 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
              SE HAN CAPTADO
            </p>
            <p className="text-5xl font-black text-cyan-400 font-mono my-2">
              {closeSuccessData?.count}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
              USUARIOS
            </p>
          </div>

          <p className="text-sm text-emerald-300 font-medium mb-6">
            Los participantes de esa jornada quedan habilitados para el sorteo.
          </p>

          <Button
            variant="glow"
            size="lg"
            onClick={() => setCloseSuccessData(null)}
            className="w-full"
          >
            ENTENDIDO
          </Button>
        </div>
      </Modal>
    </div>
  );
}
