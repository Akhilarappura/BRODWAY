const fs = require('fs');
const path = require('path');
const os = require('os');
const PDFDocument = require('pdfkit');
const Orderdb = require('../../model/orderModel');

const generateOrderInvoice = async (req, res) => {
  try {
    const orderId = req.query.id;

    const order = await Orderdb.findById(orderId)
      .populate('items.productId')
      .populate('address');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=order_invoice.pdf');
    doc.pipe(res);

    // Header Section
    doc.image('public/imgee/logobro.jpg', { width: 50, align: 'right' }).moveDown(0.5);
    doc.fontSize(20).text('BRODWAY', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Invoice', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(12)
       .text(`Invoice No.: ${order._id}`, { align: 'right' })
       .text(`Invoice Date: ${new Date().toISOString().split('T')[0]}`, { align: 'right' })
       .text(`Due Date: ${new Date().toISOString().split('T')[0]}`, { align: 'right' })
       .moveDown();

    // Billed from and Billed to
    const billingInfoY = doc.y;
    doc.text('Billed From', 50, billingInfoY)
       .font('Helvetica-Bold')
       .text('BRODWAY')
       .font('Helvetica')
       .text('BRODWAY@gmail.com')
       .text('123 Arappura Street')
       .text('TVM, ST 12345')
       .text('INDIA');

    doc.text('Billed To', 300, billingInfoY)
       .font('Helvetica-Bold')
       .text(order.address.name)
       .font('Helvetica')
       .text(order.address.email)
       .text(order.address.address)
       .text(order.address.locality)
       .text(order.address.state)
       .text(order.address.pincode);

    doc.moveDown();

    // Table headers
    const tableTop = Math.max(doc.y, 250);
    const itemCodeX = 50;
    const descriptionX = 150;
    const quantityX = 280;
    const priceX = 370;
    const amountX = 450;

    doc.font('Helvetica-Bold');
    doc.text('Item Code', itemCodeX, tableTop)
       .text('Description', descriptionX, tableTop)
       .text('Qty', quantityX, tableTop)
       .text('Price', priceX, tableTop)
       .text('Amount', amountX, tableTop);

    doc.moveTo(50, tableTop + 20)
       .lineTo(550, tableTop + 20)
       .stroke();

    // Table rows
    doc.font('Helvetica');
    let position = tableTop + 30;
    order.items.forEach(item => {
      const product = item.productId;
      doc.text(product._id.toString().slice(-6), itemCodeX, position)
         .text(product.product_name, descriptionX, position)
         .text(item.quantity.toString(), quantityX, position)
         .text(`Rs.${product.price}`, priceX, position)
         .text(`Rs.${product.price * item.quantity}`, amountX, position);
      position += 20;
    });

    // Footer
    doc.moveTo(50, position + 20)
       .lineTo(550, position + 20)
       .stroke();

    doc.text(`Total Amount: Rs.${order.totalAmount}`, { align: 'right' });

    doc.moveDown()
       .fontSize(12)
       .text('Thank You for Shopping at BRODWAY!', { align: 'center' });

    doc.end();


  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  generateOrderInvoice
};
