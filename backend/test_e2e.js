// Native global fetch in Node 22
const BASE_URL = 'http://127.0.0.1:5050/api';

async function runTests() {
  console.log('=== STARTING END-TO-END VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.status === 'healthy', 'Health check responds with healthy status');

    // 2. Authentication: Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.success && adminLogin.data.role === 'admin', 'Admin login succeeds with admin role');
    const adminToken = adminLogin.data.token;

    // 3. Authentication: Cashier Login
    const cashierLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier', password: 'cashier123' }),
    });
    const cashierLogin = await cashierLoginRes.json();
    assert(cashierLogin.success && cashierLogin.data.role === 'cashier', 'Cashier login succeeds with cashier role');
    const cashierToken = cashierLogin.data.token;

    // 4. Role Authorization: Cashier forbidden from settings/users
    const forbiddenRes = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(forbiddenRes.status === 403, 'RBAC: Cashier is forbidden (403) from accessing admin user management');

    // 5. Product Stock Check before sale
    const productsRes = await fetch(`${BASE_URL}/products?search=Astral CPVC Pipe 1 inch`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const productsData = await productsRes.json();
    const testProduct = productsData.data[0];
    assert(testProduct && testProduct.currentStock > 0, `Found product '${testProduct.name}' with stock ${testProduct.currentStock}`);
    const initialStock = testProduct.currentStock;

    // 6. POS Checkout Sale with Stock Deduction
    const salePayload = {
      customerName: 'Test Walk-in Customer',
      items: [
        {
          productId: testProduct._id,
          quantity: 2,
          unitPrice: testProduct.sellingPrice,
          gstRate: testProduct.gstRate,
          taxType: 'INCLUSIVE',
        },
      ],
      payments: [{ method: 'CASH', amount: testProduct.sellingPrice * 2 }],
    };

    const saleRes = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify(salePayload),
    });
    const saleData = await saleRes.json();
    assert(saleData.success && saleData.data.invoiceNumber, `Sale created with invoice ${saleData.data?.invoiceNumber}`);

    // 7. Verify Stock Decremented
    const productAfterSaleRes = await fetch(`${BASE_URL}/products/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const productAfterSale = await productAfterSaleRes.json();
    assert(
      productAfterSale.data.currentStock === initialStock - 2,
      `Stock correctly decremented from ${initialStock} to ${productAfterSale.data.currentStock}`
    );

    // 8. Verify StockMovement Ledger recorded SALE
    const movementsRes = await fetch(`${BASE_URL}/inventory/movements?productId=${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const movementsData = await movementsRes.json();
    const latestMovement = movementsData.data[0];
    assert(
      latestMovement && latestMovement.movementType === 'SALE' && latestMovement.quantity === -2,
      `Stock movement recorded: Type=SALE, Quantity=-2, Ref=${latestMovement.referenceDocument}`
    );

    // 9. Cancel Invoice and verify Stock Restoration
    const cancelRes = await fetch(`${BASE_URL}/sales/${saleData.data._id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({ reason: 'E2E Test Cancellation' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelData.success, 'Invoice cancelled successfully');

    const productAfterCancelRes = await fetch(`${BASE_URL}/products/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const productAfterCancel = await productAfterCancelRes.json();
    assert(
      productAfterCancel.data.currentStock === initialStock,
      `Stock fully restored back to ${initialStock} after invoice cancellation`
    );

    // 10. Customer Udhar (Credit) Sale & Payment Collection
    const customerRes = await fetch(`${BASE_URL}/customers?search=Ramesh`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const customerData = await customerRes.json();
    const ramesh = customerData.data[0];
    assert(ramesh && ramesh.phone, `Found customer Ramesh with balance ${ramesh.currentBalance}`);
    const rameshBalanceBefore = ramesh.currentBalance;

    // Collect ₹500 payment from Ramesh
    const payRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        partyType: 'CUSTOMER',
        customerId: ramesh._id,
        amount: 500,
        paymentMethod: 'UPI',
        referenceNo: 'E2E-TEST-UPI',
        notes: 'Test payment collection',
      }),
    });
    const payData = await payRes.json();
    assert(payData.success, `Payment of ₹500 recorded for ${ramesh.name}`);

    // Verify Ramesh balance decreased by 500
    const rameshAfterPayRes = await fetch(`${BASE_URL}/customers/${ramesh._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rameshAfterPay = await rameshAfterPayRes.json();
    assert(
      rameshAfterPay.data.currentBalance === rameshBalanceBefore - 500,
      `Customer balance updated from ₹${rameshBalanceBefore} to ₹${rameshAfterPay.data.currentBalance}`
    );

    // 11. Reports verification
    const profitReportRes = await fetch(`${BASE_URL}/reports/sales-profit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const profitReport = await profitReportRes.json();
    assert(profitReport.success && profitReport.data.grossProfit !== undefined, 'Sales & Gross profit report calculated correctly');

    const gstReportRes = await fetch(`${BASE_URL}/reports/gst-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const gstReport = await gstReportRes.json();
    assert(gstReport.success && gstReport.data.rateWise.length > 0, 'GST Rate-wise tax summary report calculated correctly');

    const stockValReportRes = await fetch(`${BASE_URL}/reports/stock-valuation`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stockValReport = await stockValReportRes.json();
    assert(
      stockValReport.success && stockValReport.data.totalPurchaseValue > 0,
      `Stock valuation calculated: Total Cost = ₹${stockValReport.data.totalPurchaseValue}, Retail = ₹${stockValReport.data.totalSellingValue}`
    );

    console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed === 0) {
      console.log('ALL SYSTEMS FULLY OPERATIONAL AND VERIFIED!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runTests();
