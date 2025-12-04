import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileText,
  Search,
  Eye,
  Check,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, SaleWithRelations } from "@shared/schema";

interface InvoiceWithSale extends Invoice {
  sale?: SaleWithRelations;
}

function InvoiceRow({ invoice }: { invoice: InvoiceWithSale }) {
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/invoices/${invoice.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice", variant: "destructive" });
    },
  });

  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      icon: Clock,
      label: "Pending",
    },
    paid: {
      variant: "default" as const,
      icon: Check,
      label: "Paid",
    },
    cancelled: {
      variant: "destructive" as const,
      icon: XCircle,
      label: "Cancelled",
    },
  };

  const config = statusConfig[invoice.status || "pending"];
  const StatusIcon = config.icon;

  return (
    <TableRow data-testid={`row-invoice-${invoice.id}`}>
      <TableCell>
        <div className="font-mono text-sm">{invoice.invoiceNumber}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{invoice.sale?.buyerName || "Unknown"}</div>
        <div className="text-xs text-muted-foreground">
          {invoice.sale?.business?.name || "Unknown Business"}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          ${parseFloat(invoice.sale?.totalAmount || "0").toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={config.variant} className="text-xs">
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {invoice.issueDate ? format(new Date(invoice.issueDate), "MMM d, yyyy") : "Unknown"}
        </div>
      </TableCell>
      <TableCell>
        {invoice.dueDate ? (
          <div className="text-sm">
            {format(new Date(invoice.dueDate), "MMM d, yyyy")}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/invoices/${invoice.id}`} data-testid={`button-view-invoice-${invoice.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {invoice.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateStatusMutation.mutate("paid")}
              disabled={updateStatusMutation.isPending}
              data-testid={`button-mark-paid-${invoice.id}`}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useQuery<InvoiceWithSale[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredInvoices = invoices?.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.sale?.buyerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = invoices?.filter((i) => i.status === "pending").length || 0;
  const paidCount = invoices?.filter((i) => i.status === "paid").length || 0;
  const totalPending = invoices
    ?.filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + parseFloat(i.sale?.totalAmount || "0"), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track all your invoices
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              ${totalPending.toLocaleString()} outstanding
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{paidCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-invoice-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices && filteredInvoices.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Invoices are automatically created when you record a sale"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
