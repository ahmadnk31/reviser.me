// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  explanation?: string;
}

export const generateQuestionsPDF = async (questions: Question[], documentId: string) => {
  try {
    console.log('Starting PDF generation...', { questions });
    
    // Initialize PDF with default font
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add default font
    doc.setFont('helvetica');
    
    // Set initial y position
    let yPosition = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.text('Generated Questions', 20, yPosition);
    yPosition += 15;

    // Set font size for questions
    doc.setFontSize(12);

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Processing question ${i + 1}...`);

      // Check for page overflow
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Question number
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${i + 1}:`, 20, yPosition);
      yPosition += 7;

      // Question text
      doc.setFont('helvetica', 'normal');
      const splitQuestion = doc.splitTextToSize(question.question, 170);
      doc.text(splitQuestion, 20, yPosition);
      yPosition += splitQuestion.length * 7;

      // Options (if any)
      if (question.options && question.options.length > 0) {
        yPosition += 5;
        question.options.forEach((option, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          const optionLetter = String.fromCharCode(65 + index);
          const optionText = `${optionLetter}) ${option}`;
          const splitOption = doc.splitTextToSize(optionText, 160);
          doc.text(splitOption, 25, yPosition);
          yPosition += splitOption.length * 7;
        });
      }

      // Correct Answer
      yPosition += 5;
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Correct Answer:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const splitAnswer = doc.splitTextToSize(question.correctAnswer, 160);
      doc.text(splitAnswer, 25, yPosition + 7);
      yPosition += splitAnswer.length * 7 + 10;

      // Add spacing between questions
      yPosition += 10;
    }

    console.log('PDF generation completed');

    // Generate blob
    const pdfBlob = doc.output('blob');
    console.log('PDF blob created');

    // Generate filename
    const timestamp = new Date().getTime();
    const filename = `questions_${documentId}_${timestamp}.pdf`;

    // Upload to Supabase
    const supabase = createClient();
    console.log('Uploading to Supabase...');

    const { data, error } = await supabase.storage
      .from('quiz-pdfs')
      .upload(filename, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quiz-pdfs/${filename}`;
    try{
      await supabase.from('questions_pdf').insert({url:fullUrl, document_id:documentId});
    }catch(e){
      console.log(e);
    }
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('quiz-pdfs')
      .getPublicUrl(filename);

    console.log('Generated public URL:', publicUrl);

    return { url: publicUrl, filename,fullUrl };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};