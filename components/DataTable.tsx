"use client";
import React from "react";

export interface DataTableProps {
  title?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  caption?: string;
}

export function DataTable({ title, columns, rows, caption }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      {title ? <div className="text-lg font-semibold mb-2">{title}</div> : null}
      <table className="w-full text-sm border border-zinc-200 rounded-md overflow-hidden">
        {caption ? (
          <caption className="text-left p-3 text-zinc-500">{caption}</caption>
        ) : null}
        <thead className="bg-zinc-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-medium text-zinc-700 border-b">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2 border-b">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


