/* eslint-disable react/prop-types */
import { useState } from 'react';
import './EditHousePopup.scss';
import { toast } from 'react-toastify';
import apiRequest from '../../lib/apiRequest';

const EditHousePopup = ({ house, onClose, onUpdate }) => {
  const [houseName, setHouseName] = useState(house.houseName);
  const [rentPayable, setRentPayable] = useState(house.rentPayable);
  const [months, setMonths] = useState(house.months);
  const [rentDeposit, setRentDeposit] = useState(house.rentDeposit);
  const [waterDeposit, setWaterDeposit] = useState(house.waterDeposit);
  const [otherDeposits, setOtherDeposits] = useState(house.otherDeposits || []);

  const handleRentPayableChange = (e) => {
    const value = e.target.value;
    setRentPayable(value);
    if (months) {
      setRentDeposit(value * months);
    }
  };

  const handleMonthsChange = (e) => {
    const value = e.target.value;
    setMonths(value);
    if (rentPayable) {
      setRentDeposit(rentPayable * value);
    }
  };

  const handleOtherDepositChange = (index, field, value) => {
    const updatedDeposits = [...otherDeposits];
    updatedDeposits[index][field] = value;
    setOtherDeposits(updatedDeposits);
  };

  const addOtherDepositField = () => {
    setOtherDeposits([...otherDeposits, { title: '', amount: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest.put(
        `/houses/updateHouse/${house._id}`,
        {
          houseName,
          rentPayable,
          months,
          rentDeposit,
          waterDeposit,
          otherDeposits,
        }
      );
      if (response.status === 200) {
        toast.success('House details updated successfully!');
        onUpdate(); // Call to refresh the house list or update the UI
        onClose(); // Close the popup
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Error updating house details'
      );
    }
  };

  return (
    <div className="edit-house-popup">
      <button onClick={onClose} className="close-popup-btn">
        Close
      </button>
      <h2>Edit House Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>House/Unit Name</label>
          <input
            type="text"
            value={houseName}
            onChange={(e) => setHouseName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Rent Payable</label>
          <input
            type="number"
            value={rentPayable}
            onChange={handleRentPayableChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Number of Months</label>
          <input
            type="number"
            value={months}
            onChange={handleMonthsChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Rent Deposit</label>
          <input type="number" value={rentDeposit} readOnly />
        </div>
        <div className="form-group">
          <label>Water Deposit</label>
          <input
            type="number"
            value={waterDeposit}
            onChange={(e) => setWaterDeposit(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Other Deposits</label>
          {otherDeposits.map((deposit, index) => (
            <div key={index} className="other-deposit-form">
              <input
                type="text"
                placeholder="Deposit Title"
                value={deposit.title}
                onChange={(e) =>
                  handleOtherDepositChange(index, 'title', e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Deposit Amount"
                value={deposit.amount}
                onChange={(e) =>
                  handleOtherDepositChange(index, 'amount', e.target.value)
                }
              />
            </div>
          ))}
          <button type="button" onClick={addOtherDepositField}>
            Add Another Deposit
          </button>
        </div>
        <button type="submit" className="update-btn">
          Update House
        </button>
      </form>
    </div>
  );
};

export default EditHousePopup;
