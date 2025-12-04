import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithBusiness, Business } from "@shared/schema";

const createProductSchema = z.object({
  businessId: z.string().min(1, "Please select a business"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  stock: z.string().min(1, "Stock quantity is required"),
  category: z.string().optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

const LOW_STOCK_THRESHOLD = 5;

function ProductRow({
  product,
  onDelete,
}: {
  product: ProductWithBusiness;
  onDelete: () => void;
}) {
  const isLowStock = (product.stock || 0) <= LOW_STOCK_THRESHOLD;

  return (
    <TableRow data-testid={`row-product-${product.id}`}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{product.name}</div>
            {product.category && (
              <Badge variant="secondary" className="text-xs mt-1">
                {product.category}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{product.business?.name || "Unknown"}</TableCell>
      <TableCell>${parseFloat(product.price).toLocaleString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isLowStock && (
            <AlertTriangle className="h-4 w-4 text-chart-5" />
          )}
          <span className={isLowStock ? "text-chart-5 font-medium" : ""}>
            {product.stock}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-product-menu-${product.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/inventory/${product.id}`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      businessId: "",
      name: "",
      description: "",
      price: "",
      stock: "0",
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductForm) => {
      return await apiRequest("POST", "/api/products", {
        ...data,
        price: data.price,
        stock: parseInt(data.stock),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-product">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="businessId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-product-business">
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businesses?.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Elegy RH8"
                      {...field}
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="50000"
                        {...field}
                        data-testid="input-product-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        data-testid="input-product-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sports Cars"
                      {...field}
                      data-testid="input-product-category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description..."
                      {...field}
                      data-testid="input-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-product"
              >
                {createMutation.isPending ? "Creating..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low-stock">("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<ProductWithBusiness[]>({
    queryKey: ["/api/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "low-stock" && (p.stock || 0) <= LOW_STOCK_THRESHOLD);
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products?.filter((p) => (p.stock || 0) <= LOW_STOCK_THRESHOLD).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage products across all your businesses
          </p>
        </div>
        <CreateProductDialog />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={filter === "low-stock" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low-stock")}
            data-testid="filter-low-stock"
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Low Stock ({lowStockCount})
          </Button>
        </div>
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
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onDelete={() => deleteMutation.mutate(product.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search || filter !== "all" ? "No products found" : "No products yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              {search || filter !== "all"
                ? "Try adjusting your search or filter"
                : "Add your first product to start tracking inventory"}
            </p>
            {!search && filter === "all" && <CreateProductDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
