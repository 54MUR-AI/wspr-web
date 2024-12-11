const { parentPort, workerData } = require('worker_threads');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs').promises;
const path = require('path');
const { calculateStatistics } = require('../utils/statistics');
const { decryptMetricData } = require('../utils/encryption');

// Memory optimization - Garbage collection threshold in MB
const GC_THRESHOLD = 100;
let memoryUsage = 0;

// Worker for generating reports asynchronously
async function generateReport() {
  const { format, data, tempDir, reportConfig } = workerData;
  
  try {
    // Check and create temp directory if it doesn't exist
    await ensureTempDir(tempDir);
    
    // Decrypt metric data if encrypted
    const decryptedData = await Promise.all(data.map(async item => {
      const result = item.encrypted ? await decryptMetricData(item) : item;
      
      // Track memory usage
      memoryUsage += JSON.stringify(result).length / 1024 / 1024;
      if (memoryUsage > GC_THRESHOLD) {
        global.gc && global.gc();
        memoryUsage = 0;
      }
      
      return result;
    }));
    
    // Process data and calculate statistics with progress tracking
    const processedData = decryptedData.map((metricSet, index) => {
      // Report progress
      if (index % 10 === 0) {
        parentPort.postMessage({ 
          type: 'progress',
          progress: Math.round((index / decryptedData.length) * 100)
        });
      }

      const values = metricSet.values.map(v => v.value);
      return {
        category: metricSet.category,
        metric: metricSet.metric,
        ...calculateStatistics(values),
        unit: metricSet.unit,
        timestamp: reportConfig.timestamp
      };
    });

    let result;
    switch (format) {
      case 'pdf':
        result = await generatePDFReport(processedData, tempDir, reportConfig);
        break;
      case 'csv':
        result = await generateCSVReport(processedData, tempDir, reportConfig);
        break;
      case 'json':
        result = { 
          data: processedData,
          metadata: {
            generatedAt: new Date().toISOString(),
            reportTitle: reportConfig.title,
            metricsCount: processedData.length
          }
        };
        break;
      default:
        throw new Error('Unsupported format');
    }

    parentPort.postMessage({ success: true, result });
  } catch (error) {
    console.error('Report generation error:', error);
    parentPort.postMessage({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function ensureTempDir(tempDir) {
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

async function generatePDFReport(data, tempDir, config) {
  const tempFile = path.join(tempDir, `report-${Date.now()}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(tempFile);
  
  return new Promise((resolve, reject) => {
    stream.on('finish', async () => {
      try {
        const fileContent = await fs.readFile(tempFile);
        await fs.unlink(tempFile);
        resolve({ 
          file: fileContent, 
          filename: `performance-report-${config.timestamp}.pdf`,
          metadata: {
            generatedAt: new Date().toISOString(),
            fileSize: fileContent.length,
            format: 'pdf'
          }
        });
      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', reject);
    
    // Generate PDF content
    doc.pipe(stream);
    
    // Add header with styling
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .text(config.title || 'Performance Report', { align: 'center' });
    doc.moveDown();
    
    // Add timestamp and metadata
    doc.font('Helvetica')
       .fontSize(12)
       .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' })
       .text(`Total Metrics: ${data.length}`, { align: 'right' });
    doc.moveDown();
    
    // Add table headers with improved styling
    const headers = ['Category', 'Metric', 'Min', 'Max', 'Avg', '95th %', '99th %', 'Unit'];
    let yPosition = 150;
    const columnWidth = 70;
    
    // Draw header background
    doc.rect(45, yPosition - 5, columnWidth * headers.length + 10, 25)
       .fill('#f0f0f0');
    
    // Draw headers
    doc.font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.fillColor('black')
         .text(header, 50 + (i * columnWidth), yPosition);
    });
    
    yPosition += 20;
    
    // Add table data with alternating row colors
    doc.font('Helvetica');
    data.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.rect(45, yPosition - 5, columnWidth * headers.length + 10, 20)
           .fill('#f9f9f9');
      }
      
      doc.fillColor('black')
         .text(row.category, 50, yPosition)
         .text(row.metric, 50 + columnWidth, yPosition)
         .text(row.min.toFixed(2), 50 + (2 * columnWidth), yPosition)
         .text(row.max.toFixed(2), 50 + (3 * columnWidth), yPosition)
         .text(row.avg.toFixed(2), 50 + (4 * columnWidth), yPosition)
         .text(row.p95.toFixed(2), 50 + (5 * columnWidth), yPosition)
         .text(row.p99.toFixed(2), 50 + (6 * columnWidth), yPosition)
         .text(row.unit, 50 + (7 * columnWidth), yPosition);
      
      yPosition += 20;
      
      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });
    
    doc.end();
  });
}

async function generateCSVReport(data, tempDir, config) {
  const tempFile = path.join(tempDir, `report-${Date.now()}.csv`);
  
  const csvWriter = createObjectCsvWriter({
    path: tempFile,
    header: [
      { id: 'category', title: 'Category' },
      { id: 'metric', title: 'Metric' },
      { id: 'min', title: 'Min' },
      { id: 'max', title: 'Max' },
      { id: 'avg', title: 'Avg' },
      { id: 'p95', title: 'P95' },
      { id: 'p99', title: 'P99' },
      { id: 'unit', title: 'Unit' },
      { id: 'timestamp', title: 'Timestamp' }
    ]
  });
  
  await csvWriter.writeRecords(data);
  
  const fileContent = await fs.readFile(tempFile);
  await fs.unlink(tempFile);
  
  return {
    file: fileContent,
    filename: `performance-report-${config.timestamp}.csv`,
    metadata: {
      generatedAt: new Date().toISOString(),
      fileSize: fileContent.length,
      format: 'csv',
      recordCount: data.length
    }
  };
}

// Start processing
generateReport();
