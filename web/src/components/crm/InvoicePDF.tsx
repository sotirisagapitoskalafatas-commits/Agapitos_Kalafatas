"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const COLORS = {
  primary: "#6366f1",
  primaryLight: "#e0e7ff",
  dark: "#1e293b",
  gray: "#64748b",
  lightGray: "#e2e8f0",
  white: "#ffffff",
  bg: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
    padding: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: COLORS.gray,
    lineHeight: 1.6,
  },

  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 9,
    color: COLORS.gray,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  metaBox: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.dark,
    lineHeight: 1.6,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.lightGray,
  },
  tableRowAlt: {
    backgroundColor: COLORS.bg,
  },
  cellDesc: { width: "50%" },
  cellQty: { width: "12%", textAlign: "center" },
  cellPrice: { width: "18%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right", fontWeight: "bold" },

  totals: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 250,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },
  totalsValue: {
    fontSize: 10,
    color: COLORS.dark,
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginVertical: 6,
  },
  totalsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalsTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  totalsTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  footer: {
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 9,
    color: COLORS.gray,
    lineHeight: 1.6,
  },
  notesSection: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.gray,
    lineHeight: 1.5,
  },

  badge: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  pageFooter: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
  },
  pageFooterText: {
    fontSize: 7,
    color: COLORS.gray,
  },
});

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  items: InvoiceItem[];
  notes: string;
  valid_until: string | null;
  created_at: string;
  leads?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface CompanyDetails {
  company_name: string;
  vat_number: string;
  tax_office: string;
  address: string;
  bank_iban: string;
}

export default function InvoicePDF({
  invoice,
  company,
}: {
  invoice: InvoiceData;
  company: CompanyDetails;
}) {
  const fmt = (n: number) =>
    `€${n.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const typeLabel =
    invoice.type === "quote"
      ? "ΠΡΟΣΦΟΡΑ"
      : invoice.type === "proforma"
      ? "ΠΡΟΦΟΡΜΑ"
      : "ΤΙΜΟΛΟΓΙΟ";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.company_name}</Text>
            <Text style={styles.companyDetail}>{company.address}</Text>
            <Text style={styles.companyDetail}>
              ΑΦΜ: {company.vat_number}
            </Text>
            <Text style={styles.companyDetail}>
              ΔΟΥ: {company.tax_office}
            </Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>{typeLabel}</Text>
            <Text style={styles.invoiceNumber}>
              No. {invoice.invoice_number}
            </Text>
            <Text style={styles.invoiceDate}>
              Date:{" "}
              {new Date(invoice.created_at).toLocaleDateString("el-GR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
            {invoice.valid_until && (
              <Text style={styles.invoiceDate}>
                Valid until:{" "}
                {new Date(invoice.valid_until).toLocaleDateString("el-GR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Status Badge */}
        <Text style={styles.badge}>Status: {invoice.status.toUpperCase()}</Text>

        {/* Client & Invoice Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaValue}>
              {invoice.leads
                ? `${invoice.leads.first_name} ${invoice.leads.last_name}`
                : "N/A"}
            </Text>
            {invoice.leads?.email && (
              <Text style={styles.metaValue}>{invoice.leads.email}</Text>
            )}
            {invoice.leads?.phone && (
              <Text style={styles.metaValue}>{invoice.leads.phone}</Text>
            )}
          </View>
          <View style={[styles.metaBox, { alignItems: "flex-end" }]}>
            <Text style={styles.metaLabel}>Invoice Details</Text>
            <Text style={styles.metaValue}>
              Currency: {invoice.currency || "EUR"}
            </Text>
            <Text style={styles.metaValue}>Tax Rate: {invoice.tax_rate}%</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.cellDesc]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.cellPrice]}>
            Unit Price
          </Text>
          <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              i % 2 === 1 ? styles.tableRowAlt : {},
            ]}
          >
            <Text style={styles.cellDesc}>{item.description}</Text>
            <Text style={styles.cellQty}>{item.quantity}</Text>
            <Text style={styles.cellPrice}>{fmt(item.unit_price)}</Text>
            <Text style={styles.cellTotal}>
              {fmt(item.quantity * item.unit_price)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmt(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                VAT ({invoice.tax_rate}%)
              </Text>
              <Text style={styles.totalsValue}>{fmt(invoice.tax_amount)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsTotalRow}>
              <Text style={styles.totalsTotalLabel}>Total</Text>
              <Text style={styles.totalsTotalValue}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Bank Details */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Bank Details</Text>
          <Text style={styles.footerText}>
            IBAN: {company.bank_iban}
          </Text>
          <Text style={styles.footerText}>
            Beneficiary: {company.company_name}
          </Text>
        </View>

        {/* Page Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>
            {company.company_name} | {company.address}
          </Text>
          <Text style={styles.pageFooterText}>
            {invoice.invoice_number}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
