"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerTargetRecord, Supplier, CustomerClassification } from "../types";
import { Search, Trash2, Calendar, Database, Filter } from "lucide-react";
import { SearchableSelect } from "./SearchableSelect";

interface CustomerTargetTableProps {
  targets: CustomerTargetRecord[];
  allTargetsCount: number;
  loading: boolean;
  deletingId: number | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterSupplier: string;
  onFilterSupplierChange: (val: string) => void;
  filterClassification: string;
  onFilterClassificationChange: (val: string) => void;
  suppliers: Supplier[];
  classifications: CustomerClassification[];
  onDeleteTarget: (id: number) => void;
}

export function CustomerTargetTable({
  targets,
  allTargetsCount,
  loading,
  deletingId,
  searchTerm,
  onSearchChange,
  filterSupplier,
  onFilterSupplierChange,
  filterClassification,
  onFilterClassificationChange,
  suppliers,
  classifications,
  onDeleteTarget,
}: CustomerTargetTableProps) {
  const supplierFilterOptions = React.useMemo(() => {
    return suppliers.map((s) => ({
      value: String(s.id),
      label: s.supplier_name,
    }));
  }, [suppliers]);

  const classificationFilterOptions = React.useMemo(() => {
    return classifications.map((cls) => ({
      value: String(cls.id),
      label: cls.classification_name,
    }));
  }, [classifications]);

  return (
    <Card className="border border-border/80 shadow-sm bg-card text-card-foreground dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                <Database className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Customer Targets List
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {targets.length} of {allTargetsCount}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Review and manage all recorded customer targets per product.
            </CardDescription>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search targets..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-xs bg-background dark:bg-zinc-950 dark:border-zinc-800"
              />
            </div>
            <div className="w-48">
              <SearchableSelect
                options={supplierFilterOptions}
                value={filterSupplier}
                onValueChange={onFilterSupplierChange}
                placeholder="Filter by Supplier"
                searchPlaceholder="Search supplier..."
                allowClear={true}
              />
            </div>
            <div className="w-48">
              <SearchableSelect
                options={classificationFilterOptions}
                value={filterClassification}
                onValueChange={onFilterClassificationChange}
                placeholder="Filter by Class"
                searchPlaceholder="Search classification..."
                allowClear={true}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/70 overflow-hidden dark:border-zinc-800">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-zinc-900/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-xs font-semibold">Customer</TableHead>
                <TableHead className="text-xs font-semibold">Classification</TableHead>
                <TableHead className="text-xs font-semibold">Supplier</TableHead>
                <TableHead className="text-xs font-semibold">Product</TableHead>
                <TableHead className="text-xs font-semibold">UOM</TableHead>
                <TableHead className="text-xs font-semibold">Target Period</TableHead>
                <TableHead className="text-right text-xs font-semibold">Target Qty</TableHead>
                <TableHead className="w-[80px] text-center text-xs font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                      <span className="text-xs">Loading customer targets...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : targets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Filter className="h-5 w-5 text-muted-foreground/60" />
                      <span className="text-sm font-medium">No customer targets found</span>
                      <span className="text-xs text-muted-foreground">
                        Try clearing search filters or create a new target using the form above.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                targets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40 dark:hover:bg-zinc-900/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-xs text-foreground truncate max-w-[200px]" title={t.customer_name}>
                        {t.customer_name}
                      </div>
                      {t.customer_code && t.customer_code !== "-" && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {t.customer_code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.classification_name && t.classification_name !== "-" ? (
                        <Badge variant="outline" className="text-[11px] font-normal py-0">
                          {t.classification_name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-foreground truncate max-w-[160px]" title={t.supplier_name}>
                        {t.supplier_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground truncate max-w-[200px]" title={t.product_name}>
                        {t.product_name}
                      </div>
                      {t.product_code && t.product_code !== "-" && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {t.product_code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{t.uom_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{t.date_from}</span>
                        <span>→</span>
                        <span>{t.date_to}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-xs font-mono text-primary">
                        {Number(t.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Target"
                        disabled={deletingId === t.id}
                        onClick={() => onDeleteTarget(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
