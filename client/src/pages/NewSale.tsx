import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Business, Product } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products", { businessId: selectedBusinessId }],
    enabled: !!selectedBusinessId,
  });

  const filteredProducts = products?.filter(
    (p) => p.businessId === selectedBusinessId && p.isActive && (p.stock || 0) > 0
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < (product.stock || 0)) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (quantity <= 0) {
      removeFromCart(productId);
    } else if (quantity <= (item.product.stock || 0)) {
      setCart(
        cart.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const saleData = {
        businessId: selectedBusinessId,
        buyerName,
        buyerInfo,
        totalAmount: cartTotal.toString(),
        status: "completed",
        source: "web",
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: (parseFloat(item.product.price) * item.quantity).toString(),
        })),
      };
      return await apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Sale recorded successfully" });
      if (data.invoiceId) {
        setLocation(`/invoices/${data.invoiceId}`);
      } else {
        setLocation("/sales");
      }
    },
    onError: () => {
      toast({ title: "Failed to record sale", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedBusinessId) {
      toast({ title: "Please select a business", variant: "destructive" });
      return;
    }
    if (!buyerName.trim()) {
      toast({ title: "Please enter buyer name", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Please add at least one product", variant: "destructive" });
      return;
    }
    createSaleMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/sales")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Record Sale</h1>
          <p className="text-muted-foreground">
            Create a new sale and generate an invoice
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business</Label>
                <Select
                  value={selectedBusinessId}
                  onValueChange={(value) => {
                    setSelectedBusinessId(value);
                    setCart([]);
                  }}
                >
                  <SelectTrigger id="business" data-testid="select-sale-business">
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses?.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buyerName">Buyer Name</Label>
                  <Input
                    id="buyerName"
                    placeholder="Enter buyer's name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    data-testid="input-buyer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerInfo">Additional Info (Optional)</Label>
                  <Input
                    id="buyerInfo"
                    placeholder="Phone number, notes, etc."
                    value={buyerInfo}
                    onChange={(e) => setBuyerInfo(e.target.value)}
                    data-testid="input-buyer-info"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Products</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedBusinessId ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select a business to view available products
                  </p>
                </div>
              ) : !filteredProducts || filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No products available for this business
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const inCart = cart.find((i) => i.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-md border p-3 hover-elevate"
                        data-testid={`product-item-${product.id}`}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>${parseFloat(product.price).toLocaleString()}</span>
                            <span>·</span>
                            <span>{product.stock} in stock</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={inCart ? "secondary" : "default"}
                          onClick={() => addToCart(product)}
                          disabled={(product.stock || 0) === 0}
                          data-testid={`button-add-${product.id}`}
                        >
                          {inCart ? (
                            <span>Added ({inCart.quantity})</span>
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No items in cart
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3"
                      data-testid={`cart-item-${item.product.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${parseFloat(item.product.price).toLocaleString()} each
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product.stock || 0)}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span>
                          ${(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || !buyerName.trim() || createSaleMutation.isPending}
                onClick={handleSubmit}
                data-testid="button-complete-sale"
              >
                {createSaleMutation.isPending ? "Processing..." : "Complete Sale & Generate Invoice"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
