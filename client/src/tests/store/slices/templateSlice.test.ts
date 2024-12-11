import { configureStore } from '@reduxjs/toolkit';
import templateReducer, {
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setTemplates,
} from '../../../store/slices/templateSlice';

describe('templateSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        templates: templateReducer,
      },
    });
  });

  it('should handle initial state', () => {
    expect(store.getState().templates.items).toEqual([]);
    expect(store.getState().templates.loading).toBeFalsy();
    expect(store.getState().templates.error).toBeNull();
  });

  it('should handle adding a template', () => {
    const template = {
      id: '1',
      title: 'Test Template',
      content: 'Test Content',
      category: 'Test',
      tags: ['test'],
    };

    store.dispatch(addTemplate(template));

    expect(store.getState().templates.items).toContainEqual(template);
  });

  it('should handle updating a template', () => {
    const template = {
      id: '1',
      title: 'Test Template',
      content: 'Test Content',
      category: 'Test',
      tags: ['test'],
    };

    store.dispatch(addTemplate(template));
    
    const updatedTemplate = {
      ...template,
      title: 'Updated Template',
    };

    store.dispatch(updateTemplate(updatedTemplate));

    expect(store.getState().templates.items[0].title).toBe('Updated Template');
  });

  it('should handle deleting a template', () => {
    const template = {
      id: '1',
      title: 'Test Template',
      content: 'Test Content',
      category: 'Test',
      tags: ['test'],
    };

    store.dispatch(addTemplate(template));
    store.dispatch(deleteTemplate(template.id));

    expect(store.getState().templates.items).toHaveLength(0);
  });

  it('should handle setting templates', () => {
    const templates = [
      {
        id: '1',
        title: 'Template 1',
        content: 'Content 1',
        category: 'Test',
        tags: ['test'],
      },
      {
        id: '2',
        title: 'Template 2',
        content: 'Content 2',
        category: 'Test',
        tags: ['test'],
      },
    ];

    store.dispatch(setTemplates(templates));

    expect(store.getState().templates.items).toEqual(templates);
  });
});
