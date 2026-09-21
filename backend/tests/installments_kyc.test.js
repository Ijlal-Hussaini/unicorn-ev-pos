import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Installment from '../models/installmentModel.js';

describe('Pakistani Installment & Guarantor (Zamin) KYC Tests', () => {
  it('should validate and create a valid installment plan with Zamin 1 & Zamin 2 KYC', () => {
    const plan = new Installment({
      installmentPlanId: 'INST-2026-001',
      sale: new mongoose.Types.ObjectId(),
      invoiceId: 'INV-2026-001',
      customer: 'Tariq Mehmood',
      customerPhone: '03009876543',
      customerCNIC: '42201-1234567-3',
      customerAddress: 'DHA Phase 5, Karachi',
      guarantors: [
        {
          name: 'Muhammad Asif',
          cnic: '42201-9876543-1',
          phone: '03211234567',
          relation: 'Brother',
          address: 'Gulshan, Karachi',
          workplace: 'Bank Alfalah',
        },
        {
          name: 'Kashif Khan',
          cnic: '42101-5555555-5',
          phone: '03337654321',
          relation: 'Business Partner',
          address: 'Clifton, Karachi',
          workplace: 'Habib Bank Ltd',
        },
      ],
      product: new mongoose.Types.ObjectId(),
      productName: 'Unicorn Thunder EV',
      totalAmount: 300000,
      downPayment: 100000,
      remainingAmount: 200000,
      numberOfInstallments: 10,
      installmentAmount: 20000,
      frequency: 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: new mongoose.Types.ObjectId(),
    });

    const err = plan.validateSync();
    assert.strictEqual(err, undefined, 'Installment document should pass validation');
    assert.strictEqual(plan.guarantors.length, 2);
    assert.strictEqual(plan.guarantors[0].name, 'Muhammad Asif');
    assert.strictEqual(plan.guarantors[0].relation, 'Brother');
    assert.strictEqual(plan.guarantors[1].name, 'Kashif Khan');
  });

  it('should reject plan without customer CNIC or phone', () => {
    const plan = new Installment({
      installmentPlanId: 'INST-INVALID',
      sale: new mongoose.Types.ObjectId(),
      invoiceId: 'INV-INVALID',
      customer: 'Incomplete Customer',
      // Missing customerCNIC and customerPhone
      product: new mongoose.Types.ObjectId(),
      productName: 'Test Bike',
      totalAmount: 200000,
      downPayment: 50000,
      remainingAmount: 150000,
      numberOfInstallments: 6,
      installmentAmount: 25000,
      createdBy: new mongoose.Types.ObjectId(),
    });

    const err = plan.validateSync();
    assert.ok(err, 'Validation should fail when customer CNIC or phone is missing');
    assert.ok(err.errors['customerCNIC']);
    assert.ok(err.errors['customerPhone']);
  });

  it('should calculate remainingInstallments and completionPercentage virtuals correctly', () => {
    const plan = new Installment({
      installmentPlanId: 'INST-CALC',
      sale: new mongoose.Types.ObjectId(),
      invoiceId: 'INV-CALC',
      customer: 'Zahid Hussain',
      customerPhone: '03001112233',
      customerCNIC: '42101-1112233-1',
      product: new mongoose.Types.ObjectId(),
      productName: 'Test Bike',
      totalAmount: 240000,
      downPayment: 40000,
      remainingAmount: 200000,
      numberOfInstallments: 12,
      installmentAmount: 16666.67,
      paidInstallments: 3,
      totalPaid: 50000,
      status: 'active',
      nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdBy: new mongoose.Types.ObjectId(),
    });

    assert.strictEqual(plan.remainingInstallments, 9); // 12 - 3
    assert.strictEqual(plan.completionPercentage, '25.00'); // (3 / 12) * 100
  });

  it('should correctly detect overdue installments when past due date + grace period', () => {
    const pastDueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    const plan = new Installment({
      installmentPlanId: 'INST-OVERDUE',
      sale: new mongoose.Types.ObjectId(),
      invoiceId: 'INV-OVERDUE',
      customer: 'Overdue Customer',
      customerPhone: '03009999999',
      customerCNIC: '42101-9999999-9',
      product: new mongoose.Types.ObjectId(),
      productName: 'Test Bike',
      totalAmount: 100000,
      downPayment: 20000,
      remainingAmount: 80000,
      numberOfInstallments: 4,
      installmentAmount: 20000,
      gracePeriodDays: 3,
      nextDueDate: pastDueDate,
      status: 'active',
      createdBy: new mongoose.Types.ObjectId(),
    });

    assert.strictEqual(plan.isOverdue, true, 'Plan should be overdue since 10 days > 3 days grace period');
    assert.ok(plan.daysOverdue >= 9, 'Should report days overdue');
  });

  it('should compute monthly calculateNextDueDate correctly', () => {
    const startDate = new Date('2026-01-15T00:00:00.000Z');
    const plan = new Installment({
      installmentPlanId: 'INST-DATE-TEST',
      sale: new mongoose.Types.ObjectId(),
      invoiceId: 'INV-DATE-TEST',
      customer: 'Date Test',
      customerPhone: '03001231234',
      customerCNIC: '42101-1231234-1',
      product: new mongoose.Types.ObjectId(),
      productName: 'Test Bike',
      totalAmount: 100000,
      downPayment: 20000,
      remainingAmount: 80000,
      numberOfInstallments: 4,
      installmentAmount: 20000,
      frequency: 'monthly',
      startDate: startDate,
      nextDueDate: new Date('2099-01-01T00:00:00.000Z'), // Future base
      status: 'active',
      createdBy: new mongoose.Types.ObjectId(),
    });

    const nextDate = plan.calculateNextDueDate();
    // 2099-01-01 + 1 month = 2099-02-01
    assert.strictEqual(nextDate.getFullYear(), 2099);
    assert.strictEqual(nextDate.getMonth(), 1); // February (0-indexed)
  });
});
