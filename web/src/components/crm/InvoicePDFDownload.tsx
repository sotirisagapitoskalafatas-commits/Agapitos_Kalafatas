"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const BlobProvider = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.BlobProvider),
  { ssr: false }
);

import InvoicePDF, {
  InvoiceData,
  CompanyDetails,
} from "./InvoicePDF";

const defaultCompany: CompanyDetails = {
  company_name: "Agapitos Kalafatas",
  vat_number: "",
  tax_office: "",
  address: "",
  bank_iban: "",
};

export default function InvoicePDFDownload({
  invoice,
  company,
}: {
  invoice: InvoiceData;
  company?: CompanyDetails;
}) {
  const data = company || defaultCompany;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <button
        disabled
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-400 font-medium cursor-wait"
      >
        Loading...
      </button>
    );
  }

  return (
    <BlobProvider document={<InvoicePDF invoice={invoice} company={data} />}>
      {({ blob, url, loading, error }) => {
        if (loading) {
          return (
            <button
              disabled
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-400 font-medium cursor-wait"
            >
              Generating...
            </button>
          );
        }

        if (error) {
          return (
            <button
              disabled
              className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-500 font-medium"
            >
              Error
            </button>
          );
        }

        return (
          <a
            href={url || "#"}
            download={`${invoice.invoice_number}.pdf`}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </a>
        );
      }}
    </BlobProvider>
  );
}
