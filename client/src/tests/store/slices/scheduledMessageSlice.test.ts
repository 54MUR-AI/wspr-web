import { configureStore } from '@reduxjs/toolkit';
import scheduledMessageReducer, {
  addScheduledMessage,
  updateScheduledMessage,
  deleteScheduledMessage,
  setScheduledMessages,
} from '../../../store/slices/scheduledMessageSlice';

describe('scheduledMessageSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        scheduledMessages: scheduledMessageReducer,
      },
    });
  });

  it('should handle initial state', () => {
    expect(store.getState().scheduledMessages.items).toEqual([]);
    expect(store.getState().scheduledMessages.loading).toBeFalsy();
    expect(store.getState().scheduledMessages.error).toBeNull();
  });

  it('should handle adding a scheduled message', () => {
    const message = {
      id: '1',
      content: 'Test Message',
      scheduledTime: new Date().toISOString(),
      recurring: false,
      recipientId: 'user1',
    };

    store.dispatch(addScheduledMessage(message));

    expect(store.getState().scheduledMessages.items).toContainEqual(message);
  });

  it('should handle updating a scheduled message', () => {
    const message = {
      id: '1',
      content: 'Test Message',
      scheduledTime: new Date().toISOString(),
      recurring: false,
      recipientId: 'user1',
    };

    store.dispatch(addScheduledMessage(message));
    
    const updatedMessage = {
      ...message,
      content: 'Updated Message',
    };

    store.dispatch(updateScheduledMessage(updatedMessage));

    expect(store.getState().scheduledMessages.items[0].content).toBe('Updated Message');
  });

  it('should handle deleting a scheduled message', () => {
    const message = {
      id: '1',
      content: 'Test Message',
      scheduledTime: new Date().toISOString(),
      recurring: false,
      recipientId: 'user1',
    };

    store.dispatch(addScheduledMessage(message));
    store.dispatch(deleteScheduledMessage(message.id));

    expect(store.getState().scheduledMessages.items).toHaveLength(0);
  });

  it('should handle setting scheduled messages', () => {
    const messages = [
      {
        id: '1',
        content: 'Message 1',
        scheduledTime: new Date().toISOString(),
        recurring: false,
        recipientId: 'user1',
      },
      {
        id: '2',
        content: 'Message 2',
        scheduledTime: new Date().toISOString(),
        recurring: true,
        recurrencePattern: 'daily',
        recipientId: 'user2',
      },
    ];

    store.dispatch(setScheduledMessages(messages));

    expect(store.getState().scheduledMessages.items).toEqual(messages);
  });

  it('should handle recurring messages', () => {
    const recurringMessage = {
      id: '1',
      content: 'Recurring Message',
      scheduledTime: new Date().toISOString(),
      recurring: true,
      recurrencePattern: 'daily',
      recipientId: 'user1',
    };

    store.dispatch(addScheduledMessage(recurringMessage));

    const storedMessage = store.getState().scheduledMessages.items[0];
    expect(storedMessage.recurring).toBe(true);
    expect(storedMessage.recurrencePattern).toBe('daily');
  });
});
