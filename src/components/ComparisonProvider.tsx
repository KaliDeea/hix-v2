import React, { createContext, useContext, useState, useEffect } from 'react';
import { Listing } from '../types';
import { toast } from 'sonner';

interface ComparisonContextType {
  selectedListings: Listing[];
  addToListings: (listing: Listing) => void;
  removeFromListings: (id: string) => void;
  clearListings: () => void;
  isInComparison: (id: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hix_comparison');
    if (saved) {
      try {
        setSelectedListings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load comparison state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hix_comparison', JSON.stringify(selectedListings));
  }, [selectedListings]);

  const addToListings = (listing: Listing) => {
    if (selectedListings.length >= 4) {
      toast.error("You can only compare up to 4 assets at a time.");
      return;
    }
    if (selectedListings.find(l => l.id === listing.id)) {
      toast.info("Asset is already in comparison.");
      return;
    }
    setSelectedListings([...selectedListings, listing]);
    toast.success("Added to comparison");
  };

  const removeFromListings = (id: string) => {
    setSelectedListings(selectedListings.filter(l => l.id !== id));
  };

  const clearListings = () => {
    setSelectedListings([]);
  };

  const isInComparison = (id: string) => {
    return !!selectedListings.find(l => l.id === id);
  };

  return (
    <ComparisonContext.Provider value={{ 
      selectedListings, 
      addToListings, 
      removeFromListings, 
      clearListings,
      isInComparison 
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
