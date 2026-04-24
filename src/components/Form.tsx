import { useEffect, useState } from "react";
import { CONFIG } from "../config";
import type { PickedLocation } from "../types";

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
const inputClass =
  "w-full px-[10px] py-2 border border-[#ccc] rounded bg-white text-[#333] text-[13px] outline-none transition-colors focus:border-green-500 placeholder:text-[#999] placeholder:italic";

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
        // Mobile: bottom sheet
        "fixed bottom-0 left-0 right-0 z-10 max-h-[85vh] overflow-y-auto rounded-t-2xl [scrollbar-width:thin]",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.2)] transition-transform duration-300",
        // Desktop: top-left overlay (always visible)
        "sm:absolute sm:top-5 sm:left-5 sm:bottom-auto sm:right-auto",
        "sm:max-h-[calc(100vh-40px)] sm:rounded-xl sm:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        "sm:translate-y-0 sm:transition-none",
        // Mobile open/close
        isOpen ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      {/* Mobile handle — tap to close */}
      <div
        className="flex sm:hidden justify-center items-center py-2.5 bg-[#1a1a2e] rounded-t-2xl cursor-pointer"
        onClick={onClose}
      >
        <div className="w-10 h-1 rounded-full bg-white/35" />
      </div>

      <div className="w-full sm:w-[400px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#1a1a2e] text-white px-4 pt-[14px] pb-3">
          <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-green-500/25 text-green-300 border border-green-500/45 rounded-full px-2 py-0.5 mb-2">
            OSGeo 20th Anniversary
          </span>
          <a
            href="https://www.osgeo.org/foundation-news/happy-birthday-osgeo-celebrating-20-years-of-free-and-open-source-software-for-geospatial/"
            target="_blank"
            rel="noopener"
            className="no-underline"
          >
            <p className="text-base font-bold leading-snug mb-1 text-white">
              Celebrating 20 Years<br />of OSGeo Foundation
            </p>
          </a>
          <p className="text-[11px] text-white/50">Drop a pin and leave your message on the map.</p>
        </div>

        {/* Body */}
        <div className="px-4 py-[14px] flex flex-col gap-3 bg-[#eee]">
          <p className="text-[10px] text-[#999] text-right -mt-1">* required</p>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nickname *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Country *</label>
            <select
              className={`${inputClass} select-arrow cursor-pointer appearance-none disabled:text-[#999] disabled:italic`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loadingCountries}
            >
              {loadingCountries ? (
                <option value="">Loading…</option>
              ) : countries.length === 0 ? (
                <option value="">Failed to load — refresh to retry</option>
              ) : (
                <>
                  <option value="">— Select country —</option>
                  {countries.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Favorite FOSS4G Tool</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. MapLibre, QGIS…"
              value={favorite}
              onChange={(e) => setFavorite(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Message *</label>
            <textarea
              className={`${inputClass} resize-y min-h-[68px] leading-relaxed`}
              placeholder="e.g. Congratulations on OSGeo's 20th anniversary!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Location *</label>
            <button
              className={[
                "w-full px-[10px] py-2 rounded border border-dashed border-[#aaa] bg-white text-[#555] text-xs font-bold",
                "flex items-center justify-center gap-1.5 transition-all",
                "hover:bg-[#f0f0f0] hover:border-[#888]",
                pickingLocation ? "!bg-green-500/10 !border-green-500 !text-green-800 animate-pulse" : "",
              ].join(" ")}
              onClick={onTogglePick}
            >
              <span>{pickIcon}</span>
              <span>{pickLabel}</span>
            </button>
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
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-[14px] flex flex-col gap-2 bg-[#eee] border-t border-[#ccc]">
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
          <button
            className="w-full py-2.5 rounded bg-green-500 text-white text-sm font-bold transition-all hover:bg-green-600 active:scale-[0.98] active:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send Message"}
          </button>
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
        </div>
      </div>
    </div>
  );
}
