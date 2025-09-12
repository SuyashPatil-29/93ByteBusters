"use client";

import React from "react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import { useActions } from "ai/rsc";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "./LanguageSelector";

const Navbar = () => {
  const { sendMessage } = useActions();
  const router = useRouter();

  const handleAction = async (action: string) => {
    await sendMessage(action);
  };

  return (
    <nav className="sticky z-[100] h-14 inseet-x-0 top-0 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Button
            onClick={() => {
              router.refresh();
              window.location.href = "/";
            }}
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex gap-0 z-40 font-semibold bg-transparent shadow-none hover:bg-transparent text-black text-lg"
            )}
          >
            INGRES<span className="text-blue-600 text-lg">Water</span>
          </Button>
          <div className="h-full flex items-center space-x-6">
            <button
              onClick={() => handleAction("Show groundwater status in Karnataka")}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Quick Start
            </button>
            <LanguageSelector />
            <Link
              href="/monitor"
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Metrics
            </Link>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
