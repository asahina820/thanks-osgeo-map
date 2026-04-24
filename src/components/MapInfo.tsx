import { useState } from "react";
import { GitBranch } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REPO_URL = "https://github.com/asahina820/thanks-osgeo-map";

export function MapInfo() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="absolute bottom-48 right-2.5 z-10 size-7.25 rounded-sm bg-white border border-white/60 shadow-md text-[#333] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="About this map"
        title="Repository"
      >
        <GitBranch className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="end"
        sideOffset={8}
        className="w-auto p-3"
      >
        <p className="text-[11px] font-bold tracking-wide uppercase text-muted-foreground mb-1.5">Repository</p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-foreground hover:text-green-600 hover:underline transition-colors break-all"
        >
          {REPO_URL.replace("https://", "")}
        </a>
      </PopoverContent>
    </Popover>
  );
}
