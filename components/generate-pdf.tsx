import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from './ui/button';

interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  title?: string;
}

export const generatePDF = async ({ 
  elementId, 
  filename, 
  title 
}: GeneratePDFOptions) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate width and height
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add title if provided
    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, imgWidth / 2, 15, { align: 'center' });
    }

    // Add image to PDF
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      0, 
      title ? 20 : 0, 
      imgWidth, 
      imgHeight
    );

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
  }
};

// Example usage in a React component
export const DownloadButton = ({ 
  elementId, 
  filename, 
  title 
}: GeneratePDFOptions) => {
  const handleDownload = () => {
    generatePDF({ elementId, filename, title });
  };

  return (
    <Button onClick={handleDownload} variant="outline">
      Download PDF
    </Button>
  );
};