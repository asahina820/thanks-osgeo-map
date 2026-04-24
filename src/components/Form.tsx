import { useEffect, useState } from "react";
import { CONFIG } from "../config";
import type { PickedLocation } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type Props = {
  pickingLocation: boolean;
  pickedLocation: PickedLocation | null;
  onTogglePick: () => void;
  onSubmitSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
};

type Status = { type: "success" | "error"; message: string } | null;

const labelClass = "text-[10px] font-bold tracking-[0.06em] uppercase text-[#666]";
const fieldClass = "h-9 bg-white border-[#ccc] text-[13px] placeholder:text-[#999] placeholder:italic focus-visible:border-green-500 focus-visible:ring-green-500/30";

export function Form({ pickingLocation, pickedLocation, onTogglePick, onSubmitSuccess, isOpen, onClose }: Props) {
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [favorite, setFavorite] = useState("");
  const [comment, setComment] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name")
      .then((res) => res.json())
      .then((data: { name: { common: string } }[]) => {
        const names = data.map((c) => c.name.common).sort((a, b) => a.localeCompare(b));
        setCountries(names);
        setCountry("Japan");
      })
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  const handleSubmit = async () => {
    setStatus(null);
    if (!nickname || !country || !comment || !pickedLocation) {
      setStatus({ type: "error", message: "Please fill in all required fields including a map location." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${CONFIG.backendUrl}/items`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: [
            { key: "nickname", type: "text", value: nickname },
            { key: "country", type: "text", value: country },
            { key: "your-favorite-foss4g", type: "text", value: favorite },
            { key: "comment", type: "textArea", value: comment },
            {
              key: "location",
              type: "geometryObject",
              value: { type: "Point", coordinates: [pickedLocation.lng, pickedLocation.lat] },
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      await res.json();
      setStatus({ type: "success", message: "Your message has been added to the map!" });
      onSubmitSuccess();
    } catch (e) {
      console.error("Submit failed:", e);
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const pickIcon = pickingLocation ? "⏹" : pickedLocation ? "✅" : "📍";
  const pickLabel = pickingLocation
    ? "Cancel"
    : pickedLocation
    ? "Location set — pick again"
    : "Pick from map";

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-10 max-h-[85vh] overflow-y-auto rounded-t-2xl [scrollbar-width:thin]",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.2)] transition-transform duration-300",
        "sm:absolute sm:top-5 sm:left-5 sm:bottom-auto sm:right-auto sm:w-100",
        "sm:max-h-[calc(100vh-40px)] sm:overflow-y-auto sm:rounded-xl sm:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        "sm:translate-y-0 sm:transition-none",
        isOpen ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      {/* Mobile handle */}
      <div
        className="flex sm:hidden justify-center items-center py-2.5 bg-[#1a1a2e] rounded-t-2xl cursor-pointer"
        onClick={onClose}
      >
        <div className="w-10 h-1 rounded-full bg-white/35" />
      </div>

      <Card className="w-full rounded-none sm:rounded-xl gap-0 py-0 ring-0">

        {/* Header */}
        <CardHeader className="bg-[#1a1a2e] text-white px-4 pt-3.5 pb-3 gap-1 rounded-none">
          <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-green-500/25 text-green-300 border border-green-500/45 rounded-full px-2 py-0.5 w-fit">
            OSGeo 20th Anniversary
          </span>
          <a
            href="https://www.osgeo.org/foundation-news/happy-birthday-osgeo-celebrating-20-years-of-free-and-open-source-software-for-geospatial/"
            target="_blank"
            rel="noopener"
            className="no-underline"
          >
            <div className="text-base font-bold leading-snug text-white">
              Celebrating 20 Years<br />of OSGeo Foundation
            </div>
          </a>
          <div className="text-[11px] text-white/50">Drop a pin and leave your message on the map.</div>
        </CardHeader>

        {/* Body */}
        <CardContent className="px-4 py-3.5 flex flex-col gap-3 bg-[#eee]">
          <p className="text-[10px] text-[#999] text-right -mt-1">* required</p>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Nickname *</Label>
            <Input
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Country *</Label>
            <Select value={country} onValueChange={(v) => setCountry(v ?? "")} disabled={loadingCountries}>
              <SelectTrigger className={`${fieldClass} w-full`}>
                <SelectValue
                  placeholder={
                    loadingCountries
                      ? "Loading…"
                      : countries.length === 0
                      ? "Failed to load — refresh to retry"
                      : "— Select country —"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {countries.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Favorite FOSS4G Tool</Label>
            <Input
              placeholder="e.g. MapLibre, QGIS…"
              value={favorite}
              onChange={(e) => setFavorite(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Message *</Label>
            <Textarea
              placeholder="e.g. Congratulations on OSGeo's 20th anniversary!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`${fieldClass} h-auto min-h-[68px] resize-y leading-relaxed`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Location *</Label>
            <Button
              variant="outline"
              onClick={onTogglePick}
              className={[
                "w-full h-9 border-dashed border-[#aaa] bg-white text-[#555] text-xs font-bold gap-1.5",
                pickingLocation
                  ? "!bg-green-500/10 !border-green-500 !text-green-800 animate-pulse"
                  : "hover:bg-[#f0f0f0] hover:border-[#888]",
              ].join(" ")}
            >
              <span>{pickIcon}</span>
              <span>{pickLabel}</span>
            </Button>
            {pickingLocation && (
              <p className="text-[11px] text-green-800 text-center mt-1">
                Click anywhere on the map to set location
              </p>
            )}
            {pickedLocation && !pickingLocation && (
              <p className="text-[11px] text-center text-[#888] font-mono mt-0.5">
                {pickedLocation.lng.toFixed(5)}, {pickedLocation.lat.toFixed(5)}
              </p>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="px-4 pt-3 pb-3.5 flex flex-col gap-2 bg-[#eee] rounded-none items-stretch">
          <p className="text-[11px] text-[#888] leading-relaxed bg-white border-l-[3px] border-yellow-400 rounded px-[10px] py-2">
            ⚠️ Your submission will be publicly visible on the map. Please do not include personal
            information or any content that violates our{" "}
            <a
              href="https://www.osgeo.org/code_of_conduct/"
              target="_blank"
              rel="noopener"
              className="text-[#888]"
            >
              Code of Conduct
            </a>
            .
          </p>
          <Button
            className="w-full h-10 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send Message"}
          </Button>
          {status && (
            <div
              className={[
                "text-xs px-[10px] py-2 rounded border-l-[3px] leading-relaxed",
                status.type === "success"
                  ? "bg-[#e8f5e9] border-green-500 text-green-800"
                  : "bg-[#ffebee] border-red-700 text-[#c62828]",
              ].join(" ")}
            >
              {status.message}
            </div>
          )}
        </CardFooter>

      </Card>
    </div>
  );
}
