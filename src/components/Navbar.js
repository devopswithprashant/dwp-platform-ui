import React from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar(props) {
  const navigate = useNavigate();
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">{props.title}</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">{props.sec1}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/blogs">{props.sec2}</Link>
            </li>  
            {/* <li className="nav-item">
              <Link className="nav-link" to="/create">{props.sec3}</Link>
            </li>   */}
          </ul>
        </div>
        {/* <button type="button" class="btn btn-success">+ Create</button> */}
        <button className="btn btn-success" onClick={() => navigate('/create')}>+ Create</button>
      </div>
    </nav>
  )
}

Navbar.propTypes = {
    title: PropTypes.string.isRequired,
    sec1: PropTypes.string.isRequired,
    sec2: PropTypes.string.isRequired
}

//This will be depricated in future release of react because now JS itself provide this facility by itself
// Navbar.defaultProps = {
//     title: "Set Title here",
//     about: "about me"
// };