import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import debounce from 'lodash/debounce';
import { mediaService } from '../../services/media.service';

interface MediaSearchProps {
  onSearch: (results: any[]) => void;
  onError?: (error: Error) => void;
}

const MEDIA_TYPES = [
  { value: 'all', label: 'All Types', icon: <SearchIcon /> },
  { value: 'image', label: 'Images', icon: <ImageIcon /> },
  { value: 'video', label: 'Videos', icon: <VideoIcon /> },
  { value: 'document', label: 'Documents', icon: <DocumentIcon /> },
  { value: 'audio', label: 'Audio', icon: <AudioIcon /> },
];

const MediaSearch: React.FC<MediaSearchProps> = ({ onSearch, onError }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string, type: string, filters: string[]) => {
      if (!term && type === 'all' && filters.length === 0) {
        onSearch([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await mediaService.searchMedia({
          term,
          type: type === 'all' ? undefined : type,
          filters,
        });
        onSearch(results);
      } catch (error) {
        console.error('Search error:', error);
        onError?.(error as Error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [onSearch, onError]
  );

  useEffect(() => {
    debouncedSearch(searchTerm, selectedType, activeFilters);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, selectedType, activeFilters, debouncedSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedType('all');
    setActiveFilters([]);
  };

  const handleAddFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end" size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              onChange={handleTypeChange}
              label="Type"
              size="medium"
            >
              {MEDIA_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {type.icon}
                    <Typography>{type.label}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {activeFilters.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {activeFilters.map((filter) => (
              <Chip
                key={filter}
                label={filter}
                onDelete={() => handleRemoveFilter(filter)}
                size="small"
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MediaSearch;
