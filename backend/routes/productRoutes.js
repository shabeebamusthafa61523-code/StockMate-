const express = require('express');
const router = express.Router();
const {
  getProducts,
  lookupProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsCSV,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/export/csv', protect, exportProductsCSV);
router.get('/lookup/:code', protect, lookupProduct);

router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorize('admin', 'storekeeper'), createProduct);

router
  .route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('admin', 'storekeeper'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
