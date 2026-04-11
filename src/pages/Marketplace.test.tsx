import { render, screen, fireEvent } from '@testing-library/react';
import Marketplace from '@/pages/Marketplace';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

describe('Marketplace', () => {
  it('renders the search input', () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Search assets...')).toBeInTheDocument();
  });

  it('updates search query on input change', () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );
    
    const input = screen.getByPlaceholderText('Search assets...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Siemens' } });
    expect(input.value).toBe('Siemens');
  });
});
