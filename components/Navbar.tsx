"use client";

import React from "react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import { useActions } from "ai/rsc";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
            News<span className="text-green-600 text-lg">Sense</span>
          </Button>
          <div className="h-full flex items-center space-x-6">
            <button
              onClick={() => handleAction("Show tech ETF performance")}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Tech ETFs
            </button>
            <button
              onClick={() => handleAction("List all available stocks")}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Stocks
            </button>
            <button
              onClick={() => handleAction("Get current market overview")}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => handleAction("Show Indian market stocks")}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
            >
              Indian Markets
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
