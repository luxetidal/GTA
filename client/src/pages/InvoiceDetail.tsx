import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  FileText,
  ArrowLeft,
  Printer,
  Download,
  Copy,
  Check,
  Clock,
  XCircle,
  Building2,
  User,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, SaleWithRelations } from "@shared/schema";

interface InvoiceWithSale extends Invoice {
  sale?: SaleWithRelations;
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceWithSale>({
    queryKey: ["/api/invoices", id],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice", variant: "destructive" });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const copyInvoiceLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Invoice link copied" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Invoice Not Found</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Invoice not found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              The invoice you're looking for doesn't exist
            </p>
            <Button onClick={() => setLocation("/invoices")}>
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              {invoice.issueDate
                ? format(new Date(invoice.issueDate), "MMMM d, yyyy")
                : "Unknown date"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyInvoiceLink}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {invoice.status === "pending" && (
            <Button
              onClick={() => updateStatusMutation.mutate("paid")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-mark-invoice-paid"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto print:shadow-none print:border-0">
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xl">
                RP
              </div>
              <div>
                <h2 className="text-xl font-semibold">GTA RP Business</h2>
                <p className="text-sm text-muted-foreground">Management System</p>
              </div>
            </div>
            <Badge variant={config.variant} className="text-sm h-8 px-4">
              <StatusIcon className="mr-2 h-4 w-4" />
              {config.label}
            </Badge>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>From</span>
              </div>
              <div className="font-medium">{invoice.sale?.business?.name || "Unknown Business"}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>To</span>
              </div>
              <div className="font-medium">{invoice.sale?.buyerName || "Unknown Buyer"}</div>
              {invoice.sale?.buyerInfo && (
                <div className="text-sm text-muted-foreground">{invoice.sale.buyerInfo}</div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 p-4 rounded-md bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Invoice Number</div>
              <div className="font-mono font-medium">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Issue Date</div>
              <div className="font-medium">
                {invoice.issueDate
                  ? format(new Date(invoice.issueDate), "MMM d, yyyy")
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="font-medium">
                {invoice.dueDate
                  ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                  : "On Receipt"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.sale?.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(item.unitPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(item.totalPrice).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex flex-col items-end space-y-4">
          <Separator />
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${parseFloat(invoice.sale?.totalAmount || "0").toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>$0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${parseFloat(invoice.sale?.totalAmount || "0").toLocaleString()}</span>
            </div>
          </div>
          {invoice.status === "paid" && invoice.paidAt && (
            <div className="text-sm text-muted-foreground">
              Paid on {format(new Date(invoice.paidAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>
          )}
        </CardFooter>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          #root * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
