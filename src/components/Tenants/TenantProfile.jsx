import { MdDelete } from 'react-icons/md';
import { FaEdit } from 'react-icons/fa';
import { CgPlayListRemove } from 'react-icons/cg';
import { MdOutlineNotListedLocation } from 'react-icons/md';
import { GiHazardSign } from 'react-icons/gi';
import { MdAutorenew } from 'react-icons/md';
import './TenantProfile.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiRequest from '../../lib/apiRequest';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TailSpin } from 'react-loader-spinner';
import DepoReceipt from '../Rent Payment/Payment/Receipt/DepoReceipt';
import DepositHistoryPopup from './v2/DepositHistoryPopup';

function TenantProfile() {
  const { _id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  console.log(tenant);

  const [showPopup, setShowPopup] = useState(false);
  const [depositDateHistory, setDepositDateHistory] = useState([]);

  useEffect(() => {
    fetchTenant();
  }, [_id]);
  const fetchTenant = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/v2/tenants/getSingleTenant/${_id}`);
      if (res.status) {
        console.log(res.data);
        setTenant(res.data);
        setDepositDateHistory(res.data.deposits.depositDateHistory);
        // toast.success('Tenant data fetched successfully');
      }
    } catch (error) {
      setError(error.response.data.message || 'Error getting Tenant');
      toast.error(error.response.data.message || 'Error getting Tenant');
    } finally {
      setLoading(false);
    }
  };
  const [deleteConfirmationPopup, setDeleteConfirmationPopup] = useState(false);
  const handleDeleteBtnClick = () => {
    setDeleteConfirmationPopup(true);
  };
  const handleCloseDeletePopup = () => {
    setConfirmInput('');
    setDeleteConfirmationPopup(false);
  };

  const handleDeleteTenant = async () => {
    setLoading(true);
    try {
      const res = await apiRequest.delete(`/v2/tenants/deleteTenant/${_id}`);
      if (res.status) {
        setConfirmInput('');
        handleCloseDeletePopup();
        toast.success('Tenant deleted successfully');
        setTimeout(() => {
          navigate(`/listAllTenants`);
        }, 1000);
      }
    } catch (error) {
      setError(error.response.data.message || 'Error deleting Tenant');
      toast.error(error.response.data.message || 'Error deleting Tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = async () => {
    // console.log(_id);
    navigate(`/tenant/edit/${_id}`);
  };

  const handleBlackListTenant = async () => {
    setLoading(true);
    try {
      const res = await apiRequest.patch(`/v2/tenants/blackListTenant/${_id}`);
      if (res.status) {
        toast.success('Tenant blacklisted successfully');
        await fetchTenant();
        // setTimeout(() => {
        //   navigate(`/tenantProfile/${_id}`);
        // }, 1000);
      }
    } catch (error) {
      setError(error.response.data.message || 'Error blacklisting Tenant');
      toast.error(error.response.data.message || 'Error blacklisting Tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleWhiteListTenant = async () => {
    setLoading(true);
    try {
      const res = await apiRequest.patch(`/v2/tenants/whiteListTenant/${_id}`);
      if (res.status) {
        // console.log('tenant whitelisted!');
        toast.success('Tenant whitelisted successfully');
        await fetchTenant();
        // setTimeout(() => {
        //   navigate(`/tenantProfile/${_id}`);
        // }, 1000);
      }
    } catch (error) {
      setError(error.response.data.message || 'Error whitelisting Tenant');
      toast.error(error.response.data.message || 'Error whitelisting Tenant');
    } finally {
      setLoading(false);
    }
  };

  const [receiptRegenPopup, setReceiptRegenPopup] = useState(false);
  const handleDepoReceiptGeneration = () => {
    setReceiptRegenPopup(true);
  };
  const closePopup = () => {
    setReceiptRegenPopup(false);
  };
  const receiptData = {
    rentDeposit: {
      amount: tenant?.deposits?.rentDeposit,
    },
    waterDeposit: {
      amount: tenant?.deposits?.waterDeposit,
    },
    rent: {
      amount: tenant?.deposits?.initialRentPayment,
    },
    tenant: {
      _id: tenant?._id,
      name: tenant?.name,
      email: tenant?.email,
      phoneNo: tenant?.phoneNo,
      depositDate: tenant?.deposits?.depositDate,
    },
    totalAmountPaid:
      tenant?.deposits?.rentDeposit +
      tenant?.deposits?.waterDeposit +
      tenant?.deposits?.initialRentPayment,
    referenceNumber: tenant?.referenceNo,
  };

  // Function to handle opening the popup
  const openPopup = () => {
    setShowPopup(true);
  };

  // Function to handle closing the popup
  const closePopupDepoHistory = () => {
    setShowPopup(false);
  };

  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirmChange = (e) => {
    setConfirmInput(e.target.value);
  };
  return (
    <div className="TenantProfile">
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
      {error && <span>{error}</span>}
      <div className="summary2">
        <div className="profile">
          <div className="personal-details">
            <div className="user">
              <div className="profile-image">
                {tenant?.blackListTenant == true ? (
                  <img
                    src={
                      tenant?.blackListTenant
                        ? '/blacklisted.png'
                        : '/profile1.jfif'
                    }
                    alt="profile"
                  />
                ) : (
                  <img
                    src={
                      tenant?.profile ? tenant.profile : '/tenantprofile.png'
                    }
                    alt="profile"
                  />
                )}
              </div>

              <div className="userinfo">
                <h3>{tenant ? tenant.name : 'Linda Kamau'}</h3>

                <p>Tenant Id:{tenant ? tenant.nationalId : '1'}</p>
                <p>
                  Joining Date:{' '}
                  {tenant
                    ? new Date(tenant.placementDate).toLocaleDateString()
                    : '24-06-2024'}
                </p>
              </div>
            </div>
            <div className="user-details">
              <p>
                Phone {`(+254)`}:{tenant ? tenant.phoneNo : ' 078129324'}
              </p>
              <p>Email : {tenant ? tenant.email : 'linda@gmail.com'}</p>
              <p>
                HouseNo:{' '}
                {tenant ? (
                  <>
                    Floor{tenant.houseDetails.floorNo},
                    {tenant.houseDetails.houseNo}
                  </>
                ) : (
                  'Not Asssigned'
                )}
              </p>
              <p>
                Apartment:{' '}
                {tenant ? <>{tenant.apartmentId.name}</> : 'Not Asssigned'}
              </p>
              {tenant?.blackListTenant == true ? (
                <span>Blacklisted Status:True</span>
              ) : (
                ''
              )}
              {tenant?.whiteListTenant == true ? (
                <span>whiteListed Status:True</span>
              ) : (
                ''
              )}
            </div>
          </div>

          <div className="payment">
            <div className="payment-details">
              <h3>
                Total Deposit:{' '}
                {tenant && tenant.deposits && tenant.deposits.depositDateHistory
                  ? tenant.deposits.depositDateHistory.reduce(
                      (total, deposit) => {
                        return total + deposit.amount; // Assuming 'amount' is the key in each deposit object
                      },
                      0
                    )
                  : '0.00'}
              </h3>
              <div className="dets">
                <div className="innerDets">
                  {/* Button to open the popup */}
                  <button className="edit-icon-ttDepo" onClick={openPopup}>
                    View Deposit History
                  </button>

                  {/* Conditionally render the popup */}
                  {showPopup && (
                    <DepositHistoryPopup
                      tenant={tenant}
                      depositDateHistory={depositDateHistory}
                      onClose={closePopupDepoHistory}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="payment-details">
              <h3>Emergency Contact</h3>
              <div className="dets">
                <p>Name: {tenant ? tenant.emergencyContactName : 'Jane'}</p>
                <p>
                  Contact: {tenant ? tenant.emergencyContactNumber : '1234'}
                </p>
              </div>
            </div>
          </div>

          <div className="deposits">
            <div className=" pd">
              <h3>Primary Deposits</h3>
              <table className="tenant-table">
                <thead>
                  <tr>
                    <th>Deposits</th>
                    <th>
                      {tenant
                        ? tenant.deposits.rentDeposit +
                          tenant.deposits.waterDeposit +
                          tenant.deposits.initialRentPayment
                        : 'amount'}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>Rent Deposit</td>
                    <td>{tenant ? tenant.deposits.rentDeposit : '12000'}</td>
                  </tr>
                  <tr>
                    <td>Water Deposit</td>
                    <td>{tenant ? tenant.deposits.waterDeposit : '2500'}</td>
                  </tr>
                  <tr>
                    <td>initial Rent</td>
                    <td>
                      {tenant ? tenant.deposits.initialRentPayment : '1700'}
                    </td>
                  </tr>
                  <button
                    onClick={handleDepoReceiptGeneration}
                    className="edit-icon"
                  >
                    <MdAutorenew onClick={handleDepoReceiptGeneration} />
                    Receipt
                  </button>
                </tbody>
              </table>
            </div>
            <div className=" pd">
              <span className="GiHazardSign">
                <GiHazardSign size={50} color="red" />
              </span>

              <div className="details-container">
                <p>Delete Tenant</p>{' '}
                <button onClick={handleDeleteBtnClick}>
                  <MdDelete size={20} color="red" />
                </button>
              </div>
              <div className="details-container">
                <p>Edit Tenant</p>{' '}
                <button onClick={handleEditTenant}>
                  <FaEdit size={20} color="var(--primary-color)" />
                </button>
              </div>
              <div className="details-container">
                <p>Blacklist Tenant</p>{' '}
                <button onClick={handleBlackListTenant}>
                  <CgPlayListRemove size={20} color="black" />
                </button>
              </div>
              <div className="details-container">
                <p>Whitelist Tenant</p>{' '}
                <button onClick={handleWhiteListTenant}>
                  <MdOutlineNotListedLocation size={20} color="var(--yellow)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmationPopup && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2>Confirm Tenant Deletion</h2>
            <p className="warning">
              <strong>Warning:</strong> This action is{' '}
              <strong>irreversible</strong> . By proceeding, you will
              permanently delete all data associated with{' '}
              <strong>{tenant.name}</strong>, including:
            </p>
            <ul className="delete-consequences">
              <li>All payments made by this tenant.</li>
              <li>All notes recorded for this tenant.</li>
              <li>All invoices issued to this tenant.</li>
              <li>
                The house currently occupied by this tenant will be marked as
                vacant.
              </li>
            </ul>
            <p>
              To confirm, please type: <strong>delete {tenant.name}</strong>
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={handleConfirmChange}
              placeholder={`Type "delete ${tenant.name}" to confirm`}
              className="confirm-input"
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseDeletePopup}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => handleDeleteTenant()}
                disabled={confirmInput !== `delete ${tenant.name}`}
              >
                Yes, Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
      {receiptRegenPopup && (
        <div className="receiptRegenPopup">
          <div className="receiptRegenPopup-popup">
            <DepoReceipt receiptData={receiptData} onClose={closePopup} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantProfile;
