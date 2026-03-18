import React from 'react';
import { FaSteam, FaDiscord, FaTelegramPlane } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="nx-footer">
      <div className="nx-footer-container">

        <div className="nx-footer-brand">
          <h2>Ne<span>x</span>us</h2>
          <p>Інтелектуальна система підбору ігор, що навчається на твоїх смаках.</p>
        </div>

        <div className="nx-footer-socials">
          <a href="#" className="nx-social-link">
            <FaSteam size={20} /> Steam
          </a>
          <a href="#" className="nx-social-link">
            <FaDiscord size={20} /> Discord
          </a>
          <a href="#" className="nx-social-link">
            <FaTelegramPlane size={20} /> Telegram
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;