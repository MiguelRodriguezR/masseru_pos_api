// utils/receiptGenerator.js
module.exports = function generateReceipt(sale) {
  // Genera un objeto de recibo con los detalles de la venta
  const receiptData = {
    receiptId: sale._id,
    date: sale.saleDate,
    seller: sale.user,
    items: sale.items.map(item => ({
      product: item.product.name,
      quantity: item.quantity,
      unitPrice: item.salePrice,
      total: item.salePrice * item.quantity,
      variant: item.variant
    })),
    totalAmount: sale.totalAmount
  };
  return receiptData;
};
