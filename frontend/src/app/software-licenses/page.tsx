"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type LicenseStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "SUSPENDED";

type SoftwareLicense = {
  id: string;
  software_name: string;
  provider: string | null;
  license_type: string | null;
  license_quantity: number;
  start_date: string | null;
  expiry_date: string;
  cost: number | null;
  currency: string;
  status: LicenseStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_count: number;
  remaining_count: number;
};

type LicenseListResponse = {
  success: boolean;
  data: SoftwareLicense[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

type CreateLicenseRequest = {
  software_name: string;
  provider?: string;
  license_type?: string;
  license_quantity: number;
  start_date?: string;
  expiry_date: string;
  cost?: number;
  currency?: string;
};

type UpdateLicenseRequest = {
  software_name: string;
  provider?: string;
  license_type?: string;
  license_quantity: number;
  start_date?: string;
  expiry_date: string;
  cost?: number;
  currency?: string;
};

type LicenseMutationResponse = {
  success: boolean;
  data?: SoftwareLicense;
  error?: {
    code?: string;
    message?: string;
  };
};

type LicenseAssignment = {
  id: string;
  softwareLicenseId: string;
  coreUserId: string;
  assignedAt: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssignmentListResponse = {
  success: boolean;
  data: LicenseAssignment[];
  error?: {
    code?: string;
    message?: string;
  };
};

type AssignmentMutationResponse = {
  success: boolean;
  data?:
    | LicenseAssignment
    | {
        id: string;
        deleted: boolean;
      };
  error?: {
    code?: string;
    message?: string;
  };
};

type CurrentUserResponse = {
  id: string;
  email: string;
  coreRole: string;
  subsystemRole: string | null;
};

const STATUS_OPTIONS: Array<{
  value: "" | LicenseStatus;
  label: string;
}> = [
  { value: "", label: "ทุกสถานะ" },
  { value: "ACTIVE", label: "ใช้งานอยู่" },
  { value: "EXPIRING", label: "ใกล้หมดอายุ" },
  { value: "EXPIRED", label: "หมดอายุ" },
  { value: "SUSPENDED", label: "ระงับการใช้งาน" },
];

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function formatCost(value: number | null, currency: string) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("th-TH").format(value)} ${currency}`;
}

function getStatusLabel(status: LicenseStatus) {
  switch (status) {
    case "ACTIVE":
      return "ใช้งานอยู่";
    case "EXPIRING":
      return "ใกล้หมดอายุ";
    case "EXPIRED":
      return "หมดอายุ";
    case "SUSPENDED":
      return "ระงับการใช้งาน";
  }
}

function getStatusClass(status: LicenseStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-success-container text-on-success-container";
    case "EXPIRING":
      return "bg-warning-container text-on-warning-container";
    case "EXPIRED":
      return "bg-error-container text-on-error-container";
    case "SUSPENDED":
      return "bg-surface-container-high text-on-surface-variant";
  }
}

function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  const target = new URL("/auth/login", window.location.origin);
  target.searchParams.set("next", next || "/");
  window.location.assign(target.toString());
}

export default function SoftwareLicensesPage() {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [softwareName, setSoftwareName] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<"" | LicenseStatus>("");

  const [softwareNameInput, setSoftwareNameInput] = useState("");
  const [providerInput, setProviderInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subsystemRole, setSubsystemRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const canManageLicenses = subsystemRole === "LICENSE_ADMIN";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [createForm, setCreateForm] = useState({
    software_name: "",
    provider: "",
    license_type: "",
    license_quantity: "1",
    start_date: "",
    expiry_date: "",
    cost: "",
    currency: "THB",
  });

  const [editingLicense, setEditingLicense] =
    useState<SoftwareLicense | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [editForm, setEditForm] = useState({
    software_name: "",
    provider: "",
    license_type: "",
    license_quantity: "1",
    start_date: "",
    expiry_date: "",
    cost: "",
    currency: "THB",
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [assignmentLicense, setAssignmentLicense] =
    useState<SoftwareLicense | null>(null);
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentRemovingId, setAssignmentRemovingId] =
    useState<string | null>(null);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const fetchCurrentUser = useCallback(async () => {
    setRoleLoading(true);

    try {
      const response = await fetch("/api/v1/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        throw new Error("ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้");
      }

      const result = (await response.json()) as CurrentUserResponse;

      setSubsystemRole(result.subsystemRole);
    } catch {
      setSubsystemRole(null);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (softwareName.trim()) {
        params.set("software_name", softwareName.trim());
      }

      if (provider.trim()) {
        params.set("provider", provider.trim());
      }

      if (status) {
        params.set("status", status);
      }

      params.set("page", String(page));
      params.set("limit", "10");

      const response = await fetch(
        `/api/v1/software-licenses?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        throw new Error("ไม่สามารถโหลดรายการ Software License ได้");
      }

      const result = (await response.json()) as LicenseListResponse;

      if (!result.success) {
        throw new Error("ไม่สามารถโหลดรายการ Software License ได้");
      }

      setLicenses(result.data);
      setTotal(result.meta.total);
      setTotalPages(Math.max(result.meta.total_pages, 1));
    } catch (err) {
      setLicenses([]);
      setTotal(0);
      setTotalPages(1);
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      );
    } finally {
      setLoading(false);
    }
  }, [page, provider, softwareName, status]);

  useEffect(() => {
    // The role must be resolved once on mount to gate permissions for the page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLicenses();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchLicenses]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSoftwareName(softwareNameInput);
    setProvider(providerInput);
  }

  function handleStatusChange(value: "" | LicenseStatus) {
    setPage(1);
    setStatus(value);
  }

  function handleReset() {
    setSoftwareNameInput("");
    setProviderInput("");
    setSoftwareName("");
    setProvider("");
    setStatus("");
    setPage(1);
  }

  function handleCreateFormChange(
    field: keyof typeof createForm,
    value: string,
  ) {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetCreateForm() {
    setCreateForm({
      software_name: "",
      provider: "",
      license_type: "",
      license_quantity: "1",
      start_date: "",
      expiry_date: "",
      cost: "",
      currency: "THB",
    });
    setCreateError("");
  }

  function handleCloseCreateForm() {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    resetCreateForm();
  }

  async function handleCreateLicense(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setCreateError("");

    const softwareNameValue = createForm.software_name.trim();
    const licenseQuantity = Number(createForm.license_quantity);
    const cost = createForm.cost.trim()
      ? Number(createForm.cost)
      : undefined;

    if (!softwareNameValue) {
      setCreateError("กรุณาระบุชื่อ Software");
      return;
    }

    if (!Number.isInteger(licenseQuantity) || licenseQuantity < 1) {
      setCreateError("จำนวน License ต้องเป็นจำนวนเต็มอย่างน้อย 1");
      return;
    }

    if (!createForm.expiry_date) {
      setCreateError("กรุณาระบุวันหมดอายุ");
      return;
    }

    if (
      createForm.start_date &&
      createForm.expiry_date < createForm.start_date
    ) {
      setCreateError("วันหมดอายุต้องไม่น้อยกว่าวันเริ่มต้น");
      return;
    }

    if (
      cost !== undefined &&
      (!Number.isFinite(cost) || cost < 0)
    ) {
      setCreateError("ค่าใช้จ่ายต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    const payload: CreateLicenseRequest = {
      software_name: softwareNameValue,
      license_quantity: licenseQuantity,
      expiry_date: createForm.expiry_date,
    };

    if (createForm.provider.trim()) {
      payload.provider = createForm.provider.trim();
    }

    if (createForm.license_type.trim()) {
      payload.license_type = createForm.license_type.trim();
    }

    if (createForm.start_date) {
      payload.start_date = createForm.start_date;
    }

    if (cost !== undefined) {
      payload.cost = cost;
    }

    if (createForm.currency.trim()) {
      payload.currency = createForm.currency.trim().toUpperCase();
    }

    setCreating(true);

    try {
      const response = await fetch("/api/v1/software-licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result =
        (await response.json()) as LicenseMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถสร้าง Software License ได้",
        );
      }

      setShowCreateForm(false);
      resetCreateForm();
      setPage(1);

      if (page === 1) {
        await fetchLicenses();
      }
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการสร้าง Software License",
      );
    } finally {
      setCreating(false);
    }
  }

  async function openAssignment(license: SoftwareLicense) {
    if (!canManageLicenses) {
      return;
    }

    setAssignmentLicense(license);
    setAssignments([]);
    setAssignmentUserId("");
    setAssignmentError("");
    setAssignmentLoading(true);

    try {
      const response = await fetch(
        `/api/v1/software-licenses/${license.id}/assignments`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as AssignmentListResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถโหลดรายการ License Assignment ได้",
        );
      }

      setAssignments(result.data);
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลด License Assignment",
      );
    } finally {
      setAssignmentLoading(false);
    }
  }

  function closeAssignment() {
    if (assignmentSubmitting || assignmentRemovingId) {
      return;
    }

    setAssignmentLicense(null);
    setAssignments([]);
    setAssignmentUserId("");
    setAssignmentError("");
  }

  async function handleCreateAssignment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!assignmentLicense || !canManageLicenses) {
      return;
    }

    const coreUserId = assignmentUserId.trim();

    if (!coreUserId) {
      setAssignmentError("กรุณาระบุ Core User ID");
      return;
    }

    if (assignmentLicense.remaining_count <= 0) {
      setAssignmentError(
        "License เหลือไม่เพียงพอสำหรับการจัดสรร",
      );
      return;
    }

    setAssignmentError("");
    setAssignmentSubmitting(true);

    try {
      const response = await fetch(
        `/api/v1/software-licenses/${assignmentLicense.id}/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            core_user_id: coreUserId,
          }),
        },
      );

      const result =
        (await response.json()) as AssignmentMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถจัดสรร License ได้",
        );
      }

      setAssignmentUserId("");

      await fetchLicenses();

      const updatedLicense = licenses.find(
        (license) => license.id === assignmentLicense.id,
      );

      if (updatedLicense) {
        await openAssignment({
          ...updatedLicense,
          assigned_count: updatedLicense.assigned_count + 1,
          remaining_count: Math.max(
            updatedLicense.remaining_count - 1,
            0,
          ),
        });
      } else {
        await openAssignment(assignmentLicense);
      }
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการจัดสรร License",
      );
    } finally {
      setAssignmentSubmitting(false);
    }
  }

  async function handleRemoveAssignment(
    assignment: LicenseAssignment,
  ) {
    if (
      !assignmentLicense ||
      !canManageLicenses ||
      assignmentRemovingId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `ต้องการยกเลิกการจัดสรร License ให้ "${assignment.coreUserId}" ใช่หรือไม่?`,
    );

    if (!confirmed) {
      return;
    }

    setAssignmentError("");
    setAssignmentRemovingId(assignment.id);

    try {
      const response = await fetch(
        `/api/v1/software-licenses/${assignmentLicense.id}/assignments/${assignment.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as AssignmentMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถยกเลิกการจัดสรร License ได้",
        );
      }

      await fetchLicenses();

      const updatedLicense = licenses.find(
        (license) => license.id === assignmentLicense.id,
      );

      if (updatedLicense) {
        await openAssignment({
          ...updatedLicense,
          assigned_count: Math.max(
            updatedLicense.assigned_count - 1,
            0,
          ),
          remaining_count: Math.min(
            updatedLicense.remaining_count + 1,
            updatedLicense.license_quantity,
          ),
        });
      } else {
        await openAssignment(assignmentLicense);
      }
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการยกเลิกการจัดสรร License",
      );
    } finally {
      setAssignmentRemovingId(null);
    }
  }

  function openEditForm(license: SoftwareLicense) {
    if (!canManageLicenses) {
      return;
    }

    setDeleteError("");
    setUpdateError("");

    setEditingLicense(license);

    setEditForm({
      software_name: license.software_name,
      provider: license.provider ?? "",
      license_type: license.license_type ?? "",
      license_quantity: String(license.license_quantity),
      start_date: formatDateInput(license.start_date),
      expiry_date: formatDateInput(license.expiry_date),
      cost: license.cost === null ? "" : String(license.cost),
      currency: license.currency || "THB",
    });
  }

  function closeEditForm() {
    if (updating) {
      return;
    }

    setEditingLicense(null);
    setUpdateError("");
  }

  function handleEditFormChange(
    field: keyof typeof editForm,
    value: string,
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpdateLicense(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingLicense || !canManageLicenses) {
      return;
    }

    setUpdateError("");

    const softwareNameValue = editForm.software_name.trim();
    const licenseQuantity = Number(editForm.license_quantity);
    const cost = editForm.cost.trim()
      ? Number(editForm.cost)
      : undefined;

    if (!softwareNameValue) {
      setUpdateError("กรุณาระบุชื่อ Software");
      return;
    }

    if (!Number.isInteger(licenseQuantity) || licenseQuantity < 1) {
      setUpdateError("จำนวน License ต้องเป็นจำนวนเต็มอย่างน้อย 1");
      return;
    }

    if (licenseQuantity < editingLicense.assigned_count) {
      setUpdateError(
        `จำนวน License ต้องไม่น้อยกว่าจำนวนที่จัดสรรแล้ว (${editingLicense.assigned_count})`,
      );
      return;
    }

    if (!editForm.expiry_date) {
      setUpdateError("กรุณาระบุวันหมดอายุ");
      return;
    }

    if (
      editForm.start_date &&
      editForm.expiry_date < editForm.start_date
    ) {
      setUpdateError("วันหมดอายุต้องไม่น้อยกว่าวันเริ่มต้น");
      return;
    }

    if (
      cost !== undefined &&
      (!Number.isFinite(cost) || cost < 0)
    ) {
      setUpdateError("ค่าใช้จ่ายต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    const payload: UpdateLicenseRequest = {
      software_name: softwareNameValue,
      license_quantity: licenseQuantity,
      expiry_date: editForm.expiry_date,
    };

    if (editForm.provider.trim()) {
      payload.provider = editForm.provider.trim();
    }

    if (editForm.license_type.trim()) {
      payload.license_type = editForm.license_type.trim();
    }

    if (editForm.start_date) {
      payload.start_date = editForm.start_date;
    }

    if (cost !== undefined) {
      payload.cost = cost;
    }

    if (editForm.currency.trim()) {
      payload.currency = editForm.currency.trim().toUpperCase();
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `/api/v1/software-licenses/${editingLicense.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const result =
        (await response.json()) as LicenseMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถแก้ไข Software License ได้",
        );
      }

      setEditingLicense(null);
      setUpdateError("");

      await fetchLicenses();
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการแก้ไข Software License",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteLicense(license: SoftwareLicense) {
    if (deletingId || !canManageLicenses) {
      return;
    }

    const confirmed = window.confirm(
      `ต้องการลบ Software License "${license.software_name}" ใช่หรือไม่?\n\nข้อมูลจะถูกลบออกจากรายการ License`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeletingId(license.id);

    try {
      const response = await fetch(
        `/api/v1/software-licenses/${license.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as LicenseMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถลบ Software License ได้",
        );
      }

      if (licenses.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchLicenses();
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการลบ Software License",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (roleLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="rounded-2xl bg-surface-container-low p-8 text-center"
          aria-live="polite"
        >
          <p className="text-sm text-on-surface-variant">
            กำลังตรวจสอบสิทธิ์ผู้ใช้...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            ใบอนุญาตซอฟต์แวร์
          </h1>

          <p className="mt-1 text-sm text-on-surface-variant">
            จัดการ Software License และตรวจสอบจำนวนสิทธิ์การใช้งาน
          </p>
        </div>

        {canManageLicenses ? (
          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreateForm(true);
            }}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            + เพิ่ม Software License
          </button>
        ) : null}
      </div>

      {canManageLicenses && showCreateForm ? (
        <section className="mb-6 rounded-2xl bg-surface-container-low p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-on-surface">
              เพิ่ม Software License
            </h2>

            <p className="mt-1 text-sm text-on-surface-variant">
              กรอกข้อมูล Software License ที่ต้องการลงทะเบียน
            </p>
          </div>

          <form
            onSubmit={handleCreateLicense}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="create-software-name"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ชื่อ Software *
              </label>

              <input
                id="create-software-name"
                type="text"
                required
                value={createForm.software_name}
                onChange={(event) =>
                  handleCreateFormChange(
                    "software_name",
                    event.target.value,
                  )
                }
                placeholder="เช่น Microsoft Office"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-provider"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ผู้ให้บริการ
              </label>

              <input
                id="create-provider"
                type="text"
                value={createForm.provider}
                onChange={(event) =>
                  handleCreateFormChange(
                    "provider",
                    event.target.value,
                  )
                }
                placeholder="เช่น Microsoft"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-license-type"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ประเภท License
              </label>

              <input
                id="create-license-type"
                type="text"
                value={createForm.license_type}
                onChange={(event) =>
                  handleCreateFormChange(
                    "license_type",
                    event.target.value,
                  )
                }
                placeholder="เช่น Subscription"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-license-quantity"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                จำนวน License *
              </label>

              <input
                id="create-license-quantity"
                type="number"
                min="1"
                step="1"
                required
                value={createForm.license_quantity}
                onChange={(event) =>
                  handleCreateFormChange(
                    "license_quantity",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-start-date"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                วันที่เริ่มต้น
              </label>

              <input
                id="create-start-date"
                type="date"
                value={createForm.start_date}
                onChange={(event) =>
                  handleCreateFormChange(
                    "start_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-expiry-date"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                วันหมดอายุ *
              </label>

              <input
                id="create-expiry-date"
                type="date"
                required
                value={createForm.expiry_date}
                onChange={(event) =>
                  handleCreateFormChange(
                    "expiry_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-cost"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ค่าใช้จ่าย
              </label>

              <input
                id="create-cost"
                type="number"
                min="0"
                step="0.01"
                value={createForm.cost}
                onChange={(event) =>
                  handleCreateFormChange(
                    "cost",
                    event.target.value,
                  )
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="create-currency"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                สกุลเงิน
              </label>

              <input
                id="create-currency"
                type="text"
                maxLength={3}
                value={createForm.currency}
                onChange={(event) =>
                  handleCreateFormChange(
                    "currency",
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="THB"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm uppercase text-on-surface outline-none focus:border-primary"
              />
            </div>

            {createError ? (
              <div
                className="md:col-span-2 rounded-xl bg-error-container p-4"
                role="alert"
              >
                <p className="font-semibold text-on-error-container">
                  ไม่สามารถสร้าง Software License ได้
                </p>

                <p className="mt-1 text-sm text-on-error-container">
                  {createError}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end md:col-span-2">
              <button
                type="button"
                disabled={creating}
                onClick={handleCloseCreateForm}
                className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "กำลังบันทึก..."
                  : "บันทึก Software License"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {canManageLicenses && editingLicense ? (
        <section className="mb-6 rounded-2xl bg-surface-container-low p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-on-surface">
              แก้ไข Software License
            </h2>

            <p className="mt-1 text-sm text-on-surface-variant">
              แก้ไขข้อมูลของ {editingLicense.software_name}
            </p>
          </div>

          <form
            onSubmit={handleUpdateLicense}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="edit-software-name"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ชื่อ Software *
              </label>

              <input
                id="edit-software-name"
                type="text"
                required
                value={editForm.software_name}
                onChange={(event) =>
                  handleEditFormChange(
                    "software_name",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-provider"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ผู้ให้บริการ
              </label>

              <input
                id="edit-provider"
                type="text"
                value={editForm.provider}
                onChange={(event) =>
                  handleEditFormChange(
                    "provider",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-license-type"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ประเภท License
              </label>

              <input
                id="edit-license-type"
                type="text"
                value={editForm.license_type}
                onChange={(event) =>
                  handleEditFormChange(
                    "license_type",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-license-quantity"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                จำนวน License *
              </label>

              <input
                id="edit-license-quantity"
                type="number"
                min={editingLicense.assigned_count || 1}
                step="1"
                required
                value={editForm.license_quantity}
                onChange={(event) =>
                  handleEditFormChange(
                    "license_quantity",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />

              <p className="mt-1 text-xs text-on-surface-variant">
                จัดสรรแล้ว{" "}
                {formatNumber(editingLicense.assigned_count)} License
              </p>
            </div>

            <div>
              <label
                htmlFor="edit-start-date"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                วันที่เริ่มต้น
              </label>

              <input
                id="edit-start-date"
                type="date"
                value={editForm.start_date}
                onChange={(event) =>
                  handleEditFormChange(
                    "start_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-expiry-date"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                วันหมดอายุ *
              </label>

              <input
                id="edit-expiry-date"
                type="date"
                required
                value={editForm.expiry_date}
                onChange={(event) =>
                  handleEditFormChange(
                    "expiry_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-cost"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                ค่าใช้จ่าย
              </label>

              <input
                id="edit-cost"
                type="number"
                min="0"
                step="0.01"
                value={editForm.cost}
                onChange={(event) =>
                  handleEditFormChange(
                    "cost",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="edit-currency"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                สกุลเงิน
              </label>

              <input
                id="edit-currency"
                type="text"
                maxLength={3}
                value={editForm.currency}
                onChange={(event) =>
                  handleEditFormChange(
                    "currency",
                    event.target.value.toUpperCase(),
                  )
                }
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm uppercase text-on-surface outline-none focus:border-primary"
              />
            </div>

            {updateError ? (
              <div
                className="md:col-span-2 rounded-xl bg-error-container p-4"
                role="alert"
              >
                <p className="font-semibold text-on-error-container">
                  ไม่สามารถแก้ไข Software License ได้
                </p>

                <p className="mt-1 text-sm text-on-error-container">
                  {updateError}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end md:col-span-2">
              <button
                type="button"
                disabled={updating}
                onClick={closeEditForm}
                className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={updating}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "กำลังบันทึก..."
                  : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {canManageLicenses && assignmentLicense ? (
        <section className="mb-6 rounded-2xl bg-surface-container-low p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                จัดสรร License
              </h2>

              <p className="mt-1 text-sm text-on-surface-variant">
                {assignmentLicense.software_name}
              </p>

              <p className="mt-1 text-xs text-on-surface-variant">
                ใช้งานแล้ว{" "}
                {formatNumber(assignmentLicense.assigned_count)} /{" "}
                {formatNumber(assignmentLicense.license_quantity)}
                {" • "}
                เหลือ{" "}
                {formatNumber(assignmentLicense.remaining_count)}
              </p>
            </div>

            <button
              type="button"
              onClick={closeAssignment}
              disabled={
                assignmentSubmitting ||
                assignmentRemovingId !== null
              }
              className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ปิด
            </button>
          </div>

          <form
            onSubmit={handleCreateAssignment}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="assignment-core-user-id"
                className="mb-2 block text-sm font-semibold text-on-surface"
              >
                Core User ID *
              </label>

              <input
                id="assignment-core-user-id"
                type="text"
                required
                value={assignmentUserId}
                onChange={(event) =>
                  setAssignmentUserId(event.target.value)
                }
                placeholder="เช่น user-001"
                className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={
                assignmentSubmitting ||
                assignmentLicense.remaining_count <= 0
              }
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignmentSubmitting
                ? "กำลังจัดสรร..."
                : "จัดสรร License"}
            </button>
          </form>

          {assignmentError ? (
            <div
              className="mt-4 rounded-xl bg-error-container p-4"
              role="alert"
            >
              <p className="font-semibold text-on-error-container">
                ไม่สามารถดำเนินการ Assignment ได้
              </p>

              <p className="mt-1 text-sm text-on-error-container">
                {assignmentError}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <h3 className="font-semibold text-on-surface">
              ผู้ที่ได้รับ License
            </h3>

            {assignmentLoading ? (
              <div
                className="mt-3 rounded-xl bg-surface-container p-4"
                aria-live="polite"
              >
                <p className="text-sm text-on-surface-variant">
                  กำลังโหลดรายการผู้ใช้...
                </p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="mt-3 rounded-xl bg-surface-container p-4">
                <p className="text-sm text-on-surface-variant">
                  ยังไม่มีผู้ใช้ที่ได้รับ License นี้
                </p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-outline-variant">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-on-surface">
                        Core User ID
                      </th>

                      <th className="px-4 py-3 font-semibold text-on-surface">
                        วันที่จัดสรร
                      </th>

                      <th className="px-4 py-3 font-semibold text-on-surface">
                        จัดการ
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-4 py-3 text-on-surface">
                          {assignment.coreUserId}
                        </td>

                        <td className="px-4 py-3 text-on-surface-variant">
                          {formatDate(assignment.assignedAt)}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              void handleRemoveAssignment(
                                assignment,
                              )
                            }
                            disabled={
                              assignmentRemovingId !== null ||
                              assignmentSubmitting
                            }
                            className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {assignmentRemovingId ===
                            assignment.id
                              ? "กำลังยกเลิก..."
                              : "ยกเลิก"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {deleteError ? (
        <section
          className="mb-6 rounded-2xl bg-error-container p-4"
          role="alert"
        >
          <p className="font-semibold text-on-error-container">
            ไม่สามารถลบ Software License ได้
          </p>

          <p className="mt-1 text-sm text-on-error-container">
            {deleteError}
          </p>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl bg-surface-container-low p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-4 md:grid-cols-4"
        >
          <div>
            <label
              htmlFor="software-name"
              className="mb-2 block text-sm font-semibold text-on-surface"
            >
              ชื่อซอฟต์แวร์
            </label>

            <input
              id="software-name"
              type="search"
              value={softwareNameInput}
              onChange={(event) =>
                setSoftwareNameInput(event.target.value)
              }
              placeholder="ค้นหาชื่อซอฟต์แวร์"
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="provider"
              className="mb-2 block text-sm font-semibold text-on-surface"
            >
              ผู้ให้บริการ
            </label>

            <input
              id="provider"
              type="search"
              value={providerInput}
              onChange={(event) =>
                setProviderInput(event.target.value)
              }
              placeholder="ค้นหาผู้ให้บริการ"
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-on-surface"
            >
              สถานะ
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value as "" | LicenseStatus,
                )
              }
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              ค้นหา
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-opacity hover:opacity-80"
            >
              ล้าง
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <section
          className="rounded-2xl bg-surface-container-low p-8 text-center"
          aria-live="polite"
        >
          <p className="text-sm text-on-surface-variant">
            กำลังโหลดรายการ Software License...
          </p>
        </section>
      ) : error ? (
        <section
          className="rounded-2xl bg-error-container p-6"
          role="alert"
        >
          <p className="font-semibold text-on-error-container">
            โหลดข้อมูลไม่สำเร็จ
          </p>

          <p className="mt-1 text-sm text-on-error-container">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void fetchLicenses()}
            className="mt-4 rounded-xl bg-error px-4 py-2 text-sm font-semibold text-on-error"
          >
            ลองอีกครั้ง
          </button>
        </section>
      ) : licenses.length === 0 ? (
        <section className="rounded-2xl bg-surface-container-low p-8 text-center">
          <p className="font-semibold text-on-surface">
            ไม่พบ Software License
          </p>

          <p className="mt-1 text-sm text-on-surface-variant">
            ลองเปลี่ยนคำค้นหาหรือตัวกรอง หรือเพิ่ม Software License รายการแรก
          </p>

          {canManageLicenses ? (
            <button
              type="button"
              onClick={() => {
                setCreateError("");
                setShowCreateForm(true);
              }}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              + เพิ่ม Software License
            </button>
          ) : null}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
          <div className="flex flex-col gap-2 border-b border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-on-surface">
                รายการ License
              </h2>

              <p className="text-sm text-on-surface-variant">
                ทั้งหมด {formatNumber(total)} รายการ
              </p>
            </div>

            {canManageLicenses ? (
              <button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setShowCreateForm(true);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                + เพิ่ม License
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-4 py-3 font-semibold text-on-surface">
                    ซอฟต์แวร์
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    ผู้ให้บริการ
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    จำนวนสิทธิ์
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    การใช้งาน
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    วันหมดอายุ
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    ค่าใช้จ่าย
                  </th>

                  <th className="px-4 py-3 font-semibold text-on-surface">
                    สถานะ
                  </th>

                  {canManageLicenses ? (
                    <th className="px-4 py-3 font-semibold text-on-surface">
                      จัดการ
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant">
                {licenses.map((license) => (
                  <tr
                    key={license.id}
                    className="transition-colors hover:bg-surface-container"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-on-surface">
                        {license.software_name}
                      </div>

                      <div className="mt-1 text-xs text-on-surface-variant">
                        {license.license_type || "ไม่ระบุประเภท"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-on-surface-variant">
                      {license.provider || "-"}
                    </td>

                    <td className="px-4 py-4 text-on-surface">
                      {formatNumber(license.license_quantity)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-on-surface">
                        {formatNumber(license.assigned_count)} /{" "}
                        {formatNumber(license.license_quantity)}
                      </div>

                      <div className="mt-1 text-xs text-on-surface-variant">
                        เหลือ {formatNumber(license.remaining_count)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-on-surface-variant">
                      {formatDate(license.expiry_date)}
                    </td>

                    <td className="px-4 py-4 text-on-surface-variant">
                      {formatCost(license.cost, license.currency)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          license.status,
                        )}`}
                      >
                        {getStatusLabel(license.status)}
                      </span>
                    </td>

                    {canManageLicenses ? (
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              void openAssignment(license)
                            }
                            disabled={
                              deletingId === license.id ||
                              updating ||
                              editingLicense?.id === license.id ||
                              assignmentSubmitting
                            }
                            className="rounded-xl bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary-container transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            จัดสรร
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditForm(license)}
                            disabled={
                              deletingId === license.id ||
                              assignmentLicense?.id === license.id
                            }
                            className="rounded-xl bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            แก้ไข
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteLicense(license)
                            }
                            disabled={
                              deletingId !== null ||
                              updating ||
                              editingLicense?.id === license.id ||
                              assignmentLicense?.id === license.id
                            }
                            className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === license.id
                              ? "กำลังลบ..."
                              : "ลบ"}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant">
              หน้า {page} จาก {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => current - 1)
                }
                className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
