"use client";

import * as React from "react";
import { useCustomerTarget } from "./hooks/useCustomerTarget";
import { CustomerTargetFormCard } from "./components/CustomerTargetFormCard";
import { CustomerTargetTable } from "./components/CustomerTargetTable";
import { Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerTargetModule() {
  const {
    loading,
    submitting,
    deletingId,
    formData,
    setFormData,
    customers,
    filteredCustomers,
    classifications,
    suppliers,
    products,
    filteredProducts,
    units,
    targets,
    allTargetsCount,
    searchTerm,
    setSearchTerm,
    filterSupplier,
    setFilterSupplier,
    filterClassification,
    setFilterClassification,
    availableUnits,
    handleCustomerChange,
    handleClassificationChange,
    handleSupplierChange,
    handleProductChange,
    handleUomChange,
    handleSubmit,
    handleDeleteTarget,
    refreshData,
  } = useCustomerTarget();

  const handleReset = () => {
    setFormData({
      customer_id: "",
      classification_id: "",
      supplier_id: "",
      product_id: "",
      date_from: "",
      date_to: "",
      uom_id: "",
      qty: "",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Target className="h-6 w-6 text-primary" />
            Customer Target per Product
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure sales target volume for customers based on product categories, suppliers, and unit of measurements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Target Setting Form */}
      <CustomerTargetFormCard
        formData={formData}
        submitting={submitting}
        customers={customers}
        filteredCustomers={filteredCustomers}
        classifications={classifications}
        suppliers={suppliers}
        products={products}
        filteredProducts={filteredProducts}
        units={units}
        availableUnits={availableUnits}
        onCustomerChange={handleCustomerChange}
        onClassificationChange={handleClassificationChange}
        onSupplierChange={handleSupplierChange}
        onProductChange={handleProductChange}
        onUomChange={handleUomChange}
        onDateFromChange={(val) => setFormData((prev) => ({ ...prev, date_from: val }))}
        onDateToChange={(val) => setFormData((prev) => ({ ...prev, date_to: val }))}
        onQtyChange={(val) => setFormData((prev) => ({ ...prev, qty: val }))}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      {/* Targets Table */}
      <CustomerTargetTable
        targets={targets}
        allTargetsCount={allTargetsCount}
        loading={loading}
        deletingId={deletingId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterSupplier={filterSupplier}
        onFilterSupplierChange={setFilterSupplier}
        filterClassification={filterClassification}
        onFilterClassificationChange={setFilterClassification}
        suppliers={suppliers}
        classifications={classifications}
        onDeleteTarget={handleDeleteTarget}
      />
    </div>
  );
}
