import { useEffect, useState } from 'react';
import apiRequest from '../../../../lib/apiRequest';
import Pagination from 'react-js-pagination';
import './UnpaidTenantsView.scss';
import { Rings } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';

function UnpaidTenantsView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [unpaidTenants, setUnpaidTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 4;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const response = await apiRequest.get(
          '/v2/payments/getAllPaymentsForAllTenant'
        );
        setData(response.data);
        setYears(Object.keys(response.data));
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      const months = Object.keys(data[selectedYear] || {});
      setSelectedMonth(months[0] || '');
    }
  }, [selectedYear, data]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      const tenants = data[selectedYear][selectedMonth]?.unpaidTenants || [];
      setUnpaidTenants(tenants);
      setCurrentPage(1); // Reset to first page on data change
    }
  }, [selectedYear, selectedMonth, data]);

  // Calculate pagination indexes
  const indexOfLastTenant = currentPage * tenantsPerPage;
  const indexOfFirstTenant = indexOfLastTenant - tenantsPerPage;
  const currentTenants = unpaidTenants?.slice(
    indexOfFirstTenant,
    indexOfLastTenant
  );

  return (
    <div className="unpaid-tenants-view">
      <h2>Tenants Payment Summary</h2>

      <div className="controls">
        <div className="select-group">
          <label>Select Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            {years?.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {selectedYear && (
          <div className="select-group">
            <label>Select Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              {Object.keys(data[selectedYear] || {}).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="tenant-list">
        {currentTenants && currentTenants?.length > 0 ? (
          <h3>
            Tenants with Unpaid Balances for {selectedMonth} {selectedYear}
          </h3>
        ) : (
          ''
        )}

        {currentTenants && currentTenants?.length > 0 ? (
          <div className="cards-container">
            {currentTenants?.map((tenant) => (
              <div
                key={tenant?.tenantId}
                className="tenant-card"
                onClick={() => setSelectedTenant(tenant)}
              >
                <h4>{tenant?.tenantName}</h4>
                {tenant?.amountDue > 0 ? (
                  <p>Amount Due: Ksh:{tenant?.amountDue}</p>
                ) : (
                  <p>Pending Payment...</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">Choose a period.</p>
        )}
      </div>

      {unpaidTenants?.length > tenantsPerPage && (
        <Pagination
          activePage={currentPage}
          itemsCountPerPage={tenantsPerPage}
          totalItemsCount={unpaidTenants?.length}
          pageRangeDisplayed={5}
          onChange={(pageNumber) => setCurrentPage(pageNumber)}
          innerClass="pagination"
          itemClass="page-item"
          linkClass="page-link"
        />
      )}

      {selectedTenant && (
        <div className="summary-popup">
          <div className="innerSummaryPopup">
            <div className="popup-content-summary">
              <div className="topSummary">
                <button
                  className="close-btn-summary"
                  onClick={() => setSelectedTenant(null)}
                >
                  X
                </button>
                <h3>Tenant Details</h3>
              </div>
              <div className="bodySummary">
                <div className="summaryData">
                  <p>
                    <strong>Name:</strong> {selectedTenant?.tenantName}
                  </p>
                  {selectedTenant?.amountDue > 0 ? (
                    <p>
                      <strong>Amount Due:</strong> Ksh:
                      {selectedTenant?.amountDue}
                    </p>
                  ) : (
                    ''
                  )}

                  <p>
                    <strong>House:</strong>{' '}
                    {selectedTenant?.houseName +
                      ' ' +
                      'Floor, ' +
                      selectedTenant?.floor}
                  </p>
                  <p>
                    <strong>Apartment:</strong>
                    {selectedTenant?.apartment}
                  </p>
                </div>
                <div className="summaryActions">
                  <button
                    onClick={() =>
                      navigate(`/tenantProfile/${selectedTenant?.tenantId}`)
                    }
                  >
                    Tenant Details
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/v2/tenantPaymentsV2/${selectedTenant?.tenantId}`
                      )
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
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}

export default UnpaidTenantsView;
