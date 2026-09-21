import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';

describe('Sales Workflow & Serialized Unit Allocation Tests', () => {
  it('should validate and create a valid EV bike sale with serial numbers', () => {
    const sale = new Sales({
      invoiceId: 'INV-2026-001',
      customer: 'Muhammad Ali',
      customerCnic: '42101-1234567-1',
      customerPhone: '03001234567',
      customerAddress: 'Gulshan-e-Iqbal, Karachi',
      chassisNumber: 'UN-EV2026-0091',
      motorNumber: 'MTR-72V-8821',
      batterySerial: 'BAT-GRP-1102',
      color: 'Matte Black',
      product: new mongoose.Types.ObjectId(),
      model: 'Unicorn Lightning EV',
      quantity: 1,
      price: 250000,
      cost: 200000,
      total: 250000,
      soldBy: new mongoose.Types.ObjectId(),
      paymentMethod: 'Cash',
      status: 'completed',
    });

    const err = sale.validateSync();
    assert.strictEqual(err, undefined, 'Sale document should be valid');
    assert.strictEqual(sale.chassisNumber, 'UN-EV2026-0091');
    assert.strictEqual(sale.motorNumber, 'MTR-72V-8821');
    assert.strictEqual(sale.paymentMethod, 'Cash');
    assert.strictEqual(sale.status, 'completed');
  });

  it('should reject sale with negative price or zero quantity', () => {
    const sale = new Sales({
      invoiceId: 'INV-INVALID',
      customer: 'Test Customer',
      product: new mongoose.Types.ObjectId(),
      model: 'Test Bike',
      quantity: 0,
      price: -500,
      cost: 100,
      total: -500,
      paymentMethod: 'Cash',
    });

    const err = sale.validateSync();
    assert.ok(err, 'Validation should fail for zero quantity and negative price');
    assert.ok(err.errors['quantity']);
    assert.ok(err.errors['price']);
    assert.ok(err.errors['total']);
  });

  it('should reject invalid payment method enum', () => {
    const sale = new Sales({
      invoiceId: 'INV-INVALID-PAY',
      customer: 'Test Customer',
      product: new mongoose.Types.ObjectId(),
      model: 'Test Bike',
      quantity: 1,
      price: 100000,
      cost: 80000,
      total: 100000,
      paymentMethod: 'CryptoCurrency', // Not supported
    });

    const err = sale.validateSync();
    assert.ok(err, 'Validation should fail for unsupported payment method');
    assert.ok(err.errors['paymentMethod']);
  });

  it('should accurately simulate allocating a unit to sold and releasing upon cancellation', () => {
    // Setup a product with 2 units
    const product = new Product({
      sku: 'SKU-SIM-01',
      name: 'Unicorn Swift',
      category: 'EV Bikes',
      price: 200000,
      cost: 160000,
      supplier: 'Unicorn Motors',
      units: [
        {
          _id: new mongoose.Types.ObjectId(),
          chassisNumber: 'CH-SWIFT-101',
          motorNumber: 'MTR-101',
          status: 'available',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chassisNumber: 'CH-SWIFT-102',
          motorNumber: 'MTR-102',
          status: 'available',
        },
      ],
    });

    product.updateStatus();
    assert.strictEqual(product.stock, 2);

    // Step 1: Simulate Sale Allocation of CH-SWIFT-101
    const targetUnit = product.units.find(u => u.chassisNumber === 'CH-SWIFT-101');
    assert.ok(targetUnit);
    assert.strictEqual(targetUnit.status, 'available');

    const fakeSaleId = new mongoose.Types.ObjectId();
    targetUnit.status = 'sold';
    targetUnit.soldAt = new Date();
    targetUnit.saleInvoiceId = fakeSaleId;
    targetUnit.saleInvoiceNumber = 'INV-2026-0099';

    product.updateStatus();
    assert.strictEqual(product.stock, 1, 'Stock should decrease to 1 after sale allocation');
    assert.strictEqual(targetUnit.status, 'sold');

    // Step 2: Concurrency check: Cannot allocate an already-sold unit
    const alreadySoldUnit = product.units.find(u => u.chassisNumber === 'CH-SWIFT-101');
    const isUnitAvailable = alreadySoldUnit.status === 'available';
    assert.strictEqual(isUnitAvailable, false, 'Sold unit must not be available for subsequent sales');

    // Step 3: Simulate Sale Deletion / Refund Release
    targetUnit.status = 'available';
    targetUnit.soldAt = undefined;
    targetUnit.saleInvoiceId = undefined;
    targetUnit.saleInvoiceNumber = undefined;

    product.updateStatus();
    assert.strictEqual(product.stock, 2, 'Stock should restore to 2 after release');
    assert.strictEqual(targetUnit.status, 'available');
  });
});
