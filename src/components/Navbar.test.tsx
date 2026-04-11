import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/Navbar';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

describe('Navbar', () => {
  it('renders the logo and navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('HiX')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('shows user profile when logged in', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // The avatar fallback should show the first letter of the company name or email
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
