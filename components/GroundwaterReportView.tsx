"use client";
import { DataTable } from "./DataTable";

export interface ReportData {
  areaOfFocus?: string;
  year?: string;
  metrics?: Array<{ label: string; value: string | number; unit?: string }>;
  tables?: Array<{ title?: string; columns: string[]; rows: Array<Array<string | number>> }>;
}

export function GroundwaterReportView({ report }: { report: ReportData }) {
  return (
    <div className="space-y-4">
      {(report.areaOfFocus || report.year) && (
        <div className="text-base font-semibold">
          {report.areaOfFocus ? `Area of Focus: ${report.areaOfFocus}` : null}
          {report.areaOfFocus && report.year ? " — " : null}
          {report.year ? `Year: ${report.year}` : null}
        </div>
      )}

      {report.metrics && report.metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.metrics.map((m, i) => (
            <div key={i} className="rounded border p-3 bg-white">
              <div className="text-xs uppercase tracking-wide text-zinc-500">{m.label}</div>
              <div className="text-lg font-semibold">{String(m.value)}{m.unit ? ` ${m.unit}` : ''}</div>
            </div>
          ))}
        </div>
      )}

      {report.tables?.map((t, idx) => (
        <DataTable key={idx} title={t.title} columns={t.columns} rows={t.rows as any} />
      ))}
    </div>
  );
}


