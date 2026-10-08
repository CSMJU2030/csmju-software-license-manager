"use client";

import { useCallback, useEffect, useState } from "react";
import { redirectToLogin } from "@/lib/auth";

type DashboardData = {
  total_software: number;
  total_licenses: number;
  assigned_licenses: number;
  remaining_licenses: number;
  expiring_soon: number;
  expired: number;
  total_cost: number;
};

type DashboardResponse = {
  success: boolean;
  data?: DashboardData;
  error?: {
    code?: string;
    message?: string;
  };
};

type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
  variant?: "default" | "warning" | "error";
};

function StatCard({
  label,
  value,
  description,
  variant = "default",
}: StatCardProps) {
  const valueClass =
    variant === "error"
      ? "text-error"
      : variant === "warning"
        ? "text-brand-amber"
        : "text-primary";

  return (
    <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
      <p className="text-label-md text-on-surface-variant">{label}</p>

      <p className={`mt-3 text-headline-lg font-display ${valueClass}`}>
        {value}
      </p>

      <p className="mt-2 text-body-md text-on-surface-variant">
        {description}
      </p>
    </article>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/v1/software-license-dashboard",
        {
          credentials: "include",
          cache: "no-store",
          signal,
        },
      );

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error?.message ?? "ไม่สามารถโหลดข้อมูล Dashboard ได้",
        );
      }

      setDashboard(result.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard",
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
      void loadDashboard(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <section aria-busy="true" aria-live="polite" className="space-y-8">
        <div>
          <p className="text-label-md text-primary">
            CS Software License Manager
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            ภาพรวมระบบจัดการ Software License
          </h1>

          <p className="mt-2 text-body-md text-on-surface-variant">
            กำลังโหลดข้อมูล...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-surface-container"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6" aria-live="assertive">
        <div>
          <p className="text-label-md text-primary">
            CS Software License Manager
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            ภาพรวมระบบจัดการ Software License
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
            onClick={() => void loadDashboard()}
            className="mt-5 rounded-lg bg-error px-5 py-3 text-label-md text-white transition-opacity hover:opacity-90"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-label-md text-primary">
            CS Software License Manager
          </p>

          <h1 className="mt-2 text-headline-lg font-display">
            ภาพรวมระบบจัดการ Software License
          </h1>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm">
          <h2 className="text-headline-md font-display">
            ยังไม่มีข้อมูล Dashboard
          </h2>

          <p className="mt-2 text-body-md text-on-surface-variant">
            ยังไม่มีข้อมูล Software License สำหรับแสดงผล
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-label-md text-primary">
          CS Software License Manager
        </p>

        <h1 className="mt-2 text-headline-lg font-display">
          ภาพรวมระบบจัดการ Software License
        </h1>

        <p className="mt-2 text-body-md text-on-surface-variant">
          สรุปจำนวน License การจัดสรร และสถานะ License ทั้งหมดในระบบ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Software ทั้งหมด"
          value={dashboard.total_software}
          description="จำนวน Software License ที่ลงทะเบียน"
        />

        <StatCard
          label="License ทั้งหมด"
          value={dashboard.total_licenses}
          description="จำนวนสิทธิ์การใช้งานทั้งหมด"
        />

        <StatCard
          label="License ที่จัดสรร"
          value={dashboard.assigned_licenses}
          description="จำนวน License ที่กำลังถูกใช้งาน"
        />

        <StatCard
          label="License ที่เหลือ"
          value={dashboard.remaining_licenses}
          description="จำนวน License ที่ยังสามารถจัดสรรได้"
        />

        <StatCard
          label="ใกล้หมดอายุ"
          value={dashboard.expiring_soon}
          description="License ที่จะหมดอายุภายใน 30 วัน"
          variant="warning"
        />

        <StatCard
          label="หมดอายุแล้ว"
          value={dashboard.expired}
          description="License ที่พ้นวันหมดอายุ"
          variant="error"
        />

        <StatCard
          label="มูลค่ารวม"
          value={formatCurrency(dashboard.total_cost)}
          description="ค่าใช้จ่ายรวมของ Software License"
        />
      </div>

      {dashboard.total_software === 0 && (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm">
          <h2 className="text-headline-md font-display">
            ยังไม่มี Software License
          </h2>

          <p className="mt-2 text-body-md text-on-surface-variant">
            เริ่มต้นด้วยการเพิ่ม Software License รายการแรก
          </p>

          <a
            href="/software-licenses"
            className="btn-gradient mt-5 inline-flex items-center justify-center rounded-lg px-5 py-3 text-label-md text-white shadow-md"
          >
            ไปที่ Software Licenses
          </a>
        </div>
      )}
    </section>
  );
}