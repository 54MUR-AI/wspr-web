import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateState {
  templates: Template[];
  loading: boolean;
  error: string | null;
}

const initialState: TemplateState = {
  templates: [],
  loading: false,
  error: null,
};

export const fetchTemplates = createAsyncThunk(
  "templates/fetchAll",
  async () => {
    const response = await api.get("/templates");
    return response.data;
  }
);

export const createTemplate = createAsyncThunk(
  "templates/create",
  async (templateData: Partial<Template>) => {
    const response = await api.post("/templates", templateData);
    return response.data;
  }
);

export const updateTemplate = createAsyncThunk(
  "templates/update",
  async ({ id, templateData }: { id: string; templateData: Partial<Template> }) => {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  }
);

export const deleteTemplate = createAsyncThunk(
  "templates/delete",
  async (id: string) => {
    await api.delete(`/templates/${id}`);
    return id;
  }
);

const templateSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create template
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
      })
      // Update template
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex((template) => template.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      // Delete template
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((template) => template.id !== action.payload);
      });
  },
});

export default templateSlice.reducer;
