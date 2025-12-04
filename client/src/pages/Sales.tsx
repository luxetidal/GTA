import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  FileText,
  Filter,
  Calendar,
  ArrowUpDown,
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
import type { SaleWithRelations, Business } from "@shared/schema";

function SaleRow({ sale }: { sale: SaleWithRelations }) {
  const statusVariant = {
    completed: "default" as const,
    pending: "secondary" as const,
    cancelled: "destructive" as const,
  };

  return (
    <TableRow data-testid={`row-sale-${sale.id}`}>
      <TableCell>
        <div className="font-medium">{sale.buyerName}</div>
        {sale.buyerInfo && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
            {sale.buyerInfo}
          </div>
        )}
      </TableCell>
      <TableCell>{sale.business?.name || "Unknown"}</TableCell>
      <TableCell>
        <div className="font-medium">${parseFloat(sale.totalAmount).toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">
          {sale.items?.length || 0} item(s)
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[sale.status || "completed"]} className="text-xs">
          {sale.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {sale.source === "game" ? "In-Game" : "Web"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {sale.createdAt ? format(new Date(sale.createdAt), "MMM d, yyyy") : "Unknown"}
        </div>
        <div className="text-xs text-muted-foreground">
          {sale.createdAt ? format(new Date(sale.createdAt), "h:mm a") : ""}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/sales/${sale.id}`} data-testid={`button-view-sale-${sale.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {sale.invoice && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/invoices/${sale.invoice.id}`} data-testid={`button-view-invoice-${sale.id}`}>
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Sales() {
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: sales, isLoading: salesLoading } = useQuery<SaleWithRelations[]>({
    queryKey: ["/api/sales"],
  });

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const filteredSales = sales?.filter((s) => {
    const matchesSearch =
      s.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      s.buyerInfo?.toLowerCase().includes(search.toLowerCase());
    const matchesBusiness =
      businessFilter === "all" || s.businessId === businessFilter;
    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesBusiness && matchesStatus;
  });

  const totalRevenue = filteredSales?.reduce(
    (sum, s) => sum + parseFloat(s.totalAmount),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-muted-foreground">
            Track and manage all your sales
          </p>
        </div>
        <Button asChild data-testid="button-new-sale">
          <Link href="/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{filteredSales?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {filteredSales?.filter((s) => s.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-sales"
          />
        </div>
        <Select value={businessFilter} onValueChange={setBusinessFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-business">
            <SelectValue placeholder="Filter by business" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {businesses?.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                {business.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {salesLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredSales && filteredSales.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search || businessFilter !== "all" || statusFilter !== "all"
                ? "No sales found"
                : "No sales yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              {search || businessFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Record your first sale to see it here"}
            </p>
            {!search && businessFilter === "all" && statusFilter === "all" && (
              <Button asChild>
                <Link href="/sales/new" data-testid="button-first-sale">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Sale
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
