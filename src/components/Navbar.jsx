import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  // 1. 🎯 Add State to track if the mobile menu is open
  const [isOpen, setIsOpen] = useState(false);

  // Read token, userRole, and user object directly from localStorage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (err) {
    console.error('Error parsing user object:', err);
  }

  // Check if user is Admin
  const isAdmin =
    userRole === 'admin' ||
    userRole === 'Admin' ||
    user?.role === 'admin' ||
    user?.isAdmin === true;

  // 🎯 Helper function to close menu after clicking a link
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    closeMenu(); // Close menu on logout
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-2 shadow-sm">
      <div className="container-fluid">
        {/* BRAND LOGO */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-danger fs-4" to="/" onClick={closeMenu}>
          <i className="bi bi-film"></i> MyShow
        </Link>

        {/* 2. 🎯 Toggler Button now uses React onClick instead of Bootstrap JS */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* 3. 🎯 Dynamically add the 'show' class if isOpen is true */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarContent">
          {/* LEFT NAV LINKS */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center gap-2">
            <li className="nav-item">
              <Link className="nav-link fw-semibold text-white" to="/" onClick={closeMenu}>
                Home
              </Link>
            </li>

            {/* 🎟️ MY BOOKINGS LINK */}
            {token && (
              <li className="nav-item">
                <Link className="nav-link fw-semibold text-white" to="/my-bookings" onClick={closeMenu}>
                  🎟️ My Bookings
                </Link>
              </li>
            )}

            {/* 🛡️ ADMIN PANEL LINK */}
            {token && isAdmin && (
              <li className="nav-item">
                <Link className="nav-link fw-semibold text-warning" to="/admin" onClick={closeMenu}>
                  🛡️ Admin Panel
                </Link>
              </li>
            )}
          </ul>

          {/* RIGHT ACCOUNT / LOGOUT BAR */}
          <div className="d-flex align-items-center gap-3 ms-auto mt-3 mt-lg-0">
            {token ? (
              <>
                <span className="text-light small">
                  👤 Logged in as:{' '}
                  <strong className="text-info text-capitalize">
                    {user?.name || (isAdmin ? 'Admin' : 'User')}
                  </strong>
                </span>

                <button
                  className="btn btn-outline-danger btn-sm fw-bold px-3"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm fw-semibold px-3" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/signup" className="btn btn-danger btn-sm fw-bold px-3" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;