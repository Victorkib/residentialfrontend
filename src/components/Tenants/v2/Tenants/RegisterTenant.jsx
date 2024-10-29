/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import './RegisterTenant.scss';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../../../lib/apiRequest';
import { TailSpin } from 'react-loader-spinner';
import { toast, ToastContainer } from 'react-toastify';

const RegisterTenant = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nationalId: '',
    phoneNo: '',
    placementDate: '',
    houseNo: '',
    emergencyContactNumber: '',
    emergencyContactName: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [selectedApartment, setSelectedApartment] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [isHousePopupVisible, setIsHousePopupVisible] = useState(false);
  const [isDepositPopupVisible, setIsDepositPopupVisible] = useState(false);
  const [tenantData, setTenantData] = useState(null);

  // Separate form data for single and multiple deposits
  const [singleDepositData, setSingleDepositData] = useState({
    totalAmount: '',
    referenceNo: '',
    depositDate: '',
  });

  const [multipleDepositData, setMultipleDepositData] = useState({
    rentDeposit: '',
    waterDeposit: '',
    initialRentPayment: '',
    referenceNo: '',
    depositDate: '',
  });

  const [showSingleDeposit, setShowSingleDeposit] = useState(true); // Default to single deposit
  const [houses, setHouses] = useState([]);
  const [organizedData, setOrganizedData] = useState({});

  const [floors, setFloors] = useState([]);

  const getFloorName = (floorNumber) => {
    if (floorNumber === 0) return 'Ground Floor';

    const ordinalSuffix = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    return `${floorNumber}${ordinalSuffix(floorNumber)} Floor`;
  };
  // Fetch available floors from backend
  const fetchFloors = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get('/v2/floors/getAllFloors');
      const floorsData = response.data.map((floor) => ({
        floorName: getFloorName(floor.floorNumber),
        floorNumber: floor.floorNumber,
      }));
      setFloors(floorsData);
    } catch (error) {
      toast.error('Error fetching floors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchHouses = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/houses/getAllHouses');
        const houseData = response.data;
        setHouses(houseData);

        // Organize houses by apartment and floor
        const organizedHouses = houseData.reduce((acc, house) => {
          const apartmentId = house.apartment._id;
          const floor = house.floor;

          if (!acc[apartmentId])
            acc[apartmentId] = { apartment: house.apartment, floors: {} };

          if (!acc[apartmentId].floors[floor])
            acc[apartmentId].floors[floor] = [];
          acc[apartmentId].floors[floor].push(house);

          return acc;
        }, {});

        setOrganizedData(organizedHouses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching houses:', error);
        toast.error(error.response.data.message || 'Error Fetching Houses');
        setLoading(false);
      }
    };
    fetchFloors();
    fetchHouses();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSingleDepositChange = (e) => {
    setSingleDepositData({
      ...singleDepositData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMultipleDepositChange = (e) => {
    setMultipleDepositData({
      ...multipleDepositData,
      [e.target.name]: e.target.value,
    });
  };

  //apartment selection
  const handleApartmentSelection = (apartment) => {
    setSelectedApartment(apartment);
    setSelectedFloor(null);
    setSelectedHouse(null);
  };

  const handleFloorSelection = (floor) => {
    setSelectedFloor(floor);
  };

  const handleHouseSelection = (house) => {
    console.log('house: ', house);
    if (!house.isOccupied) {
      const houseLetter = house.houseName.slice(-1);
      const houseNumber = `${selectedFloor}${houseLetter}`;
      setSelectedHouse(houseNumber);
      setFormData({ ...formData, houseNo: house?.houseName });
      setIsHousePopupVisible(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest.post('/v2/tenants/createTenant', {
        ...formData,
        apartmentId: selectedApartment?._id,
        floorNumber: selectedFloor, // Add this line
      });
      if (response.status) {
        setTenantData(response.data);
        closeConfirmCreateTenant();
        setIsDepositPopupVisible(true);
        setLoading(false);
        toast.success('Success Tenant Creation');
      }
    } catch (error) {
      closeConfirmCreateTenant();
      setError(error.response.data.message);
      setLoading(false);
      toast.error(error.response.data.message || 'Error Creating Tenant');
    } finally {
      setError('');
    }
  };
  const [createConfirmationPopup, setCreateConfirmationPopup] = useState(false);

  const handleCreateTenant = (e) => {
    e.preventDefault();
    setCreateConfirmationPopup(true);
  };
  const closeConfirmCreateTenant = () => {
    setCreateConfirmationPopup(false);
  };

  const handleDeposit = async (url, depositData, e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest.post(url, {
        ...depositData,
        tenantId: tenantData._id,
      });
      if (response.status) {
        console.log('responseData: ', response.data);
        showSingleDeposit && showSingleDeposit
          ? closeFundsConfirm()
          : closeMultiFundsConfirm();
        const isCleared = response.data.tenant.deposits.isCleared;
        navigate(isCleared ? '/listAllTenants' : '/v2/incompleteDeposits');
        setLoading(false);
        toast.success('Success Deposits Addition');
      }
    } catch (error) {
      setError(error.response.data.message);
      toast.error(error.response.data.message || 'Error Adding Deposits');
      console.error('Error processing deposit:', error);
      setLoading(false);
    } finally {
      setError('');
    }
  };

  const [fundsConfirmPopup, setFundsConfirmPopup] = useState(false);
  const [multiFundsConfirmPopup, setMultiFundsConfirmPopup] = useState(false);

  const fundConfirm = (e) => {
    e.preventDefault();
    setFundsConfirmPopup(true);
  };
  const closeFundsConfirm = () => {
    setFundsConfirmPopup(false);
  };

  const multiFundConfirm = (e) => {
    e.preventDefault();
    setMultiFundsConfirmPopup(true);
  };
  const closeMultiFundsConfirm = () => {
    setMultiFundsConfirmPopup(false);
  };

  const formattedPlacementDate = new Date(
    formData.placementDate
  ).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="register-tenant">
      {!tenantData && (
        <div className="registration-card">
          <h2>Tenant Registration</h2> <hr className="h" />
          <form onSubmit={handleCreateTenant}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="nationalId">National Id</label>
            <input
              type="text"
              name="nationalId"
              placeholder="National ID"
              value={formData.nationalId}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="phoneNo">Phone No.</label>
            <input
              type="text"
              name="phoneNo"
              placeholder="Phone No."
              value={formData.phoneNo}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="placementDate">Placement Date</label>
            <input
              type="date"
              name="placementDate"
              value={formData.placementDate}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="emergencyContactName">Emergency Contact Name</label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleInputChange}
            />
            <label htmlFor="emergencyContactNumber">Emergency Contact No</label>
            <input
              type="number"
              id="emergencyContactNumber"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleInputChange}
            />
            <div
              className="house-selection"
              onClick={() => setIsHousePopupVisible(true)}
            >
              {selectedHouse ? selectedHouse : 'Select House'}
            </div>
            {error && <span>{error}</span>}
            <button type="submit">Register Tenant</button>
          </form>
        </div>
      )}

      {isHousePopupVisible && (
        <div className="floor-popup">
          <button
            className="closePopup"
            onClick={() => setIsHousePopupVisible(false)}
          >
            ×
          </button>
          <h3>Select an Apartment</h3>
          <div className="apartment-selection">
            {Object?.values(organizedData)?.map(({ apartment }) => (
              <div
                key={apartment?._id}
                className={`apartment-option ${
                  selectedApartment && selectedApartment?._id === apartment._id
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleApartmentSelection(apartment)}
              >
                {apartment.name}
              </div>
            ))}
          </div>
          {selectedApartment && (
            <>
              <h3>Floor Selection</h3>
              <div className="floorAndHouse">
                <div className="floor-selection">
                  {Object.keys(
                    organizedData[selectedApartment?._id]?.floors || {}
                  ).map((floorNumber) => {
                    const floorName = getFloorName(Number(floorNumber));
                    return (
                      <div
                        key={floorNumber}
                        className={`floor-option ${
                          selectedFloor === Number(floorNumber)
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          handleFloorSelection(Number(floorNumber))
                        }
                      >
                        {floorName}
                      </div>
                    );
                  })}
                </div>

                {selectedFloor !== null && (
                  <div className="houseSelectionParent">
                    <h3>House Selection</h3>
                    <div className="house-selection">
                      {organizedData[selectedApartment?._id].floors[
                        selectedFloor
                      ]?.map((house) => (
                        <div
                          key={house?._id}
                          className={`house-option ${
                            selectedHouse ===
                            `${selectedFloor}${house?.houseName.slice(-1)}`
                              ? 'selected'
                              : ''
                          } ${house?.isOccupied ? 'occupied' : ''}`}
                          onClick={() => handleHouseSelection(house)}
                        >
                          {house?.houseName} {house?.isOccupied && '(Occupied)'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isDepositPopupVisible && (
        <div className="deposit-popup">
          <button
            className="close-popup"
            onClick={(e) =>
              handleDeposit(
                '/v2/tenants/addSingleAmountDeposit',
                singleDepositData,
                e
              )
            }
          >
            ×
          </button>
          <h2>
            <span>Tenant </span> : {tenantData.name}
          </h2>
          <div className="deposit-toggle">
            <button onClick={() => setShowSingleDeposit(!showSingleDeposit)}>
              {showSingleDeposit
                ? 'Switch to Multiple Deposits'
                : 'Switch to Single Deposit'}
            </button>
          </div>
          <div className="card-options">
            {showSingleDeposit ? (
              <div className="deposit-card single-deposit">
                <h3>Single Deposit</h3>
                <form onSubmit={fundConfirm}>
                  <label htmlFor="totalAmount">Total Amount</label>
                  <input
                    type="number"
                    name="totalAmount"
                    placeholder="Total Amount"
                    value={singleDepositData.totalAmount}
                    onChange={handleSingleDepositChange}
                    required
                  />
                  <label htmlFor="referenceNo">Reference No.</label>
                  <input
                    type="text"
                    name="referenceNo"
                    placeholder="Reference No."
                    value={singleDepositData.referenceNo}
                    onChange={handleSingleDepositChange}
                    required
                  />
                  <label htmlFor="depositDate">Deposit Date</label>
                  <input
                    type="date"
                    name="depositDate"
                    value={singleDepositData.depositDate}
                    onChange={handleSingleDepositChange}
                    required
                  />
                  {error && <span>{error}</span>}
                  <button type="submit">Submit Deposit</button>
                </form>
              </div>
            ) : (
              <div className="deposit-card multiple-deposits">
                <h3>Multiple Deposits</h3>
                <form onSubmit={multiFundConfirm}>
                  <label htmlFor="rentDeposit">Rent Deposit</label>
                  <input
                    type="number"
                    name="rentDeposit"
                    placeholder="Rent Deposit"
                    value={multipleDepositData.rentDeposit}
                    onChange={handleMultipleDepositChange}
                    required
                  />
                  <label htmlFor="waterDeposit">Water Deposit</label>
                  <input
                    type="number"
                    name="waterDeposit"
                    placeholder="Water Deposit"
                    value={multipleDepositData.waterDeposit}
                    onChange={handleMultipleDepositChange}
                    required
                  />
                  <label htmlFor="initialRentPayment">
                    Initial Rent Payment
                  </label>
                  <input
                    type="number"
                    name="initialRentPayment"
                    placeholder="Initial Rent Payment"
                    value={multipleDepositData.initialRentPayment}
                    onChange={handleMultipleDepositChange}
                    required
                  />
                  <label htmlFor="referenceNo">Reference No.</label>
                  <input
                    type="text"
                    name="referenceNo"
                    placeholder="Reference No."
                    value={multipleDepositData.referenceNo}
                    onChange={handleMultipleDepositChange}
                    required
                  />
                  <label htmlFor="depositDate">Deposit Date</label>
                  <input
                    type="date"
                    name="depositDate"
                    value={multipleDepositData.depositDate}
                    onChange={handleMultipleDepositChange}
                    required
                  />
                  {error && <span>{error}</span>}
                  <button type="submit">Submit Deposits</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer />
      {loading && (
        <div className="loader-overlay">
          <TailSpin
            height="100"
            width="100"
            color="#4fa94d"
            ariaLabel="loading"
            visible={true}
          />
        </div>
      )}

      {createConfirmationPopup && (
        <div className="confirm-popup-overlay">
          <div className="confirm-popup">
            <h3>Confirm Tenant Details</h3>
            <ul>
              <li>
                <strong>Name:</strong> {formData.name}
              </li>
              <li>
                <strong>Email:</strong> {formData.email}
              </li>
              <li>
                <strong>National ID:</strong> {formData.nationalId}
              </li>
              <li>
                <strong>Phone No.:</strong> {formData.phoneNo}
              </li>
              <li>
                <strong>Placement Date:</strong> {formattedPlacementDate}
              </li>
              <li>
                <strong>House No:</strong> {selectedHouse || 'Not Selected'}
              </li>
              <li>
                <strong>Emergency Contact Name:</strong>{' '}
                {formData.emergencyContactName}
              </li>
              <li>
                <strong>Emergency Contact No.:</strong>{' '}
                {formData.emergencyContactNumber}
              </li>
            </ul>
            <div className="confirm-actions">
              <button onClick={handleSubmit} className="confirm-button">
                Confirm
              </button>
              <button
                onClick={closeConfirmCreateTenant}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirm single amount depo */}
      {fundsConfirmPopup && (
        <div className="single-confirmation-popup">
          <div className="popup-content glass-card">
            <h3>Confirm Deposit Details</h3>
            <div className="popup-details">
              <div className="detail-item">
                <span className="label">Tenant:</span>
                <span className="value">{tenantData.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Amount:</span>
                <span className="value">
                  Ksh{' '}
                  {new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                  }).format(singleDepositData.totalAmount)}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Reference No:</span>
                <span className="value">{singleDepositData.referenceNo}</span>
              </div>
              <div className="detail-item">
                <span className="label">Deposit Date:</span>
                <span className="value">
                  {new Date(singleDepositData.depositDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="popup-actions">
              <button className="cancel-btn" onClick={closeFundsConfirm}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={(e) =>
                  handleDeposit(
                    '/v2/tenants/addSingleAmountDeposit',
                    singleDepositData,
                    e
                  )
                }
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Multiple Deposits Popup */}
      {multiFundsConfirmPopup && (
        <div className="multiFunds-confirmation-popup">
          <div className="popup-content glass-card">
            <h3>Confirm Deposit Details</h3>
            <div className="popup-details">
              <div className="detail-item">
                <span className="label">Tenant:</span>
                <span className="value">{tenantData.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Amount:</span>
                <ul className="amount-list">
                  <li>
                    Rent Deposit:
                    <span className="value">
                      {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                      }).format(multipleDepositData.rentDeposit)}
                    </span>
                  </li>
                  <li>
                    Water Deposit:
                    <span className="value">
                      {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                      }).format(multipleDepositData.waterDeposit)}
                    </span>
                  </li>
                  <li>
                    Initial Rent Payment:
                    <span className="value">
                      {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                      }).format(multipleDepositData.initialRentPayment)}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="detail-item">
                <span className="label">Reference No:</span>
                <span className="value">{multipleDepositData.referenceNo}</span>
              </div>
              <div className="detail-item">
                <span className="label">Deposit Date:</span>
                <span className="value">
                  {new Date(
                    multipleDepositData.depositDate
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="popup-actions">
              <button className="cancel-btn" onClick={closeMultiFundsConfirm}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={(e) =>
                  handleDeposit(
                    '/v2/tenants/addDeposits',
                    multipleDepositData,
                    e
                  )
                }
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterTenant;
