import { useEffect, useState } from 'react';
import './TenantPaymentsV2.scss';
import apiRequest from '../../../../lib/apiRequest';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { TailSpin } from 'react-loader-spinner';
import { toast, ToastContainer } from 'react-toastify';
import Invoice from '../../../Rent Payment/Payment/Invoice/Invoice';
import moment from 'moment';
import jsPDF from 'jspdf';
import { FaNoteSticky } from 'react-icons/fa6';
import ReactPaginate from 'react-paginate';

const TenantPayments = () => {
  const { tenantId } = useParams();
  const [loading, setLoading] = useState(false);

  // /////////////////////////////Lengalei-start////////////

  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const notesPerPage = 1;

  // Fetch all notes
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get(
        `/v2/notes/getAllNotes/${tenantId}`
      );
      setNotes(response.data);
    } catch (error) {
      // console.error('Error fetching notes:', error);
      toast.error(error?.resonse?.data?.message || 'error fetching notes');
    } finally {
      setLoading(false);
    }
  };

  // Add a new note
  const addNote = async () => {
    setLoading(true);
    try {
      if (!title && !description) {
        throw new Error('All fields must be filled!');
      }
      const response = await apiRequest.post('/v2/notes/postNote', {
        title,
        description,
        tenantId,
      });
      setNotes([...notes, response.data]);
      setTitle('');
      setDescription('');
      await fetchNotes();
      toast.success('Note added successfully');
    } catch (error) {
      toast.error(
        error?.resonse?.data?.message || error.message || 'error fetching notes'
      );
    } finally {
      setLoading(false);
    }
  };

  // Update a note
  const updateNote = async (id) => {
    setLoading(true);
    try {
      const response = await apiRequest.put(`/v2/notes/updateNote/${id}`, {
        title,
        description,
        tenantId,
      });
      setNotes(notes.map((note) => (note._id === id ? response.data : note)));
      setEditingNoteId(null);
      setTitle('');
      setDescription('');
      await fetchNotes();
      toast.success('Note updated successfully');
    } catch (error) {
      toast.error(error?.resonse?.data?.message || 'error fetching notes');
    } finally {
      setLoading(false);
    }
  };

  // Delete a note
  const deleteNote = async (id) => {
    setLoading(true);
    try {
      const response = await apiRequest.delete(`/v2/notes/deleteNote/${id}`);
      if (response.status) {
        setNotes(notes.filter((note) => note._id !== id));
        closeDeleteNotePopup();
        await fetchNotes();
        toast.success('Note deleted successfully');
      }
    } catch (error) {
      toast.error(error?.resonse?.data?.message || 'error fetching notes');
    } finally {
      setLoading(false);
    }
  };
  const [selectedNote, setSelectedNote] = useState('');
  const [deleteNotePopup, setDeleteNotePopup] = useState(false);

  const deleteNoteBtnClick = (note) => {
    setSelectedNote(note);
    setDeleteNotePopup(true);
  };
  const closeDeleteNotePopup = () => {
    setSelectedNote('');
    setDeleteNotePopup(false);
  };

  const handleAddOrUpdate = () => {
    if (editingNoteId) {
      updateNote(editingNoteId);
    } else {
      addNote();
    }
  };

  const openEditPopup = (note) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setDescription(note.description);
    setPopupOpen(true);
  };

  const openAddPopup = () => {
    setEditingNoteId(null);
    setTitle('');
    setDescription('');
    setPopupOpen(true);
  };

  const pageCount = Math.ceil(notes.length / notesPerPage);
  const handlePageClick = (data) => setCurrentPage(data.selected);

  // Slice notes to show only current page items
  const currentNotes = notes.slice(
    currentPage * notesPerPage,
    currentPage * notesPerPage + notesPerPage
  );

  // ///////////////////////Lengalei-end///////////////
  const location = useLocation();
  const tenantDetails = location.state?.tenantDetails;

  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState('complete'); // Toggle between Complete and Outstanding
  const [showPopup, setShowPopup] = useState(false); // Popup for updating default values
  const [showPaymentPopup, setShowPaymentPopup] = useState(false); // Popup for outstanding payments

  const [completePayments, setCompletePayments] = useState([]);
  const [outstandingPayments, setOutstandingPayments] = useState([]);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null); // Selected outstanding payment

  const [selectedYear, setSelectedYear] = useState(''); // Selected year
  const [years, setYears] = useState([]); // Available years
  const [filteredPayments, setFilteredPayments] = useState([]); // Payments filtered by year

  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentyear] = useState('');
  const [nextMonth, setNextMonth] = useState('');

  // New States for Water Bill Dropdown
  const [waterBillDropdownOpen, setWaterBillDropdownOpen] = useState(false); // Toggle dropdown
  const [accumulatedWaterBill, setAccumulatedWaterBill] = useState(''); // Accumulated Water Bill
  const [paidWaterBill, setPaidWaterBill] = useState(''); // Paid Water Bill

  //
  const [extraChargesDropdownOpen, setExtraChargesDropdownOpen] =
    useState(false); // Toggle dropdown
  const [selectedExtraCharge, setSelectedExtraCharge] = useState({
    expectedAmount: '',
    description: '',
  }); // Selected extra charge

  const [
    previousMonthExtraChargesDropdownOpen,
    setPreviousMonthExtraChargesDropdownOpen,
  ] = useState(false);
  const [
    previousMonthSelectedExtraCharge,
    setPreviousMonthSelectedExtraCharge,
  ] = useState({
    expectedAmount: '',
    description: '',
  }); // Selected extra charge

  const [displayRefNoHistory, setDisplayRefNoHistory] = useState(
    Array(filteredPayments.length).fill(false) // Initialize with false for each card
  );

  const handleRefNoHistory = (index) => {
    setDisplayRefNoHistory((prevState) => {
      const newState = [...prevState];
      newState[index] = !newState[index]; // Toggle the specific card's state
      return newState;
    });
  };
  const toggleExtraChargesDropdown = () => {
    setExtraChargesDropdownOpen((prevState) => !prevState);
  };
  const togglePreviousMonthExtraChargesDropdown = () => {
    setPreviousMonthExtraChargesDropdownOpen((prevState) => !prevState);
  };

  const [fetchedTenantDetails, setTenantDetails] = useState('');
  // Separate function to fetch unpaid payments
  const fetchUnpaidPayments = async (tenantId) => {
    setLoading(true);
    try {
      const response = await apiRequest.get(
        `/v2/payments/unpaidPayments/${tenantId}`
      );
      console.log('unfinished: ', response.data);
      setOutstandingPayments(response.data);
      if (response.status == 404) {
        toast.error(response?.data?.message || 'No Outstanding Payments');
      }
    } catch (error) {
      if (error?.response?.data?.unpaidPayments?.length < 0) {
        console.log('no outstanding payments');
        toast.error('No Outstanding Payments');
      }
      // setError(error.response.data.message);
      console.log(error.response);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch fully paid payments
  const months = [
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

  const fetchFullyPaidPayments = async (tenantId) => {
    setLoading(true);
    // console.log(tenantId);
    try {
      const response = await apiRequest.get(
        `/v2/payments/fullyPaidPayments/${tenantId}`
      );
      // console.log(response.data);
      setCompletePayments(response.data);
      setError('');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Error fetching fully paid payments'
      );
      toast.info(
        error.response?.data?.message || 'Error fetching fully paid payments'
      );
      throw new Error(
        error.response?.data?.message || 'Error fetching fully paid payments'
      );
    } finally {
      setLoading(false);
    }
  };

  const [previousMonth, setPreviousMonth] = useState('');
  const [previousYear, setPreviousYear] = useState('');
  const [mostRecentPayment, setMostRecentPayments] = useState({});
  console.log('mostRecentPayment: ', mostRecentPayment);
  const getMostRecentPaymentByTenantId = async (tenantId) => {
    try {
      const response = await apiRequest.get(
        `/v2/tenants/getMostRecentPaymentByTenantId/${tenantId}`
      );
      if (response.status) {
        setPreviousMonth(response.data.mostRecentPayment[0].month);
        // console.log(response.data);
        setPreviousYear(response.data.mostRecentPayment[0].year);
        setMostRecentPayments(response.data.mostRecentPayment[0]);
        // Example structure of returned data
        const paymentsData = response.data.mostRecentPayment; // Assume this is an array with 'year' and 'month' keys

        // Step 1: Extract all unique years
        const years = [...new Set(paymentsData.map((payment) => payment.year))];
        // Extract unique years from the payment data
        const availableYears = [
          ...new Set(paymentsData.map((payment) => payment.year)),
        ];
        setYears(availableYears);

        setSelectedYear(availableYears[0]);
        // Step 2: Find the most recent year
        const mostRecentYear = Math.max(...years);

        // Step 3: Filter data for the most recent year
        const dataForMostRecentYear = paymentsData.filter(
          (payment) => payment.year === mostRecentYear
        );

        // Step 4: Find the most recent month in the most recent year's data
        const mostRecentMonth = dataForMostRecentYear
          .map((payment) => months.indexOf(payment.month))
          .reduce((max, current) => (current > max ? current : max), -1);

        const currentMonthName = months[mostRecentMonth];
        console.log('currentMonthName: ', currentMonthName);

        // Step 5: Determine the next month
        // const nextMonthIndex = (mostRecentMonth + 1) % 12;
        // // const nextMonthName = months[nextMonthIndex];

        const findNextYear = determineYearForNextMonth(
          currentMonthName,
          mostRecentYear
        );

        setError('');
        setCurrentMonth(currentMonthName);
        setNextMonth(findNextYear.nextMonthName);
        // console.log('month: ', findNextYear.nextMonthName);
        setCurrentyear(findNextYear.nextYear);
        // console.log('year: ', findNextYear.nextYear);
      }
    } catch (error) {
      setError(error.response.data.message);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const [nextYear, setNextYear] = useState('');

  // Helper function to determine the next year based on current month
  const determineYearForNextMonth = (currentMonth, currentYear) => {
    const months = [
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

    // Find index of the current month
    const currentMonthIndex = months.indexOf(currentMonth);

    // Determine the next month index
    const nextMonthIndex = (currentMonthIndex + 1) % 12;

    // Check if current month is December to increment the year
    const isDecember = currentMonthIndex === 11;
    const nextYear = isDecember ? currentYear + 1 : currentYear;

    // Get the name of the next month
    const nextMonthName = months[nextMonthIndex];

    return { nextMonthName, nextYear };
  };

  useEffect(() => {
    if ((currentMonth && currentYear) || (previousMonth && previousYear)) {
      let month = previousMonth ? previousMonth : currentMonth;
      let year = previousYear ? previousYear : currentYear;
      const { nextMonthName, nextYear } = determineYearForNextMonth(
        month,
        year
      );
      setNextMonth(nextMonthName);
      setNextYear(nextYear);
    }
  }, [currentMonth, currentYear, previousMonth]);

  useEffect(() => {
    if (selectedYear) {
      const paymentsForYear = completePayments.filter(
        (payment) => payment.year === parseInt(selectedYear)
      );
      setFilteredPayments(paymentsForYear);
    }
  }, [selectedYear, completePayments]);

  // Fetch payments using the separated functions
  useEffect(() => {
    getMostRecentPaymentByTenantId(tenantId);
    fetchUnpaidPayments(tenantId);
    fetchFullyPaidPayments(tenantId);
  }, [tenantId]);

  const toggleTab = (tab) => {
    setSelectedTab(tab);
  };

  const [newMonthlyAmount, setNewMonthlyAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState('');

  // const [rentDeficit, setRentDeficit] = useState('');
  // const [waterDeficit, setWaterDeficit] = useState('');
  // const [garbageDeficit, setGarbageDeficit] = useState('');
  // const [previousPaidWaterBill, setPreviousPaidWaterBill] = useState('');
  // const [previousOtherChargesDeficit, setPreviousOtherChargesDeficit] =
  //   useState('');
  const [previousAccumulatedWaterBill, setPreviousAccumulatedWaterBill] =
    useState('');

  const handleAddPayment = async (e) => {
    e.preventDefault();
    // setLoading(true);
    handleShowModal();
  };

  // State to track if overpay is transferred to monthly amount
  const [isOverpayTransferred, setIsOverpayTransferred] = useState(false);

  const dataToSend = {
    tenantId,
    newMonthlyAmount: isOverpayTransferred ? 0 : newMonthlyAmount,
    referenceNumber,
    newPaymentDate,
    extraCharges: selectedExtraCharge,
    previousMonthExtraCharges: previousMonthSelectedExtraCharge,
    month: nextMonth,
    year: currentYear || nextYear,
    previousAccumulatedWaterBill,
  };
  // Actual function to send payment after confirmation
  const handleConfirmAddPayment = async () => {
    setLoading(true);
    setShowConfirmationModal(false); // Close the modal when confirmed

    try {
      const response = await apiRequest.post(
        '/v2/payments/monthlyPayProcessing',
        dataToSend
      );

      if (response.status) {
        fetchUnpaidPayments(tenantId);
        fetchFullyPaidPayments(tenantId);
        await getMostRecentPaymentByTenantId(tenantId);
        await getTenantDetails();
        // handleOverpayTransfer();
        setIsOverpayTransferred(false);
        setError('');
        toast.success(`Success`);

        handleGenerateReceipt(dataToSend);
        // Reset form fields
        setNewMonthlyAmount('');
        setReferenceNumber('');
        setNewPaymentDate('');
        setSelectedExtraCharge({ expectedAmount: '', description: '' });
        setPreviousMonthSelectedExtraCharge({
          expectedAmount: '',
          description: '',
        });
        setPreviousAccumulatedWaterBill('');
      }
    } catch (error) {
      console.log('Error occurred:', error);
      setError(error?.response?.data?.message);
      toast.error(error.response?.data?.message || 'Failed to clear tenant');
    } finally {
      setLoading(false);
    }
  };
  const [rentDefault, setRentDefault] = useState('');
  const [garbageDefault, setGarbageDefault] = useState('');

  const handleUpdateDefaults = async (e) => {
    e.preventDefault();
    // Handle default update here
    setLoading(true);
    try {
      const response = await apiRequest.put(
        `/v2/tenants/updateTenantHouseDetails/${tenantId}`,
        {
          rentDefault: rentDefault
            ? rentDefault
            : tenantDetails.houseDetails.rent,
          garbageDefault: garbageDefault
            ? garbageDefault
            : tenantDetails.houseDetails.garbageFee,
        }
      );
      if (response.status) {
        console.log(response.data);
      }
      setRentDefault('');
      setGarbageDefault('');
      setShowPopup(false);

      setError('');
      toast.success(`Success Updating Defaults`);
    } catch (error) {
      setError(error.response.data.message);
      toast.error(
        error.response?.data?.message || 'Failed to update tenant Defaults'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getTenantDetails();
  }, [rentDefault, tenantId]);
  const getTenantDetails = async () => {
    try {
      const response = await apiRequest.get(
        `/v2/tenants/getSingleTenant/${tenantId}`
      );
      if (response.status) {
        setTenantDetails(response.data);
      }
    } catch (error) {
      setError(error.response.data.message);
    }
  };
  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    // Initialize Water Bill States with existing data if available
    setAccumulatedWaterBill(payment?.waterBill?.accumulated || 0);
    setPaidWaterBill(payment?.waterBill?.paid || 0);
    setWaterBillDropdownOpen(false); // Ensure dropdown is closed initially
    setShowPaymentPopup(true); // Show the payment popup
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    // Handle updating payment here
    // Example API call:
    setLoading(true);
    const formData = new FormData(e.target);
    try {
      const response = await apiRequest.put(
        `/v2/payments/updatePayment/${selectedPayment._id}`,
        {
          rentDeficit: formData.get('rentDeficit'),
          garbageDeficit: formData.get('garbageDeficit'),
          waterDeficit: formData.get('waterDeficit'),
          referenceNumber: formData.get('referenceNumber'),
          date: formData.get('date'),
          month: selectedPayment.month,
          year: selectedPayment.year,
          accumulatedWaterBill: accumulatedWaterBill, // Send accumulated water bill
          paidWaterBill: paidWaterBill, // Send paid water bill
          tenantId: tenantId,
        }
      );
      if (response.status === 200) {
        console.log(`responseFromBackend: `, response.data);
        navigate(`/rentpayment`);
        // fetchUnpaidPayments(tenantId);
        // fetchFullyPaidPayments(tenantId);
        // await getMostRecentPaymentByTenantId(tenantId);
        setError('');
      }
      setShowPaymentPopup(false);
      // Optionally, refresh the outstanding payments
      fetchUnpaidPayments(tenantId);
    } catch (error) {
      setError(error.response.data.message);
      toast.error(error.response.data.message || 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const toggleWaterBillDropdown = () => {
    setWaterBillDropdownOpen((prevState) => !prevState);
  };

  const hasOutstandingPayments = outstandingPayments.length > 0;

  const [AddInternalAmountPopup, setAddInternalAmountPopup] = useState(false);
  const handleAddInternalAmount = () => {
    setAddInternalAmountPopup(true);
  };

  const [extraAmount, setExtraAmount] = useState('');
  const [extraAmountReferenceNo, setExtraAmountReferenceNo] = useState('');
  const [extraAmountGivenDate, setExtraAmountGivenDate] = useState('');

  const moneyWithinMonthData = {
    currentYear,
    nextMonth,
    extraAmountProvided: extraAmount,
    extraAmountReferenceNo,
    extraAmountGivenDate,
  };
  const handleInternalMonthExtraGivenAmount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest.put(
        `/v2/payments/ExtraAmountGivenInAmonth/${tenantId}`,
        moneyWithinMonthData
      );
      if (response.status) {
        // console.log('All good');
        closeExtraAmountConfirmationPopup();
        setAddInternalAmountPopup(false);
        toast.success('Amount Added!');

        handleGenerateReceipt(moneyWithinMonthData);

        await fetchUnpaidPayments(tenantId);
        await fetchFullyPaidPayments(tenantId);
        await getMostRecentPaymentByTenantId(tenantId);
        await getTenantDetails();
        setExtraAmount('');
        setExtraAmountReferenceNo('');
        setExtraAmountGivenDate('');
      }
    } catch (error) {
      setError(error.response.data.message);
      toast.error(error.response.data.message || 'Failed to Add payment');
    } finally {
      setLoading(false);
    }
  };

  const [isConfirmExtraPopup, setIsConfirmExtraPopup] = useState(false);
  const confirmExtraInternalAmount = (e) => {
    e.preventDefault();
    setIsConfirmExtraPopup(true);
  };
  const closeExtraAmountConfirmationPopup = () => {
    setIsConfirmExtraPopup(false);
  };

  const totalGlobalDeficit = outstandingPayments.reduce(
    (total, payment) => total + payment.globalDeficit,
    0 // Initial value of the sum
  );

  // Function to handle overpay transfer
  const handleOverpayTransfer = () => {
    if (!isOverpayTransferred) {
      const lastPaymentDate =
        mostRecentPayment?.referenceNoHistory[
          mostRecentPayment?.referenceNoHistory?.length - 1
        ]?.date;

      setNewMonthlyAmount(mostRecentPayment?.overpay || 0); // Transfer overpay to monthly amount
      setReferenceNumber(mostRecentPayment?.referenceNumber || 'usedOverPay'); // Transfer overpay to monthly amount
      setNewPaymentDate(
        lastPaymentDate
          ? moment(lastPaymentDate).format('MMMM D, YYYY') // Desired format
          : moment(new Date()).format('MMMM D, YYYY') // Format the current date if no date found
      );

      setIsOverpayTransferred(true); // Mark overpay as transferred
    } else {
      setNewMonthlyAmount(''); // Reset the monthly amount
      setReferenceNumber('');
      setNewPaymentDate('');
      setIsOverpayTransferred(false); // Mark overpay as not transferred
    }
  };

  // New states for modal handling
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);
  const [displayUpdatebtn, setDisplayUpdatebtn] = useState(false);

  const handleUpdateArrowClick = () => {
    setDisplayUpdatebtn(!displayUpdatebtn);
  };

  // Handle showing and closing the confirmation modal
  const handleShowModal = () => setShowConfirmationModal(true);
  const handleCloseModal = () => setShowConfirmationModal(false);

  const displayUpdatePopup = (payment) => {
    setSelectedPayment(payment);
    setShowUpdatePaymentModal(true);
  };
  const closeUpdatePopup = () => {
    setSelectedPayment('');
    setShowUpdatePaymentModal(false);
  };

  const [updatedRentDeficit, setUpdatedRentDeficit] = useState('');
  const [updatedWaterDeficit, setUpdatedWaterDeficit] = useState('');
  const [updatedAccumulatedWaterBill, setUpdatedAccumulatedWaterBill] =
    useState('');
  const [updatedGarbageDeficit, setUpdatedGarbageDeficit] = useState('');
  const [updatedExtraCharges, setUpdatedExtraCharges] = useState('');
  const [updatedReferenceNumber, setUpdatedReferenceNumber] = useState('');

  //handle deficit updates
  const handleDeficitsUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await apiRequest.put(
        `/v2/payments/updateDeficit/${selectedPayment._id}`,
        {
          updatedRentDeficit: updatedRentDeficit
            ? updatedRentDeficit
            : selectedPayment.rent.deficit > 0
            ? selectedPayment.rent.deficit
            : '',
          updatedWaterDeficit: updatedWaterDeficit
            ? updatedWaterDeficit
            : selectedPayment.waterBill.deficit > 0
            ? selectedPayment.waterBill.deficit
            : '',
          updatedAccumulatedWaterBill: updatedAccumulatedWaterBill
            ? updatedAccumulatedWaterBill
            : selectedPayment.waterBill.accumulatedAmount > 0
            ? selectedPayment.waterBill.accumulatedAmount
            : '',
          updatedGarbageDeficit: updatedGarbageDeficit
            ? updatedGarbageDeficit
            : selectedPayment.garbageFee.deficit > 0
            ? selectedPayment.garbageFee.deficit
            : '',
          updatedReferenceNumber: updatedReferenceNumber
            ? updatedReferenceNumber
            : selectedPayment.referenceNumber,
          updatedExtraCharges: updatedExtraCharges
            ? updatedExtraCharges
            : selectedPayment.extraCharges.deficit > 0
            ? selectedPayment.extraCharges.deficit
            : '',
        }
      );
      if (response.status) {
        toast.success('Success');
        /**********/
        await fetchUnpaidPayments(tenantId);
        await fetchFullyPaidPayments(tenantId);
        await getMostRecentPaymentByTenantId(tenantId);

        //reset deficit update values
        setUpdatedRentDeficit('');
        setUpdatedWaterDeficit('');
        setUpdatedAccumulatedWaterBill('');
        setUpdatedGarbageDeficit('');
        setUpdatedExtraCharges('');
        setUpdatedReferenceNumber('');
        setError('');
        closeConfirmationPopup();
        closeUpdatePopup();
        setShowUpdatePaymentModal(false);
      }
    } catch (error) {
      console.log(error.response.data.message);
      setError(error.response.data.message);
      toast.error(error.response?.data?.message || 'Failed to Update Deficits');
    }
  };

  const [UpdatingDeficitPopup, setIsUpdatingDeficitPopup] = useState(false);
  const showConfirmationPopup = (e) => {
    e.preventDefault();
    setIsUpdatingDeficitPopup(true);
  };

  const closeConfirmationPopup = () => {
    setIsUpdatingDeficitPopup(false);
  };

  const [invoiceSelectedPayment, setInvoiceSelectedPayment] = useState('');
  console.log(invoiceSelectedPayment);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

  const handleInvoiceGenerate = (payment) => {
    setInvoiceSelectedPayment(payment);
    setIsInvoiceVisible(true);
  };

  const closeInvoice = async () => {
    setIsInvoiceVisible(false);
    fetchUnpaidPayments(tenantId);
    fetchFullyPaidPayments(tenantId);
    await getMostRecentPaymentByTenantId(tenantId);
  };

  const invoiceData = {
    clientData: {
      _id: invoiceSelectedPayment?.tenant?._id,
      name: invoiceSelectedPayment?.tenant?.name,
      email: invoiceSelectedPayment?.tenant?.name,
      houseNo: invoiceSelectedPayment?.tenant?.houseDetails?.houseNo,
    },
    selectedPayment: {
      _id: invoiceSelectedPayment?._id,
      year: invoiceSelectedPayment?.year,
      month: invoiceSelectedPayment?.month,
    },
    HouseNo: invoiceSelectedPayment?.tenant?.houseDetails?.houseNo,
    items: [
      invoiceSelectedPayment.rent?.deficit > 0 && {
        name: 'Monthly Rent Transaction',
        description: 'Rent Deficit',
        price: invoiceSelectedPayment.rent.deficit,
      },
      invoiceSelectedPayment.waterBill?.deficit > 0 && {
        name: 'Monthly Water Transaction',
        description: 'Water Deficit',
        price: invoiceSelectedPayment.waterBill.deficit,
      },
      invoiceSelectedPayment.garbageFee?.deficit > 0 && {
        name: 'Monthly Garbage Transaction',
        description: 'Garbage Deficit',
        price: invoiceSelectedPayment.garbageFee.deficit,
      },
      invoiceSelectedPayment.extraCharges?.deficit > 0 && {
        name: 'Monthly Extra Charges Transaction',
        description: 'ExtraCharges Deficit',
        price: invoiceSelectedPayment.extraCharges.deficit,
      },
    ].filter(Boolean),
    totalAmount: [
      invoiceSelectedPayment.rent?.deficit > 0
        ? invoiceSelectedPayment.rent.deficit
        : 0,
      invoiceSelectedPayment.waterBill?.deficit > 0
        ? invoiceSelectedPayment.waterBill.deficit
        : 0,
      invoiceSelectedPayment.garbageFee?.deficit > 0
        ? invoiceSelectedPayment.garbageFee.deficit
        : 0,
      invoiceSelectedPayment.extraCharges?.deficit > 0
        ? invoiceSelectedPayment.extraCharges.deficit
        : 0,
    ].reduce((total, value) => total + value, 0),
    invoiceNumber: `INV-${Math.floor(Math.random() * 1000) + 1}`,
  };

  const handleGenerateReceipt = async (dataToSend) => {
    // console.log('Generating receipt for payed:', dataToSend);
    await handleDownload(dataToSend);
  };
  // Function to handle downloading the PDF receipt
  const handleDownload = (dataToSend) => {
    const doc = new jsPDF();

    // Load the logo image to get its dimensions
    const logo = new Image();
    logo.src = '/homelogo.png'; // Path to the logo

    logo.onload = function () {
      // Get original dimensions
      const originalWidth = logo.width;
      const originalHeight = logo.height;

      // Calculate aspect ratio
      const aspectRatio = originalWidth / originalHeight;

      // Set desired width
      const desiredWidth = 50; // You can set your desired width here
      const newWidth = desiredWidth; // Use desired width
      const newHeight = desiredWidth / aspectRatio; // Calculate height based on aspect ratio

      // Add letterhead
      doc.addImage(logo, 'PNG', 10, 10, newWidth, newHeight);
      doc.setFontSize(16);
      doc.text('Sleek Abode Apartments', 70, 20);
      doc.setFontSize(12);
      doc.text('Kimbo, Ruiru.', 70, 30);
      doc.text('Contact: sleekabodemanagement@gmail.com', 70, 35);
      doc.text('Phone: (+254) 788-413-323', 70, 40);

      doc.setLineWidth(1);
      doc.line(10, 45, 200, 45);

      doc.setFontSize(20);
      doc.text('Payment Receipt', 14, 60);

      // Add tenant details
      doc.setFontSize(12);
      doc.text(`Tenant Name: ${tenantDetails?.name || 'Tenant'}`, 14, 70);
      doc.text(`Phone No: ${tenantDetails?.phoneNo || '+254'}`, 14, 75);
      doc.text(
        `Apartment: ${
          tenantDetails?.apartmentId?.name || 'Sleek Abode Apartments'
        }`,
        14,
        80
      );
      doc.text(
        `House: ${
          'Floor' +
          tenantDetails?.houseDetails?.floorNo +
          ', ' +
          tenantDetails?.houseDetails?.houseNo
        }`,
        14,
        85
      );

      // Payment summary table
      const details = [
        [
          'Payment Reference No',
          dataToSend?.referenceNumber ||
            dataToSend?.extraAmountReferenceNo ||
            'ReferenceNo',
        ],
        [
          'Payment Amount',
          new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
          }).format(
            dataToSend?.newMonthlyAmount ||
              mostRecentPayment?.overpay ||
              dataToSend?.extraAmountProvided ||
              0
          ),
        ],
        [
          'Payment Date',
          moment(
            dataToSend?.newPaymentDate ||
              dataToSend?.extraAmountGivenDate ||
              new Date()
          ).format('MMM DD YYYY'),
        ],
      ];
      doc.autoTable({
        head: [['Description', 'Details']],
        body: details,
        startY: 90, // Adjust starting Y position as needed
        theme: 'grid',
        styles: { fontSize: 12 },
      });

      // Save the PDF
      doc.save(
        `receipt_${
          dataToSend?.referenceNumber ||
          dataToSend?.extraAmountReferenceNo ||
          'PaymentReceipt'
        }.pdf`
      );
    };
  };
  const deficitUpdates = [
    {
      label: 'Updated Rent Deficit',
      value: updatedRentDeficit
        ? updatedRentDeficit
        : selectedPayment?.rent?.deficit,
    },
    {
      label: 'Updated Water Deficit',
      value: updatedWaterDeficit
        ? updatedWaterDeficit
        : selectedPayment?.waterBill?.deficit,
    },
    {
      label: 'Updated Accumulated Water Bill',
      value: updatedAccumulatedWaterBill
        ? updatedAccumulatedWaterBill
        : selectedPayment?.waterBill?.accumulatedAmount,
    },
    {
      label: 'Updated Garbage Deficit',
      value: updatedGarbageDeficit
        ? updatedGarbageDeficit
        : selectedPayment?.garbageFee?.deficit,
    },
    {
      label: 'Updated Reference Number',
      value: updatedReferenceNumber
        ? updatedReferenceNumber.toUpperCase()
        : selectedPayment?.referenceNumber
        ? selectedPayment.referenceNumber.toUpperCase()
        : '',
    },

    {
      label: 'Updated Extra Charges',
      value: updatedExtraCharges
        ? updatedExtraCharges
        : selectedPayment?.extraCharges?.deficit,
    },
  ];

  // Function to get the ordinal suffix
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'; // Special case for 11th to 13th
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  // Date formatting function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  return (
    <div className="tenant-payments-container">
      <>
        <div className="tenantPaymentHeader">
          <div className="h1">
            <h1>
              <span>{tenantDetails?.name + `'s`} </span> Payment Track
            </h1>
          </div>
          {/* /////////////////////////////////Lengalei's code begins//////////////////////////////////////////// */}

          <div>
            <button onClick={openAddPopup} className="sticky-note-button">
              <FaNoteSticky className="stickynote" />
              {notes.length > 0 && (
                <span className="note-count">{notes.length}</span>
              )}
            </button>

            {popupOpen && (
              <div className="note-popup">
                {currentNotes.length > 0 ? (
                  <div className="notes-container">
                    <h3>Existing Notes</h3>
                    {currentNotes.map((note) => (
                      <div key={note._id} className="note">
                        <h4>{note.title}</h4>
                        <p>{note.description}</p>
                        <button onClick={() => openEditPopup(note)}>
                          Edit
                        </button>
                        <button onClick={() => deleteNoteBtnClick(note)}>
                          Delete
                        </button>
                      </div>
                    ))}

                    <ReactPaginate
                      previousLabel={'<'}
                      nextLabel={'>'}
                      pageCount={pageCount}
                      onPageChange={handlePageClick}
                      containerClassName={'pagination'}
                      activeClassName={'active'}
                      previousClassName={'page-item'}
                      nextClassName={'page-item'}
                      pageClassName={'page-item'}
                      breakClassName={'page-item'}
                      breakLabel={'...'}
                    />
                  </div>
                ) : (
                  ''
                )}

                <div className="add-edit-section">
                  <h3>{editingNoteId ? 'Edit Note' : 'Add Note'}</h3>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <div className="noteButtons">
                    <button onClick={handleAddOrUpdate}>
                      {editingNoteId ? 'Update Note' : 'Add Note'}
                    </button>
                    <button onClick={() => setPopupOpen(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* /////////////////////////////////Lengalei's code ends//////////////////// */}
        <div className="payments-cards">
          {/* Left Card */}
          <div className={`card left-card `}>
            <div className="card-header">
              <div className="outstandingWithGlobalDeficit">
                <button
                  className={`tab-button ${
                    selectedTab === 'complete' ? 'active' : ''
                  }`}
                  onClick={() => toggleTab('complete')}
                >
                  Complete Payments
                </button>
                <span>_______</span>
              </div>

              {hasOutstandingPayments ? (
                <div className="outstandingWithGlobalDeficit">
                  <button
                    className={`tab-button ${
                      selectedTab === 'outstanding' ? 'active' : ''
                    }`}
                    onClick={() => toggleTab('outstanding')}
                  >
                    Pending Payments
                  </button>
                  {totalGlobalDeficit ? (
                    <span>Global deficit: {totalGlobalDeficit}</span>
                  ) : (
                    <span>_______</span>
                  )}
                </div>
              ) : (
                ''
              )}
            </div>
            <div className="card-body">
              {selectedTab === 'complete' ? (
                <>
                  <div className="year-selector">
                    <label>Select Year: </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {years.map((year, index) => (
                        <option key={index} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mini-cards">
                    {filteredPayments.map((payment, index) => {
                      const cleared =
                        payment.rent.paid &&
                        payment.waterBill.paid &&
                        payment.garbageFee.paid;

                      return (
                        <div key={index} className="mini-card">
                          <p>
                            <strong>Month:</strong>{' '}
                            {payment?.month || currentMonth}, {payment?.year}
                          </p>
                          <p>
                            <strong>Total Amount Received:</strong>{' '}
                            {payment?.totalAmountPaid}
                          </p>
                          <p
                            onClick={() => {
                              handleRefNoHistory(index); // Pass the index to the handler
                            }}
                          >
                            <strong>Reference No History:</strong>
                            <span className="dropdown-toggle">
                              {displayRefNoHistory[index] ? '⬆️' : '⬇️'}
                            </span>
                            {displayRefNoHistory[index] && ( // Display only for the selected card
                              <>
                                {payment?.referenceNoHistory?.map(
                                  (ref, index) => (
                                    <div
                                      key={ref._id}
                                      style={{
                                        backgroundColor:
                                          index ===
                                          payment.referenceNoHistory.length - 1 // Check if it's the last item
                                            ? 'green' // Color for the last item
                                            : 'red', // Color for all prior items
                                        color: 'white',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        borderRadius: '5px',
                                      }}
                                    >
                                      <p>Amount Used: {ref.amount}</p>
                                      <p>RefNo Used: {ref.referenceNoUsed}</p>
                                      <p>
                                        Received payment on:{' '}
                                        {formatDate(ref.date)}{' '}
                                        {/* Use the formatDate function here */}
                                      </p>
                                    </div>
                                  )
                                )}
                              </>
                            )}
                          </p>
                          <p>
                            <strong>Cleared Status:</strong>{' '}
                            {cleared ? 'True' : 'False'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mini-cards">
                  {outstandingPayments?.map((payment, index) => (
                    <div key={index} className="mini-card outstanding">
                      <div onClick={() => handlePaymentClick(payment)}>
                        <p>
                          <strong>Month:</strong>{' '}
                          <span className="monthOuts">{payment?.month}</span>
                        </p>
                        {payment?.rent?.deficit ? (
                          <p>
                            <strong>Rent Deficit:</strong>
                            {payment?.rent?.deficit > 0
                              ? payment?.rent?.deficit
                              : 'None'}
                          </p>
                        ) : (
                          ''
                        )}
                        {payment?.waterBill?.paid ? (
                          ''
                        ) : (
                          <div className="waterBill">
                            {payment?.waterBill?.deficit > 0 ? (
                              <p>
                                <strong>Water Deficit:</strong>{' '}
                                {payment?.waterBill?.deficit > 0
                                  ? payment?.waterBill?.deficit
                                  : 'Water Bill...'}
                                {''}
                              </p>
                            ) : (
                              <p>
                                <strong>Water Bill:</strong>{' '}
                                {payment?.waterBill?.deficit > 0
                                  ? payment?.waterBill?.deficit
                                  : 'Water Bill...'}
                                {''}
                              </p>
                            )}

                            {payment?.waterBill?.accumulatedAmount > 0 ? (
                              <p>
                                {payment?.waterBill?.accumulatedAmount > 0 ? (
                                  <span>
                                    Accumulated Bill:{' '}
                                    {payment?.waterBill?.accumulatedAmount}
                                  </span>
                                ) : (
                                  ''
                                )}
                              </p>
                            ) : (
                              ''
                            )}

                            {payment?.waterBill?.amount > 0 ? (
                              <p>
                                {payment?.waterBill?.amount > 0 ? (
                                  <span>
                                    Already Paid: {payment?.waterBill?.amount}✅
                                  </span>
                                ) : (
                                  ''
                                )}
                              </p>
                            ) : (
                              ''
                            )}
                          </div>
                        )}

                        {payment?.garbageFee?.deficit ? (
                          <p>
                            <strong>Garbage Fee Deficit:</strong>{' '}
                            {payment?.garbageFee?.deficit > 0
                              ? payment?.garbageFee?.deficit
                              : 'None'}
                          </p>
                        ) : (
                          ''
                        )}
                        {payment?.extraCharges?.deficit > 0 ? (
                          <p>
                            <strong>extraCharges Deficit:</strong>{' '}
                            {payment?.extraCharges?.deficit > 0
                              ? payment?.extraCharges?.deficit
                              : 'None'}
                          </p>
                        ) : (
                          ''
                        )}
                        {payment?.globalDeficit ? (
                          <p>
                            <strong>{payment?.month} Total Deficit:</strong>{' '}
                            {payment?.globalDeficit > 0
                              ? payment?.globalDeficit
                              : '...'}
                          </p>
                        ) : (
                          ''
                        )}

                        {payment?.overpay ? (
                          <p>
                            <strong>Current Excess To use:</strong>{' '}
                            {payment?.overpay > 0 ? payment?.overpay : 'None'}
                          </p>
                        ) : (
                          ''
                        )}
                      </div>
                      <p
                        onClick={() => {
                          handleUpdateArrowClick();
                        }}
                      >
                        {displayUpdatebtn ? '⬆' : '⬇'}
                        <br />
                        {displayUpdatebtn && (
                          <>
                            {' '}
                            <button
                              className="confirm-btn"
                              onClick={() => displayUpdatePopup(payment)}
                            >
                              Deficit Errors?
                            </button>
                            <button
                              className="confirm-btn"
                              onClick={() => handleInvoiceGenerate(payment)}
                            >
                              Generate Invoice
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedTab === 'complete' ? (
              ''
            ) : (
              <>
                {hasOutstandingPayments ? (
                  <button
                    className="addExtraAmount"
                    onClick={() => {
                      handleAddInternalAmount();
                    }}
                    // disabled={outstandingPayments[0].waterBill.deficit > 0}
                  >
                    Given Extra Amount within {previousMonth}
                  </button>
                ) : (
                  ''
                )}
              </>
            )}
          </div>

          {/* Right Card */}

          <div className={`card right-card`}>
            <div className="card-header">
              <button
                className={`update-defaults-btn`}
                onClick={() => setShowPopup(true)}
              >
                Update Defaults
              </button>
            </div>
            {/* Monthly Payment Info  */}
            <div className="card-body">
              <form onSubmit={handleAddPayment}>
                {/* Section 1: Monthly Payment Info */}
                <div className="section section-1">
                  <h3>{nextMonth + ', ' + currentYear} Payment Info</h3>
                  <div>
                    {mostRecentPayment?.overpay !== undefined && (
                      <div className="overpay-section">
                        {isOverpayTransferred ? (
                          <p>
                            <strong>Current Overpay:</strong> None
                            <span
                              className="overpay-toggle"
                              onClick={handleOverpayTransfer}
                              style={{
                                cursor: 'pointer',
                                marginLeft: '10px',
                              }}
                            >
                              ⬆
                            </span>
                          </p>
                        ) : (
                          <p>
                            <strong>Current Overpay:</strong>{' '}
                            {mostRecentPayment?.overpay > 0
                              ? mostRecentPayment?.overpay
                              : 'None'}
                            <span
                              className="overpay-toggle"
                              onClick={handleOverpayTransfer}
                              style={{
                                cursor: 'pointer',
                                marginLeft: '10px',
                              }}
                            >
                              ⬇
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Monthly Amount:</label>
                    <input
                      type="number"
                      placeholder="Enter amount provided"
                      value={newMonthlyAmount}
                      onChange={(e) => setNewMonthlyAmount(e.target.value)}
                      readOnly={isOverpayTransferred}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reference Number:</label>
                    <input
                      type="text"
                      placeholder="Reference No used"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      readOnly={isOverpayTransferred}
                    />
                  </div>
                  <div className="form-group">
                    {isOverpayTransferred ? (
                      <label>Last Payment Date:</label>
                    ) : (
                      <label>New Payment Date:</label>
                    )}
                    <input
                      type={isOverpayTransferred ? 'text' : 'date'}
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      readOnly={isOverpayTransferred}
                    />
                  </div>
                  {/* Section 1.2: Extra Charges */}
                  <h3>New Month Extra Charges</h3>
                  <div className="extra-charges-dropdown">
                    <label
                      onClick={toggleExtraChargesDropdown}
                      className="dropdown-label"
                    >
                      <span>
                        {selectedExtraCharge.description ||
                          'Select Extra Charge'}
                      </span>
                      <span className="dropdown-toggle">
                        {extraChargesDropdownOpen ? '⬆️' : '⬇️'}
                      </span>
                    </label>
                    {extraChargesDropdownOpen && (
                      <div className="extra-charges-dropdown-content">
                        <div className="form-group">
                          <label>Expected Amount:</label>
                          <input
                            type="number"
                            value={selectedExtraCharge.expectedAmount ?? 0}
                            onChange={(e) =>
                              setSelectedExtraCharge((prevState) => ({
                                ...prevState,
                                expectedAmount: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {/* <div className="form-group">
                        <label>Paid Amount:</label>
                        <input
                          type="number"
                          value={selectedExtraCharge.paidAmount}
                          onChange={(e) =>
                            setSelectedExtraCharge((prevState) => ({
                              ...prevState,
                              paidAmount: e.target.value,
                            }))
                          }
                        />
                      </div> */}
                        <div className="form-group">
                          <label>Description:</label>
                          <input
                            type="text"
                            value={selectedExtraCharge.description ?? 'None'}
                            onChange={(e) =>
                              setSelectedExtraCharge((prevState) => ({
                                ...prevState,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="close-dropdown-btn"
                          onClick={toggleExtraChargesDropdown}
                        >
                          ⬆
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Previous Monthly Deficits */}
                <div className="section section-2">
                  <h3>Previous Month Transactions</h3>
                  {outstandingPayments && (
                    <>
                      {outstandingPayments.map((payment) => (
                        <div key={payment._id}>
                          <>
                            <label>
                              {payment?.month + ',' + payment?.year}
                            </label>
                            {payment?.rent?.deficit > 0 ? (
                              <div className="form-group">
                                <label>
                                  Rent Deficit:{payment?.rent?.deficit}{' '}
                                </label>
                                {/* <input
                                type="number"
                                placeholder="Enter rent deficit"
                                value={rentDeficit}
                                onChange={(e) => setRentDeficit(e.target.value)}
                              /> */}
                              </div>
                            ) : (
                              ''
                            )}
                            {payment?.waterBill?.deficit > 0 ? (
                              <div className="form-group">
                                <label>
                                  Water Deficit:
                                  {payment?.waterBill?.deficit}
                                </label>
                                {/* <input
                                type="number"
                                placeholder="Enter water deficit"
                                value={waterDeficit}
                                onChange={(e) =>
                                  setWaterDeficit(e.target.value)
                                }
                              /> */}
                              </div>
                            ) : (
                              ''
                            )}
                            {payment?.waterBill?.paid ? (
                              ''
                            ) : (
                              <>
                                {payment?.waterBill?.deficit > 0 ? (
                                  ''
                                ) : (
                                  <div className="form-group water-bill-section">
                                    <label
                                      onClick={toggleWaterBillDropdown}
                                      className="water-bill-label"
                                    >
                                      <span className="water-bill-icon">
                                        💧
                                      </span>{' '}
                                      Water Bill{' '}
                                      <span className="dropdown-toggle">
                                        {waterBillDropdownOpen ? '⬆' : '⬇'}
                                      </span>
                                    </label>
                                    {waterBillDropdownOpen && (
                                      <div className="water-bill-dropdown">
                                        <div className="form-group">
                                          <label>Accumulated Water Bill:</label>
                                          <input
                                            type="number"
                                            value={previousAccumulatedWaterBill}
                                            onChange={(e) =>
                                              setPreviousAccumulatedWaterBill(
                                                e.target.value
                                              )
                                            }
                                            name="accumulatedWaterBill"
                                            required
                                          />
                                        </div>
                                        {/* <div className="form-group">
                                      <label>Paid Water Bill:</label>
                                      <input
                                        type="number"
                                        value={previousPaidWaterBill}
                                        onChange={(e) =>
                                          setPreviousPaidWaterBill(
                                            e.target.value
                                          )
                                        }
                                        name="paidWaterBill"
                                        required
                                      />
                                    </div> */}
                                        <button
                                          type="button"
                                          className="close-dropdown-btn"
                                          onClick={toggleWaterBillDropdown}
                                        >
                                          ⬆
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {payment?.garbageFee?.deficit > 0 ? (
                              <div className="form-group">
                                <label>
                                  Garbage Deficit:{' '}
                                  {payment?.garbageFee?.deficit}
                                </label>
                                {/* <input
                                type="number"
                                placeholder="Enter garbage deficit"
                                value={garbageFee}
                                onChange={(e) =>
                                  setGarbageDeficit(e.target.value)
                                }
                              /> */}
                              </div>
                            ) : (
                              ''
                            )}
                            {payment?.extraCharges?.deficit > 0 ? (
                              <div className="form-group">
                                <label>
                                  Previous Extra Charges Deficit:
                                  {payment?.extraCharges?.deficit}
                                </label>
                                {/* <input
                                type="number"
                                placeholder="Enter extra charges"
                                value={previousOtherChargesDeficit}
                                onChange={(e) =>
                                  setPreviousOtherChargesDeficit(e.target.value)
                                }
                              /> */}
                              </div>
                            ) : (
                              ''
                            )}
                            <hr />
                          </>
                        </div>
                      ))}
                    </>
                  )}
                  <h3>Previous Month Extra Charges</h3>
                  <div className="extra-charges-dropdown">
                    <label
                      onClick={togglePreviousMonthExtraChargesDropdown}
                      className="dropdown-label"
                    >
                      <span>
                        {previousMonthSelectedExtraCharge.description ||
                          'PreviousMonth  Extra Charge'}
                      </span>
                      <span className="dropdown-toggle">
                        {previousMonthExtraChargesDropdownOpen ? '⬆️' : '⬇️'}
                      </span>
                    </label>
                    {previousMonthExtraChargesDropdownOpen && (
                      <div className="extra-charges-dropdown-content">
                        <div className="form-group">
                          <label>Expected Amount:</label>
                          <input
                            type="number"
                            value={
                              previousMonthSelectedExtraCharge.expectedAmount ??
                              0
                            }
                            onChange={(e) =>
                              setPreviousMonthSelectedExtraCharge(
                                (prevState) => ({
                                  ...prevState,
                                  expectedAmount: e.target.value,
                                })
                              )
                            }
                          />
                        </div>
                        {/* <div className="form-group">
                        <label>Paid Amount:</label>
                        <input
                          type="number"
                          value={previousMonthSelectedExtraCharge.paidAmount}
                          onChange={(e) =>
                            setPreviousMonthSelectedExtraCharge(
                              (prevState) => ({
                                ...prevState,
                                paidAmount: e.target.value,
                              })
                            )
                          }
                        />
                      </div> */}
                        <div className="form-group">
                          <label>Description:</label>
                          <input
                            type="text"
                            value={
                              previousMonthSelectedExtraCharge.description ??
                              'None'
                            }
                            onChange={(e) =>
                              setPreviousMonthSelectedExtraCharge(
                                (prevState) => ({
                                  ...prevState,
                                  description: e.target.value,
                                })
                              )
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="close-dropdown-btn"
                          onClick={togglePreviousMonthExtraChargesDropdown}
                        >
                          ⬆
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="confirm-btn">
                  Add Payment
                </button>
              </form>
            </div>
          </div>
        </div>
        {/*Invoice generation */}
        {isInvoiceVisible && (
          <div className="invoice-modal">
            <Invoice
              invoiceData={invoiceData}
              onClose={closeInvoice}
              tenantId={invoiceSelectedPayment?.tenant?._id}
            />
          </div>
        )}
        {/*Update Defaults Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>
                Update {tenantDetails?.name}
                {`'s`} Default Values
              </h2>
              <form onSubmit={handleUpdateDefaults}>
                <div className="form-group">
                  <label>Rent Default:</label>
                  <h5>
                    Original Payable Rent:
                    <span className="updateDefaults">
                      {fetchedTenantDetails?.houseDetails?.rent}
                    </span>
                  </h5>
                  <input
                    type="number"
                    placeholder="Enter rent default"
                    value={rentDefault}
                    onChange={(e) => {
                      setRentDefault(e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Garbage Default:</label>
                  <h5>
                    Original GarbageFee:
                    <span className="updateDefaults">
                      {fetchedTenantDetails?.houseDetails?.garbageFee}
                    </span>
                  </h5>
                  <input
                    type="number"
                    placeholder="Enter garbage default"
                    value={garbageDefault}
                    onChange={(e) => {
                      setGarbageDefault(e.target.value);
                    }}
                  />
                </div>
                <button type="submit">Update</button>
                <button
                  type="button"
                  className="close-btnClose"
                  onClick={() => setShowPopup(false)}
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        )}
        {/*Given Extra Amount Internal AmountPopup */}
        {AddInternalAmountPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>{tenantDetails?.name}</h2>
              <h2>
                Extra {extraAmount || 0} given within {previousMonth}
              </h2>
              <form onSubmit={confirmExtraInternalAmount}>
                <div className="form-group">
                  <label>Amount Added</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={extraAmount}
                    onChange={(e) => {
                      setExtraAmount(e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Reference number</label>
                  <input
                    type="text"
                    placeholder="Reference number"
                    value={extraAmountReferenceNo}
                    onChange={(e) => {
                      setExtraAmountReferenceNo(e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={extraAmountGivenDate}
                    onChange={(e) => {
                      setExtraAmountGivenDate(e.target.value);
                    }}
                  />
                </div>
                <button type="submit">Add amount</button>
                <button
                  type="button"
                  className="close-btnClose"
                  onClick={() => setAddInternalAmountPopup(false)}
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        )}
        {/*Complete a said month Pending Payments Popup */}
        {showPaymentPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>
                Complete {selectedPayment.month + `,` + selectedPayment.year}{' '}
                Pending Payment
              </h2>
              <form onSubmit={handlePaymentUpdate}>
                {/* Rent Deficit */}
                {selectedPayment?.rent?.deficit ? (
                  <div className="form-group">
                    <label>
                      Rent Deficit: {selectedPayment?.rent?.deficit || ''}
                    </label>
                    <input type="number" name="rentDeficit" />
                  </div>
                ) : null}

                {/* Water Deficit */}
                {selectedPayment?.waterBill?.deficit ? (
                  <>
                    <div className="form-group">
                      <label>
                        Water Bill {selectedPayment?.waterBill?.deficit || ''}
                      </label>
                      <input type="number" name="waterDeficit" />
                    </div>
                  </>
                ) : (
                  ''
                )}

                {selectedPayment?.waterBill?.deficit ? (
                  ''
                ) : (
                  <>
                    {' '}
                    <div className="form-group water-bill-section">
                      <label
                        onClick={toggleWaterBillDropdown}
                        className="water-bill-label"
                      >
                        <span className="water-bill-icon">💧</span> Water Bill{' '}
                        <span className="dropdown-toggle">
                          {waterBillDropdownOpen ? '⬆' : '⬇'}
                        </span>
                      </label>
                      {waterBillDropdownOpen && (
                        <div className="water-bill-dropdown">
                          <div className="form-group">
                            <label>Accumulated Water Bill:</label>
                            <input
                              type="number"
                              value={accumulatedWaterBill}
                              onChange={(e) =>
                                setAccumulatedWaterBill(e.target.value)
                              }
                              name="accumulatedWaterBill"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Paid Water Bill:</label>
                            <input
                              type="number"
                              value={paidWaterBill}
                              onChange={(e) => setPaidWaterBill(e.target.value)}
                              name="paidWaterBill"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            className="close-dropdown-btn"
                            onClick={toggleWaterBillDropdown}
                          >
                            ⬆
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* New Water Bill Dropdown Section */}

                {/* Garbage Deficit */}
                {selectedPayment?.garbageFee?.deficit ? (
                  <div className="form-group">
                    <label>
                      Garbage Deficit:{' '}
                      {selectedPayment?.garbageFee?.deficit || ''}
                    </label>
                    <input type="number" name="garbageDeficit" required />
                  </div>
                ) : null}

                {/* Reference Number */}
                <div className="form-group">
                  <label>Reference Number</label>
                  <input type="text" name="referenceNumber" required />
                </div>

                {/* Date */}
                <div className="form-group">
                  <label>Date:</label>
                  <input type="date" name="date" required />
                </div>

                {/* Submit and Cancel Buttons */}
                <button type="submit" className="confirm-btn">
                  Update Payment
                </button>
                <button
                  type="button"
                  className="close-btnClose"
                  onClick={() => setShowPaymentPopup(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
        {/*Update deficits */}
        {showUpdatePaymentModal && (
          <div className="confirmation-modal">
            <div className="popup-content">
              <h2>
                Update {selectedPayment.month + `,` + selectedPayment.year}{' '}
                Deficits
              </h2>
              <form onSubmit={showConfirmationPopup}>
                {/* Rent Deficit */}
                {selectedPayment?.rent?.deficit > 0 ? (
                  <div className="form-group">
                    <label>
                      Current Rent Deficit:{' '}
                      {selectedPayment?.rent?.deficit || ''}
                    </label>
                    <input
                      type="number"
                      value={updatedRentDeficit}
                      onChange={(e) => setUpdatedRentDeficit(e.target.value)}
                      placeholder="New deficit value"
                    />
                  </div>
                ) : null}

                {/* Water Deficit */}
                {selectedPayment?.waterBill?.paid ? (
                  ''
                ) : (
                  <>
                    {selectedPayment?.waterBill?.deficit > 0 ? (
                      <>
                        <div className="form-group">
                          <label>
                            Current Water Bill{' '}
                            {selectedPayment?.waterBill?.deficit || ''}
                          </label>
                          <input
                            type="number"
                            value={updatedWaterDeficit}
                            onChange={(e) =>
                              setUpdatedWaterDeficit(e.target.value)
                            }
                            placeholder="New deficit value"
                          />
                        </div>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                )}

                {selectedPayment?.waterBill?.paid ? (
                  ''
                ) : (
                  <>
                    {' '}
                    {selectedPayment?.waterBill?.deficit > 0 ? (
                      ''
                    ) : (
                      <>
                        {' '}
                        <div className="form-group water-bill-section">
                          <label
                            onClick={toggleWaterBillDropdown}
                            className="water-bill-label"
                          >
                            <span className="water-bill-icon">💧</span> Water
                            Bill{' '}
                            <span className="dropdown-toggle">
                              {waterBillDropdownOpen ? '⬆' : '⬇'}
                            </span>
                          </label>
                          {waterBillDropdownOpen && (
                            <div className="water-bill-dropdown">
                              <div className="form-group">
                                <label>Accumulated Water Bill:</label>
                                <input
                                  type="number"
                                  value={updatedAccumulatedWaterBill}
                                  onChange={(e) =>
                                    setUpdatedAccumulatedWaterBill(
                                      e.target.value
                                    )
                                  }
                                  name="accumulatedWaterBill"
                                />
                              </div>
                              <button
                                type="button"
                                className="close-dropdown-btn"
                                onClick={toggleWaterBillDropdown}
                              >
                                ⬆
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* New Water Bill Dropdown Section */}

                {/* Garbage Deficit */}
                {selectedPayment?.garbageFee?.deficit > 0 ? (
                  <div className="form-group">
                    <label>
                      Current Garbage Deficit:{' '}
                      {selectedPayment?.garbageFee?.deficit || ''}
                    </label>
                    <input
                      type="number"
                      value={updatedGarbageDeficit}
                      onChange={(e) => setUpdatedGarbageDeficit(e.target.value)}
                      placeholder="New deficit value"
                    />
                  </div>
                ) : null}

                {/*Extra Charges*/}
                {selectedPayment?.extraCharges?.deficit > 0 ? (
                  <div className="form-group">
                    <label>
                      Current Extra Charges Deficit:{' '}
                      {selectedPayment?.extraCharges?.deficit || ''}
                    </label>
                    <input
                      type="number"
                      value={updatedExtraCharges}
                      onChange={(e) => setUpdatedExtraCharges(e.target.value)}
                      placeholder="New deficit value"
                    />
                  </div>
                ) : null}

                {/* Reference Number */}
                <div className="form-group">
                  <label>
                    Current RefNo: `
                    {selectedPayment?.referenceNumber.toUpperCase()}`
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={updatedReferenceNumber}
                    onChange={(e) => setUpdatedReferenceNumber(e.target.value)}
                    placeholder="New RefNo"
                  />
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="closeAndUpdateBtns">
                  {' '}
                  <button type="submit" className="confirm-btn">
                    Update Deficits
                  </button>
                  <button
                    type="button"
                    className="confirm-btn"
                    onClick={() => {
                      closeUpdatePopup();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/*Confirmation Modal */}
        {showConfirmationModal && (
          <div className="confirmation-modal">
            <div className="modal-content">
              <p>Are you sure you want to proceed with this payment?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleConfirmAddPayment}
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {deleteNotePopup && (
          <div className="confirmation-modal">
            <div className="modal-content">
              <p>Are you sure you want to Delete This note?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeDeleteNotePopup}>
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={() => deleteNote(selectedNote._id)}
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {UpdatingDeficitPopup && (
          <div className="deficit-confirmation-modal">
            <div className="deficit-modal-content">
              <p>
                Are you sure you want to proceed with this update of payment?
              </p>

              {/* Conditionally Render List */}
              <ul>
                {deficitUpdates?.map((update, index) =>
                  update.value ? ( // Only render if value exists
                    <li key={index}>
                      <strong>{update?.label}: </strong>
                      <span>{update?.value}</span>
                    </li>
                  ) : (
                    ''
                  )
                )}
              </ul>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeConfirmationPopup}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={handleDeficitsUpdate}>
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {isConfirmExtraPopup && (
          <div className="deficit-confirmation-modal">
            <div className="deficit-modal-content">
              <p>Are you sure you want to proceed with this Extra payment?</p>
              <h4>
                Amount to process:{' '}
                <span>
                  {new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                  }).format(moneyWithinMonthData?.extraAmountProvided)}
                </span>
              </h4>
              <h4>
                ReferenceNo used:{' '}
                <span>
                  {moneyWithinMonthData?.extraAmountReferenceNo?.toUpperCase()}
                </span>
              </h4>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={closeExtraAmountConfirmationPopup}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleInternalMonthExtraGivenAmount}
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <span>{error}</span>}
      </>
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
      <ToastContainer />
    </div>
  );
};

export default TenantPayments;
