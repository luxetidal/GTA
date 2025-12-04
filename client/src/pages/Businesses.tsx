import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Package,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
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
import type { BusinessWithRelations } from "@shared/schema";

const businessTypes = [
  { value: "dealership", label: "Dealership" },
  { value: "store", label: "Store" },
  { value: "restaurant", label: "Restaurant" },
  { value: "garage", label: "Garage" },
  { value: "nightclub", label: "Nightclub" },
  { value: "other", label: "Other" },
];

const createBusinessSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["dealership", "store", "restaurant", "garage", "nightclub", "other"]),
  description: z.string().optional(),
});

type CreateBusinessForm = z.infer<typeof createBusinessSchema>;

function BusinessCard({ business }: { business: BusinessWithRelations }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/businesses/${business.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "Business deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete business", variant: "destructive" });
    },
  });

  const copyApiKey = async () => {
    if (business.apiKey) {
      await navigator.clipboard.writeText(business.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "API key copied to clipboard" });
    }
  };

  const typeLabel = businessTypes.find((t) => t.value === business.type)?.label || business.type;

  return (
    <Card className="hover-elevate" data-testid={`card-business-${business.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{business.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
              {business.isActive ? (
                <Badge className="text-xs bg-chart-4/20 text-chart-4">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-business-menu-${business.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/businesses/${business.id}`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowApiKey(true)}>
              <Key className="h-4 w-4 mr-2" />
              View API Key
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {business.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {business.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{business.employees?.length || 0} employees</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{business.products?.length || 0} products</span>
          </div>
        </div>
      </CardContent>

      <Dialog open={showApiKey} onOpenChange={setShowApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key for {business.name}</DialogTitle>
            <DialogDescription>
              Use this key to authenticate requests from your FiveM server.
              Keep it secret and never share it publicly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
              {business.apiKey || "No API key generated"}
            </code>
            {business.apiKey && (
              <Button variant="outline" size="icon" onClick={copyApiKey}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKey(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CreateBusinessDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateBusinessForm>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      type: "store",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateBusinessForm) => {
      return await apiRequest("POST", "/api/businesses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "Business created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create business", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-business">
          <Plus className="mr-2 h-4 w-4" />
          Create Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Business</DialogTitle>
          <DialogDescription>
            Add a new business to manage. You can configure products and employees after creation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premium Dealership"
                      {...field}
                      data-testid="input-business-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-business-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your business..."
                      {...field}
                      data-testid="input-business-description"
                    />
                  </FormControl>
                  <FormDescription>
                    This will be visible in your business list.
                  </FormDescription>
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
                data-testid="button-submit-business"
              >
                {createMutation.isPending ? "Creating..." : "Create Business"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Businesses() {
  const [search, setSearch] = useState("");

  const { data: businesses, isLoading } = useQuery<BusinessWithRelations[]>({
    queryKey: ["/api/businesses"],
  });

  const filteredBusinesses = businesses?.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Businesses</h1>
          <p className="text-muted-foreground">
            Manage your GTA RP businesses
          </p>
        </div>
        <CreateBusinessDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-businesses"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBusinesses && filteredBusinesses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search ? "No businesses found" : "No businesses yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              {search
                ? "Try adjusting your search"
                : "Create your first business to start managing sales and inventory"}
            </p>
            {!search && <CreateBusinessDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
