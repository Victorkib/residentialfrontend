import { useEffect, useState } from 'react';
import Pagination from 'react-js-pagination';
import './UnpaidTenantsList.scss';
import apiRequest from '../../../../lib/apiRequest';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Rings } from 'react-loader-spinner';

const UnpaidTenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnpaidTenants = async () => {
      setLoading(true);
      try {
        const { data } = await apiRequest.get('/v2/payments/unpaid');
        if (Array.isArray(data)) {
          setTenants(data);
        } else {
          setTenants([]);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || 'Error fetching unpaid tenants!'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUnpaidTenants();
  }, []);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleCardClick = (tenant) => setSelectedTenant(tenant);

  const closeModal = () => setSelectedTenant(null);

  const navigateToTenantDetails = (tenantId) => {
    closeModal();
    navigate(`/tenantProfile/${tenantId}`);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTenants = tenants.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="unpaid-tenants-list">
      <h2 className="unpaid-tenants-title">
        Unpaid Tenants for the Current Month
      </h2>
      {currentTenants.length > 0 ? (
        <div className="tenants-cards">
          {currentTenants.map((tenant) => (
            <div
              key={tenant.tenantId}
              className="tenant-card"
              onClick={() => handleCardClick(tenant)}
            >
              <h3>{tenant.tenantName}</h3>
              <p>House: {tenant.houseName}</p>
              <p>Floor: {tenant.floor}</p>
              <p>Apartment: {tenant.apartment || 'N/A'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No unpaid tenants for this month.</p>
      )}

      {loading && (
        <div className="loader-overlay">
          <Rings
            height="100" // Set desired height
            width="100" // Set desired width
            color="#4fa94d"
            ariaLabel="rings-loading"
            visible={true}
          />
        </div>
      )}
      {/* Pagination */}
      <Pagination
        activePage={currentPage}
        itemsCountPerPage={itemsPerPage}
        totalItemsCount={tenants?.length}
        pageRangeDisplayed={5}
        onChange={handlePageChange}
        innerClass="pagination"
        itemClass="page-item"
        linkClass="page-link"
      />

      {/* Custom Modal for tenant details */}
      {selectedTenant && (
        <div className="custom-modal">
          <div className="modal-content">
            <h3>{selectedTenant.tenantName}</h3>

            <div className="tenant-details">
              <p>
                <strong>House:</strong> {selectedTenant.houseName}
              </p>
              <p>
                <strong>Floor:</strong> {selectedTenant.floor}
              </p>
              <p>
                <strong>Apartment:</strong> {selectedTenant.apartment || 'N/A'}
              </p>
            </div>

            <div className="modal-buttons">
              <button
                onClick={() => navigateToTenantDetails(selectedTenant.tenantId)}
                className="confirm-button"
              >
                View Full Details
              </button>
              <button
                onClick={() =>
                  navigate(`/v2/tenantPaymentsV2/${selectedTenant?.tenantId}`)
                }
              >
                Rent Payment
              </button>
              <button
                onClick={() =>
                  navigate(`/tenantPaymentList/${selectedTenant?.tenantId}`)
                }
              >
                Payments
              </button>
              <button onClick={closeModal} className="cancel-button">
                Close
              </button>
            </div>
          </div>
          <div className="modal-overlay" onClick={closeModal}></div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default UnpaidTenantsList;
