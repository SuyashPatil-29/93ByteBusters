"use client";
import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";

export type TableSection = {
  title?: string;
  caption?: string;
  columns: string[];
  rows: Array<Array<string>>;
};

export function MarkdownTableView({ sections }: { sections: TableSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx} className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
          {section.title ? (
            <div className="px-4 py-3 border-b text-sm font-semibold text-zinc-800 dark:text-zinc-200 dark:border-zinc-800">
              {section.title}
            </div>
          ) : null}
          <div className="px-2 pb-2 overflow-x-auto">
            <Table>
              {section.caption ? <TableCaption>{section.caption}</TableCaption> : null}
              <TableHeader>
                <TableRow>
                  {section.columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={section.columns.length} className="text-zinc-500">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  section.rows.map((r, rIdx) => (
                    <TableRow key={rIdx}>
                      {r.map((cell, cIdx) => (
                        <TableCell key={cIdx}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}


