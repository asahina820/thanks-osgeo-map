import { useEffect, useState } from "react";
import { CONFIG } from "../config";
import type { PickedLocation } from "../types";

type Props = {
  pickingLocation: boolean;
  pickedLocation: PickedLocation | null;
  onTogglePick: () => void;
  onSubmitSuccess: () => void;
};

type Status = { type: "success" | "error"; message: string } | null;

export function Form({ pickingLocation, pickedLocation, onTogglePick, onSubmitSuccess }: Props) {
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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

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
    <div id="form-container">
      <div className="wrap">
        <div className="header">
          <div className="badge">OSGeo 20th Anniversary</div>
          <a
            href="https://www.osgeo.org/foundation-news/happy-birthday-osgeo-celebrating-20-years-of-free-and-open-source-software-for-geospatial/"
            target="_blank"
            rel="noopener"
            style={{ textDecoration: "none" }}
          >
            <p className="header-title">
              Celebrating 20 Years
              <br />
              of OSGeo Foundation
            </p>
          </a>
          <p className="header-sub">Drop a pin and leave your message on the map.</p>
        </div>

        <div className="body">
          <p className="required-note">* required</p>

          <div className="field">
            <label>Nickname *</label>
            <input
              type="text"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Country *</label>
            <select
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
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="field">
            <label>Favorite FOSS4G Tool</label>
            <input
              type="text"
              placeholder="e.g. MapLibre, QGIS…"
              value={favorite}
              onChange={(e) => setFavorite(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Message *</label>
            <textarea
              placeholder="e.g. Congratulations on OSGeo's 20th anniversary!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Location *</label>
            <button
              className={`btn-pick${pickingLocation ? " picking" : ""}`}
              onClick={onTogglePick}
            >
              <span>{pickIcon}</span>
              <span>{pickLabel}</span>
            </button>
            {pickingLocation && (
              <p className="pick-hint visible">Click anywhere on the map to set location</p>
            )}
            {pickedLocation && !pickingLocation && (
              <p className="coords-display visible">
                {pickedLocation.lng.toFixed(5)}, {pickedLocation.lat.toFixed(5)}
              </p>
            )}
          </div>
        </div>

        <div className="footer">
          <p className="notice">
            ⚠️ Your submission will be publicly visible on the map. Please do not include personal
            information or any content that violates our{" "}
            <a
              href="https://www.osgeo.org/code_of_conduct/"
              target="_blank"
              rel="noopener"
              style={{ color: "#888" }}
            >
              Code of Conduct
            </a>
            .
          </p>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Send Message"}
          </button>
          {status && <div className={`status ${status.type}`}>{status.message}</div>}
        </div>
      </div>
    </div>
  );
}
