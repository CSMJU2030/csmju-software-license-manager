"use client";

import { useCallback, useEffect, useState } from "react";

type ExpiringLicense = {
  id: string;
  software_name: string;
  provider?: string | null;
  license_type?: string | null;
  expiry_date: string;
  days_remaining: number;
  assigned_count: number;
  status: string;
};

type ExpiringResponse = {
  success: boolean;
  data?: ExpiringLicense[];
  error?: {
    code?: string;
    message?: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "ใช้งานอยู่";
    case "EXPIRING":
      return "ใกล้หมดอายุ";
    case "EXPIRED":
      return "หมดอายุแล้ว";
    case "SUSPENDED":
      return "ระงับการใช้งาน";
    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "EXPIRED":
      return "bg-error-container text-on-error-container";

    case "EXPIRING":
      return "bg-brand-amber/15 text-brand-amber";

    case "SUSPENDED":
      return "bg-surface-container-high text-on-surface-variant";

    default:
      return "bg-sso-container text-sso";
  }
}

export default function ExpiringLicensesPage() {
  const [licenses, setLicenses] = useState<ExpiringLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpiringLicenses = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/v1/software-licenses/expiring",
        {
          credentials: "include",
          cache: "no-store",
          signal,
        },
      );

      const result = (await response.json()) as ExpiringResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error?.message ??
            "ไม่สามารถโหลดรายการ License ที่ใกล้หมดอายุได้",
        );
      }

      setLicenses(result.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      void loadExpiringLicenses(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadExpiringLicenses]);

  if (loading) {
    return (
      <section aria-busy="true" aria-live="polite" className="space-y-8">
        <div>
          <p className="text-label-md text-primary">
            Software License
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            License ใกล้หมดอายุ
          </h1>

          <p className="mt-2 text-body-md text-on-surface-variant">
            กำลังโหลดข้อมูล...
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
          <div className="h-16 animate-pulse bg-surface-container" />

          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg bg-surface-container"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6" aria-live="assertive">
        <div>
          <p className="text-label-md text-primary">
            Software License
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            License ใกล้หมดอายุ
          </h1>
        </div>

        <div className="rounded-2xl border border-error/30 bg-error-container p-6">
          <h2 className="text-headline-md font-display text-on-error-container">
            ไม่สามารถโหลดข้อมูลได้
          </h2>

          <p className="mt-2 text-body-md text-on-error-container">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadExpiringLicenses()}
            className="mt-5 rounded-lg bg-error px-5 py-3 text-label-md text-white transition-opacity hover:opacity-90"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </section>
    );
  }

  if (licenses.length === 0) {
    return (
      <section className="space-y-8">
        <div>
          <p className="text-label-md text-primary">
            Software License
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            License ใกล้หมดอายุ
          </h1>

          <p className="mt-2 text-body-md text-on-surface-variant">
            รายการ License ที่จะหมดอายุภายใน 30 วัน
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center shadow-sm">
          <h2 className="text-headline-md font-display">
            ไม่มี License ที่ใกล้หมดอายุ
          </h2>

          <p className="mt-2 text-body-md text-on-surface-variant">
            ขณะนี้ไม่มี Software License ที่จะหมดอายุภายใน 30 วัน
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-label-md text-primary">
          Software License
        </p>

        <h1 className="mt-2 text-headline-lg font-display">
          License ใกล้หมดอายุ
        </h1>

        <p className="mt-2 text-body-md text-on-surface-variant">
          รายการ License ที่จะหมดอายุภายใน 30 วัน
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                <th className="px-5 py-4 text-left text-label-md text-on-surface">
                  Software
                </th>

                <th className="px-5 py-4 text-left text-label-md text-on-surface">
                  Provider
                </th>

                <th className="px-5 py-4 text-left text-label-md text-on-surface">
                  License Type
                </th>

                <th className="px-5 py-4 text-left text-label-md text-on-surface">
                  วันหมดอายุ
                </th>

                <th className="px-5 py-4 text-center text-label-md text-on-surface">
                  เหลือ
                </th>

                <th className="px-5 py-4 text-center text-label-md text-on-surface">
                  จัดสรร
                </th>

                <th className="px-5 py-4 text-left text-label-md text-on-surface">
                  สถานะ
                </th>
              </tr>
            </thead>

            <tbody>
              {licenses.map((license) => (
                <tr
                  key={license.id}
                  className="border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-low"
                >
                  <td className="px-5 py-5">
                    <p className="text-label-md text-on-surface">
                      {license.software_name}
                    </p>
                  </td>

                  <td className="px-5 py-5 text-body-md text-on-surface-variant">
                    {license.provider || "-"}
                  </td>

                  <td className="px-5 py-5 text-body-md text-on-surface-variant">
                    {license.license_type || "-"}
                  </td>

                  <td className="px-5 py-5 text-body-md text-on-surface-variant">
                    {formatDate(license.expiry_date)}
                  </td>

                  <td className="px-5 py-5 text-center">
                    <span
                      className={
                        license.days_remaining <= 7
                          ? "font-semibold text-error"
                          : "font-semibold text-brand-amber"
                      }
                    >
                      {license.days_remaining} วัน
                    </span>
                  </td>

                  <td className="px-5 py-5 text-center text-body-md text-on-surface">
                    {license.assigned_count}
                  </td>

                  <td className="px-5 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-label-sm ${getStatusClass(
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
      </div>
    </section>
  );
}