import { useState, useEffect } from "react";
import Pagination from "react-js-pagination";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import "./TenantCardsPage.scss";
import apiRequest from "../../../lib/apiRequest";
import { setTenants } from "../../../features/Tenants/TenantsSlice";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const TenantCardsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [showWaterBillPopup, setShowWaterBillPopup] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [paymentMonths, setPaymentMonths] = useState([]); // Store full payment data
  const [selectedMonth, setSelectedMonth] = useState(""); // To track the selected month

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tenants = useSelector((store) => store.tenantsData.tenants);

  const fallbackTenants = [
    // ... tenant data ...
  ];

  useEffect(() => {
    fetchAllTenants();
    if (selectedTenant) fetchPayments();
  }, [dispatch, selectedTenant]);

  const fetchAllTenants = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest.get("/v2/tenants/getToBeClearedFalse");
      dispatch(setTenants(res?.data?.length ? res.data : fallbackTenants));
    } catch {
      setError("Error fetching tenants. Using fallback data.");
      toast.error(
        error?.response?.data?.message ||
          "Error fetching tenants. Using fallback data"
      );
      dispatch(setTenants(fallbackTenants));
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (tenant) => {
    try {
      const response = await apiRequest.get(
        `/v2/payments/unpaidPayments/${
          selectedTenant ? selectedTenant._id : tenant._id
        }`
      );
      // Store full payment data (including month and year)
      const payments = response.data.map((payment) => ({
        month: payment.month,
        year: payment.year, // Store year as well
      }));
      setPaymentMonths(payments);
    } catch (error) {
      console.error("Error fetching unpaid payments:", error);
      toast.info(
        error?.response?.data?.message || "Error fetching unpaid payments"
      );
    }
  };

  // Filter the selected payment and get the year based on selected month
  const getYearForSelectedMonth = () => {
    const selectedPayment = paymentMonths.find(
      (payment) => payment.month === selectedMonth
    );
    return selectedPayment ? selectedPayment.year : null; // Return year or null
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handlePageChange = (pageNumber) => {
    setActivePage(pageNumber); // This should trigger a re-render
  };

  const openWaterBillPopup = async (tenant) => {
    setSelectedTenant(tenant);
    if (tenant) {
      await fetchPayments(tenant);
      setShowWaterBillPopup(true);
    }
  };

  const closeWaterBillPopup = () => {
    setShowWaterBillPopup(false);
    setSelectedTenant(null);
    setPaymentMonths([]);
    setShowConfirmationPopup(false);
  };

  const handleAddWaterBill = () => {
    setShowConfirmationPopup(true);
  };

  const confirmAddWaterBill = async (amount, month) => {
    setLoading(true);
    const year = getYearForSelectedMonth(); // Get the year for the selected month
    try {
      const response = await apiRequest.put(
        `/v2/payments/addHouseWaterBill/${selectedTenant._id}`,
        { amount, month, year } // Send both month and year
      );
      if (response.status == 200) {
        toast.success("Success!");
        await fetchPayments();
        closeWaterBillPopup();
      }
    } catch (error) {
      console.error("error: ", error);
      toast.error(error?.response?.data?.message || "Failed to add water bill");
    } finally {
      setLoading(false);
    }
  };

  // Ensure this is already defined
  const tenantsPerPage = 3; // Number of tenants per page

  // Calculate the current tenants based on active page
  const currentTenants = tenants.slice(
    (activePage - 1) * tenantsPerPage,
    activePage * tenantsPerPage
  );

  return (
    <div className="tenant-cards-page-addWater">
      <h2>Water Bills Management</h2>
      <div className="tenant-cards-container">
        {currentTenants.map((tenant) => (
          <div key={tenant._id} className="tenant-card">
            <h3>{tenant.name}</h3>
            <p>
              House:{" "}
              {`Floor:${tenant.houseDetails.floorNo}, ${tenant.houseDetails.houseNo}`}
            </p>
            <div className="addWaterBtns">
              <button
                onClick={() => openWaterBillPopup(tenant)}
                className="action-btn water-bill-btn"
              >
                Add Water Bill
              </button>
              <button
                className="action-btn rent-btn"
                onClick={() => navigate(`/v2/tenantPaymentsV2/${tenant?._id}`)}
              >
                Rent Payment
              </button>
              <button
                className="action-btn payment-btn"
                onClick={() => navigate(`/tenantPaymentList/${tenant?._id}`)}
              >
                Payment History
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading && (
        <div className="loader-overlay-addWater">
          <Oval
            height="100"
            width="100"
            color="#4fa94d"
            ariaLabel="loading"
            visible={true}
          />
        </div>
      )}
      <ToastContainer />

      <Pagination
        activePage={activePage}
        itemsCountPerPage={tenantsPerPage}
        totalItemsCount={tenants.length}
        pageRangeDisplayed={5}
        onChange={handlePageChange}
        itemClass="page-item"
        linkClass="page-link"
        activeClass="active"
        innerClass="pagination"
        disabledClass="disabled"
        prevPageText="Prev"
        nextPageText="Next"
      />

      {showWaterBillPopup && selectedTenant && paymentMonths.length > 0 && (
        <div
          className="tenant-cards-popup-overlay"
          onClick={closeWaterBillPopup}
        >
          <div
            className="tenant-cards-popup-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`tenant-cards-popup-left ${
                showConfirmationPopup ? "blurred not-allowed" : ""
              }`}
              disabled={showConfirmationPopup}
            >
              <h3>Add Water Bill for {selectedTenant.name}</h3>{" "}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const amount = e.target.amount.value;
                  const month = e.target.month.value;
                  handleAddWaterBill(amount, month);
                }}
              >
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  required
                  disabled={showConfirmationPopup}
                />
                <select
                  name="month"
                  required
                  disabled={showConfirmationPopup}
                  onChange={handleMonthChange}
                >
                  <option value="" disabled selected>
                    Select Month
                  </option>
                  {paymentMonths.map((payment, index) => (
                    <option key={index} value={payment.month}>
                      {payment.month}
                    </option>
                  ))}
                </select>{" "}
                <div className="addWaterTitle">
                  {" "}
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={showConfirmationPopup}
                  >
                    Submit
                  </button>
                  <button
                    onClick={closeWaterBillPopup}
                    className="close-btn-addWater"
                    disabled={showConfirmationPopup}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>

            {showConfirmationPopup && (
              <div className="tenant-cards-popup-right">
                <h3>Are you sure?</h3>
                <p>Confirm adding the water bill for {selectedTenant.name}.</p>
                <button
                  onClick={() =>
                    confirmAddWaterBill(
                      document.querySelector('input[name="amount"]').value,
                      document.querySelector('select[name="month"]').value
                    )
                  }
                  className="action-btn confirm-btn"
                >
                  Confirm
                </button>
                <button
                  onClick={closeWaterBillPopup}
                  className="action-btn cancel-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantCardsPage;
