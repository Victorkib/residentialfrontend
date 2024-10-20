/* eslint-disable react/prop-types */

import { FaReceipt } from 'react-icons/fa'; // Import icons for actions
import './DepositHistoryPopup.scss';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';

const DepositHistoryPopup = ({ depositDateHistory, onClose, tenant }) => {
  // Function to handle generating a receipt
  const handleGenerateReceipt = (deposit) => {
    console.log('Generating receipt for deposit:', deposit);
    handleDownload(deposit);
  };

  // Function to handle downloading the PDF receipt
  const handleDownload = (deposit) => {
    const doc = new jsPDF();

    // Load the logo image to get its dimensions
    const logo = new Image();
    logo.src = '/homelogo.png'; // Path to the logo

    logo.onload = function () {
      // Get original dimensions
      const originalWidth = logo.width;
      const originalHeight = logo.height;

      // Calculate aspect ratio
      const aspectRatio = originalWidth / originalHeight;

      // Set desired width
      const desiredWidth = 50; // You can set your desired width here
      const newWidth = desiredWidth; // Use desired width
      const newHeight = desiredWidth / aspectRatio; // Calculate height based on aspect ratio

      // Add letterhead
      doc.addImage(logo, 'PNG', 10, 10, newWidth, newHeight);
      doc.setFontSize(16);
      doc.text('Sleek Abode Apartments', 70, 20);
      doc.setFontSize(12);
      doc.text('Kimbo, Ruiru.', 70, 30);
      doc.text('Contact: sleekabodemanagement@gmail.com', 70, 35);
      doc.text('Phone: (+254) 788-413-323', 70, 40);

      doc.setLineWidth(1);
      doc.line(10, 45, 200, 45);

      doc.setFontSize(20);
      doc.text('Deposit Receipt', 14, 60);

      // Add tenant details
      doc.setFontSize(12);
      doc.text(`Tenant Name: ${tenant.name}`, 14, 70);
      doc.text(`Phone No: ${tenant.phoneNo}`, 14, 75);
      doc.text(`Apartment: ${tenant.apartmentId.name}`, 14, 80);
      doc.text(
        `House: ${
          'Floor' +
          tenant.houseDetails.floorNo +
          ', ' +
          tenant.houseDetails.houseNo
        }`,
        14,
        85
      );

      // Payment summary table
      const details = [
        ['Deposit Reference No', deposit.referenceNoUsed],
        ['Deposit Amount', `KSH ${deposit.amount.toFixed(2)}`],
        ['Deposit Date', moment(deposit.date).format('MMM DD YYYY')],
        ['Description', deposit.description],
      ];

      doc.autoTable({
        head: [['Description', 'Details']],
        body: details,
        startY: 90, // Adjust starting Y position as needed
        theme: 'grid',
        styles: { fontSize: 12 },
      });

      // Save the PDF
      doc.save(`receipt_${deposit.referenceNoUsed || 'DepositReceipt'}.pdf`);
    };
  };

  return (
    <div className="Depo-history-popup-overlay">
      <div className="popup-content">
        <h3>{tenant.name} Deposit History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference No</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {depositDateHistory?.map((deposit) => (
              <tr key={deposit._id}>
                <td>{new Date(deposit.date).toLocaleDateString()}</td>
                <td>{deposit.referenceNoUsed}</td>
                <td>{deposit.amount}</td>
                <td>{deposit.description}</td>
                <td>
                  {/* Action Icons: Edit, Delete, Generate Receipt */}

                  <FaReceipt
                    className="action-icon"
                    onClick={() => handleGenerateReceipt(deposit)}
                    title="Generate Receipt"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="closePopupDepo" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default DepositHistoryPopup;
