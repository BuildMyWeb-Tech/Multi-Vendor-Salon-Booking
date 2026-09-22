import productModel from '../models/productModel.js';
import billModel from '../models/billModel.js';
import appointmentModel from '../models/appointmentModel.js';

// ── PRODUCTS ─────────────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { name, category, variants } = req.body;

    if (!name) return res.json({ success: false, message: 'Product name is required.' });

    let parsedVariants = variants;
    if (typeof variants === 'string') parsedVariants = JSON.parse(variants);

    if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
      return res.json({ success: false, message: 'At least one variant is required.' });
    }

    for (const v of parsedVariants) {
      if (!v.size) return res.json({ success: false, message: 'Each variant must have a size/name.' });
      if (v.price == null || v.price < 0) return res.json({ success: false, message: 'Each variant must have a valid price.' });
    }

    const product = await productModel.create({ shopId, name, category: category || '', variants: parsedVariants });
    res.json({ success: true, message: 'Product created.', product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { search, category, includeInactive } = req.query;

    const filter = { shopId };
    if (!includeInactive) filter.isActive = true;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };

    const products = await productModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const product = await productModel.findOne({ _id: req.params.id, shopId }).lean();
    if (!product) return res.json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { name, category, variants } = req.body;

    const product = await productModel.findOne({ _id: req.params.id, shopId });
    if (!product) return res.json({ success: false, message: 'Product not found.' });

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;

    if (variants !== undefined) {
      let parsedVariants = variants;
      if (typeof variants === 'string') parsedVariants = JSON.parse(variants);
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        return res.json({ success: false, message: 'At least one variant is required.' });
      }
      product.variants = parsedVariants;
    }

    await product.save();
    res.json({ success: true, message: 'Product updated.', product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const product = await productModel.findOne({ _id: req.params.id, shopId });
    if (!product) return res.json({ success: false, message: 'Product not found.' });

    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product archived.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── INVENTORY ─────────────────────────────────────────────────────────────────

export const getInventory = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const products = await productModel.find({ shopId, isActive: true }).lean();

    const inventory = [];
    for (const p of products) {
      for (const v of p.variants) {
        const stockStatus =
          v.stock === 0 ? 'out_of_stock'
          : v.stock <= v.lowStockThreshold ? 'low_stock'
          : 'in_stock';
        inventory.push({
          productId: p._id,
          productName: p.name,
          variantId: v._id,
          variantSize: v.size,
          price: v.price,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          stockStatus,
        });
      }
    }

    const stats = {
      inStock: inventory.filter((i) => i.stockStatus === 'in_stock').length,
      lowStock: inventory.filter((i) => i.stockStatus === 'low_stock').length,
      outOfStock: inventory.filter((i) => i.stockStatus === 'out_of_stock').length,
    };

    res.json({ success: true, inventory, stats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── BILLS ──────────────────────────────────────────────────────────────────────

export const createBill = async (req, res) => {
  // Track which products had stock reduced so we can roll back on error
  const stockRollbacks = [];
  try {
    const shopId = req.salonAdmin.shopId;
    const {
      customerName, customerPhone,
      appointmentId,
      services, products,
      discount, discountType, taxPercent,
      paymentMethod,
    } = req.body;

    const parsedServices = typeof services === 'string' ? JSON.parse(services) : (services || []);
    const parsedProducts = typeof products === 'string' ? JSON.parse(products) : (products || []);

    // Validate & enrich products, reduce stock
    const enrichedProducts = [];
    for (const item of parsedProducts) {
      const product = await productModel.findOne({ _id: item.productId, shopId, isActive: true });
      if (!product) return res.json({ success: false, message: `Product ${item.productName} not found.` });
      const variant = product.variants.id(item.variantId);
      if (!variant) return res.json({ success: false, message: `Variant not found for ${item.productName}.` });
      if (variant.stock < item.quantity) {
        return res.json({ success: false, message: `Insufficient stock for ${product.name} (${variant.size}). Available: ${variant.stock}` });
      }
      variant.stock -= item.quantity;
      await product.save();
      stockRollbacks.push({ product, variantId: item.variantId, qty: item.quantity });

      enrichedProducts.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantSize: variant.size,
        price: variant.price,
        quantity: item.quantity,
        subtotal: variant.price * item.quantity,
      });
    }

    // Compute totals
    const serviceSubtotal = parsedServices.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    const productSubtotal = enrichedProducts.reduce((s, i) => s + i.subtotal, 0);
    const subtotal = serviceSubtotal + productSubtotal;

    const discountAmt = discountType === 'percent'
      ? Math.round((subtotal * (parseFloat(discount) || 0)) / 100 * 100) / 100
      : parseFloat(discount) || 0;

    const afterDiscount = subtotal - discountAmt;
    const taxAmt = Math.round((afterDiscount * (parseFloat(taxPercent) || 0)) / 100 * 100) / 100;
    const total = afterDiscount + taxAmt;

    const enrichedServices = parsedServices.map((s) => ({
      name: s.name,
      price: s.price,
      quantity: s.quantity || 1,
      subtotal: s.price * (s.quantity || 1),
    }));

    // Mark appointment completed if linked
    if (appointmentId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
    }

    const bill = await billModel.create({
      shopId,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      appointmentId: appointmentId || null,
      services: enrichedServices,
      products: enrichedProducts,
      subtotal,
      discount: discountAmt,
      discountType: discountType || 'flat',
      tax: taxAmt,
      taxPercent: parseFloat(taxPercent) || 0,
      total,
      paymentMethod: paymentMethod || 'cash',
      utrNumber: '',
      status: 'completed',
    });

    res.json({ success: true, message: 'Bill created.', bill });
  } catch (error) {
    // Roll back any stock deductions that already happened
    for (const { product, variantId, qty } of stockRollbacks) {
      const variant = product.variants.id(variantId);
      if (variant) { variant.stock += qty; await product.save().catch(() => {}); }
    }
    res.json({ success: false, message: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { search, status, from, to, page = 1, limit = 20 } = req.query;

    const filter = { shopId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bills, total] = await Promise.all([
      billModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      billModel.countDocuments(filter),
    ]);

    res.json({ success: true, bills, total, page: parseInt(page) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const bill = await billModel.findOne({ _id: req.params.id, shopId }).lean();
    if (!bill) return res.json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, bill });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const cancelBill = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const bill = await billModel.findOne({ _id: req.params.id, shopId });
    if (!bill) return res.json({ success: false, message: 'Bill not found.' });
    if (bill.status === 'cancelled') return res.json({ success: false, message: 'Bill already cancelled.' });

    // Restore product stock
    for (const item of bill.products) {
      const product = await productModel.findById(item.productId);
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        }
      }
    }

    bill.status = 'cancelled';
    await bill.save();
    res.json({ success: true, message: 'Bill cancelled and stock restored.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
