import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Box,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { RootState } from '@/store';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/store/slices/templateSlice';

interface MessageTemplatesProps {
  open: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const dispatch = useDispatch();
  const { templates, loading, error } = useSelector(
    (state: RootState) => state.templates
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      dispatch(fetchTemplates());
    }
  }, [dispatch, open]);

  const handleEdit = (template: any) => {
    setEditMode(template.id);
    setEditContent(template.content);
    setEditName(template.name);
    setEditTags(template.tags);
  };

  const handleSave = async () => {
    if (editMode) {
      await dispatch(
        updateTemplate({
          id: editMode,
          template: {
            content: editContent,
            name: editName,
            tags: editTags,
          },
        })
      );
    } else {
      await dispatch(
        createTemplate({
          content: editContent,
          name: editName,
          tags: editTags,
        })
      );
    }
    setEditMode(null);
    setEditContent('');
    setEditName('');
    setEditTags([]);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteTemplate(id));
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Message Templates</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <List>
              {filteredTemplates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  onClick={() => onSelect(template.content)}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          {template.content}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {template.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{ mr: 0.5 }}
                            />
                          ))}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEdit(template)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(template.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Button
              startIcon={<AddIcon />}
              onClick={() => setEditMode('new')}
              sx={{ mt: 2 }}
            >
              Create New Template
            </Button>
          </>
        )}

        {editMode && (
          <Dialog open={!!editMode} onClose={() => setEditMode(null)}>
            <DialogTitle>
              {editMode === 'new' ? 'Create Template' : 'Edit Template'}
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Template Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
              />
              <TextField
                fullWidth
                label="Template Content"
                multiline
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={editTags.join(', ')}
                onChange={(e) =>
                  setEditTags(
                    e.target.value.split(',').map((tag) => tag.trim())
                  )
                }
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditMode(null)}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageTemplates;
