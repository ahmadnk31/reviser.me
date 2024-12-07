import jsPDF from 'jspdf';
import { Button } from './ui/button';

interface PDFGenerationOptions {
  content: string;
  filename: string;
  title?: string;
}

export const generateTextPDF = ({ 
  content, 
  filename, 
  title 
}: PDFGenerationOptions) => {
  // Create a new jsPDF instance
  const doc = new jsPDF();

  // Set font styles
  doc.setFontSize(12);
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
  }

  // Set starting Y position
  const startY = title ? 30 : 20;

  // Split text into lines that fit the page width
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - (2 * margin);

  const splitText = doc.splitTextToSize(content, maxLineWidth);

  // Add text to PDF
  doc.text(splitText, margin, startY);

  // Save the PDF
  doc.save(filename);
};

// React component for download button
export const TextDownloadButton = ({ 
  content, 
  filename, 
  title 
}: PDFGenerationOptions) => {
  const handleDownload = () => {
    generateTextPDF({ content, filename, title });
  };

  return (
    <Button onClick={handleDownload} variant="outline">
      Download Text PDF
    </Button>
  );
};