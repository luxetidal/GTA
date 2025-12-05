import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["owner", "employee", "admin"] }).default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business types for GTA RP
export const businessTypeEnum = ["dealership", "store", "restaurant", "garage", "nightclub", "other"] as const;
export const employeeRoleEnum = ["manager", "employee"] as const;

// Businesses table
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { enum: businessTypeEnum }).notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  apiKey: varchar("api_key").unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business employees junction table
export const businessEmployees = pgTable("business_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: employeeRoleEnum }).default("employee"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Products/Inventory table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales enums
export const saleStatusEnum = ["pending", "completed", "cancelled"] as const;
export const saleSourceEnum = ["web", "game"] as const;

// Sales table
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  buyerName: varchar("buyer_name", { length: 255 }).notNull(),
  buyerInfo: text("buyer_info"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: saleStatusEnum }).default("completed"),
  source: varchar("source", { enum: saleSourceEnum }).default("web"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Invoice enums
export const invoiceStatusEnum = ["pending", "paid", "cancelled"] as const;

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { enum: invoiceStatusEnum }).default("pending"),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedBusinesses: many(businesses),
  employments: many(businessEmployees),
  sales: many(sales),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, {
    fields: [businesses.ownerId],
    references: [users.id],
  }),
  employees: many(businessEmployees),
  products: many(products),
  sales: many(sales),
}));

export const businessEmployeesRelations = relations(businessEmployees, ({ one }) => ({
  business: one(businesses, {
    fields: [businessEmployees.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [businessEmployees.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  business: one(businesses, {
    fields: [sales.businessId],
    references: [businesses.id],
  }),
  seller: one(users, {
    fields: [sales.sellerId],
    references: [users.id],
  }),
  items: many(saleItems),
  invoice: one(invoices),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  sale: one(sales, {
    fields: [invoices.saleId],
    references: [sales.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessSchema = createInsertSchema(businesses, {
  type: z.enum(businessTypeEnum),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  apiKey: true,
});

export const insertBusinessEmployeeSchema = createInsertSchema(businessEmployees, {
  role: z.enum(employeeRoleEnum).optional(),
}).omit({
  id: true,
  joinedAt: true
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSaleSchema = createInsertSchema(sales, {
  status: z.enum(saleStatusEnum).optional(),
  source: z.enum(saleSourceEnum).optional(),
}).omit({
  id: true,
  createdAt: true
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true
});

export const insertInvoiceSchema = createInsertSchema(invoices, {
  status: z.enum(invoiceStatusEnum).optional(),
}).omit({
  id: true,
  issueDate: true,
  paidAt: true
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type BusinessEmployee = typeof businessEmployees.$inferSelect;
export type InsertBusinessEmployee = z.infer<typeof insertBusinessEmployeeSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Extended types for frontend
export type BusinessWithRelations = Business & {
  owner?: User;
  employees?: (BusinessEmployee & { user?: User })[];
  products?: Product[];
};

export type SaleWithRelations = Sale & {
  seller?: User;
  business?: Business;
  items?: (SaleItem & { product?: Product })[];
  invoice?: Invoice;
};

export type ProductWithBusiness = Product & {
  business?: Business;
};
