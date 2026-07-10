import React from 'react';

const Navbar = ({ title, subtitle }) => {
    return (
        <header className="page-header">
            <div className="header-title-area">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
        </header>
    );
};

export default Navbar;
