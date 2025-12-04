import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Mail,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { BusinessEmployee, User, Business } from "@shared/schema";

interface EmployeeWithDetails extends BusinessEmployee {
  user?: User;
  business?: Business;
}

const addEmployeeSchema = z.object({
  businessId: z.string().min(1, "Please select a business"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["manager", "employee"]),
});

type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

function EmployeeRow({
  employee,
  onRemove,
}: {
  employee: EmployeeWithDetails;
  onRemove: () => void;
}) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <TableRow data-testid={`row-employee-${employee.id}`}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={employee.user?.profileImageUrl || undefined}
              alt={employee.user?.firstName || "Employee"}
              className="object-cover"
            />
            <AvatarFallback>
              {getInitials(employee.user?.firstName, employee.user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {employee.user?.firstName} {employee.user?.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {employee.user?.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>{employee.business?.name || "Unknown"}</TableCell>
      <TableCell>
        <Badge variant={employee.role === "manager" ? "default" : "secondary"} className="text-xs">
          {employee.role === "manager" ? "Manager" : "Employee"}
        </Badge>
      </TableCell>
      <TableCell>
        {employee.joinedAt
          ? format(new Date(employee.joinedAt), "MMM d, yyyy")
          : "Unknown"}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-employee-menu-${employee.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={onRemove}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const form = useForm<AddEmployeeForm>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      businessId: "",
      email: "",
      role: "employee",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AddEmployeeForm) => {
      return await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee added successfully" });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add employee",
        description: error.message || "User not found or already an employee",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-employee">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Add an existing user as an employee to one of your businesses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="businessId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-business">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="employee@example.com"
                      {...field}
                      data-testid="input-employee-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={addMutation.isPending}
                data-testid="button-submit-employee"
              >
                {addMutation.isPending ? "Adding..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Employees() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<EmployeeWithDetails[]>({
    queryKey: ["/api/employees"],
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove employee", variant: "destructive" });
    },
  });

  const filteredEmployees = employees?.filter((e) => {
    const name = `${e.user?.firstName || ""} ${e.user?.lastName || ""}`.toLowerCase();
    const email = e.user?.email?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-muted-foreground">
            Manage employees across your businesses
          </p>
        </div>
        <AddEmployeeDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-employees"
        />
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
      ) : filteredEmployees && filteredEmployees.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    onRemove={() => removeMutation.mutate(employee.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search ? "No employees found" : "No employees yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              {search
                ? "Try adjusting your search"
                : "Add employees to your businesses to let them record sales"}
            </p>
            {!search && <AddEmployeeDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
