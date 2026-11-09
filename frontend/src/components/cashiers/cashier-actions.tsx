"use client";
import type { WorkspaceState } from "@/components/workspace/use-workspace";
import { Button } from "@/components/ui/button";
import { Field, FormActions } from "@/components/shared/fields";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
type CashierFormProps = Pick<WorkspaceState, "mutate" | "busy" | "setDialog">;
export function CashierForm({ mutate, busy, setDialog }: CashierFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void mutate(
          () =>
            api("cashiers", "POST", {
              name: f.get("name"),
              email: f.get("email"),
              password: f.get("password"),
            }),
          "Akun kasir berhasil dibuat.",
        );
      }}
    >
      <Field label="Nama kasir">
        <input name="name" required maxLength={100} autoComplete="off" />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="off"
        />
      </Field>
      <Field label="Kata sandi awal">
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          required
          autoComplete="new-password"
        />
      </Field>
      <p className="hint">
        Gunakan 8–128 karakter. Berikan kata sandi langsung kepada kasir.
      </p>
      <FormActions busy={busy} cancel={() => setDialog(null)} />
    </form>
  );
}
type CashierStatusProps = Omit<
  Pick<WorkspaceState, "selectedUser" | "busy" | "setDialog" | "mutate">,
  "selectedUser"
> & { selectedUser: User };
export function CashierStatus({
  selectedUser,
  busy,
  setDialog,
  mutate,
}: CashierStatusProps) {
  return (
    <>
      <p>
        {selectedUser.status === "active" ? (
          <>
            Akun <strong>{selectedUser.name}</strong> tidak dapat masuk atau
            melanjutkan akses sampai diaktifkan kembali.
          </>
        ) : (
          <>
            Akun <strong>{selectedUser.name}</strong> dapat kembali masuk dan
            melayani transaksi.
          </>
        )}
      </p>
      <div className="dialog-actions">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setDialog(null)}
        >
          Batal
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            mutate(
              () =>
                api(`cashiers/${selectedUser.id}/status`, "PATCH", {
                  status:
                    selectedUser.status === "active" ? "inactive" : "active",
                }),
              "Status akun berhasil diperbarui.",
            )
          }
        >
          {busy ? "Menyimpan…" : "Ya, Ubah Status"}
        </Button>
      </div>
    </>
  );
}
