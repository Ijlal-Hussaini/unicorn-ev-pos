import { describe, it } from 'node:test';
import assert from 'node:assert';
import Product from '../models/productModel.js';

describe('Serialized EV Inventory Tracking Tests', () => {
  it('should normalize and uppercase chassis and motor numbers', () => {
    const product = new Product({
      sku: 'SKU-TEST-01',
      name: 'Unicorn Lightning EV',
      model: 'Lightning 2026',
      category: 'EV Bikes',
      price: 250000,
      cost: 200000,
      supplier: 'Unicorn Motors',
      units: [
        {
          chassisNumber: '  un-ev-2026-001  ',
          motorNumber: '  mtr-72v-991  ',
          batterySerial: '  bat-grp-882  ',
          color: 'Matte Black',
          status: 'available',
        },
      ],
    });

    assert.strictEqual(product.units[0].chassisNumber, 'UN-EV-2026-001');
    assert.strictEqual(product.units[0].motorNumber, 'MTR-72V-991');
    assert.strictEqual(product.units[0].batterySerial, 'BAT-GRP-882');
    assert.strictEqual(product.units[0].status, 'available');
  });

  it('should auto-calculate stock and status based on available units for EV Bikes', () => {
    const product = new Product({
      sku: 'SKU-TEST-02',
      name: 'Unicorn Turbo EV',
      model: 'Turbo V2',
      category: 'EV Bikes',
      price: 300000,
      cost: 240000,
      minStock: 5,
      supplier: 'Unicorn Motors',
      units: [
        { chassisNumber: 'CH-001', status: 'available' },
        { chassisNumber: 'CH-002', status: 'available' },
        { chassisNumber: 'CH-003', status: 'sold' },
        { chassisNumber: 'CH-004', status: 'available' },
      ],
    });

    product.updateStatus();

    // 3 available units out of 4
    assert.strictEqual(product.stock, 3);
    // Since 3 < minStock (5), status should be low-stock
    assert.strictEqual(product.status, 'low-stock');
  });

  it('should set status to out-of-stock when 0 units are available', () => {
    const product = new Product({
      sku: 'SKU-TEST-03',
      name: 'Unicorn Eco EV',
      model: 'Eco 100',
      category: 'EV Bikes',
      price: 180000,
      cost: 140000,
      minStock: 3,
      supplier: 'Unicorn Motors',
      units: [
        { chassisNumber: 'CH-101', status: 'sold' },
        { chassisNumber: 'CH-102', status: 'sold' },
      ],
    });

    product.updateStatus();

    assert.strictEqual(product.stock, 0);
    assert.strictEqual(product.status, 'out-of-stock');
  });

  it('should set status to in-stock when stock meets or exceeds minStock', () => {
    const product = new Product({
      sku: 'SKU-TEST-04',
      name: 'Unicorn Pro EV',
      model: 'Pro 500',
      category: 'EV Bikes',
      price: 350000,
      cost: 280000,
      minStock: 2,
      supplier: 'Unicorn Motors',
      units: [
        { chassisNumber: 'CH-201', status: 'available' },
        { chassisNumber: 'CH-202', status: 'available' },
        { chassisNumber: 'CH-203', status: 'available' },
      ],
    });

    product.updateStatus();

    assert.strictEqual(product.stock, 3);
    assert.strictEqual(product.status, 'in-stock');
  });

  it('should compute virtual profit margin and profit percentage accurately', () => {
    const product = new Product({
      sku: 'SKU-TEST-05',
      name: 'Unicorn Cruiser EV',
      category: 'EV Bikes',
      price: 300000,
      cost: 200000,
      supplier: 'Unicorn Motors',
    });

    assert.strictEqual(product.profitMargin, 100000);
    assert.strictEqual(product.profitPercentage, '50.00');
  });

  it('should reject invalid unit status enum', () => {
    const product = new Product({
      sku: 'SKU-TEST-06',
      name: 'Unicorn Test',
      category: 'EV Bikes',
      price: 200000,
      cost: 150000,
      supplier: 'Unicorn Motors',
      units: [
        { chassisNumber: 'CH-ERR', status: 'damaged_disposed' },
      ],
    });

    const err = product.validateSync();
    assert.ok(err, 'Validation should fail for invalid unit status');
    assert.ok(err.errors['units.0.status']);
  });
});
