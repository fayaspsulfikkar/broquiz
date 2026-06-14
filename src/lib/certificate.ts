// ============================================
// BroQuiz — PDF Certificate Generation Client
// ============================================

import jsPDF from 'jspdf';
import type { Certificate } from '@/types';

export async function generateCertificatePDF(cert: Certificate): Promise<void> {
  // Create a landscape A4 PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background and Border
  doc.setFillColor(250, 250, 252); // Off-white
  doc.rect(0, 0, width, height, 'F');
  
  // Double border
  doc.setDrawColor(210, 210, 215);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20, 'S');
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24, 'S');

  // Accent line
  doc.setFillColor(0, 113, 227); // iOS Blue
  doc.rect(10, 10, width - 20, 6, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(29, 29, 31);
  doc.text('Certificate of Completion', width / 2, 50, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(110, 110, 115);
  doc.text('This is to certify that', width / 2, 70, { align: 'center' });

  // Name
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(48);
  doc.setTextColor(29, 29, 31);
  doc.text(cert.user_name, width / 2, 100, { align: 'center' });

  // Divider
  doc.setDrawColor(210, 210, 215);
  doc.setLineWidth(1);
  doc.line(width / 2 - 60, 110, width / 2 + 60, 110);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(110, 110, 115);
  doc.text(`has successfully passed Level ${cert.level}`, width / 2, 130, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(29, 29, 31);
  doc.text(cert.level_name, width / 2, 145, { align: 'center' });

  // Score
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(110, 110, 115);
  doc.text(`with a score of ${cert.score} / 10`, width / 2, 160, { align: 'center' });

  // Footer Details
  doc.setFontSize(10);
  const dateStr = new Date(cert.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Date
  doc.text(`Date: ${dateStr}`, 30, 185);
  // Verification ID
  doc.text(`Verification ID: ${cert.verification_id}`, 30, 192);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  doc.text(`Verify at: ${origin}/verify/${cert.verification_id}`, 30, 199);

  // Signatures / Logos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CodIQ', width - 40, 185, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Scholarship Selection Platform', width - 40, 192, { align: 'center' });

  // Save PDF
  doc.save(`CodIQ_Certificate_Level_${cert.level}_${cert.user_name.replace(/\s+/g, '_')}.pdf`);
}
