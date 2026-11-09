"use client";
import { Plus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/types";
import { Empty } from "@/components/shared/feedback";
import { useWorkspace } from "@/components/workspace/use-workspace";
import { CashierSale } from "@/components/cashier/sale";
import { ReceiptView } from "@/components/cashier/receipt";
import { ProductStockPage } from "@/components/products/product-stock-page";
import { OverviewPage } from "@/components/reports/overview-page";
import { ReportsPage } from "@/components/reports/reports-page";
import { TransactionsPage } from "@/components/transactions/transactions-page";
import { CashiersPage } from "@/components/cashiers/cashiers-page";
import { WorkspaceDialogs } from "@/components/workspace/workspace-dialogs";

export function Workspace({ path, user }: { path: string; user: User }) {
  const state = useWorkspace({ path, user });
  const {
    receipt,
    productPage,
    open,
    stockPage,
    error,
    setError,
    title,
    subtitle,
    accountPage,
    toast,
    loading,
    products,
    refresh,
    isCash,
    isSuccess,
    overview,
    reports,
  } = state;
  return (
    <div className="workspace">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            {user.role === "admin" ? "KELOLA TOKO" : "LAYANI PELANGGAN"}
          </span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {productPage && (
          <Button className="primary" onClick={() => open("product")}>
            <Plus size={17} />
            Tambah Produk
          </Button>
        )}
        {accountPage && (
          <Button className="primary" onClick={() => open("cashier")}>
            <Plus size={17} />
            Tambah Akun Kasir
          </Button>
        )}
      </header>
      {error && (
        <div className="error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Tutup pesan">
            ×
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {loading ? (
        <div className="skeleton-grid" aria-label="Memuat data">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div className="skeleton" key={n} />
          ))}
        </div>
      ) : error && !products.length ? (
        <div className="panel">
          <Empty title="Data belum dapat dimuat">
            Periksa koneksi layanan toko, lalu coba kembali.
          </Empty>
          <Button onClick={refresh}>Coba lagi</Button>
        </div>
      ) : (
        <>
          {isCash && <CashierSale {...state} />}
          {(isSuccess || (receipt && isCash)) && <ReceiptView {...state} />}
          {(productPage || stockPage) && <ProductStockPage {...state} />}
          {overview && <OverviewPage {...state} />}
          {reports && <ReportsPage {...state} />}
          {!isCash &&
            !isSuccess &&
            !productPage &&
            !stockPage &&
            !overview &&
            !reports &&
            !accountPage && <TransactionsPage {...state} />}
          {accountPage && <CashiersPage {...state} />}
        </>
      )}
      <WorkspaceDialogs {...state} />
    </div>
  );
}
