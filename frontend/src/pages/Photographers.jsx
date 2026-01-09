import React, { useEffect, useMemo, useState } from "react";
import { usePhotographer } from "../hooks/usePhotographer";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { Plus, Trash2, Pencil, Loader2, Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const Photographer = () => {
  const {
    photographers,
    loading,
    error,
    fetchPhotographers,
    addPhotographer,
    deletePhotographer,
    editPhotographer,
  } = usePhotographer();
  const { role } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (role && role !== "admin") {
      navigate("/notfound", { replace: true });
    }
  }, [role, navigate]);

  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [formErrors, setFormErrors] = useState({});

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [editErrors, setEditErrors] = useState({});

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", phone: "" });
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password is required";
    if (!form.phone) errs.phone = "Phone is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    await addPhotographer({ ...form });
    setIsOpen(false);
    resetForm();
  };

  const openEdit = (p) => {
    const id = p?._id || p?.id;
    if (!id) return;
    setEditingId(id);
    setEditForm({
      name: p?.name || "",
      email: p?.email || "",
      password: "",
      phone: p?.phone || "",
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const validateEdit = () => {
    const errs = {};
    if (!editForm.name) errs.name = "Name is required";
    if (!editForm.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(editForm.email)) errs.email = "Invalid email";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onUpdate = async () => {
    if (!validateEdit()) return;
    if (!editingId) return;
    const { name, email, phone, password } = editForm;
    const body = { name, email, phone };
    if (password) body.password = password;
    await editPhotographer(editingId, body);
    setIsEditOpen(false);
    setEditingId(null);
  };

  const actions = (
    <>
      <button
        onClick={() => setIsOpen(false)}
        className="inline-flex justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted border border-input cursor-pointer"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer ${
          loading ? "bg-muted" : "bg-primary hover:bg-primary/90"
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />Saving...
          </span>
        ) : (
          "Save"
        )}
      </button>
    </>
  );

  const renderRows = useMemo(() => {
    return (photographers || []).map((p) => {
      const id = p?._id || p?.id;
      return (
        <TableRow key={id} className="hover:bg-muted/50">
          <TableCell>{p?.name || "-"}</TableCell>
          <TableCell>{p?.email || "-"}</TableCell>
          <TableCell>{p?.phone || "-"}</TableCell>
          <TableCell className="relative group">
            <div className="flex items-center">
              <span className="font-mono">
                {typeof p?.password === 'string' && p.password.length > 0 
                  ? visiblePasswords[id]
                    ? p.password
                    : '•'.repeat(p.password.length > 5 ? 8 : p.password.length)
                  : "-"}
              </span>
              {typeof p?.password === 'string' && p.password.length > 0 && (
                <button
                  type="button"
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisiblePasswords(prev => ({
                      ...prev,
                      [id]: !prev[id]
                    }));
                  }}
                >
                  {visiblePasswords[id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <button
              onClick={() => openEdit(p)}
              className="inline-flex items-center gap-1 text-primary cursor-pointer mr-3"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => id && deletePhotographer(id)}
              className="inline-flex items-center gap-1 text-destructive cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </TableCell>
        </TableRow>
      );
    });
  }, [photographers, deletePhotographer]);

  if (role && role !== "admin") return null;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Photographers</h1>
          <p className="text-muted-foreground text-sm">Manage photographers in your workspace</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-medium shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Photographer
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-12 text-center">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : photographers?.length ? (
                  renderRows
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      No photographers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Photographer Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Add Photographer"
        actions={actions}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["name", "email", "password", "phone"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-foreground mb-1 capitalize">
                {field}
              </label>
              <div className="relative">
                <input
                  type={field === "password" ? (showPassword ? "text" : "password") : field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className={`w-full rounded-lg border ${
                    formErrors[field] ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-ring`}
                  placeholder={
                    field === "password"
                      ? "••••••••"
                      : field === "email"
                      ? "you@example.com"
                      : field === "phone"
                      ? "03xx-xxxxxxx"
                      : "John Doe"
                  }
                />
                {field === "password" && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              {formErrors[field] && (
                <p className="mt-1 text-xs text-destructive">{formErrors[field]}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Edit Photographer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingId(null);
          setEditErrors({});
        }}
        title="Edit Photographer"
        actions={
          <>
            <button
              onClick={() => {
                setIsEditOpen(false);
                setEditingId(null);
              }}
              className="inline-flex justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted border border-input cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onUpdate}
              disabled={loading}
              className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer ${
                loading ? "bg-muted" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update"
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["name", "email", "password", "phone"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-foreground mb-1 capitalize">
                {field} {field === "password" && "(optional)"}
              </label>
              <div className="relative">
                <input
                  type={field === "password" ? (showEditPassword ? "text" : "password") : field === "email" ? "email" : "text"}
                  value={editForm[field]}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  className={`w-full rounded-lg border ${
                    editErrors[field] ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-ring`}
                  placeholder={
                    field === "password"
                      ? "Leave empty to keep current password"
                      : field === "email"
                      ? "you@example.com"
                      : field === "phone"
                      ? "03xx-xxxxxxx"
                      : "John Doe"
                  }
                />
                {field === "password" && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              {editErrors[field] && (
                <p className="mt-1 text-xs text-destructive">{editErrors[field]}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Photographer;
