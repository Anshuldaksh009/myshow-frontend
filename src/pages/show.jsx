import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

const Show = () => {
  const { movieId } = useParams();
  const selectedCity = localStorage.getItem('selectedCity') || 'Bhopal';

  // Helper function to format Date object into local YYYY-MM-DD format
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [shows, setShows] = useState([]);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (movieId) {
      fetchMovieAndShows();
    }
  }, [movieId, selectedCity, selectedDate]);

  const fetchMovieAndShows = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch Movie Details
      try {
        const movieRes = await axiosClient.get(`/movies/get-movie-by-id/${movieId}`);
        if (movieRes.data?.data) {
          setMovie(movieRes.data.data);
        } else if (movieRes.data?.movie) {
          setMovie(movieRes.data.movie);
        }
      } catch (err) {
        console.warn('Movie details fetch fallback notice:', err);
      }

      // 2. Fetch Shows by City, Movie, and Selected Date
      const showsRes = await axiosClient.get(
        `/shows/get-shows-by-city-and-movie?movie=${movieId}&city=${encodeURIComponent(
          selectedCity
        )}&date=${selectedDate}`
      );

      if (showsRes.data?.success) {
        const fetchedShows = showsRes.data.data || [];
        setShows(fetchedShows);

        // Fallback movie details from shows if movie endpoint failed
        if (!movie && fetchedShows.length > 0 && fetchedShows[0].movie) {
          setMovie(fetchedShows[0].movie);
        }
      } else {
        setShows([]);
      }
    } catch (err) {
      console.error('Error fetching shows:', err);
      setError('Failed to load showtimes for the selected date.');
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  // 🗓️ Generates 7 Days based on local dates
  const generateAvailableDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let maxDays = 7;

    if (movie?.endDate) {
      const expiryDate = new Date(movie.endDate);
      expiryDate.setHours(23, 59, 59, 999);
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays < 7) {
        maxDays = diffDays;
      }
    }

    for (let i = 0; i < maxDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const dateStr = getLocalDateString(d);
      const dayName =
        i === 0
          ? 'TODAY'
          : i === 1
          ? 'TOM'
          : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

      const monthDay = d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      });

      days.push({ dateStr, dayName, monthDay });
    }
    return days;
  };

  const availableDays = generateAvailableDays();

  // Group shows by Theater ID safely
  const theatersMap = {};
  shows.forEach((show) => {
    const theaterId = show.theater?._id || show.theater || 'unknown';
    if (!theatersMap[theaterId]) {
      theatersMap[theaterId] = {
        theater: typeof show.theater === 'object' ? show.theater : { name: 'Partner Cinema', city: selectedCity },
        shows: [],
      };
    }
    theatersMap[theaterId].shows.push(show);
  });

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <div className="container py-4">
        {/* 🎬 1. MOVIE BANNER */}
        {movie && (
          <div className="bg-dark text-white p-4 rounded-3 mb-4 shadow-sm d-flex flex-column flex-md-row gap-4 align-items-center">
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                style={{ width: '120px', height: '175px', objectFit: 'cover' }}
                className="rounded-3 shadow"
              />
            )}
            <div>
              <h2 className="fw-bold text-capitalize m-0">{movie.title}</h2>
              <div className="d-flex flex-wrap gap-2 my-2 align-items-center">
                <span className="badge bg-danger">{movie.genre || 'Action'}</span>
                <span className="badge bg-secondary">{movie.language || 'English'}</span>
                <span className="small text-white-50">⏱️ {movie.duration || 120} mins</span>
              </div>
              <p className="small text-warning m-0">
                📍 Selected City: <strong>{selectedCity}</strong>
              </p>
            </div>
          </div>
        )}

        {/* 📅 2. 7-DAY CALENDAR BAR */}
        <div className="bg-white p-3 rounded-3 shadow-sm mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-danger fs-5"></i>
              <h6 className="fw-bold text-dark m-0">SELECT SHOW DATE</h6>
            </div>

            <input
              type="date"
              className="form-control form-control-sm border-danger-subtle shadow-none fw-semibold text-secondary"
              style={{ width: '150px' }}
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Date Pills */}
          <div className="d-flex gap-2 overflow-x-auto py-1">
            {availableDays.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`btn d-flex flex-column align-items-center justify-content-center py-2 px-3 rounded-3 transition-all ${
                    isSelected
                      ? 'btn-danger text-white shadow-sm fw-bold'
                      : 'btn-light text-dark border-0'
                  }`}
                  style={{
                    minWidth: '75px',
                    flexShrink: 0,
                    border: isSelected ? 'none' : '1px solid #e0e0e0',
                  }}
                >
                  <span className={`small text-uppercase ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                    {item.dayName}
                  </span>
                  <span className="fs-6 fw-bold lh-1 mt-1">
                    {item.monthDay}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🎟️ 3. SHOWTIMES LIST */}
        <h5 className="fw-bold mb-3">Available Theaters & Showtimes</h5>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="mt-2 text-muted small">Loading showtimes for {selectedDate}...</p>
          </div>
        ) : Object.keys(theatersMap).length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center rounded-3">
            <h5 className="fw-bold text-secondary mb-2">No Shows Scheduled</h5>
            <p className="text-muted small m-0">
              There are no available showtimes for <strong>{selectedCity}</strong> on{' '}
              <strong>{selectedDate}</strong>.
            </p>
          </div>
        ) : (
          Object.values(theatersMap).map(({ theater, shows }) => (
            <div key={theater?._id || Math.random()} className="card border-0 shadow-sm p-4 rounded-3 mb-3">
              <h5 className="fw-bold text-primary m-0 mb-1">
                🏛️ {theater?.name || 'Partner Cinema'}
              </h5>
              <p className="small text-muted mb-3">
                {theater?.address ? `${theater.address}, ` : ''}{theater?.city || selectedCity}
              </p>

              <div className="d-flex flex-wrap gap-3">
                {shows.map((show) => (
                  <Link
                    key={show._id}
                    to={`/book-seats/${show._id}`}
                    className="btn btn-outline-danger px-3 py-2 rounded-3 text-center text-decoration-none shadow-sm"
                    style={{ minWidth: '130px' }}
                  >
                    <div className="fw-bold">{show.time}</div>
                    <div className="small text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                      Price: <strong>₹{show.ticketPrice}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Show;