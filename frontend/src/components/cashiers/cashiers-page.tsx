"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/feedback";
import { DataTable } from "@/components/shared/data-table";
import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<WorkspaceState, "cashiers" | "setSelectedUser" | "setDialog">;
export function CashiersPage({ cashiers, setSelectedUser, setDialog }: Props) {
  return (
    <section className="panel">
      <div className="section-line">
        <h2>Tim kasir toko</h2>
        <span>
          {cashiers.filter((c) => c.status === "active").length} akun aktif
        </span>
      </div>
      <DataTable
        headings={["Nama kasir", "Email", "Status akun", "Aksi"]}
        rows={cashiers.map((c) => [
          <div className="product-name" key="n">
            <span className="person-avatar">{c.name[0]}</span>
            <strong>{c.name}</strong>
          </div>,
          c.email,
          <Badge key="s" low={c.status === "inactive"}>
            {c.status === "active" ? "Aktif" : "Nonaktif"}
          </Badge>,
          <Button
            variant="outline"
            key="a"
            onClick={() => {
              setSelectedUser(c);
              setDialog("status");
            }}
          >
            {c.status === "active" ? "Nonaktifkan" : "Aktifkan"}
          </Button>,
        ])}
      />
    </section>
  );
}
