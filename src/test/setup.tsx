import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    profile: { companyName: 'Test Company', role: 'user' },
    logout: vi.fn(),
  })),
  db: {},
  auth: {},
  onSnapshot: vi.fn((_query, onNext, _onError) => {
    if (typeof onNext === 'function') {
      onNext({ docs: [] });
    } else if (typeof _query === 'function') {
      // Handle case where onNext is the first argument (doc onSnapshot)
      _query({ exists: () => false, data: () => ({}) });
    }
    return vi.fn(); // unsubscribe
  }),
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn(),
  })),
  handleFirestoreError: vi.fn(),
  OperationType: {
    GET: 'get',
    LIST: 'list',
    WRITE: 'write',
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
