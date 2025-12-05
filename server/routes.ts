import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import { z } from "zod";
import {
  businessTypeEnum,
  employeeRoleEnum,
  saleStatusEnum,
  saleSourceEnum,
  invoiceStatusEnum
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const { checkDatabaseHealth } = await import("./initDb");
      const dbHealthy = await checkDatabaseHealth();
      res.json({
        status: "ok",
        database: dbHealthy ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Setup authentication
  await setupAuth(app);

  // Auth routes are handled in setupAuth

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Business routes
  app.get("/api/businesses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businesses = await storage.getBusinesses(userId);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.params.id;
      
      // Check authorization
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to access this business" });
      }
      
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post("/api/businesses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        name: z.string().min(2),
        type: z.enum(businessTypeEnum),
        description: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const business = await storage.createBusiness({ ...data, ownerId: userId });
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(400).json({ message: "Failed to create business" });
    }
  });

  app.patch("/api/businesses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.params.id;
      
      // Check authorization - only owner can update business
      const existingBusiness = await storage.getBusiness(businessId);
      if (!existingBusiness || existingBusiness.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can update this business" });
      }
      
      const business = await storage.updateBusiness(businessId, req.body);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(400).json({ message: "Failed to update business" });
    }
  });

  app.delete("/api/businesses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.params.id;
      
      // Check authorization - only owner can delete business
      const existingBusiness = await storage.getBusiness(businessId);
      if (!existingBusiness || existingBusiness.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can delete this business" });
      }
      
      await storage.deleteBusiness(businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  // Product routes
  app.get("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { businessId, lowStock } = req.query;

      if (lowStock === "true") {
        const products = await storage.getLowStockProducts(userId);
        return res.json(products);
      }

      if (businessId) {
        // Verify user has access to this business
        const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, businessId as string);
        if (!isAuthorized) {
          return res.status(403).json({ message: "Not authorized to access this business" });
        }
        const products = await storage.getProductsByBusiness(businessId as string);
        return res.json(products);
      }

      const products = await storage.getProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check authorization for the product's business
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, product.businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to access this product" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        businessId: z.string(),
        name: z.string().min(2),
        description: z.string().optional(),
        price: z.string(),
        stock: z.number().int().min(0),
        category: z.string().optional(),
      });

      const data = schema.parse(req.body);
      
      // Check authorization - user must have access to this business
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, data.businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to add products to this business" });
      }
      
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = req.params.id;
      
      // Get the product to check its business
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check authorization
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, existingProduct.businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }
      
      // Prevent changing businessId (products cannot be moved between businesses)
      const updateData = { ...req.body };
      delete updateData.businessId;
      
      const product = await storage.updateProduct(productId, updateData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = req.params.id;
      
      // Get the product to check its business
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check authorization - only owner can delete products
      const existingBusiness = await storage.getBusiness(existingProduct.businessId);
      if (!existingBusiness || existingBusiness.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can delete products" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Sales routes
  app.get("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sales = await storage.getSales(userId);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      
      // Check authorization
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, sale.businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to view this sale" });
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        businessId: z.string(),
        buyerName: z.string().min(1),
        buyerInfo: z.string().optional(),
        totalAmount: z.string(),
        status: z.enum(saleStatusEnum).optional(),
        source: z.enum(saleSourceEnum).optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.string(),
            totalPrice: z.string(),
          })
        ),
      });

      const data = schema.parse(req.body);
      
      // Check authorization for the business
      const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, data.businessId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to create sales for this business" });
      }
      
      // Verify all products belong to this business
      for (const item of data.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        if (product.businessId !== data.businessId) {
          return res.status(400).json({ message: `Product ${product.name} does not belong to this business` });
        }
        if ((product.stock || 0) < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
      }
      
      const { items, ...saleData } = data;

      const result = await storage.createSale(
        { ...saleData, sellerId: userId },
        items
      );

      res.status(201).json({
        ...result.sale,
        invoice: result.invoice,
        invoiceId: result.invoice.id,
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(400).json({ message: "Failed to create sale" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check authorization through the sale's business
      if (invoice.sale) {
        const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, invoice.sale.businessId);
        if (!isAuthorized) {
          return res.status(403).json({ message: "Not authorized to view this invoice" });
        }
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoiceId = req.params.id;
      
      // Get the invoice to check authorization
      const existingInvoice = await storage.getInvoice(invoiceId);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check authorization through the sale's business
      if (existingInvoice.sale) {
        const isAuthorized = await storage.isUserAuthorizedForBusiness(userId, existingInvoice.sale.businessId);
        if (!isAuthorized) {
          return res.status(403).json({ message: "Not authorized to update this invoice" });
        }
      }
      
      const schema = z.object({
        status: z.enum(invoiceStatusEnum).optional(),
        dueDate: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const invoice = await storage.updateInvoice(invoiceId, data as any);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employees = await storage.getEmployees(userId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        businessId: z.string(),
        email: z.string().email(),
        role: z.enum(employeeRoleEnum).optional(),
      });

      const data = schema.parse(req.body);

      // Check authorization - only owner can add employees
      const business = await storage.getBusiness(data.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can add employees" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(404).json({ message: "User not found with that email" });
      }

      const employee = await storage.addEmployee({
        businessId: data.businessId,
        userId: user.id,
        role: data.role || "employee",
      });

      res.status(201).json(employee);
    } catch (error) {
      console.error("Error adding employee:", error);
      res.status(400).json({ message: "Failed to add employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employeeId = req.params.id;
      
      // Get the employee record directly (not filtered by user)
      const employee = await storage.getEmployeeById(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check authorization - only owner can remove employees
      const business = await storage.getBusiness(employee.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can remove employees" });
      }
      
      await storage.removeEmployee(employeeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing employee:", error);
      res.status(500).json({ message: "Failed to remove employee" });
    }
  });

  // FiveM Game API endpoint (uses API key auth instead of session)
  app.post("/api/game/sales", async (req, res) => {
    try {
      const schema = z.object({
        businessApiKey: z.string(),
        buyerName: z.string().min(1),
        buyerInfo: z.string().optional(),
        sellerId: z.string().optional(), // Optional: if not provided, uses business owner
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().positive(),
          })
        ),
      });

      const data = schema.parse(req.body);

      // Validate API key
      const business = await storage.getBusinessByApiKey(data.businessApiKey);
      if (!business) {
        return res.status(401).json({ message: "Invalid API key" });
      }

      // Determine seller ID - use provided sellerId if valid, otherwise use business owner
      let sellerId = business.ownerId;
      if (data.sellerId) {
        // Verify the sellerId is either the owner or an employee of the business
        const isValidSeller = await storage.isUserAuthorizedForBusiness(data.sellerId, business.id);
        if (isValidSeller) {
          sellerId = data.sellerId;
        }
      }

      // Get product details and calculate totals
      const items = [];
      let totalAmount = 0;

      for (const item of data.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        if (product.businessId !== business.id) {
          return res.status(400).json({ message: `Product ${product.name} does not belong to this business` });
        }
        if ((product.stock || 0) < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }

        const itemTotal = parseFloat(product.price) * item.quantity;
        totalAmount += itemTotal;

        items.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal.toString(),
        });
      }

      const result = await storage.createSale(
        {
          businessId: business.id,
          sellerId,
          buyerName: data.buyerName,
          buyerInfo: data.buyerInfo,
          totalAmount: totalAmount.toString(),
          status: "completed",
          source: "game",
        },
        items
      );

      res.status(201).json({
        success: true,
        saleId: result.sale.id,
        invoiceNumber: result.invoice.invoiceNumber,
        totalAmount,
      });
    } catch (error) {
      console.error("Error processing game sale:", error);
      res.status(400).json({ message: "Failed to process sale" });
    }
  });

  return httpServer;
}
