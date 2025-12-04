import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Building2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import type { SaleWithRelations, Business, Product } from "@shared/schema";

interface DashboardStats {
  totalSalesToday: number;
  totalOrders: number;
  lowStockItems: number;
  totalBusinesses: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend && (
              <span className={trend.positive ? "text-chart-4" : "text-destructive"}>
                <TrendingUp className={`h-3 w-3 inline ${!trend.positive && "rotate-180"}`} />
                {trend.value}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
  testId,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  testId: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col gap-2 py-4 px-6"
      asChild
    >
      <Link href={href} data-testid={testId}>
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  );
}

function RecentSalesTable({ sales, isLoading }: { sales?: SaleWithRelations[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No sales yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Record your first sale to see it here
        </p>
        <Button asChild>
          <Link href="/sales/new" data-testid="button-first-sale">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Buyer</TableHead>
          <TableHead>Business</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
            <TableCell className="font-medium">{sale.buyerName}</TableCell>
            <TableCell>{sale.business?.name || "Unknown"}</TableCell>
            <TableCell>${parseFloat(sale.totalAmount).toLocaleString()}</TableCell>
            <TableCell>
              <Badge
                variant={sale.status === "completed" ? "default" : "secondary"}
                className="text-xs"
              >
                {sale.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {sale.createdAt
                    ? formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })
                    : "Unknown"}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LowStockAlert({ products, isLoading }: { products?: Product[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          All products are well stocked
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.slice(0, 5).map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between rounded-md border p-3"
          data-testid={`alert-low-stock-${product.id}`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-chart-5" />
            <span className="text-sm font-medium">{product.name}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {product.stock} left
          </Badge>
        </div>
      ))}
      {products.length > 5 && (
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/inventory?filter=low-stock">
            View all ({products.length}) <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentSales, isLoading: salesLoading } = useQuery<SaleWithRelations[]>({
    queryKey: ["/api/sales", { limit: 5 }],
  });

  const { data: lowStockProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { lowStock: true }],
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your businesses.
          </p>
        </div>
        <Button asChild data-testid="button-new-sale">
          <Link href="/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={`$${(stats?.totalSalesToday || 0).toLocaleString()}`}
          icon={DollarSign}
          description="from yesterday"
          trend={{ value: 12, positive: true }}
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          description="this month"
          isLoading={statsLoading}
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          icon={AlertTriangle}
          description="needs attention"
          isLoading={statsLoading}
        />
        <StatCard
          title="Businesses"
          value={stats?.totalBusinesses || 0}
          icon={Building2}
          description="active"
          isLoading={statsLoading}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <QuickActionButton
          icon={Plus}
          label="Record Sale"
          href="/sales/new"
          testId="quick-action-sale"
        />
        <QuickActionButton
          icon={Package}
          label="Add Product"
          href="/inventory/new"
          testId="quick-action-product"
        />
        <QuickActionButton
          icon={Building2}
          label="New Business"
          href="/businesses/new"
          testId="quick-action-business"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sales">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentSalesTable sales={recentSales} isLoading={salesLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Low Stock Alert</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <LowStockAlert products={lowStockProducts} isLoading={productsLoading} />
          </CardContent>
        </Card>
      </div>

      {(!businesses || businesses.length === 0) && !businessesLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No businesses yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Create your first business to start tracking sales, inventory, and invoices
            </p>
            <Button asChild data-testid="button-create-first-business">
              <Link href="/businesses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Business
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
