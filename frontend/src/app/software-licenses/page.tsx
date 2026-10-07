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

return ( <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"> <div className="mb-6 flex flex-col gap-2"> <h1 className="text-2xl font-bold text-on-surface">
ใบอนุญาตซอฟต์แวร์ </h1> <p className="text-sm text-on-surface-variant">
จัดการ Software License และตรวจสอบจำนวนสิทธิ์การใช้งาน </p> </div>

  <section className="mb-6 rounded-2xl bg-surface-container-low p-4 shadow-sm">
    <form
      onSubmit={handleSearch}
      className="grid gap-4 md:grid-cols-4"
    >
      <div className="md:col-span-1">
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
          onChange={(event) => setSoftwareNameInput(event.target.value)}
          placeholder="ค้นหาชื่อซอฟต์แวร์"
          className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
        />
      </div>

      <div className="md:col-span-1">
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
          onChange={(event) => setProviderInput(event.target.value)}
          placeholder="ค้นหาผู้ให้บริการ"
          className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
        />
      </div>

      <div className="md:col-span-1">
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
            handleStatusChange(event.target.value as "" | LicenseStatus)
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
      <p className="mt-1 text-sm text-on-error-container">{error}</p>
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
        ลองเปลี่ยนคำค้นหาหรือตัวกรอง
      </p>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm">
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
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            ก่อนหน้า
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
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


