"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Calendar,
  User,
  Shield,
  Trash2,
  UserPlus,
  Lock,
  Trophy,
  LogIn,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/ToastContext";
import { formatDate, formatTime } from "@/lib/utils";

interface AuditItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userEmail: string;
  userName: string;
  userRole: string;
  details: string | null;
  createdAt: string;
}

interface AuditMetrics {
  total: number;
  createdCount: number;
  deletedCount: number;
  closedCount: number;
  sorteoCount: number;
  loginCount: number;
}

const ACTION_FILTERS = [
  { label: "TODOS", value: "ALL" },
  { label: "ALTAS", value: "PARTICIPANTE_CREATED" },
  { label: "ELIMINACIONES", value: "PARTICIPANTE_DELETED" },
  { label: "CIERRES DE DÍA", value: "JORNADA_CLOSED" },
  { label: "SORTEOS", value: "SORTEO_CREATED" },
  { label: "LOGINS", value: "LOGIN" },
];

export default function AuditoriaPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    total: 0,
    createdCount: 0,
    deletedCount: 0,
    closedCount: 0,
    sorteoCount: 0,
    loginCount: 0,
  });

  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Current User to verify Admin Role
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          if (data.user.role !== "ADMIN") {
            toastError("Acceso denegado", "Módulo exclusivo para administradores.");
            router.push("/captacion");
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => {});
  }, [router, toastError]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAction !== "ALL") params.set("action", selectedAction);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/auditoria?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      } else if (res.status === 403) {
        toastError("No autorizado", "Requiere permisos de administrador.");
      }
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, search, page, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Human-friendly description parser
  const renderDetailDescription = (log: AuditItem) => {
    let parsed: any = null;
    try {
      if (log.details) {
        parsed = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
      }
    } catch {
      return <span>{log.details || "Sin detalles adicionales"}</span>;
    }

    if (!parsed) return <span className="text-gray-500">Sin datos adicionales</span>;

    switch (log.action) {
      case "PARTICIPANTE_CREATED":
        return (
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-400">Registró a </span>
              <span className="font-bold text-white">{parsed.fullName}</span>
              <span className="font-mono text-cyan-400 ml-1.5 font-bold">(@{parsed.instagram})</span>
            </div>
            {parsed.jornada && (
              <div className="text-[11px] text-gray-400 font-mono">
                Jornada: <span className="text-purple-300 font-bold">{parsed.jornada}</span>
              </div>
            )}
          </div>
        );

      case "PARTICIPANTE_DELETED":
        return (
          <div className="space-y-0.5">
            <div>
              <span className="text-rose-400 font-semibold">Eliminó participante: </span>
              <span className="font-bold text-white">{parsed.participantName}</span>
              <span className="font-mono text-rose-300 ml-1.5 font-bold">(@{parsed.instagram})</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              Teléfono: {parsed.phone} • Jornada: {parsed.jornada} • Cargado originalmente por: {parsed.cargadoPor || "N/A"}
            </div>
          </div>
        );

      case "JORNADA_CLOSED":
        return (
          <div>
            <span className="text-amber-400 font-semibold">Cerró altas del día: </span>
            <span className="font-bold text-white">{parsed.jornadaName}</span>
            <span className="text-gray-400 ml-2">
              (Total captados: <span className="text-cyan-400 font-bold">{parsed.participantesCaptados}</span>)
            </span>
          </div>
        );

      case "JORNADA_OPENED":
        return (
          <div>
            <span className="text-sky-400 font-semibold">Abrió altas del día: </span>
            <span className="font-bold text-white">{parsed.jornadaName}</span>
          </div>
        );

      case "SORTEO_CREATED":
        return (
          <div className="space-y-1">
            <div>
              <span className="text-purple-400 font-semibold">Ejecutó sorteo oficial </span>
              <span className="text-gray-300">
                (Universo habilitado: <span className="font-bold text-white">{parsed.totalEligible}</span>)
              </span>
            </div>
            {parsed.winners && (
              <div className="text-[11px] text-emerald-300 font-mono">
                Ganadores: {parsed.winners.map((w: any) => `#${w.pos} @${w.ig}`).join(", ")}
              </div>
            )}
          </div>
        );

      case "LOGIN":
        return (
          <span className="text-gray-300">
            Inicio de sesión exitoso ({parsed.role || log.userRole})
          </span>
        );

      default:
        return <span>{typeof parsed === "object" ? JSON.stringify(parsed) : String(parsed)}</span>;
    }
  };

  // Badge for Action Type
  const renderActionBadge = (action: string) => {
    switch (action) {
      case "PARTICIPANTE_CREATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold">
            <UserPlus className="w-3 h-3" />
            ALTA
          </span>
        );
      case "PARTICIPANTE_DELETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-mono font-bold">
            <Trash2 className="w-3 h-3" />
            ELIMINACIÓN
          </span>
        );
      case "JORNADA_CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-mono font-bold">
            <Lock className="w-3 h-3" />
            CIERRE DÍA
          </span>
        );
      case "JORNADA_OPENED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-mono font-bold">
            <Calendar className="w-3 h-3" />
            APERTURA
          </span>
        );
      case "SORTEO_CREATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-mono font-bold">
            <Trophy className="w-3 h-3" />
            SORTEO
          </span>
        );
      case "LOGIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-mono font-bold">
            <LogIn className="w-3 h-3" />
            LOGIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[11px] font-mono font-bold">
            {action}
          </span>
        );
    }
  };

  // Exportar logs a Excel
  const handleExportAuditExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "1000");
      if (selectedAction !== "ALL") params.set("action", selectedAction);
      if (search) params.set("search", search);

      const res = await fetch(`/api/auditoria?${params.toString()}`);
      if (!res.ok) throw new Error("Error al consultar logs");

      const data = await res.json();
      const exportLogs: AuditItem[] = data.logs || [];

      if (exportLogs.length === 0) {
        toastError("Exportación", "No hay registros para exportar.");
        setIsExporting(false);
        return;
      }

      const rows = exportLogs.map((log, idx) => ({
        "#": idx + 1,
        "Fecha": formatDate(log.createdAt),
        "Hora": formatTime(log.createdAt),
        "Usuario": log.userName,
        "Email": log.userEmail,
        "Rol": log.userRole,
        "Acción": log.action,
        "Detalle": log.details || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");

      const fileName = `Auditoria_ExpoChina2026_${selectedAction}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toastSuccess("Exportación Exitosa", `Se descargaron ${exportLogs.length} registros de auditoría.`);
    } catch {
      toastError("Error", "No se pudo exportar la auditoría.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white font-mono tracking-wide uppercase">
              MÓDULO DE AUDITORÍA & TRAZABILIDAD
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Registro inmutable de todas las acciones operativas en Expo China 2026.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualizar
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={handleExportAuditExcel}
            isLoading={isExporting}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Exportar Auditoría
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
            TOTAL REGISTROS
          </p>
          <p className="text-3xl font-black font-mono text-cyan-400 mt-1">
            {metrics.total.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            ALTAS CARGADAS
          </p>
          <p className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {metrics.createdCount.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
            ELIMINACIONES
          </p>
          <p className="text-3xl font-black font-mono text-rose-400 mt-1">
            {metrics.deletedCount.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
            CIERRES DE DÍA
          </p>
          <p className="text-3xl font-black font-mono text-amber-400 mt-1">
            {metrics.closedCount.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
            SORTEOS
          </p>
          <p className="text-3xl font-black font-mono text-purple-400 mt-1">
            {metrics.sorteoCount.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {ACTION_FILTERS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedAction(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all shrink-0 cursor-pointer ${
                  selectedAction === tab.value
                    ? "bg-primary text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                    : "bg-surface-light text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:max-w-md">
            <Input
              placeholder="Buscar por usuario, email, detalle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </form>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <Loading text="Cargando registros de auditoría..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-300">
              No se encontraron registros de auditoría
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Probá modificando el filtro de acción o término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1118] text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">FECHA / HORA</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">USUARIO RESPONSABLE</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">ACCIÓN</th>
                  <th className="px-6 py-4 font-bold">DETALLE DE LA OPERACIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-400 text-[11px] whitespace-nowrap align-top">
                      {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="font-bold text-white">{log.userName}</div>
                      <div className="text-[11px] font-mono text-cyan-400">{log.userEmail}</div>
                      <div className="mt-0.5">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-semibold">
                          {log.userRole}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      {renderActionBadge(log.action)}
                    </td>

                    <td className="px-6 py-4 text-gray-300 align-top max-w-xl">
                      {renderDetailDescription(log)}
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
    </div>
  );
}
