import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(''); // 👈 New: Tells you EXACTLY why it failed

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('token');

      if (!token) {
        setErrorMessage("You are not logged in. Please log in to view your tickets.");
        setLoading(false);
        return;
      }

      // 1. Decode JWT to get ID reliably (Bypasses localStorage user object bugs)
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.id || payload._id;
      } catch (e) {
        console.error("Token decode error:", e);
      }

      if (!userId) {
        setErrorMessage("Invalid session. Please log out and log in again.");
        setLoading(false);
        return;
      }

      // 2. Fetch the populated bookings
      const endpoint = `/booking/get-user-booking/${userId}`;
      const res = await axiosClient.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        // Smart mapping: checks data, then bookings, then defaults to empty array
        const fetchedBookings = res.data.data || res.data.bookings || [];
        setBookings(fetchedBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('FULL ERROR:', err.response?.data || err.message);
      
      // 🚨 401 Catch: If the backend rejects the token, tell the user!
      if (err.response?.status === 401) {
        setErrorMessage("Your session has expired. Please log out and log back in to see your tickets.");
      } else {
        setErrorMessage("Failed to load bookings. Our servers might be taking a nap.");
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket? Seats will be released.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || payload.id || payload._id;
      
      const res = await axiosClient.post('/booking/cancel-booking', {
        bookingId,
        userId: userId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        alert('🎟️ Ticket cancelled successfully!');
        fetchBookings(); // Refresh tickets list to show CANCELLED status
      } else {
        alert(res.data?.message || 'Failed to cancel booking.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling booking.');
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <div className="container py-4">
        <h3 className="fw-bold mb-4">🎟️ My Booked Tickets</h3>

        {/* 🚨 SMART ERROR UI: If there's a 401 or crash, it shows up here */}
        {errorMessage && (
          <div className="alert alert-danger shadow-sm text-center fw-bold py-3">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : !errorMessage && bookings.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center rounded-3">
            <h5 className="text-secondary fw-bold mb-2">No Bookings Found</h5>
            <p className="text-muted small">You haven't booked any movie tickets yet.</p>
          </div>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              // Safely extract nested data with fallbacks
              const show = b.show || {};
              const movie = show.movie || {};
              const theater = show.theater || {};
              const status = b.status || 'BOOKED';
              const isCancelled = status === 'CANCELLED';

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const showDate = show.date ? new Date(show.date) : null;
              const isExpired = showDate ? showDate < today : false;

              return (
                <div key={b._id} className="col-md-6 col-lg-4">
                  <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isCancelled ? 'opacity-75' : ''}`}>
                    <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-capitalize text-truncate me-2" style={{ maxWidth: '180px' }}>
                        {movie.title || 'Unknown Movie'}
                      </span>
                      <span className={`badge ${isCancelled ? 'bg-secondary' : 'bg-success'}`}>
                        {status}
                      </span>
                    </div>

                    <div className="card-body p-3">
                      <p className="small text-muted mb-1">
                        🏛️ <strong>Theater:</strong> {theater.name || 'Unknown Theater'} {theater.city ? `(${theater.city})` : ''}
                      </p>
                      <p className="small text-muted mb-1">
                        📅 <strong>Date:</strong> {showDate ? showDate.toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="small text-muted mb-1">
                        ⏰ <strong>Time:</strong> {show.time || 'N/A'}
                      </p>
                      <p className="small text-danger fw-bold mb-2">
                        🪑 <strong>Seats:</strong> {Array.isArray(b.seats) ? b.seats.join(', ') : 'N/A'}
                      </p>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2">
                        <span className="fw-bold fs-6">₹{b.totalAmount || 0}</span>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Txn: {b.transactionId || b._id?.substring(0, 8)}
                        </small>
                      </div>
                    </div>

                    {!isCancelled && !isExpired && (
                      <div className="card-footer bg-white border-0 text-end pb-3 pt-0">
                        <button
                          className="btn btn-outline-danger btn-sm fw-semibold"
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;