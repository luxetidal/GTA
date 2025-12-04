import { Building2, ShoppingCart, FileText, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Building2,
    title: "Business Management",
    description: "Create and manage multiple GTA RP businesses including dealerships, stores, and more.",
  },
  {
    icon: ShoppingCart,
    title: "Sales Recording",
    description: "Track every sale with detailed buyer information and generate instant invoices.",
  },
  {
    icon: FileText,
    title: "Invoice Generation",
    description: "Create professional invoices that can be shared in-game or printed for records.",
  },
  {
    icon: Users,
    title: "Employee Tracking",
    description: "Assign employees to businesses and track their sales performance.",
  },
];

const benefits = [
  "Real-time inventory management",
  "FiveM server integration via API",
  "Role-based access control",
  "Detailed sales reports",
  "Multi-business support",
  "Mobile-friendly dashboard",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
              RP
            </div>
            <span className="text-lg font-semibold">GTA RP Business</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/login">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Manage Your{" "}
                <span className="text-primary">GTA RP Businesses</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                The complete business management solution for GTA roleplay servers.
                Track sales, manage inventory, and generate invoices with seamless
                FiveM integration.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/login">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Everything You Need
              </h2>
              <p className="mt-4 text-muted-foreground">
                Powerful features to manage your in-game businesses efficiently
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border-card-border">
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Built for GTA RP Servers
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Our platform is specifically designed for FiveM and GTA roleplay
                  servers. Integrate directly with your game server using our
                  simple API to record sales automatically from in-game transactions.
                </p>
                <ul className="mt-8 space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <Card className="border-card-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-sidebar p-4 border-b">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-destructive/60" />
                        <div className="h-3 w-3 rounded-full bg-chart-5/60" />
                        <div className="h-3 w-3 rounded-full bg-chart-4/60" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Today's Sales</span>
                          <span className="text-2xl font-semibold text-primary">$24,580</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 w-3/4 rounded-full bg-primary" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="text-center">
                            <div className="text-xl font-semibold">47</div>
                            <div className="text-xs text-muted-foreground">Orders</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-semibold">12</div>
                            <div className="text-xs text-muted-foreground">Products</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-semibold">3</div>
                            <div className="text-xs text-muted-foreground">Businesses</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sign up now and start managing your GTA RP businesses like a pro
            </p>
            <Button size="lg" className="mt-8" asChild data-testid="button-signup">
              <a href="/login">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
                RP
              </div>
              <span className="text-sm font-medium">GTA RP Business Manager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for the roleplay community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
