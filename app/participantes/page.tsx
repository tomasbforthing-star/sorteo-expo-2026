"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Lock,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Download,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
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
  promotoraName?: string;
  promotoraEmail?: string;
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

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
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
  const [isExporting, setIsExporting] = useState(false);

  // Close Altas Modal States
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccessData, setCloseSuccessData] = useState<{
    jornadaName: string;
    count: number;
  } | null>(null);

  // Delete Participant Modal States (Admin only)
  const [participantToDelete, setParticipantToDelete] = useState<ParticipantItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.user) setCurrentUser(data.user);
      }
    } catch {
      console.error("Error fetching current user");
    }
  };

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
    fetchCurrentUser();
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

  // Exportar a Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      if (selectedDay !== "all") params.set("dayNumber", selectedDay);
      if (search) params.set("search", search);

      const res = await fetch(`/api/participantes?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener datos");

      const data = await res.json();
      const exportList: ParticipantItem[] = data.participants || [];

      if (exportList.length === 0) {
        toastError("Exportación", "No hay participantes para exportar con el filtro actual.");
        setIsExporting(false);
        return;
      }

      const rows = exportList.map((p, idx) => ({
        "#": idx + 1,
        "Nombre y Apellido": p.fullName,
        "Instagram": `@${p.instagram}`,
        "Celular": p.phone,
        "Jornada": p.jornadaName,
        "Cargado Por": p.promotoraName || p.promotoraEmail || "Admin",
        "Fecha": formatDate(p.createdAt),
        "Hora": formatTime(p.createdAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column width
      const colWidths = [
        { wch: 6 },
        { wch: 28 },
        { wch: 22 },
        { wch: 18 },
        { wch: 12 },
        { wch: 24 },
        { wch: 14 },
        { wch: 12 },
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes");

      const filterTag = selectedDay === "all" ? "Todos" : `Dia_${selectedDay}`;
      const fileName = `Participantes_ExpoChina2026_${filterTag}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toastSuccess("Exportación Exitosa", `Se descargó el archivo ${fileName} con ${exportList.length} registros.`);
    } catch {
      toastError("Error", "Ocurrió un problema al exportar a Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // Confirmar y eliminar participante
  const handleConfirmDeleteParticipant = async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/participantes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: participantToDelete.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError("Error al eliminar", data.error || "No se pudo borrar el participante.");
        setIsDeleting(false);
        return;
      }

      toastSuccess(
        "Participante Eliminado",
        `${participantToDelete.fullName} (@${participantToDelete.instagram}) fue eliminado.`
      );
      setParticipantToDelete(null);
      fetchStats();
      fetchParticipants();
    } catch {
      toastError("Error", "Error de red al intentar eliminar.");
    } finally {
      setIsDeleting(false);
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
            disabled={!stats.activeJornada || !isAdmin}
            onClick={() => setIsCloseModalOpen(true)}
            className="w-full text-sm font-bold"
            leftIcon={<Lock className="w-4 h-4" />}
          >
            CERRAR ALTAS DEL DÍA
          </Button>
        </div>
      </div>

      {/* Filter, Search Bar & Excel Export */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-2xl justify-end">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="w-full sm:flex-1">
              <Input
                placeholder="Buscar por Nombre, @instagram o Celular..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </form>

            {/* Export Excel Button (Admin or any user) */}
            <Button
              variant="glow"
              size="md"
              onClick={handleExportExcel}
              isLoading={isExporting}
              className="w-full sm:w-auto shrink-0 font-bold"
              leftIcon={<Download className="w-4 h-4" />}
            >
              EXPORTAR EXCEL
            </Button>
          </div>
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
                  {isAdmin && <th className="px-6 py-4 font-bold text-right">ACCIONES</th>}
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
                    {isAdmin && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setParticipantToDelete(p)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 h-8 w-8"
                          title="Eliminar participante (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
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

      {/* Confirmation Modal: ELIMINAR PARTICIPANTE (ADMIN) */}
      <Modal
        isOpen={participantToDelete !== null}
        onClose={() => !isDeleting && setParticipantToDelete(null)}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-4">
            <Trash2 className="h-8 w-8" />
          </div>

          <h3 className="text-2xl font-black text-white font-mono uppercase">
            ELIMINAR PARTICIPANTE
          </h3>

          <p className="text-sm text-gray-300 mt-2">
            ¿Estás seguro de que deseas eliminar este participante?
          </p>

          {participantToDelete && (
            <div className="my-4 p-4 rounded-xl bg-surface-light border border-white/10 w-full text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Nombre:</span>
                <span className="text-xs font-bold text-white">{participantToDelete.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Instagram:</span>
                <span className="text-xs font-mono font-bold text-cyan-400">@{participantToDelete.instagram}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Celular:</span>
                <span className="text-xs font-mono text-gray-300">{participantToDelete.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Jornada:</span>
                <span className="text-xs font-mono text-purple-300">{participantToDelete.jornadaName}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Esta acción no se puede deshacer y quedará registrada en el módulo de auditoría.</span>
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setParticipantToDelete(null)}
              disabled={isDeleting}
              className="flex-1"
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteParticipant}
              isLoading={isDeleting}
              className="flex-1 font-bold"
            >
              ELIMINAR
            </Button>
          </div>
        </div>
      </Modal>

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

