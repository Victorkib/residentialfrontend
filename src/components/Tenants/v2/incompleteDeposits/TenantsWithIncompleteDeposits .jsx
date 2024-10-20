import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-js-pagination';
import './TenantsWithIncompleteDeposits.scss';
import apiRequest from '../../../../lib/apiRequest';

const TenantsWithIncompleteDeposits = () => {
  const [tenants, setTenants] = useState([]);
  // console.log('tenant: ', tenants);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 6; // Adjust the number of cards per page
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await apiRequest.get(
          '/v2/tenants/tenantWithIncompleteDepo'
        );
        console.log('tenantsWithIncomplete: ', response.data.tenants);
        setTenants(response.data.tenants);
      } catch (error) {
        console.error('Error fetching tenants:', error.message);
      }
    };

    fetchTenants();
  }, []);

  const calculateTotalDeficit = (tenant) => {
    // Start with the known deficits (rent, water, initial rent payment)
    let totalDeficit =
      tenant.deposits.rentDepositDeficit +
      tenant.deposits.waterDepositDeficit +
      tenant.deposits.initialRentPaymentDeficit;

    // Check if tenant.otherDeposits exists and is an array
    if (tenant.otherDeposits && Array.isArray(tenant.otherDeposits)) {
      // Iterate over otherDeposits to sum up any deficits greater than 0
      tenant.otherDeposits.forEach((deposit) => {
        if (deposit.deficit > 0) {
          totalDeficit += deposit.deficit;
        }
      });
    }

    // Return the total deficit
    return totalDeficit;
  };

  const formatLocalDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatNumber = (number) => {
    return number.toLocaleString();
  };

  const handleCardClick = (tenant) => {
    // console.log('tenantToUpdateDepos: ', tenant);
    navigate('/v2/tenantUpdateDeposit', {
      state: { tenant },
    });
  };

  const indexOfLastTenant = currentPage * tenantsPerPage;
  const indexOfFirstTenant = indexOfLastTenant - tenantsPerPage;
  const currentTenants = tenants.slice(indexOfFirstTenant, indexOfLastTenant);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="tenants-page">
      {tenants?.length > 0 ? (
        <>
          <h1>Tenants with Incomplete Deposits</h1>
          <div className="tenants-list">
            {currentTenants.map((tenant) => (
              <div
                key={tenant._id}
                className="tenant-card"
                onClick={() => handleCardClick(tenant)}
              >
                <h2>{tenant.name}</h2>
                <p>
                  <strong>Total Deficit:</strong> KSH{' '}
                  {formatNumber(calculateTotalDeficit(tenant))}
                </p>
                <p>
                  <strong>Last Payment Date:</strong>{' '}
                  {formatLocalDate(tenant.placementDate)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="nothing">
          <h4>No Tenant with Incomplete Deposits</h4>
          <div className="nothingLinks">
            <Link to="/listAllTenants">All Tenants</Link>
            <Link to="/v2/registerTenant">Register Tenant</Link>
          </div>
        </div>
      )}

      <div className="pagination">
        <ReactPaginate
          activePage={currentPage}
          itemsCountPerPage={tenantsPerPage}
          totalItemsCount={tenants.length}
          pageRangeDisplayed={5}
          onChange={handlePageChange}
          itemClass="page-item"
          linkClass="page-link"
        />
      </div>
    </div>
  );
};

export default TenantsWithIncompleteDeposits;
