import { useState, useEffect } from 'react';
import './Payments.scss';
import { FaChevronDown } from 'react-icons/fa';
import Pagination from 'react-js-pagination';
import Popup from './Popup.jsx';
import apiRequest from '../../../lib/apiRequest.js';
import { InfinitySpin } from 'react-loader-spinner';

const Payments = () => {
  const [groupedPayments, setGroupedPayments] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [activeTenant, setActiveTenant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const itemsPerPage = 5;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroupedPayments = async () => {
      setLoading(true);
      try {
        const res = await apiRequest.get(
          '/v2/payments/getGroupedPaymentsByTenant'
        );
        if (Array?.isArray(res.data)) {
          console.log('GroupedPayments: ', res.data);
          setGroupedPayments(res.data);
        } else {
          console.error('Expected an array but got', res.data);
        }
      } catch (err) {
        console.error('Failed to fetch grouped payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupedPayments();
  }, []);

  const handlePageChange = (pageNumber) => {
    setActivePage(pageNumber);
  };

  const handleViewPayments = async (tenantId) => {
    setLoading(true);
    try {
      const res = await apiRequest.get(
        `/v2/payments/getPaymentsByTenantId/${tenantId}`
      );
      setActiveTenant({
        ...groupedPayments?.find((gp) => gp?._id === tenantId),
        payments: res.data,
      });
      setShowPopup(true);
    } catch (err) {
      console.error('Failed to fetch tenant payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const displayedGroups = Array.isArray(groupedPayments)
    ? groupedPayments?.slice(
        (activePage - 1) * itemsPerPage,
        activePage * itemsPerPage
      )
    : [];

  return (
    <div className="allpaymentspage">
      <div className="payments-container">
        <h2>Payments Made</h2>
        <div className="payments-list">
          {displayedGroups.map((group) => (
            <div className="payment-card" key={group._id}>
              <div className="card-header">
                <h3>{group?.tenant?.name}</h3>
                <p>{group?.tenant?.email}</p>
                <p>House No: {group?.tenant?.houseDetails?.houseNo}</p>
                <p>Total Amount: {group?.totalPayments?.toLocaleString()}</p>
              </div>
              <div className="card-body">
                <button onClick={() => handleViewPayments(group?.tenant?._id)}>
                  View Payments <FaChevronDown />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination
          activePage={activePage}
          itemsCountPerPage={itemsPerPage}
          totalItemsCount={groupedPayments.length}
          pageRangeDisplayed={5}
          onChange={handlePageChange}
          itemClass="page-item"
          linkClass="page-link"
        />
        {showPopup && (
          <Popup
            payments={activeTenant?.payments || []}
            onClose={handleClosePopup}
          />
        )}
      </div>
      {loading && (
        <div className="loader-overlay">
          <InfinitySpin
            height="100"
            width="100"
            radius="2"
            color="#4fa94d"
            ariaLabel="three-dots-loading"
            visible={true}
          />
        </div>
      )}
    </div>
  );
};

export default Payments;
