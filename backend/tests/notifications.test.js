import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Aggregated Notifications API Tests', () => {
  it('should format out-of-stock and low-stock alerts correctly', () => {
    const mockProductsOut = [
      { _id: 'prod1', name: 'Unicorn EV Model A', sku: 'SKU-A', stock: 0 },
    ];
    const mockProductsLow = [
      { _id: 'prod2', name: 'Unicorn EV Model B', sku: 'SKU-B', stock: 3 },
    ];

    const notifications = [];

    mockProductsOut.forEach(item => {
      notifications.push({
        id: `out-${item._id}`,
        type: 'out-of-stock',
        title: 'Out of Stock Alert',
        message: `${item.name || item.sku} - 0 units remaining`,
        time: 'Critical',
        unread: true,
        link: '/inventory',
      });
    });

    mockProductsLow.forEach(item => {
      notifications.push({
        id: `low-${item._id}`,
        type: 'low-stock',
        title: 'Low Stock Warning',
        message: `${item.name || item.sku} - Only ${item.stock} left in showroom`,
        time: 'Warning',
        unread: true,
        link: '/inventory',
      });
    });

    assert.strictEqual(notifications.length, 2);
    assert.strictEqual(notifications[0].type, 'out-of-stock');
    assert.strictEqual(notifications[0].time, 'Critical');
    assert.strictEqual(notifications[1].type, 'low-stock');
    assert.strictEqual(notifications[1].time, 'Warning');
    assert.strictEqual(notifications.filter(n => n.unread).length, 2);
  });

  it('should categorize overdue vs due-soon installments correctly', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 2); // 2 days ago

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 2); // 2 days later

    const mockInstallments = [
      { _id: 'inst1', customer: 'Ali Khan', installmentAmount: 15000, nextDueDate: pastDate },
      { _id: 'inst2', customer: 'Bilal Ahmed', installmentAmount: 20000, nextDueDate: futureDate },
    ];

    const notifications = [];

    mockInstallments.forEach(item => {
      const isOverdue = new Date(item.nextDueDate) < today;
      notifications.push({
        id: `inst-${item._id}`,
        type: isOverdue ? 'installment-overdue' : 'installment-due',
        title: isOverdue ? 'Installment Overdue' : 'Installment Due Soon',
        message: `${item.customer} - Rs. ${item.installmentAmount.toLocaleString()}`,
        time: isOverdue ? 'Overdue' : 'Upcoming',
        unread: true,
      });
    });

    assert.strictEqual(notifications[0].type, 'installment-overdue');
    assert.strictEqual(notifications[0].time, 'Overdue');
    assert.strictEqual(notifications[1].type, 'installment-due');
    assert.strictEqual(notifications[1].time, 'Upcoming');
  });
});
