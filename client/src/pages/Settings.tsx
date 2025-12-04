import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import {
  User,
  Moon,
  Sun,
  LogOut,
  Key,
  Bell,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user?.profileImageUrl || undefined}
                alt={user?.firstName || "User"}
                className="object-cover"
              />
              <AvatarFallback className="text-lg">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">First Name</Label>
              <div className="font-medium">{user?.firstName || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Name</Label>
              <div className="font-medium">{user?.lastName || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="font-medium">{user?.email || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="font-medium capitalize">{user?.role || "employee"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the app looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Integration
          </CardTitle>
          <CardDescription>
            Connect your FiveM server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Each business has its own API key for FiveM integration.
            You can view and manage API keys from the Businesses page.
          </p>
          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">FiveM Integration Example</h4>
            <pre className="text-xs overflow-x-auto bg-background rounded p-3 font-mono">
{`PerformHttpRequest("YOUR_APP_URL/api/game/sales",
  function(err, text, headers)
    print("Response: " .. text)
  end,
  'POST',
  json.encode({
    businessApiKey = "YOUR_BUSINESS_API_KEY",
    buyerName = playerName,
    items = {{productId = "xxx", quantity = 1}}
  }),
  { ['Content-Type'] = 'application/json' }
)`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>
            Manage your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" asChild>
            <a href="/api/logout" data-testid="button-logout-settings">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
