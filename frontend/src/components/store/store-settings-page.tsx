"use client";
import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/fields";
import { Toast } from "@/components/shared/feedback";
import { storeInitial, useStore } from "@/components/session/store-context";

const NAME_MAX = 100;
const TYPE_MAX = 60;

export function StoreSettingsPage() {
  const { store, isLoaded, loadError, reload, update } = useStore();
  const [draftName, setDraftName] = useState<string | null>(null);
  const preview = draftName ?? store.name;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await update({
        name: String(form.get("name") ?? ""),
        type: String(form.get("type") ?? ""),
      });
      setDraftName(null);
      setToast("Profil toko berhasil disimpan.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace">
      <header className="page-header">
        <div>
          <span className="eyebrow">KELOLA TOKO</span>
          <h1>Pengaturan Toko</h1>
          <p>Nama ini tampil di sidebar dan struk pembayaran.</p>
        </div>
      </header>
      {(error || loadError) && (
        <div className="error" role="alert">
          <AlertCircle size={17} />
          <span>{error || loadError}</span>
          {loadError && !error && (
            <button onClick={() => void reload()} aria-label="Muat ulang">
              ↻
            </button>
          )}
        </div>
      )}
      <Toast message={toast} onDismiss={() => setToast("")} />
      {!isLoaded ? (
        <div className="skeleton-grid" aria-label="Memuat data">
          <div className="skeleton" />
        </div>
      ) : (
        <form
          key={store.updatedAt ?? "default"}
          className="panel store-settings"
          onSubmit={submit}
        >
          <div className="store-label store-preview" aria-hidden="true">
            <span className="store-avatar">{storeInitial(preview)}</span>
            <div>
              <strong>{preview || "Nama toko"}</strong>
              <small>Pratinjau</small>
            </div>
          </div>
          <Field label="Nama toko">
            <input
              name="name"
              required
              maxLength={NAME_MAX}
              defaultValue={store.name}
              onChange={(e) => setDraftName(e.target.value)}
              autoComplete="organization"
            />
          </Field>
          <Field label="Jenis toko">
            <input
              name="type"
              required
              maxLength={TYPE_MAX}
              defaultValue={store.type}
              placeholder="Contoh: Toko kelontong"
            />
          </Field>
          <div className="dialog-actions">
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
