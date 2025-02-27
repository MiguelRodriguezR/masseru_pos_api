// controllers/receiptController.js
const Receipt = require('../models/Receipt');
const Sale = require('../models/Sale');
const generateReceipt = require('../utils/receiptGenerator');

exports.getReceipt = async (req, res) => {
  try {
    const { saleId } = req.params;
    let receipt = await Receipt.findOne({ sale: saleId });
    if(!receipt) {
      const sale = await Sale.findById(saleId)
        .populate('user', 'name email')
        .populate('items.product', 'name salePrice');
      if(!sale) return res.status(404).json({ msg: 'Venta no encontrada' });
      const receiptData = generateReceipt(sale);
      receipt = new Receipt({
        sale: saleId,
        receiptData
      });
      await receipt.save();
      return res.status(201).json({ msg: 'Recibo generado', receipt });
    }
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
