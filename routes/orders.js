// routes/orders.js
import express from "express";
import Order from "../models/order.js";
import { authenticate, authorizeStaff } from "../middleware/auth.js";

const router = express.Router();

// Create new order (accessible without staff auth, but requires authentication)
router.post("/", async (req, res) => {
  try {
    const { tableId, items, location, ip } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Table ID and items are required" });
    }

    const newOrder = new Order({
      tableId,
      items,
      location,
      ip,             // Add this line
      status: "pending",
      createdAt: new Date(),
    });

    await newOrder.save();

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Failed to create order:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get pending orders (staff only)
router.get("/pending", authenticate, authorizeStaff, async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: "pending" });
    res.json(pendingOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.patch("/:id/status", authenticate, authorizeStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "received",
      "preparing",
      "ready",
      "serving",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Failed to update order status:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get confirmed orders (staff only)
router.get("/confirmed", authenticate, authorizeStaff, async (req, res) => {
  try {
    const confirmedOrders = await Order.find({ status: "confirmed" });
    res.json(confirmedOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm order by ID (staff only)
router.post("/confirm/:id", authenticate, authorizeStaff, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "confirmed";
    await order.save();

    res.json({ message: "Order confirmed", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get orders by status (staff only)
router.get("/status/:status", authenticate, authorizeStaff, async (req, res) => {
  const { status } = req.params;
  const validStatuses = [
    "pending",
    "confirmed",
    "received",
    "preparing",
    "ready",
    "serving",
    "completed",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const orders = await Order.find({ status });
    res.json(orders);
  } catch (err) {
    console.error("Failed to fetch orders by status:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete order by ID (staff only)
router.delete("/:id", authenticate, authorizeStaff, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully", order: deletedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/today
router.get("/today", authenticate, authorizeStaff, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({
      createdAt: { $gte: startOfToday }
    });

    res.json(ordersToday);
  } catch (err) {
    console.error("Error fetching today's orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
