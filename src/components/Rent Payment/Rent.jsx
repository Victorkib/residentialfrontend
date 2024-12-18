import { Link, useNavigate } from 'react-router-dom';
import { FaTrashAlt } from 'react-icons/fa';
import './Rent.css';
import { useEffect, useState } from 'react';
import apiRequest from '../../lib/apiRequest';
import { useDispatch, useSelector } from 'react-redux';
import { setTenants } from '../../features/Tenants/TenantsSlice';
import { TailSpin } from 'react-loader-spinner';
import Pagination from 'react-js-pagination';

const Rent = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const itemsPerPage = 5; // Items per page for pagination
  const dispatch = useDispatch();
  const tenants = useSelector((store) => store.tenantsData.tenants);

  const fallbackTenants = [
    {
      _id: 1,
      name: 'John Doe',
      totalAmount: '20000',
      houseNo: 'A6',
      balance: '-100',
      status: 'cleared',
    },
    {
      _id: 2,
      name: 'Jane Smith',
      totalAmount: '25000',
      houseNo: 'B3',
      balance: '500',
      status: 'pending',
    },
    {
      _id: 3,
      name: 'Michael Johnson',
      totalAmount: '15000',
      houseNo: 'C2',
      balance: '300',
      status: 'cleared',
    },
    {
      _id: 4,
      name: 'Emily Davis',
      totalAmount: '18000',
      houseNo: 'D4',
      balance: '-200',
      status: 'pending',
    },
    {
      _id: 5,
      name: 'Chris Brown',
      totalAmount: '22000',
      houseNo: 'A1',
      balance: '0',
      status: 'cleared',
    },
    {
      _id: 6,
      name: 'Olivia Wilson',
      totalAmount: '21000',
      houseNo: 'B5',
      balance: '100',
      status: 'cleared',
    },
    {
      _id: 7,
      name: 'Daniel Martinez',
      totalAmount: '17000',
      houseNo: 'C7',
      balance: '-50',
      status: 'pending',
    },
    {
      _id: 8,
      name: 'Sophia Garcia',
      totalAmount: '19000',
      houseNo: 'D9',
      balance: '200',
      status: 'cleared',
    },
  ];

  useEffect(() => {
    const fetchAllTenants = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await apiRequest.get('/v2/tenants/getTenantsForColors');
        if (res.status) {
          if (res?.data?.length === 0) {
            dispatch(setTenants(fallbackTenants));
          } else {
            dispatch(setTenants(res.data));
          }
        } else {
          setError('Failed to fetch tenants. Using fallback data.');
          dispatch(setTenants(fallbackTenants));
        }
      } catch (error) {
        setError('Error fetching tenants. Using fallback data.');
        dispatch(setTenants(fallbackTenants));
      } finally {
        setLoading(false);
      }
    };
    fetchAllTenants();
  }, [dispatch]);

  const handleDelete = async (_id) => {
    setLoading(true);
    try {
      const res = await apiRequest.delete(`/v2/tenants/deleteTenant/${_id}`);
      if (res.status === 200) {
        dispatch(setTenants(tenants.filter((tenant) => tenant._id !== _id)));
        setConfirmInput('');
        setShowModal(false);
      } else {
        console.error('Failed to delete tenant');
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tenant) => {
    setTenantToDelete(tenant);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setConfirmInput('');
    setTenantToDelete('');
  };

  const handleSingleTenantClick = (tenant) => {
    navigate(`/v2/tenantPaymentsV2/${tenant._id}`, {
      state: { tenantDetails: tenant },
    });
  };

  // Pagination: Calculate current tenants based on currentPage
  const indexOfLastTenant = currentPage * itemsPerPage;
  const indexOfFirstTenant = indexOfLastTenant - itemsPerPage;
  const currentTenants = tenants.slice(indexOfFirstTenant, indexOfLastTenant);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const [searchTerm, setSearchTerm] = useState(''); // To store search input
  const [highlightedTenant, setHighlightedTenant] = useState(null); // To store the tenant being highlighted

  // Effect to clear highlight after a few seconds
  useEffect(() => {
    if (highlightedTenant) {
      const timer = setTimeout(() => setHighlightedTenant(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTenant]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === '') return; // Reset search if input is empty

    const tenant = tenants.find((t) => {
      // Create a composite string for the house format
      const houseComposite = `Floor ${t.houseDetails.floorNo} ${t.houseDetails.houseNo}`;

      return (
        t.name.toLowerCase().includes(term.toLowerCase()) ||
        t.phoneNo?.toString().includes(term) ||
        (t.houseDetails.houseName &&
          t.houseDetails.houseName
            .toLowerCase()
            .includes(term.toLowerCase())) ||
        houseComposite.toLowerCase().includes(term.toLowerCase())
      );
    });

    if (tenant) {
      // Find the page the tenant is on
      const tenantIndex = tenants.indexOf(tenant);
      const page = Math.floor(tenantIndex / itemsPerPage) + 1;

      // Set page if tenant is on a different page
      if (currentPage !== page) {
        setCurrentPage(page);
      }

      // Highlight the tenant after pagination change
      setTimeout(() => {
        setHighlightedTenant(tenant._id);
        const element = document.getElementById(`tenant-${tenant._id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirmChange = (e) => {
    setConfirmInput(e.target.value);
  };

  //colors implementation
  const calculateRowStyle = (pendingPayments) => {
    if (!pendingPayments || pendingPayments.length === 0) {
      return { backgroundColor: 'rgb(37, 197, 37)' }; // No pending payments
    }

    // Calculate total global deficit
    const totalDeficit = pendingPayments.reduce(
      (sum, payment) => sum + (payment.globalDeficit || 0),
      0
    );

    if (totalDeficit > 150) {
      return { backgroundColor: '#b30000' }; // Total deficit > 150 (red)
    } else if (totalDeficit >= 0 && totalDeficit <= 150) {
      return { backgroundColor: 'rgb(230, 153, 11)' }; // Total deficit <= 150 and > 0(orange)
    }

    return { backgroundColor: 'rgb(37, 197, 37)' }; // Fallback(green)
  };

  const sortTenants = (tenants) => {
    return tenants.sort((a, b) => {
      const aHasPending = a.pendingPayments && a.pendingPayments.length > 0;
      const bHasPending = b.pendingPayments && b.pendingPayments.length > 0;

      if (aHasPending && !bHasPending) return -1;
      if (!aHasPending && bHasPending) return 1;

      // Both have pendingPayments or neither has pendingPayments
      const aTotalDeficit = a.pendingPayments
        ? a.pendingPayments.reduce(
            (sum, payment) => sum + (payment.globalDeficit || 0),
            0
          )
        : 0;
      const bTotalDeficit = b.pendingPayments
        ? b.pendingPayments.reduce(
            (sum, payment) => sum + (payment.globalDeficit || 0),
            0
          )
        : 0;

      return bTotalDeficit - aTotalDeficit; // Sort by total deficit descending
    });
  };

  return (
    <div className="summary2">
      <div className="tenantslist">
        <div className="holderTitle">
          <h2 className="title">Tenants List</h2>
          <div className="search-container">
            <button
              className="search-button"
              onClick={() => handleSearch({ target: { value: searchTerm } })}
            >
              Type Name to search➞
            </button>
            <input
              type="text"
              placeholder="Search tenant by name"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {error && <span>{error}</span>}
        <Pagination
          activePage={currentPage}
          itemsCountPerPage={itemsPerPage}
          totalItemsCount={tenants.length}
          pageRangeDisplayed={5}
          onChange={handlePageChange}
          innerClass="paginationRent"
          itemClass="page-item"
          linkClass="page-link"
          activeLinkClass="active"
        />
        <br />
        <div className="table-container">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Tenant{`'`}s Name</th>
                <th>Phone No.</th>
                <th>House No.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="rentListTbody">
              {sortTenants(currentTenants).map((tenant) => (
                <tr
                  key={tenant._id}
                  id={`tenant-${tenant._id}`}
                  style={calculateRowStyle(tenant.pendingPayments)} // Apply computed style
                  className={
                    highlightedTenant === tenant._id ? 'highlight' : ''
                  }
                >
                  <td>{tenant.name}</td>
                  <td>{tenant.phoneNo}</td>
                  <td>
                    {'Floor: ' +
                      tenant.houseDetails.floorNo +
                      ' ' +
                      tenant.houseDetails.houseNo}
                  </td>
                  <td className="actions">
                    <p
                      onClick={() => handleSingleTenantClick(tenant)}
                      className="edit-btn"
                    >
                      Add-Payment
                    </p>
                    <Link
                      to={`/tenantPaymentList/${tenant._id}`}
                      className="edit-btn"
                    >
                      Payments
                    </Link>
                    <button
                      onClick={() => handleOpenModal(tenant)}
                      className="delete-btn"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
      </div>
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
      {showModal && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2>Confirm Tenant Deletion</h2>
            <p className="warning">
              <strong>Warning:</strong> This action is{' '}
              <strong>irreversible</strong> . By proceeding, you will
              permanently delete all data associated with{' '}
              <strong>{tenantToDelete.name}</strong>, including:
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
              To confirm, please type:{' '}
              <strong>delete {tenantToDelete.name}</strong>
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={handleConfirmChange}
              placeholder={`Type "delete ${tenantToDelete.name}" to confirm`}
              className="confirm-input"
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => handleDelete(tenantToDelete._id)}
                disabled={confirmInput !== `delete ${tenantToDelete.name}`}
              >
                Yes, Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
