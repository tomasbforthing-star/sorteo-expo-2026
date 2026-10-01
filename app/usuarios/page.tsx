"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  RefreshCw,
  Lock,
  Mail,
  User,
  ShieldAlert,
  AlertCircle,
  UserCheck,
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PROMOTORA" | "REPRESENTANTE";
  isActive: boolean;
  plainPassword?: string;
  participantsCount: number;
  createdAt: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; userId?: string } | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Visible passwords map { [userId]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Create / Edit
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "PROMOTORA" | "REPRESENTANTE">("PROMOTORA");
  const [formIsActive, setFormIsActive] = useState(true);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Password modal specific state
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Current User & Verify Admin Role
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 403) {
        toastError("No autorizado", "Requiere rol de Administrador.");
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle password visibility for specific row
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (text: string, id: string) => {
    if (!text || text === "••••••••") return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toastSuccess("Copiado", "Contraseña copiada al portapapeles.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("PROMOTORA");
    setFormIsActive(true);
    setShowFormPassword(false);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: UserItem) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormIsActive(u.isActive);
    setFormPassword("");
    setShowFormPassword(false);
    setIsEditModalOpen(true);
  };

  // Open Change Password Modal
  const handleOpenPasswordModal = (u: UserItem) => {
    setSelectedUser(u);
    setNewPassword("");
    setShowNewPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (u: UserItem) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      toastError("Campos incompletos", "Complete todos los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          isActive: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Error al crear", data.error || "No se pudo crear el usuario.");
        setIsSubmitting(false);
        return;
      }

      toastSuccess("Usuario Creado", `Usuario ${data.user.name} creado exitosamente.`);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch {
      toastError("Error", "Error de red al crear el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formName || !formEmail) {
      toastError("Campos incompletos", "Complete todos los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        id: selectedUser.id,
        name: formName,
        email: formEmail,
        role: formRole,
        isActive: formIsActive,
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Error al actualizar", data.error || "No se pudo actualizar el usuario.");
        setIsSubmitting(false);
        return;
      }

      toastSuccess("Usuario Actualizado", `Usuario ${data.user.name} actualizado exitosamente.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch {
      toastError("Error", "Error de red al actualizar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.trim().length < 4) {
      toastError("Contraseña inválida", "La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          password: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Error al cambiar contraseña", data.error || "No se pudo actualizar.");
        setIsSubmitting(false);
        return;
      }

      toastSuccess("Contraseña Modificada", `Se actualizó la contraseña de ${selectedUser.name}.`);
      setIsPasswordModalOpen(false);
      fetchUsers();
    } catch {
      toastError("Error", "Error de red al actualizar la contraseña.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Error al eliminar", data.error || "No se pudo eliminar el usuario.");
        setIsSubmitting(false);
        return;
      }

      toastSuccess("Usuario Eliminado", data.message || "Usuario eliminado correctamente.");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch {
      toastError("Error", "Error de red al eliminar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Users to Excel
  const handleExportUsersExcel = () => {
    setIsExporting(true);
    try {
      const rows = users.map((u, idx) => ({
        "#": idx + 1,
        "Nombre y Apellido": u.name,
        "Email de Acceso": u.email,
        "Rol": u.role,
        "Contraseña Asignada": u.plainPassword || "N/A",
        "Estado": u.isActive ? "ACTIVO" : "INACTIVO",
        "Participantes Captados": u.participantsCount,
        "Fecha de Alta": formatDate(u.createdAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 32 },
        { wch: 14 },
        { wch: 20 },
        { wch: 12 },
        { wch: 22 },
        { wch: 16 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

      const fileName = `Usuarios_ExpoChina2026_${formatDate(new Date().toISOString()).replace(/\//g, "-")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toastSuccess("Exportación Exitosa", `Se descargó el archivo ${fileName} con ${users.length} usuarios.`);
    } catch {
      toastError("Error", "No se pudo exportar la lista de usuarios.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered users by search
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // Metrics
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;
  const representanteUsers = users.filter((u) => u.role === "REPRESENTANTE").length;
  const promotoraUsers = users.filter((u) => u.role === "PROMOTORA").length;
  const activeUsers = users.filter((u) => u.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white font-mono tracking-wide uppercase">
              GESTIÓN DE USUARIOS & CREDENCIALES
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Administración de promotoras, representantes, administradores y contraseñas de acceso.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchUsers()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualizar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportUsersExcel}
            isLoading={isExporting}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Exportar Excel
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={handleOpenCreateModal}
            className="font-bold"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            + NUEVO USUARIO
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
            TOTAL USUARIOS
          </p>
          <p className="text-3xl font-black font-mono text-cyan-400 mt-1">
            {totalUsers}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
            ADMINISTRADORES
          </p>
          <p className="text-3xl font-black font-mono text-amber-400 mt-1">
            {adminUsers}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
            REPRESENTANTES
          </p>
          <p className="text-3xl font-black font-mono text-purple-400 mt-1">
            {representanteUsers}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            PROMOTORAS
          </p>
          <p className="text-3xl font-black font-mono text-cyan-300 mt-1">
            {promotoraUsers}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/10 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            USUARIOS ACTIVOS
          </p>
          <p className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {activeUsers}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <Input
          placeholder="Buscar por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Users className="w-4 h-4" />}
        />
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <Loading text="Cargando usuarios..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-300">
              No se encontraron usuarios
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1118] text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">NOMBRE Y APELLIDO</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">EMAIL DE ACCESO</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">ROL</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">CONTRASEÑA</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">ESTADO</th>
                  <th className="px-6 py-4 font-bold whitespace-nowrap">PARTICIPANTES</th>
                  <th className="px-6 py-4 font-bold text-right whitespace-nowrap">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => {
                  const isPassVisible = visiblePasswords[u.id];
                  const passwordText = u.plainPassword || "••••••••";

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">Alta: {formatDate(u.createdAt)}</div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={u.role === "ADMIN" ? "amber" : u.role === "REPRESENTANTE" ? "purple" : "cyan"}
                          size="sm"
                        >
                          {u.role === "ADMIN" ? "ADMINISTRADOR" : u.role === "REPRESENTANTE" ? "REPRESENTANTE" : "PROMOTORA"}
                        </Badge>
                      </td>

                      {/* Password visualizer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 p-1.5 px-2.5 rounded-lg bg-[#0d1017] border border-white/10">
                          <span className="font-mono text-xs text-gray-200 min-w-[80px]">
                            {isPassVisible ? passwordText : "••••••••"}
                          </span>

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-gray-400 hover:text-white transition"
                            title={isPassVisible ? "Ocultar contraseña" : "Ver contraseña"}
                          >
                            {isPassVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {u.plainPassword && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(u.plainPassword || "", u.id)}
                              className="p-1 text-gray-400 hover:text-white transition"
                              title="Copiar contraseña"
                            >
                              {copiedId === u.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={u.isActive ? "emerald" : "rose"}
                          size="sm"
                        >
                          {u.isActive ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </td>

                      {/* Participants Count */}
                      <td className="px-6 py-4 font-mono font-bold text-gray-300 whitespace-nowrap">
                        {u.participantsCount}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPasswordModal(u)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-2 h-8 w-8"
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(u)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 h-8 w-8"
                          title="Modificar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteModal(u)}
                          disabled={u.id === currentUser?.userId}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 h-8 w-8 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === currentUser?.userId ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: CREAR NUEVO USUARIO */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        maxWidth="md"
      >
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-mono uppercase">
                CREAR NUEVO USUARIO
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Registra un nuevo usuario con credenciales de acceso.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <Input
              label="Nombre y Apellido"
              placeholder="Ej: Luana Trunzo"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-cyan-400" />}
              required
            />

            <Input
              label="Email de Acceso"
              type="email"
              placeholder="nombre.apellido@forthing.com.ar"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-cyan-400" />}
              required
            />

            <Input
              label="Contraseña"
              type={showFormPassword ? "text" : "password"}
              placeholder="Mínimo 4 caracteres"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-cyan-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowFormPassword((p) => !p)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-300 tracking-wider uppercase mb-1.5 font-mono">
                  ROL DEL USUARIO
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "ADMIN" | "PROMOTORA" | "REPRESENTANTE")}
                  className="w-full rounded-xl bg-[#131622] border border-white/15 px-3 py-3 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="PROMOTORA">PROMOTORA</option>
                  <option value="REPRESENTANTE">REPRESENTANTE</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 tracking-wider uppercase mb-1.5 font-mono">
                  ESTADO
                </label>
                <select
                  value={formIsActive ? "true" : "false"}
                  onChange={(e) => setFormIsActive(e.target.value === "true")}
                  className="w-full rounded-xl bg-[#131622] border border-white/15 px-3 py-3 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="true">ACTIVO</option>
                  <option value="false">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                CANCELAR
              </Button>

              <Button
                type="submit"
                variant="glow"
                isLoading={isSubmitting}
                className="flex-1 font-bold"
              >
                CREAR USUARIO
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: MODIFICAR USUARIO */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        maxWidth="md"
      >
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-mono uppercase">
                MODIFICAR USUARIO
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Actualiza los datos del usuario seleccionado.
              </p>
            </div>
          </div>

          <form onSubmit={handleEditUser} className="space-y-4 pt-2">
            <Input
              label="Nombre y Apellido"
              placeholder="Nombre"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-cyan-400" />}
              required
            />

            <Input
              label="Email de Acceso"
              type="email"
              placeholder="Email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-cyan-400" />}
              required
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-300 tracking-wider uppercase mb-1.5 font-mono">
                  ROL
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "ADMIN" | "PROMOTORA" | "REPRESENTANTE")}
                  className="w-full rounded-xl bg-[#131622] border border-white/15 px-3 py-3 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="PROMOTORA">PROMOTORA</option>
                  <option value="REPRESENTANTE">REPRESENTANTE</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 tracking-wider uppercase mb-1.5 font-mono">
                  ESTADO
                </label>
                <select
                  value={formIsActive ? "true" : "false"}
                  onChange={(e) => setFormIsActive(e.target.value === "true")}
                  className="w-full rounded-xl bg-[#131622] border border-white/15 px-3 py-3 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="true">ACTIVO</option>
                  <option value="false">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-light border border-white/10 space-y-2">
              <label className="block text-xs font-semibold text-gray-300 tracking-wider uppercase font-mono">
                NUEVA CONTRASEÑA (OPCIONAL)
              </label>
              <Input
                type={showFormPassword ? "text" : "password"}
                placeholder="Dejar en blanco para conservar la actual"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-amber-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowFormPassword((p) => !p)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                CANCELAR
              </Button>

              <Button
                type="submit"
                variant="glow"
                isLoading={isSubmitting}
                className="flex-1 font-bold"
              >
                GUARDAR CAMBIOS
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: CAMBIAR CONTRASEÑA DIRECTAMENTE */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => !isSubmitting && setIsPasswordModalOpen(false)}
        maxWidth="md"
      >
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-mono uppercase">
                CAMBIAR CONTRASEÑA
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Usuario: <strong className="text-white">{selectedUser?.name}</strong> ({selectedUser?.email})
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <Input
              label="Nueva Contraseña"
              type={showNewPassword ? "text" : "password"}
              placeholder="Ingrese la nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-amber-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                CANCELAR
              </Button>

              <Button
                type="submit"
                variant="glow"
                isLoading={isSubmitting}
                className="flex-1 font-bold"
              >
                ACTUALIZAR CONTRASEÑA
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: ELIMINAR USUARIO */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-4">
            <Trash2 className="h-8 w-8" />
          </div>

          <h3 className="text-2xl font-black text-white font-mono uppercase">
            ELIMINAR USUARIO
          </h3>

          <p className="text-sm text-gray-300 mt-2">
            ¿Estás seguro de que deseas eliminar a este usuario del sistema?
          </p>

          {selectedUser && (
            <div className="my-4 p-4 rounded-xl bg-surface-light border border-white/10 w-full text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Nombre:</span>
                <span className="text-xs font-bold text-white">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Email:</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Rol:</span>
                <span className="text-xs font-mono text-amber-300">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">Participantes Cargados:</span>
                <span className="text-xs font-mono text-emerald-300">{selectedUser.participantsCount}</span>
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
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isSubmitting}
              className="flex-1 font-bold"
            >
              ELIMINAR USUARIO
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
