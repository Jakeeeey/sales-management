"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "./SearchableSelect";
import {
  Customer,
  CustomerClassification,
  Supplier,
  Product,
  Unit,
  CustomerTargetFormData,
} from "../types";
import { PlusCircle, RotateCcw, Target, CalendarDays, Building2, Package, Sparkles } from "lucide-react";

interface CustomerTargetFormCardProps {
  formData: CustomerTargetFormData;
  submitting: boolean;
  customers: Customer[];
  filteredCustomers: Customer[];
  classifications: CustomerClassification[];
  suppliers: Supplier[];
  products: Product[];
  filteredProducts: Product[];
  units: Unit[];
  availableUnits: Unit[];
  onCustomerChange: (val: string) => void;
  onClassificationChange: (val: string) => void;
  onSupplierChange: (val: string) => void;
  onProductChange: (val: string) => void;
  onUomChange: (val: string) => void;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onQtyChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function CustomerTargetFormCard({
  formData,
  submitting,
  filteredCustomers,
  classifications,
  suppliers,
  filteredProducts,
  availableUnits,
  onCustomerChange,
  onClassificationChange,
  onSupplierChange,
  onProductChange,
  onUomChange,
  onDateFromChange,
  onDateToChange,
  onQtyChange,
  onSubmit,
  onReset,
}: CustomerTargetFormCardProps) {
  // Prep customer options
  const customerOptions = React.useMemo(() => {
    return filteredCustomers.map((c) => ({
      value: String(c.id),
      label: c.customer_name || `Customer #${c.id}`,
      subLabel: [c.customer_code, c.city, c.province].filter(Boolean).join(" • "),
    }));
  }, [filteredCustomers]);

  // Prep classification options
  const classificationOptions = React.useMemo(() => {
    return classifications.map((cls) => ({
      value: String(cls.id),
      label: cls.classification_name,
    }));
  }, [classifications]);

  // Prep supplier options
  const supplierOptions = React.useMemo(() => {
    return suppliers.map((s) => ({
      value: String(s.id),
      label: s.supplier_name,
      subLabel: s.supplier_shortcut || s.supplier_type || undefined,
    }));
  }, [suppliers]);

  // Prep product options - filtered by selected supplier
  const productOptions = React.useMemo(() => {
    return filteredProducts.map((p) => ({
      value: String(p.product_id),
      label: p.product_name,
      subLabel: p.product_code ? `Code: ${p.product_code}` : undefined,
    }));
  }, [filteredProducts]);

  // Prep UOM options - only available units for the selected product/variant
  const uomOptions = React.useMemo(() => {
    return availableUnits.map((u) => ({
      value: String(u.unit_id),
      label: u.unit_name,
      subLabel: u.unit_shortcut ? `${u.unit_shortcut}` : undefined,
    }));
  }, [availableUnits]);

  return (
    <Card className="border border-border/80 shadow-sm bg-card text-card-foreground dark:border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                <Target className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Set Customer Target per Product
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Define product target quantities per customer, filtered by classification, supplier, and measurement units.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Form
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Section 1: Customer & Classification */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              Customer & Classification
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Classification */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Customer Classification
                  </Label>
                  {formData.classification_id && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Filtering customers
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={classificationOptions}
                  value={formData.classification_id}
                  onValueChange={onClassificationChange}
                  placeholder="Select classification..."
                  searchPlaceholder="Search classification..."
                  allowClear={true}
                />
              </div>

              {/* Customer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Customer <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {filteredCustomers.length} available
                  </span>
                </div>
                <SearchableSelect
                  options={customerOptions}
                  value={formData.customer_id}
                  onValueChange={onCustomerChange}
                  placeholder="Select customer..."
                  searchPlaceholder="Search customer name or code..."
                  allowClear={true}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Supplier, Product & UOM */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Package className="h-3.5 w-3.5" />
              Product & Supplier Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supplier */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Supplier</Label>
                <SearchableSelect
                  options={supplierOptions}
                  value={formData.supplier_id}
                  onValueChange={onSupplierChange}
                  placeholder="Select supplier..."
                  searchPlaceholder="Search supplier..."
                  allowClear={true}
                />
              </div>

              {/* Product */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">Product</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {filteredProducts.length} available
                  </span>
                </div>
                <SearchableSelect
                  options={productOptions}
                  value={formData.product_id}
                  onValueChange={onProductChange}
                  placeholder={
                    formData.supplier_id
                      ? "Select supplier product..."
                      : "Select product..."
                  }
                  searchPlaceholder="Search product name or code..."
                  allowClear={true}
                />
              </div>

              {/* Unit of Measurement */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Unit of Measurement (UOM)</Label>
                <SearchableSelect
                  options={uomOptions}
                  value={formData.uom_id}
                  onValueChange={onUomChange}
                  placeholder="Select UOM..."
                  searchPlaceholder="Search unit of measure..."
                  allowClear={true}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Period & Target Quantity */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <CalendarDays className="h-3.5 w-3.5" />
              Target Period & Quantity
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date From */}
              <div className="space-y-1.5">
                <Label htmlFor="date_from" className="text-xs font-medium text-foreground">
                  Date From <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_from"
                  type="date"
                  value={formData.date_from}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="h-9 text-sm bg-background dark:bg-zinc-950 dark:border-zinc-800"
                  required
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <Label htmlFor="date_to" className="text-xs font-medium text-foreground">
                  Date To <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_to"
                  type="date"
                  value={formData.date_to}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="h-9 text-sm bg-background dark:bg-zinc-950 dark:border-zinc-800"
                  required
                />
              </div>

              {/* Target Qty */}
              <div className="space-y-1.5">
                <Label htmlFor="qty" className="text-xs font-medium text-foreground">
                  Target Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="e.g. 100.0000"
                  value={formData.qty}
                  onChange={(e) => onQtyChange(e.target.value)}
                  className="h-9 text-sm bg-background dark:bg-zinc-950 dark:border-zinc-800 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting || !formData.customer_id || !formData.date_from || !formData.date_to || !formData.qty}
              className="gap-2 font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? "Saving Target..." : "Save Customer Target"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
