const orderdb = require('../../model/orderModel');
const PDFDocument = require('pdfkit-table');
const moment = require('moment');
const ExcelJS = require('exceljs');

const getSalesReport = async (req, res) => {
    try {
        res.render('salesReport');
    } catch (error) {
        console.log(error);
        res.render('error500');
    }
}

const generateReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate, reportType } = req.query;

        let salesData;
        let dailySalesData;
        let reportTitle;

        if (filterType === 'daily') {
            salesData = await getDailySales();
            dailySalesData = salesData;
            reportTitle = 'Today';
        } else if (filterType === 'weekly') {
            salesData = await getWeeklySales();
            dailySalesData = salesData;
            reportTitle = `This Week`;
        } else if (filterType === 'monthly') {
            salesData = await getMonthlySales();
            dailySalesData = salesData;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            reportTitle = monthNames[new Date().getMonth()]; // Use current month if no startDate provided
        } else if (filterType === 'yearly') {
            salesData = await getYearlySales();
            dailySalesData = salesData;
            reportTitle = `Yearly Sales Report (${new Date().getFullYear()})`;
        } else if (filterType === 'custom') {
            if (!startDate || !endDate) {
                throw new Error('Custom date range requires both start date and end date.');
            }
            salesData = await getCustomRangeSales(startDate, endDate);
            dailySalesData = salesData;
            reportTitle = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        }
        console.log(reportType);

        if (reportType === 'pdf') {
            generatePDFReport(res, reportTitle, salesData, dailySalesData); // Pass dailySalesData here
        } else if (reportType === 'excel') {
            generateExcelReport(res, reportTitle, salesData, dailySalesData);
        } else if (reportType === 'html') {
            generateHTMLReport(res, reportTitle, salesData, dailySalesData);
        } else {
            res.status(400).json({ message: 'Invalid report type' });
        }
    } catch (error) {
        console.error(error);
        res.render('error500');
    }
};

async function generatePDFReport(res, reportTitle, salesData, dailySalesData) {
    try {
        const doc = new PDFDocument();
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename=sales_report.pdf`, // inline for preview
                'Content-Length': pdfData.length
            });
            res.end(pdfData);
        });

        doc.fontSize(20).text(`BRODWAY`, { align: 'center' });
        doc.fontSize(18).text(`Sales Report (${reportTitle})`, { align: 'center' });
        doc.moveDown();

        // Overall Sales Report Table
        doc.fontSize(16).text('Sales Report', { underline: true });
        const overallTableHeaders = ['Date', 'Total Sales', 'Total Order Amount', 'Total Discount'];
        const overallTableData = dailySalesData.map(({ date, totalSales, totalOrderAmount, totalDiscount }) =>
            [new Date(date).toLocaleDateString(), totalSales, 'Rs.' + totalOrderAmount, 'Rs.' + totalDiscount]
        );
        const { totalSalesSum, totalOrderAmountSum, totalDiscountSum, totalCouponDiscountSum } = calculateTotalSums(dailySalesData);
        generateTable(doc, overallTableHeaders, overallTableData, totalSalesSum, totalOrderAmountSum, totalDiscountSum, totalCouponDiscountSum);

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
}

function calculateTotalSums(dailySalesData) {
    let totalSalesSum = 0;
    let totalOrderAmountSum = 0;
    let totalDiscountSum = 0;
    let totalCouponDiscountSum = 0;

    dailySalesData.forEach(({ totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
        totalSalesSum += totalSales;
        totalOrderAmountSum += totalOrderAmount;
        totalDiscountSum += totalDiscount;
        totalCouponDiscountSum += totalCouponDiscount;
    });

    return {
        totalSalesSum,
        totalOrderAmountSum,
        totalDiscountSum,
        totalCouponDiscountSum
    };
}

async function generateTable(doc, headers, data, totalSalesSum, totalOrderAmountSum, totalDiscountSum) {
    const tableData = [...data, ['Total:', totalSalesSum, 'Rs.' + totalOrderAmountSum, 'Rs.' + totalDiscountSum]];

    doc.table({
        headers: headers,
        rows: tableData,
        widths: Array(headers.length).fill('*'), // Equal width for all columns
        heights: 20,
        headerRows: 1
    });
}

async function generateExcelReport(res, reportTitle, salesData, dailySalesData) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total Sales', key: 'totalSales', width: 15 },
            { header: 'Total Order Amount', key: 'totalOrderAmount', width: 20 },
            { header: 'Total Discount', key: 'totalDiscount', width: 15 },
            { header: 'Total Coupon Discount', key: 'totalCouponDiscount', width: 20 }
        ];
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = `BRODWAY- ${reportTitle}`;
        worksheet.addRow(['Date', 'Total Sales', 'Total Order Amount', 'Total Discount', 'Total Coupon Discount']);

        // Add data rows
        dailySalesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
            worksheet.addRow({ date: new Date(date).toLocaleDateString(), totalSales, totalOrderAmount: 'Rs.' + totalOrderAmount, totalDiscount: 'Rs.' + totalDiscount, totalCouponDiscount: 'Rs.' + totalCouponDiscount });
        });

        // Add total sums row
        const { totalSalesSum, totalOrderAmountSum, totalDiscountSum, totalCouponDiscountSum } = calculateTotalSums(dailySalesData);
        worksheet.addRow(['Total:', totalSalesSum, 'Rs.' + totalOrderAmountSum, 'Rs.' + totalDiscountSum, 'Rs.' + totalCouponDiscountSum]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating Excel report' });
    }
}

// Add the following function for yearly sales data retrieval
async function getYearlySales() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    return await getOrderData(startOfYear, endOfYear);
}

// Helper functions to retrieve sales data based on different filter types
async function getDailySales() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return await getOrderData(startOfDay, endOfDay);
}

async function getWeeklySales() {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    return await getOrderData(startOfWeek, endOfWeek);
}

async function getMonthlySales() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return await getOrderData(startOfMonth, endOfMonth);
}

async function getCustomRangeSales(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await getOrderData(start, end);
}

async function getOrderData(startDate, endDate) {
    const orders = await orderdb.find({ orderedDate: { $gte: startDate, $lt: endDate } }).populate('items.productId');

    let dailySalesData = [];

    orders.forEach(order => {
        let totalSales = 0;
        let totalOrderAmount = order.totalAmount;
        let totalDiscount = 0;
        let totalCouponDiscount = 0;

        order.items.forEach(item => {
            totalSales += item.quantity;
            const productPrice = item.price * item.quantity;

            // Error Correction: Ensure item.productId is not null before accessing its properties
            if (item.productId) {
                const discountAmount = productPrice - item.productId.discount;
                totalDiscount += Math.round(discountAmount);
            }
            console.log(item, "total");
        });

        if (order.couponused) {
            totalCouponDiscount += order.couponused.maxdiscount;
        }

        dailySalesData.push({
            date: order.orderedDate,
            totalSales,
            totalOrderAmount,
            totalDiscount,
            totalCouponDiscount
        });
    });

    // Sort the daily sales data by order date in ascending order
    dailySalesData.sort((a, b) => a.date - b.date);

    return dailySalesData;
}

const modalgenerateReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate, reportType } = req.query;

        let salesData;
        let dailySalesData;
        let reportTitle;

        if (filterType === 'daily') {
            salesData = await getDailySales();
            dailySalesData = salesData;
            reportTitle = 'Today';
        } else if (filterType === 'weekly') {
            salesData = await getWeeklySales();
            dailySalesData = salesData;
            reportTitle = `This Week`;
        } else if (filterType === 'monthly') {
            salesData = await getMonthlySales();
            dailySalesData = salesData;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            reportTitle = monthNames[new Date().getMonth()]; // Use current month if no startDate provided
        } else if (filterType === 'yearly') {
            salesData = await getYearlySales();
            dailySalesData = salesData;
            reportTitle = `Yearly Sales Report (${new Date().getFullYear()})`;
        } else if (filterType === 'custom') {
            if (!startDate || !endDate) {
                throw new Error('Custom date range requires both start date and end date.');
            }
            salesData = await getCustomRangeSales(startDate, endDate);
            dailySalesData = salesData;
            reportTitle = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        }
        console.log(reportType);

        if (reportType === 'pdf') {
            generatePDFReport(res, reportTitle, salesData, dailySalesData); // Pass dailySalesData here
        } else if (reportType === 'excel') {
            generateExcelReport(res, reportTitle, salesData, dailySalesData);
        } else if (reportType === 'html') {
            generateHTMLReport(res, reportTitle, salesData, dailySalesData);
        } else {
            res.status(400).json({ message: 'Invalid report type' });
        }
    } catch (error) {
        console.error(error);
        res.render('error500');
    }
};

function generateHTMLReport(res, reportTitle, salesData, dailySalesData) {
    let html = `<h2>${reportTitle}</h2>`;
    html += '<table class="table table-striped">';
    html += '<thead><tr><th>Date</th><th>Total Sales</th><th>Total Order Amount</th><th>Total Discount</th><th>Total Coupon Discount</th></tr></thead>';
    html += '<tbody>';
    dailySalesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
        html += `<tr>
                    <td>${new Date(date).toLocaleDateString()}</td>
                    <td>${totalSales}</td>
                    <td>Rs.${totalOrderAmount}</td>
                    <td>Rs.${totalDiscount}</td>
                    <td>Rs.${totalCouponDiscount}</td>
                </tr>`;
    });

    const { totalSalesSum, totalOrderAmountSum, totalDiscountSum, totalCouponDiscountSum } = calculateTotalSums(dailySalesData);
    html += `<tr>
                <td><strong>Total:</strong></td>
                <td>${totalSalesSum}</td>
                <td>Rs.${totalOrderAmountSum}</td>
                <td>Rs.${totalDiscountSum}</td>
                <td>Rs.${totalCouponDiscountSum}</td>
            </tr>`;
    html += '</tbody></table>';

    res.send(html);
}

module.exports = {
    generateReport,
    getSalesReport,
    modalgenerateReport
};
