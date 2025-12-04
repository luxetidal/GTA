import {
  users,
  businesses,
  businessEmployees,
  products,
  sales,
  saleItems,
  invoices,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type BusinessEmployee,
  type InsertBusinessEmployee,
  type Product,
  type InsertProduct,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type Invoice,
  type InsertInvoice,
  type BusinessWithRelations,
  type SaleWithRelations,
  type ProductWithBusiness,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Business operations
  getBusinesses(userId: string): Promise<BusinessWithRelations[]>;
  getBusiness(id: string): Promise<BusinessWithRelations | undefined>;
  getBusinessByApiKey(apiKey: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness & { ownerId: string }): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;
  deleteBusiness(id: string): Promise<void>;

  // Employee operations
  getEmployees(userId: string): Promise<(BusinessEmployee & { user?: User; business?: Business })[]>;
  addEmployee(employee: InsertBusinessEmployee): Promise<BusinessEmployee>;
  removeEmployee(id: string): Promise<void>;

  // Product operations
  getProducts(userId: string): Promise<ProductWithBusiness[]>;
  getProductsByBusiness(businessId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getLowStockProducts(userId: string, threshold?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Sales operations
  getSales(userId: string): Promise<SaleWithRelations[]>;
  getSale(id: string): Promise<SaleWithRelations | undefined>;
  createSale(
    sale: InsertSale,
    items: Omit<InsertSaleItem, "saleId">[]
  ): Promise<{ sale: Sale; invoice: Invoice }>;

  // Invoice operations
  getInvoices(userId: string): Promise<(Invoice & { sale?: SaleWithRelations })[]>;
  getInvoice(id: string): Promise<(Invoice & { sale?: SaleWithRelations }) | undefined>;
  updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | undefined>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalSalesToday: number;
    totalOrders: number;
    lowStockItems: number;
    totalBusinesses: number;
  }>;

  // Authorization helpers
  isUserAuthorizedForBusiness(userId: string, businessId: string): Promise<boolean>;
  
  // Get employee by ID (for authorization checks)
  getEmployeeById(id: string): Promise<(BusinessEmployee & { user?: User; business?: Business }) | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Business operations
  async getBusinesses(userId: string): Promise<BusinessWithRelations[]> {
    const ownedBusinesses = await db.query.businesses.findMany({
      where: eq(businesses.ownerId, userId),
      with: {
        owner: true,
        employees: {
          with: {
            user: true,
          },
        },
        products: true,
      },
    });

    // Also get businesses where user is an employee
    const employeeRecords = await db.query.businessEmployees.findMany({
      where: eq(businessEmployees.userId, userId),
      with: {
        business: {
          with: {
            owner: true,
            employees: {
              with: {
                user: true,
              },
            },
            products: true,
          },
        },
      },
    });

    const employeeBusinesses = employeeRecords
      .map((e) => e.business)
      .filter((b): b is NonNullable<typeof b> => b !== null);

    // Combine and deduplicate
    const allBusinesses = [...ownedBusinesses];
    for (const b of employeeBusinesses) {
      if (!allBusinesses.find((ob) => ob.id === b.id)) {
        allBusinesses.push(b);
      }
    }

    return allBusinesses;
  }

  async getBusiness(id: string): Promise<BusinessWithRelations | undefined> {
    return await db.query.businesses.findFirst({
      where: eq(businesses.id, id),
      with: {
        owner: true,
        employees: {
          with: {
            user: true,
          },
        },
        products: true,
      },
    });
  }

  async getBusinessByApiKey(apiKey: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.apiKey, apiKey));
    return business;
  }

  async createBusiness(business: InsertBusiness & { ownerId: string }): Promise<Business> {
    const apiKey = `rp_${randomUUID().replace(/-/g, "")}`;
    const [created] = await db
      .insert(businesses)
      .values({ ...business, apiKey })
      .returning();
    return created;
  }

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [updated] = await db
      .update(businesses)
      .set({ ...business, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return updated;
  }

  async deleteBusiness(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  // Employee operations
  async getEmployees(userId: string): Promise<(BusinessEmployee & { user?: User; business?: Business })[]> {
    const userBusinesses = await this.getBusinesses(userId);
    const businessIds = userBusinesses.map((b) => b.id);

    if (businessIds.length === 0) return [];

    const employees = await db.query.businessEmployees.findMany({
      with: {
        user: true,
        business: true,
      },
    });

    return employees.filter((e) => businessIds.includes(e.businessId));
  }

  async addEmployee(employee: InsertBusinessEmployee): Promise<BusinessEmployee> {
    const [created] = await db.insert(businessEmployees).values(employee).returning();
    return created;
  }

  async removeEmployee(id: string): Promise<void> {
    await db.delete(businessEmployees).where(eq(businessEmployees.id, id));
  }

  // Product operations
  async getProducts(userId: string): Promise<ProductWithBusiness[]> {
    const userBusinesses = await this.getBusinesses(userId);
    const businessIds = userBusinesses.map((b) => b.id);

    if (businessIds.length === 0) return [];

    const allProducts = await db.query.products.findMany({
      with: {
        business: true,
      },
      orderBy: desc(products.createdAt),
    });

    return allProducts.filter((p) => businessIds.includes(p.businessId));
  }

  async getProductsByBusiness(businessId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.businessId, businessId))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getLowStockProducts(userId: string, threshold: number = 5): Promise<Product[]> {
    const userBusinesses = await this.getBusinesses(userId);
    const businessIds = userBusinesses.map((b) => b.id);

    if (businessIds.length === 0) return [];

    const allProducts = await db
      .select()
      .from(products)
      .where(lte(products.stock, threshold));

    return allProducts.filter((p) => businessIds.includes(p.businessId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Sales operations
  async getSales(userId: string): Promise<SaleWithRelations[]> {
    const userBusinesses = await this.getBusinesses(userId);
    const businessIds = userBusinesses.map((b) => b.id);

    if (businessIds.length === 0) return [];

    const allSales = await db.query.sales.findMany({
      with: {
        seller: true,
        business: true,
        items: {
          with: {
            product: true,
          },
        },
        invoice: true,
      },
      orderBy: desc(sales.createdAt),
    });

    return allSales.filter((s) => businessIds.includes(s.businessId));
  }

  async getSale(id: string): Promise<SaleWithRelations | undefined> {
    return await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        seller: true,
        business: true,
        items: {
          with: {
            product: true,
          },
        },
        invoice: true,
      },
    });
  }

  async createSale(
    saleData: InsertSale,
    items: Omit<InsertSaleItem, "saleId">[]
  ): Promise<{ sale: Sale; invoice: Invoice }> {
    // Create sale
    const [sale] = await db.insert(sales).values(saleData).returning();

    // Create sale items and update stock
    for (const item of items) {
      await db.insert(saleItems).values({
        ...item,
        saleId: sale.id,
      });

      // Update product stock
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    // Generate invoice
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const [invoice] = await db
      .insert(invoices)
      .values({
        saleId: sale.id,
        invoiceNumber,
        status: "pending",
      })
      .returning();

    return { sale, invoice };
  }

  // Invoice operations
  async getInvoices(userId: string): Promise<(Invoice & { sale?: SaleWithRelations })[]> {
    const userSales = await this.getSales(userId);
    const saleIds = userSales.map((s) => s.id);

    if (saleIds.length === 0) return [];

    const allInvoices = await db.query.invoices.findMany({
      with: {
        sale: {
          with: {
            seller: true,
            business: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: desc(invoices.issueDate),
    });

    return allInvoices.filter((i) => saleIds.includes(i.saleId));
  }

  async getInvoice(id: string): Promise<(Invoice & { sale?: SaleWithRelations }) | undefined> {
    return await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        sale: {
          with: {
            seller: true,
            business: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const updateData: any = { ...data };
    if (data.status === "paid" && !data.paidAt) {
      updateData.paidAt = new Date();
    }
    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalSalesToday: number;
    totalOrders: number;
    lowStockItems: number;
    totalBusinesses: number;
  }> {
    const userBusinesses = await this.getBusinesses(userId);
    const businessIds = userBusinesses.map((b) => b.id);

    if (businessIds.length === 0) {
      return {
        totalSalesToday: 0,
        totalOrders: 0,
        lowStockItems: 0,
        totalBusinesses: 0,
      };
    }

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allSales = await db.query.sales.findMany({
      where: eq(sales.status, "completed"),
    });

    const userSales = allSales.filter((s) => businessIds.includes(s.businessId));
    const todaySales = userSales.filter(
      (s) => s.createdAt && new Date(s.createdAt) >= today
    );

    const totalSalesToday = todaySales.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount),
      0
    );

    const lowStockProducts = await this.getLowStockProducts(userId);

    return {
      totalSalesToday,
      totalOrders: userSales.length,
      lowStockItems: lowStockProducts.length,
      totalBusinesses: userBusinesses.length,
    };
  }

  // Authorization helpers
  async isUserAuthorizedForBusiness(userId: string, businessId: string): Promise<boolean> {
    // Check if user is the business owner
    const [business] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, userId)));
    
    if (business) {
      return true;
    }

    // Check if user is an employee of the business
    const [employee] = await db
      .select()
      .from(businessEmployees)
      .where(
        and(
          eq(businessEmployees.businessId, businessId),
          eq(businessEmployees.userId, userId)
        )
      );
    
    return !!employee;
  }

  // Get employee by ID (for authorization checks)
  async getEmployeeById(id: string): Promise<(BusinessEmployee & { user?: User; business?: Business }) | undefined> {
    return await db.query.businessEmployees.findFirst({
      where: eq(businessEmployees.id, id),
      with: {
        user: true,
        business: true,
      },
    });
  }
}

export const storage = new DatabaseStorage();
