import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  url: string;
  fileType: string;
  fileName: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url, fileType, fileName }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [url]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading document:', error);
    setError('Failed to load document');
    setLoading(false);
  };

  const renderTextPreview = async () => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return (
        <Box
          component="pre"
          sx={{
            p: 2,
            maxHeight: '60vh',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            bgcolor: 'background.paper',
          }}
        >
          {text}
        </Box>
      );
    } catch (error) {
      setError('Failed to load text file');
      return null;
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <Box sx={{ maxHeight: '80vh', overflow: 'auto' }}>
            <Document
              file={url}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                scale={1.2}
              />
            </Document>
            {numPages && (
              <Typography textAlign="center" mt={1}>
                Page {pageNumber} of {numPages}
              </Typography>
            )}
          </Box>
        );

      case 'txt':
      case 'json':
      case 'md':
      case 'csv':
        return renderTextPreview();

      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return (
          <Box
            component="iframe"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            sx={{
              width: '100%',
              height: '80vh',
              border: 'none',
            }}
          />
        );

      default:
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Preview not available for this file type</Typography>
          </Box>
        );
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box p={2}>
        <Typography variant="subtitle1" gutterBottom>
          {fileName}
        </Typography>
        {renderPreview()}
      </Box>
    </Paper>
  );
};

export default DocumentPreview;
