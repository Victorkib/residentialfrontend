/* eslint-disable react/prop-types */
import { useState } from 'react';
import jsPDF from 'jspdf'; // PDF generation library
import 'jspdf-autotable'; // To generate tables in PDFs
import ReactPaginate from 'react-js-pagination'; // Pagination library
import './PaymentDataPopup.scss'; // SCSS file for styling

const PaymentDataPopup = ({ paymentsData, paymentsDataTenant, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Number of items to display per page

  // Calculate the current payments to display
  const indexOfLastPayment = currentPage * itemsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
  const currentPayments = paymentsData.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );

  // Function to handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Function to handle document download
  const handleDownload = () => {
    const doc = new jsPDF();

    // Load the logo image
    const img = new Image();
    img.src = '/houselogo1.png'; // Path to your logo image

    img.onload = function () {
      // Define logo dimensions
      const logoWidth = 50;
      const aspectRatio = img.width / img.height;
      const logoHeight = logoWidth / aspectRatio;

      // Add the logo to the document
      doc.addImage(img, 'PNG', 10, 10, logoWidth, logoHeight);

      // Company Details
      doc.setFontSize(14);
      doc.text('Sleek Abode Apartments', 70, 20);
      doc.setFontSize(10);
      doc.text('Kimbo, Ruiru.', 70, 30);
      doc.text('Contact: sleekabodemanagement@gmail.com', 70, 35);
      doc.text('Phone: (+254) 788-413-323', 70, 40);

      // Title for the payment report
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.text('Tenant Payment Report', 10, 70);

      // Tenant Name and Total Amount Paid
      doc.setFont('times', 'normal');
      doc.text(`Tenant: ${paymentsDataTenant.name}`, 10, 80);
      doc.text(
        `Total Amount Paid: Ksh ${paymentsDataTenant.totalAmountPaid}`,
        10,
        90
      ); // Total Amount Paid

      // Date and Time
      const today = new Date();
      const date = `${today.getDate()}/${
        today.getMonth() + 1
      }/${today.getFullYear()}`;
      const time = `${today.getHours()}:${today.getMinutes()}`;
      doc.setFontSize(12);
      doc.text(`Generated on: ${date} at ${time}`, 100, 70); // Right-aligned date

      // Creating a table for the payment data
      const tableColumnHeaders = [
        'Payment Date',
        'Rent',
        'Water Bill',
        'Garbage Fee',
        'Extra Charges',
        'Amount Paid',
        'Reference No (Amount, Ref No, Date)',
        'Status',
      ];

      // Generate the table rows
      const tableRows = paymentsData.map((payment) => {
        // Combine all reference numbers with their date and amount from referenceNoHistory
        const referenceDetails =
          payment.referenceNoHistory
            ?.map(
              (ref) =>
                `Amount: ${ref.amount}\nRef No: ${
                  ref.referenceNoUsed
                }\nDate: ${new Date(ref.date).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
            )
            .join('\n\n') || 'N/A'; // Display 'N/A' if there are no references

        return [
          `${payment.month} ${payment.year}`, // Format the date
          payment.rent.amount,
          payment.waterBill.amount,
          payment.garbageFee.amount,
          payment.extraCharges.amount,
          payment.totalAmountPaid,
          referenceDetails, // Vertically formatted reference details
          payment.isCleared ? 'Cleared' : 'Pending',
        ];
      });

      // Adding table with improved styling
      doc.autoTable({
        head: [tableColumnHeaders],
        body: tableRows,
        startY: 100, // Start below the title and tenant name
        theme: 'grid', // Use grid lines for better readability
        styles: { fontSize: 12, cellPadding: 3, overflow: 'linebreak' }, // Cell padding and overflow options
        headStyles: {
          fillColor: [22, 160, 133], // Teal header background
          textColor: [255, 255, 255], // White text for headers
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Automatically adjust the width for the first column
          1: { halign: 'right', cellWidth: 'max-content' }, // Set max-content width for the rent column
          2: { halign: 'right', cellWidth: 'max-content' }, // Set max-content width for water bill column
          3: { halign: 'right', cellWidth: 'max-content' }, // Set max-content width for garbage fee column
          4: { halign: 'right', cellWidth: 'max-content' }, // Set max-content width for extra charges column
          5: { halign: 'right', cellWidth: 'max-content' }, // Set max-content width for total amount paid column
          6: { cellWidth: 'max-content', halign: 'left' }, // Increase width for reference details
          7: { halign: 'center', cellWidth: 'max-content' }, // Center align status and set max-content width
        },
        margin: { top: 10 },
      });

      // Footer
      doc.setFontSize(10);
      doc.setFont('times', 'italic');
      doc.text(
        'Thank you for your continued partnership with Sleek Abode Apartments.',
        10,
        doc.internal.pageSize.height - 10
      ); // Add at bottom of page

      // Save the document as PDF
      doc.save('TenantPayment_Report.pdf');
    };

    // Error handler for logo loading
    img.onerror = function () {
      alert('Failed to load logo image.');
    };
  };

  return (
    <div className="paymentDataPopupContainer">
      <div className="paymentPopupContent">
        <div className="paymentPopupHeader">
          <img
            src="/houselogo1.png"
            alt="Sleek Abode Apartments Logo"
            className="logo"
          />
          <div className="letterhead">
            <h2>Sleek Abode Apartments</h2>
            <p>Location: 123 Elegant Lane, Cityville</p>
            <p>Email:sleekabodemanagement@gmail.com</p>
            <p>Phone: (+254) 788-413-323</p>
          </div>
        </div>
        <h3>Tenant: {paymentsDataTenant.name}</h3>
        <p>Total Amount Paid: Ksh {paymentsDataTenant.totalAmountPaid}</p>
        {/* Display total amount paid */}
        <table className="payment-tenant-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Rent</th>
              <th>Water Bill</th>
              <th>Garbage Fee</th>
              <th>Extra Charges</th>
              <th>Amount Paid</th>
              <th>Reference No (Date, Amount)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.map((payment, index) => (
              <tr key={index}>
                <td>{`${payment.month} ${payment.year}`}</td>
                <td>{payment.rent.amount}</td>
                <td>{payment.waterBill.amount}</td>
                <td>{payment.garbageFee.amount}</td>
                <td>{payment.extraCharges.amount}</td>
                <td>{payment.totalAmountPaid}</td>

                {/* Reference No section with date and amount */}
                <td>
                  {payment.referenceNoHistory?.map((ref, refIndex) => (
                    <div key={refIndex}>
                      Ref: {ref.referenceNoUsed} <br />
                      Amount: {ref.amount} <br />
                      Date:{' '}
                      {new Date(ref.date).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  ))}
                </td>
                <td>{payment.isCleared ? 'Cleared' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="paginationContainer">
          <ReactPaginate
            activePage={currentPage}
            itemsCountPerPage={itemsPerPage}
            totalItemsCount={paymentsData.length}
            pageRangeDisplayed={5}
            onChange={handlePageChange}
            itemClass="paginationItem" // CSS class for pagination items
            linkClass="paginationLink" // CSS class for pagination links
            activeClass="activePage" // CSS class for the active page
          />
        </div>
        <div className="popupButtons">
          <button className="downloadButton" onClick={handleDownload}>
            Download PDF
          </button>
          <button className="closeButton" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDataPopup;
