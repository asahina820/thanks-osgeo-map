import { useState } from "react";
import { GitBranch } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const REPO_URL = "https://github.com/asahina820/thanks-osgeo-map";
const API_URL = "https://api.cms.reearth.io/api/p/asahina820/foss4g-hiroshima/thanks-osgeo";

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
        className="w-72 p-3 flex flex-col gap-3"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wide uppercase text-muted-foreground mb-1.5">Repository</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-foreground hover:text-green-600 hover:underline transition-colors break-all"
          >
            {REPO_URL.replace("https://", "")}
          </a>
        </div>

        <Separator />

        <div>
          <p className="text-[11px] font-bold tracking-wide uppercase text-muted-foreground mb-1.5">Public API <span className="normal-case font-normal text-muted-foreground">(read only)</span></p>
          <a
            href={API_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-foreground hover:text-green-600 hover:underline transition-colors break-all"
          >
            {API_URL.replace("https://", "")}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
