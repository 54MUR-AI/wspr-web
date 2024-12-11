import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageTemplates from '../../../components/Chat/MessageTemplates';
import templateReducer from '../../../store/slices/templateSlice';

const mockStore = configureStore({
  reducer: {
    templates: templateReducer,
  },
});

describe('MessageTemplates', () => {
  it('renders template list', () => {
    render(
      <Provider store={mockStore}>
        <MessageTemplates />
      </Provider>
    );
    
    expect(screen.getByText(/Message Templates/i)).toBeInTheDocument();
  });

  it('opens create template dialog', () => {
    render(
      <Provider store={mockStore}>
        <MessageTemplates />
      </Provider>
    );
    
    const addButton = screen.getByRole('button', { name: /add template/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText(/Create Template/i)).toBeInTheDocument();
  });
});
