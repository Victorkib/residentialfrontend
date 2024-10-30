import { useState, useEffect } from 'react';
import './RegisterHouse.scss';
import { ThreeDots } from 'react-loader-spinner';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiRequest from '../../lib/apiRequest';
import { useLocation, useParams } from 'react-router-dom';
import EditHousePopup from './EditHousePopup';
import { FaEdit, FaTrash } from 'react-icons/fa';
import MapComponent from './MapComponent';

// Function to map floor number to floor name with dynamic ordinal suffix generation
const getFloorName = (floorNumber) => {
  if (floorNumber === 0) return 'Ground Floor';

  const ordinalSuffix = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${floorNumber}${ordinalSuffix(floorNumber)} Floor`;
};

const RegisterHouse = () => {
  const { apartmentId } = useParams();
  const location = useLocation();
  const apartment = location?.state?.apartmentData || {};
  // console.log('apartment: ', apartment);
  const [floorOptions, setFloorOptions] = useState([]);
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [housesPerPage] = useState(4);
  const [showHouseNamePopup, setShowHouseNamePopup] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [registeredHouseNames, setRegisteredHouseNames] = useState([]);
  const [showAddFloorPopup, setShowAddFloorPopup] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState('');

  const [rentPayable, setRentPayable] = useState('');
  const [months, setMonths] = useState('');
  const [rentDeposit, setRentDeposit] = useState(0);
  const [waterDeposit, setWaterDeposit] = useState('');
  const [showOtherDeposits, setShowOtherDeposits] = useState(false);
  const [otherDeposits, setOtherDeposits] = useState([
    { title: '', amount: '' },
  ]);

  useEffect(() => {
    fetchFloors(); // Fetch available floors on component mount
    fetchHouses();
  }, []);

  // Fetch available floors from backend
  const fetchFloors = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get(
        `/v2/floors/getAllFloorsInApartment/${apartmentId}`
      );
      const floorsData = response.data.map((floor) => ({
        label: getFloorName(floor.floorNumber),
        value: floor.floorNumber,
      }));
      setFloorOptions(floorsData);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error fetching floors');
    } finally {
      setLoading(false);
    }
  };

  // Fetch houses
  const fetchHouses = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get(
        `/houses/getAllHouses/${apartmentId}`
      );
      const houseData = response.data;
      setHouses(houseData);

      // Only set registered house names if a floor is selected
      if (selectedFloor) {
        const registeredHousesInSelectedFloor = houseData.filter(
          (house) => house.floor === selectedFloor.value
        );
        setRegisteredHouseNames(registeredHousesInSelectedFloor);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error getting Houses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFloor = async () => {
    setLoading(true);

    if (newFloorNumber === '') return;
    const floorNumber = Number(newFloorNumber);
    const floorName = getFloorName(floorNumber);
    try {
      const response = await apiRequest.post('/v2/floors/addFloor', {
        floorNumber,
        floorName,
        apartmentId,
      });
      if (response.status === 200) {
        toast.success('Floor added successfully!');
        setShowAddFloorPopup(false);
        setNewFloorNumber('');
        await fetchFloors(); // Refetch floors after adding a new one
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error adding floor');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastHouse = currentPage * housesPerPage;
  const indexOfFirstHouse = indexOfLastHouse - housesPerPage;
  const currentHouses = houses.slice(indexOfFirstHouse, indexOfLastHouse);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const closeHouseNamePopup = () => {
    setShowHouseNamePopup(false);
    setSelectedFloor('');
    resetForm();
  };

  const handleFloorChange = (e) => {
    const selected = floorOptions.find(
      (option) => option.value === Number(e.target.value)
    );
    setSelectedFloor(selected);
    setShowHouseNamePopup(true);

    // Filter houses for the selected floor
    const registeredHousesInSelectedFloor = houses.filter(
      (house) => house.floor === selected.value
    );

    // If there are no houses in the selected floor, you may want to handle that here
    if (registeredHousesInSelectedFloor.length === 0) {
      toast.info('No houses registered for this floor.');
    }

    // Update registered house names
    setRegisteredHouseNames(registeredHousesInSelectedFloor);
  };

  const handleHouseNameChange = (e) => {
    setHouseName(e.target.value);
  };

  const handleRentPayableChange = (e) => {
    setRentPayable(e.target.value);
  };

  const handleMonthsChange = (e) => {
    const inputMonths = e.target.value;
    setMonths(inputMonths);
    if (rentPayable) {
      setRentDeposit(rentPayable * inputMonths);
    }
  };

  const handleWaterDepositChange = (e) => {
    setWaterDeposit(e.target.value);
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
    setLoading(true);
    try {
      const response = await apiRequest.post(
        `/houses/postHouse/${apartmentId}`,
        {
          houseName,
          floor: selectedFloor.value,
          rentPayable,
          months,
          rentDeposit,
          waterDeposit,
          otherDeposits,
        }
      );
      if (response.status === 200) {
        toast.success('House registered successfully!');
        fetchHouses(); // Refresh house list after registration
        resetForm();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error registering house');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHouseName('');
    setRentPayable('');
    setMonths('');
    setRentDeposit(0);
    setWaterDeposit('');
    setOtherDeposits([{ title: '', amount: '' }]);
  };

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);

  const openEditPopup = (house) => {
    setSelectedHouse(house);
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setSelectedHouse(null);
  };

  const refreshHouses = () => {
    fetchHouses(); // Refresh house list after editing
  };
  const [confirmationHouseDeletePopup, setConfirmationHouseDeletePopup] =
    useState(false);
  const [selectedHouseToDelete, setselectedHouseToDelete] = useState('');

  const handleDelete = (house) => {
    setselectedHouseToDelete(house);
    setConfirmationHouseDeletePopup(true);
  };
  const closeDeleteHousePopup = () => {
    setselectedHouseToDelete('');
    setConfirmationHouseDeletePopup(false);
  };
  const onConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest.delete(
        `/houses/deleteHouse/${selectedHouseToDelete._id}`
      );
      if (response.status) {
        await fetchHouses();
        closeDeleteHousePopup();
        toast.success('Houses Deleted Successfully!');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error Deleting House!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-house-container">
      <div className="register-house">
        <h2>{apartment?.name + `'s`} House Registration</h2>
        <div className="form-group">
          <label htmlFor="floor">Floor</label>
          <select
            id="floor"
            value={selectedFloor ? selectedFloor.value : ''}
            onChange={handleFloorChange}
            required
          >
            <option value="" disabled>
              Select Floor
            </option>
            {floorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddFloorPopup(true)}
            className="add-floor-btn"
          >
            +
          </button>
        </div>
        <MapComponent location={apartment?.location || 'Ruiru Nairobi'} />
      </div>

      <div className="house-list">
        <h2>Registered Houses</h2>
        {currentHouses.map((house) => (
          <div className="house-card" key={house._id}>
            <div className="house-icon">🏠</div>
            <div className="house-details">
              <p>
                <strong>{house.houseName}</strong>
              </p>
              <p>Floor: {house.floor}</p>
              <p>Status: {house.isOccupied ? 'Occupied' : 'Available'}</p>
              <div className="house-action-buttons">
                <button
                  className="house-Edit"
                  disabled={house.isOccupied}
                  onClick={() => openEditPopup(house)}
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  className="house-Delete"
                  disabled={house.isOccupied}
                  onClick={() => handleDelete(house)}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="pagination">
          {Array.from(
            { length: Math.ceil(houses.length / housesPerPage) },
            (_, index) => (
              <button key={index} onClick={() => paginate(index + 1)}>
                {index + 1}
              </button>
            )
          )}
        </div>
      </div>
      {showHouseNamePopup && (
        <div className="house-name-popup">
          <button onClick={closeHouseNamePopup} className="closeHousePopupBtn">
            Close
          </button>
          <div className="popup-content">
            <div className="left-card">
              <h2>Register House for {selectedFloor?.label}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>House/Unit Name</label>
                  <input
                    type="text"
                    value={houseName}
                    onChange={handleHouseNameChange}
                    required
                  />
                </div>

                {houseName && (
                  <>
                    <div className="form-group">
                      <label>{houseName} Rent Payable</label>
                      <input
                        type="number"
                        value={rentPayable}
                        onChange={handleRentPayableChange}
                        required
                      />
                    </div>

                    {rentPayable && (
                      <div className="form-group">
                        <label>Number of Months</label>
                        <input
                          type="number"
                          value={months}
                          onChange={handleMonthsChange}
                          required
                        />
                      </div>
                    )}

                    {months && (
                      <div className="form-group">
                        <label>Rent Deposit</label>
                        <input type="number" value={rentDeposit} readOnly />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Water Deposit</label>
                      <input
                        type="number"
                        value={waterDeposit}
                        onChange={handleWaterDepositChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Other Deposits</label>
                      <button
                        type="button"
                        className="otherDepo"
                        onClick={() => setShowOtherDeposits(!showOtherDeposits)}
                      >
                        {showOtherDeposits
                          ? 'Hide Other Deposits'
                          : 'Show Other Deposits'}
                      </button>
                      {showOtherDeposits &&
                        otherDeposits.map((deposit, index) => (
                          <div key={index} className="other-deposit-form">
                            <input
                              type="text"
                              placeholder="Deposit Title"
                              value={deposit.title}
                              onChange={(e) =>
                                handleOtherDepositChange(
                                  index,
                                  'title',
                                  e.target.value
                                )
                              }
                            />
                            <input
                              type="number"
                              placeholder="Deposit Amount"
                              value={deposit.amount}
                              onChange={(e) =>
                                handleOtherDepositChange(
                                  index,
                                  'amount',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                      <button
                        type="button"
                        className="otherDepo"
                        onClick={addOtherDepositField}
                      >
                        Add Another Deposit
                      </button>
                    </div>

                    <button type="submit" className="proceed-btn">
                      Proceed
                    </button>
                  </>
                )}
              </form>
            </div>
            <div className="right-card">
              <h2>Registered Houses</h2>
              {registeredHouseNames?.map((house) => (
                <div key={house._id} className="house-card">
                  <div className="house-icon">🏠</div>
                  <div className="house-details">
                    <p>
                      <strong>{house.houseName}</strong>
                    </p>
                    <p>Floor: {house?.floor}</p>
                    <p>Status: {house.isOccupied ? 'Occupied' : 'Available'}</p>
                    <div className="house-action-buttons">
                      <button
                        className="house-Edit"
                        disabled={house.isOccupied}
                        onClick={() => openEditPopup(house)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="house-Delete"
                        disabled={house.isOccupied}
                        onClick={() => handleDelete(house)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pagination">
                {Array.from({
                  length: Math.ceil(houses.length / housesPerPage),
                }).map((_, index) => (
                  <button key={index} onClick={() => paginate(index + 1)}>
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <EditHousePopup
          house={selectedHouse}
          onClose={closeEditPopup}
          onUpdate={refreshHouses}
        />
      )}

      {showAddFloorPopup && (
        <div className="add-floor-popup">
          <h3>Add New Floor</h3>
          <input
            type="number"
            placeholder="Enter floor number"
            value={newFloorNumber}
            onChange={(e) => setNewFloorNumber(e.target.value)}
          />
          <button type="button" onClick={handleAddFloor}>
            Add Floor
          </button>
          <button type="button" onClick={() => setShowAddFloorPopup(false)}>
            Close
          </button>
        </div>
      )}

      {confirmationHouseDeletePopup && (
        <div className="confirmation-popup-overlay">
          <div className="confirmation-popup">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete this house? This action cannot be
              undone.
            </p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={onConfirm}>
                Yes, Delete
              </button>
              <button className="cancel-button" onClick={closeDeleteHousePopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      {loading && (
        <div className="loader">
          <ThreeDots
            className="threeDots"
            height="100"
            width="100"
            radius="9"
            color="#4fa94d"
            ariaLabel="three-dots-loading"
            visible={true}
          />
        </div>
      )}
    </div>
  );
};

export default RegisterHouse;
