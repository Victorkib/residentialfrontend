import { useState, useEffect } from 'react';
import './TaxPayment.scss';
import apiRequest from '../../lib/apiRequest';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { TailSpin } from 'react-loader-spinner';

const TaxPayment = () => {
  const [yearsData, setYearsData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [totalYearRent, setTotalYearRent] = useState(0);
  const [date, setDate] = useState('');
  const [monthRent, setMonthRent] = useState(0);
  const [tax, setTax] = useState('0.00');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [formData, setFormData] = useState({
    referenceNo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [monthsPerPage] = useState(4); // Number of months per page
  const [currentMonths, setCurrentMonths] = useState([]);
  const [filedKraMonths, setFiledKraMonths] = useState([]); // For KRA filed data

  const navigate = useNavigate();

  // Fetch the years data on component mount
  useEffect(() => {
    const fetchYearsData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/v2/payments/allRents');
        if (response.status === 200) {
          setYearsData(response.data.groupedByYear || []);
        } else {
          console.error('Failed to fetch years data');
        }
      } catch (error) {
        console.error('Error fetching years data:', error);
        toast.error(
          error?.response?.data?.message || 'Error fetching Years Data!'
        );
      } finally {
        setLoading(false);
      }
    };

    // Fetch KRA filed data
    const fetchAllKra = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/kra/allKra');
        if (response.status === 200) {
          setFiledKraMonths(response.data || []);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || 'Failed to fetch KRA data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllKra();
    fetchYearsData();
  }, []);

  useEffect(() => {
    // Update current months based on pagination
    if (selectedYear) {
      const yearData = yearsData.find((data) => data.year === selectedYear);
      if (yearData) {
        const indexOfLastMonth = currentPage * monthsPerPage;
        const indexOfFirstMonth = indexOfLastMonth - monthsPerPage;
        setCurrentMonths(
          yearData.months
            .slice(indexOfFirstMonth, indexOfLastMonth)
            .sort(
              (a, b) =>
                monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
            )
        );

        setTotalYearRent(yearData.totalRent);
      }
    }
  }, [selectedYear, currentPage, monthsPerPage, yearsData]);

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    setCurrentPage(1); // Reset pagination to first page
    setDate('');
    setMonthRent(0);
    setTax('0.00');
    setSelectedMonth('');
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);

    // Parse the selected date using JavaScript's Date object
    const dateObj = new Date(selectedDate);
    const monthIndex = dateObj.getMonth(); // Get current month index
    const year = dateObj.getFullYear();

    // Determine the previous month and possibly the previous year
    let previousMonthIndex;
    let previousYear = year;

    if (monthIndex == 0) {
      // If January
      previousMonthIndex = 11; // December
      previousYear = year - 1; // Move to previous year
    } else {
      previousMonthIndex = monthIndex - 1; // Normal case
    }

    // Create a date object for the previous month
    const previousMonthDate = new Date(previousYear, previousMonthIndex);
    const previousMonthName = previousMonthDate.toLocaleString('default', {
      month: 'long',
    });

    setSelectedMonth(previousMonthName);

    // Fetch the rent data for the previous month
    const yearData = yearsData.find((data) => data.year == previousYear);

    if (yearData) {
      const monthData = yearData.months.find(
        (m) => m.month == previousMonthName
      );

      if (monthData) {
        setMonthRent(monthData.totalRent);
        setTax((monthData.totalRent * 0.075).toFixed(2));
      } else {
        setMonthRent(0);
        setTax('0.00');
      }
    } else {
      // If yearData is not found, set rent and tax to 0
      setMonthRent(0);
      setTax('0.00');
    }
  };

  const handleReferenceNoChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      referenceNo: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest.post('/kra/', {
        date,
        month: selectedMonth,
        selectedYear,
        rent: monthRent,
        tax,
        referenceNo: formData.referenceNo,
      });

      if (response.status === 201) {
        navigate('/taxPaymentHistory');
      } else {
        console.error('Failed to submit data');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error(error?.response?.data?.message || 'Error Adding kra!');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if KRA is filed for a specific month
  const isKraFiled = (year, month) => {
    return filedKraMonths?.some(
      (filedMonth) => filedMonth?.year === year && filedMonth?.month === month
    );
  };

  // Pagination handlers
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(
    (yearsData.find((data) => data.year === selectedYear)?.months.length || 0) /
      monthsPerPage
  );

  const monthOrder = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="taxPaying">
      <div className="tax-payment-container">
        <div className="left-card">
          <h2>Select Year</h2>
          <select value={selectedYear || ''} onChange={handleYearChange}>
            <option value="" disabled>
              Select Year
            </option>
            {yearsData.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
          {selectedYear && (
            <>
              <div className="month-cards">
                {currentMonths.map((month) => (
                  <div
                    key={month.month}
                    className={`month-card ${
                      isKraFiled(selectedYear, month.month) ? 'kra-filed' : ''
                    }`}
                  >
                    <h3>{month.month}</h3>
                    <p>Total Rent: {month.totalRent.toFixed(2)}</p>
                    {isKraFiled(selectedYear, month.month) && (
                      <div className="kra-overlay">KRA Filed</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    className={index + 1 === currentPage ? 'active' : ''}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p className="year-total">
                Total Rent for {selectedYear}: {totalYearRent.toFixed(2)}
              </p>
            </>
          )}
        </div>

        <div className={`right-card ${!selectedYear ? 'disabled' : ''}`}>
          <h2 className="month-heading">
            KRA Payment Details for {selectedYear || '...'}
          </h2>
          <form onSubmit={handleSubmit}>
            {selectedYear && (
              <div className="input-group">
                <label>Select Date:</label>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  min={`${selectedYear}-01-01`}
                  max={`${selectedYear}-12-31`}
                  required
                />
              </div>
            )}
            {selectedMonth && (
              <div className="input-group">
                <label>
                  Previous Month:{' '}
                  <span className="selected-month">{selectedMonth}</span>
                </label>
              </div>
            )}
            {selectedYear && (
              <div className="input-group">
                <label>
                  Selected Year:{' '}
                  <span className="selected-month">{selectedYear}</span>
                </label>
              </div>
            )}
            <div className="input-group">
              <label>
                Total Rent for the Previous Month:{' '}
                <span className="rental-value">
                  {monthRent.toFixed(2) || '0.00'}
                </span>
              </label>
            </div>
            <div className="input-group">
              <label>Tax Paid (7.5%):</label>
              <input
                type="text"
                value={tax}
                readOnly
                placeholder="Tax will be calculated automatically"
              />
            </div>
            <div className="input-group">
              <label>Ref NO Used:</label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={handleReferenceNoChange}
                placeholder="Enter Reference Number"
                required
                disabled={!selectedYear || !date}
              />
            </div>
            <button
              type="submit"
              className="btn"
              disabled={!selectedYear || !date}
            >
              Add KRA Record
            </button>
          </form>
        </div>
      </div>
      <ToastContainer />
      {loading && (
        <div className="loader-overlay">
          <TailSpin
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

export default TaxPayment;
