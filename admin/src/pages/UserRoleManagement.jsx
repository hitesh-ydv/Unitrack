import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  User,
  Mail,
  Shield,
  Check,
  CheckCircle2,
  Info,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { userService } from "../services/userService";
import { useToast } from "../context/ToastContext";

export const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Dispatcher",
    department: "Control Room Operations",
    phone: "+91 98100 00000",
    status: "active",
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, roleData] = await Promise.all([
        userService.getAll(),
        userService.getRolesAndPermissions(),
      ]);
      setUsers(userData);
      setRoles(roleData);
    } catch {
      toast.error("Error", "Failed to load user records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "Dispatcher",
      department: "Control Room Operations",
      phone: "+91 98100 00000",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone || "+91 98100 00000",
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning("Validation Error", "Please provide user name and email.");
      return;
    }

    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        toast.success("User Updated", `${formData.name}'s account updated.`);
      } else {
        await userService.create(formData);
        toast.success("User Created", `${formData.name} invited as ${formData.role}.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Could not save user.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.delete(deleteTarget.id);
      toast.success("Deleted", `${deleteTarget.name} profile removed.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: "Staff Member",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
            {val.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-white block text-xs">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      key: "department",
      sortable: true,
      render: (val) => <span className="text-slate-300 text-xs">{val}</span>,
    },
    {
      header: "Assigned Role",
      key: "role",
      sortable: true,
      render: (val) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {val}
        </span>
      ),
    },
    {
      header: "Last Session",
      key: "lastLogin",
      sortable: true,
      render: (val) => <span className="text-slate-400 text-xs font-mono">{val}</span>,
    },
    {
      header: "Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">User & Role Permission Administration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure transit dispatchers, depot managers, conductors, and enforce role-based access control.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Security Architecture Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-0.5">
            Permission-Aware Navigation & Backend Enforced Security
          </strong>
          <span>
            This admin panel dynamically filters routes and UI controls according to the assigned role. Note: In production, backend Node.js controllers must validate JSON Web Tokens and enforce RBAC at the API layer for all database queries and actions.
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search staff member, email or department..."
        csvFilename="transit_users_roster.csv"
      />

      {/* Role Permission Matrix Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1">Access Control & Role Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">Privilege mapping for transit system roles</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div
              key={r.role}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{r.role}</h4>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{r.description}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Permissions Included:
                </span>
                {r.permissions.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : "Create System Staff Account"}
        subtitle="Grant console privileges and assign university organizational unit."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Arvind Chawla"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">University Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@apex.edu"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Control Room Operations"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Super Admin">Super Admin (Full Privileges)</option>
                <option value="Fleet Manager">Fleet Manager (Maintenance & Depot)</option>
                <option value="Dispatcher">Dispatcher (Trips & SOS)</option>
                <option value="Conductor">Conductor (QR Attendance Scan)</option>
                <option value="Viewer">Viewer (Read-Only)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
            >
              {editingUser ? "Save User Profile" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={`Revoke account for ${deleteTarget?.name}?`}
        message={`Are you sure you want to deactivate ${deleteTarget?.name} (${deleteTarget?.role})?`}
        confirmLabel="Deactivate Account"
        type="danger"
      />
    </div>
  );
};
