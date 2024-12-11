import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ScheduledMessages from '../../../components/Chat/ScheduledMessages';
import scheduledMessageReducer from '../../../store/slices/scheduledMessageSlice';

const mockStore = configureStore({
  reducer: {
    scheduledMessages: scheduledMessageReducer,
  },
});

describe('ScheduledMessages', () => {
  it('renders scheduled messages list', () => {
    render(
      <Provider store={mockStore}>
        <ScheduledMessages />
      </Provider>
    );
    
    expect(screen.getByText(/Scheduled Messages/i)).toBeInTheDocument();
  });

  it('opens schedule message dialog', () => {
    render(
      <Provider store={mockStore}>
        <ScheduledMessages />
      </Provider>
    );
    
    const scheduleButton = screen.getByRole('button', { name: /schedule message/i });
    fireEvent.click(scheduleButton);
    
    expect(screen.getByText(/Schedule Message/i)).toBeInTheDocument();
  });

  it('shows recurring options when recurring is selected', () => {
    render(
      <Provider store={mockStore}>
        <ScheduledMessages />
      </Provider>
    );
    
    const scheduleButton = screen.getByRole('button', { name: /schedule message/i });
    fireEvent.click(scheduleButton);
    
    const recurringCheckbox = screen.getByRole('checkbox', { name: /recurring/i });
    fireEvent.click(recurringCheckbox);
    
    expect(screen.getByText(/Recurrence Pattern/i)).toBeInTheDocument();
  });
});
