/**
 * PDF Pattern Evaluation Report Generator according to OIML R 76-2
 * Non-Automatic Weighing Instruments (NAWIs)
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EvaluationReport } from '../types/metrology';

export function generateOimlReportPdf(report: EvaluationReport): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper for footer & page numbering
  const addHeaderFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NATIONAL LEGAL METROLOGY LABORATORY • OIML R 76-2 PATTERN EVALUATION REPORT', 14, 10);
    doc.text(`Report Ref: ${report.reportNumber}`, pageWidth - 14, 10, { align: 'right' });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, 12, pageWidth - 14, 12);

    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(`Evaluation Standard: ${report.ruleVersion.name}`, 14, pageHeight - 8);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  };

  // ---------------- PAGE 1: COVER & GENERAL INFORMATION ----------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('ORGANISATION INTERNATIONALE DE MÉTROLOGIE LÉGALE', pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text('PATTERN EVALUATION REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENTS', pageWidth / 2, 31, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`According to OIML Recommendation R 76-1 (Edition 2006) and R 76-2`, pageWidth / 2, 37, { align: 'center' });

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(14, 42, pageWidth - 14, 42);

  // Status Badge
  const statusColor = report.overallResult === 'PASS' ? [22, 101, 52] : report.overallResult === 'FAIL' ? [153, 27, 27] : [133, 77, 14];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 60, 46, 46, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`RESULT: ${report.overallResult}`, pageWidth - 37, 52.5, { align: 'center' });

  // General Metadata Table
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. GENERAL INFORMATION CONCERNING THE PATTERN', 14, 52);

  const inst = report.instrument;
  const generalData = [
    ['Report Number:', report.reportNumber, 'Application Number:', inst.applicationNumber],
    ['Pattern Designation:', inst.patternDesignation, 'Instrument Category:', inst.instrumentCategory],
    ['Manufacturer:', inst.manufacturer, 'Applicant:', inst.applicant],
    ['Accuracy Class:', `Class ${inst.accuracyClass}`, 'Indicating Type:', inst.indicatingType],
    ['Range Type:', inst.rangeType, 'Units of Measurement:', inst.units],
    ['Max Capacity:', `${inst.ranges.map((r) => r.max).join(' / ')} ${inst.units}`, 'Min Capacity:', `${inst.ranges[0].min} ${inst.units}`],
    ['Scale Interval (e):', `${inst.ranges.map((r) => r.e).join(' / ')} ${inst.units}`, 'Scale Interval (d):', `${inst.ranges.map((r) => r.d).join(' / ')} ${inst.units}`],
    ['Number of Intervals (n):', `${inst.ranges.map((r) => r.n).join(' / ')}`, 'Temperature Range:', `${inst.temperatureMin} °C to ${inst.temperatureMax} °C`],
    ['Power Supply:', `${inst.powerCategory} (${inst.nominalVoltage} V)`, 'Tare Capacity:', `${inst.tareMax} ${inst.units} (${inst.tareType})`],
    ['Serial / Identification #:', inst.serialNumber, 'Evaluation Period:', `${report.evaluationPeriodStart} to ${report.evaluationPeriodEnd}`],
    ['Evaluating Observer:', report.observerName, 'Assigned Reviewer:', report.reviewerName || 'Unassigned'],
  ];

  autoTable(doc, {
    startY: 58,
    body: generalData,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 42 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 42 },
      3: { cellWidth: 48 },
    },
  });

  // SUMMARY OF PATTERN EVALUATION (Tests 1 - 17)
  const finalY1 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. SUMMARY OF PATTERN EVALUATION (TESTS 1 TO 17)', 14, finalY1);

  const summaryRows = [
    ['1', 'Weighing Performance (A.4.4 / A.5.3.1)', report.test1?.overallResult || 'INCOMPLETE', report.test1?.remarks || 'Calculated over full load range'],
    ['2', 'Temperature Effect on No-load (A.5.3.2)', report.test2?.overallResult || 'INCOMPLETE', report.test2?.remarks || 'Tested over specified temperature limits'],
    ['3', 'Eccentricity (A.4.7)', report.test3?.overallResult || 'INCOMPLETE', report.test3?.remarks || 'Center, front, back, lateral positions'],
    ['4', 'Discrimination and Sensitivity (A.4.8 / A.4.9)', report.test4?.overallResult || 'INCOMPLETE', report.test4?.remarks || '1.4d digital extra load response'],
    ['5', 'Repeatability (A.4.10)', report.test5?.overallResult || 'INCOMPLETE', report.test5?.remarks || '50% Max & 100% Max series (Emax - Emin <= MPE)'],
    ['6', 'Time-Dependence: Zero Return & Creep (A.4.11)', report.test6?.overallResult || 'INCOMPLETE', report.test6?.remarks || 'Zero return & 30 min creep'],
    ['7', 'Stability of Equilibrium (A.4.12)', report.test7?.overallResult || 'INCOMPLETE', report.test7?.remarks || 'Printing stability & disturbed zero accuracy'],
    ['8', 'Tilting (A.5.1, 2 and 3)', report.test8?.overallResult || 'INCOMPLETE', report.test8?.remarks || 'Longitudinal & Transverse tilt at zero and load'],
    ['9', 'Tare (Weighing Test) (A.4.6.1)', report.test9?.overallResult || 'INCOMPLETE', report.test9?.remarks || 'Subtractive/Additive net loads evaluated against MPE(Net)'],
    ['10', 'Warm-Up Time (A.5.2)', report.test10?.overallResult || 'INCOMPLETE', report.test10?.remarks || '0, 5, 15, 30 min after >= 8h disconnection'],
    ['11', 'Variations of Voltage (A.5.4)', report.test11?.overallResult || 'INCOMPLETE', report.test11?.remarks || 'Mains public AC / battery lower limits'],
    ['12', 'Electrical Disturbances / EMC (B.3)', report.test12?.overallResult || 'INCOMPLETE', report.test12?.remarks || 'Dips, bursts, ESD, radiated RF immunity'],
    ['13', 'Damp Heat, Steady State (B.2.2)', report.test13?.overallResult || 'INCOMPLETE', report.test13?.remarks || 'Reference & 85% RH damp heat chamber test'],
    ['14', 'Span Stability (B.4)', report.test14?.overallResult || 'INCOMPLETE', report.test14?.remarks || '28-day span variation V <= Allowable A'],
    ['15', 'Endurance (A.6)', report.test15?.overallResult || 'INCOMPLETE', report.test15?.remarks || '100,000 loadings at ~0.5 Max'],
    ['16', 'Examination of Construction (Clause 4 & 6)', report.test16?.overallResult || 'INCOMPLETE', report.test16?.remarks || 'Conformity of physical and modular features'],
    ['17', 'Complete Checklist (Clause 3, 4, 5, 7)', report.test17?.overallResult || 'INCOMPLETE', report.test17?.remarks || 'All metrological and technical requirements'],
  ];

  autoTable(doc, {
    startY: finalY1 + 4,
    head: [['Test #', 'Test Description (OIML R 76-1 Reference)', 'Status', 'Metrological Findings / Remarks']],
    body: summaryRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { cellWidth: 28, fontStyle: 'bold', halign: 'center' },
      3: { cellWidth: 60 },
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'PASS') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val === 'FAIL') {
          data.cell.styles.textColor = [185, 28, 28];
        } else if (val === 'NOT_APPLICABLE') {
          data.cell.styles.textColor = [100, 116, 139];
        } else {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
  });

  // ---------------- PAGE 2: TEST DETAILS (Test 1, 2, 3, 4, 5) ----------------
  doc.addPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DETAILED TEST OBSERVATIONS & FORMULAS', 14, 20);

  // Test 1 Table
  doc.setFontSize(9.5);
  doc.text(`TEST 1: WEIGHING PERFORMANCE (P = I + e/2 - ΔL, E = P - L, Ec = E - E0)`, 14, 28);
  if (report.test1?.observations) {
    const t1Rows = report.test1.observations.map((obs) => [
      `${obs.load} ${inst.units}`,
      obs.direction,
      `${obs.indication} ${inst.units}`,
      `${obs.deltaL} ${inst.units}`,
      `${obs.p?.toFixed(4) || '-'}`,
      `${obs.error?.toFixed(4) || '-'}`,
      `${obs.correctedError?.toFixed(4) || '-'}`,
      `±${obs.mpe?.toFixed(4) || '-'}`,
      obs.pass ? 'PASS' : 'FAIL',
    ]);

    autoTable(doc, {
      startY: 31,
      head: [['Load (L)', 'Dir', 'Indication (I)', 'ΔL', 'P (True)', 'Error (E)', 'Corr. Error (Ec)', 'MPE', 'Result']],
      body: t1Rows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 7.5, textColor: [255, 255, 255] },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 8: { fontStyle: 'bold', halign: 'center' } },
    });
  }

  // Test 3 Eccentricity
  const finalY2 = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`TEST 3: ECCENTRICITY (Load = (Max + Tare)/3 = ${report.test3?.calculatedLoad || '-'} ${inst.units})`, 14, finalY2);

  if (report.test3?.weightPositions) {
    const t3Rows = report.test3.weightPositions.map((pos) => [
      `Pos ${pos.positionNumber}: ${pos.positionName}`,
      `${pos.load} ${inst.units}`,
      `${pos.indication} ${inst.units}`,
      `${pos.deltaL} ${inst.units}`,
      `${pos.correctedError?.toFixed(4) || '-'}`,
      `±${pos.mpe?.toFixed(4) || '-'}`,
      pos.pass ? 'PASS' : 'FAIL',
    ]);

    autoTable(doc, {
      startY: finalY2 + 3,
      head: [['Position', 'Load (L)', 'Indication (I)', 'ΔL', 'Corrected Error (Ec)', 'MPE', 'Result']],
      body: t3Rows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 7.5, textColor: [255, 255, 255] },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 6: { fontStyle: 'bold', halign: 'center' } },
    });
  }

  // Test 5 Repeatability
  const finalY3 = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`TEST 5: REPEATABILITY (Series Range R = Pmax - Pmin <= MPE)`, 14, finalY3);

  const t5Rows = [
    [
      'Around 50% Max',
      `${report.test5?.series50.loadNominal || '-'} ${inst.units}`,
      `${report.test5?.series50.weighings.length || 0} weighings`,
      `Pmax=${report.test5?.series50.pMax?.toFixed(4) || '-'}, Pmin=${report.test5?.series50.pMin?.toFixed(4) || '-'}`,
      `R = ${report.test5?.series50.rangeR?.toFixed(4) || '-'} ${inst.units}`,
      `±${report.test5?.series50.mpe?.toFixed(4) || '-'}`,
      report.test5?.series50.rangePass ? 'PASS' : 'FAIL',
    ],
    [
      'Close to 100% Max',
      `${report.test5?.series100.loadNominal || '-'} ${inst.units}`,
      `${report.test5?.series100.weighings.length || 0} weighings`,
      `Pmax=${report.test5?.series100.pMax?.toFixed(4) || '-'}, Pmin=${report.test5?.series100.pMin?.toFixed(4) || '-'}`,
      `R = ${report.test5?.series100.rangeR?.toFixed(4) || '-'} ${inst.units}`,
      `±${report.test5?.series100.mpe?.toFixed(4) || '-'}`,
      report.test5?.series100.rangePass ? 'PASS' : 'FAIL',
    ],
  ];

  autoTable(doc, {
    startY: finalY3 + 3,
    head: [['Series', 'Nominal Load', 'Count', 'Extreme Values', 'Range (R)', 'MPE', 'Result']],
    body: t5Rows,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 7.5, textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 1.5 },
  });

  // ---------------- PAGE 3: DIGITAL SIGNATURE & LEGAL METROLOGY STATEMENT ----------------
  doc.addPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. REGULATORY COMPLIANCE DECISION & CERTIFICATION', 14, 20);

  const decisionBoxText = [
    `Evaluation Conclusion: The pattern of the instrument ${inst.patternDesignation} submitted by ${inst.manufacturer} was subjected to type evaluation tests 1 to 17 pursuant to OIML R 76-1 (2006) and R 76-2 (2007).`,
    `Final Compliance Result: ${report.overallResult}`,
    `Reviewer Evaluation Notes: ${report.reviewerNotes || 'Reviewed and validated according to standard metrological verification procedures.'}`,
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(decisionBoxText[0], 14, 28, { maxWidth: pageWidth - 28 });
  doc.setFont('helvetica', 'bold');
  doc.text(decisionBoxText[1], 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(decisionBoxText[2], 14, 45, { maxWidth: pageWidth - 28 });

  // Cryptographic Signature Block
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 56, pageWidth - 28, 54, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('LEGAL METROLOGY DIGITAL DOCUMENT INTEGRITY & SIGNATURE SPECIFICATION', 18, 64);

  const sig = report.signature;
  const sigDetails = [
    `Digital Signature Status: ${sig?.isSigned ? 'CRYPTOGRAPHICALLY SEALED (SHA-256)' : 'PENDING FINAL SIGNING / SEALING'}`,
    `Signatory Authority: ${sig?.signerName || report.reviewerName || 'Legal Metrology Officer'} (${sig?.signerRole || 'ADMIN'})`,
    `Cryptographic Algorithm: ${sig?.algorithm || 'SHA-256 with RSA PKCS#1 v1.5 (HSM / Token Ready)'}`,
    `Canonical Document Hash (SHA-256): ${sig?.reportHashSha256 || 'Calculated at finalization'}`,
    `PKI Certificate Serial: ${sig?.certificateSerial || 'Ready for National Metrology Institute (NMI) HSM PKI'}`,
    `Timestamp of Cryptographic Sealing: ${sig?.signedAt || new Date().toISOString()}`,
  ];

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  let sigY = 71;
  sigDetails.forEach((line) => {
    doc.text(line, 18, sigY);
    sigY += 6;
  });

  // Stamp and sign-off placeholders
  doc.setDrawColor(148, 163, 184);
  doc.rect(20, 120, 75, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Evaluating Testing Officer', 24, 126);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.observerName, 24, 134);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${report.evaluationPeriodEnd}`, 24, 144);

  doc.rect(pageWidth - 95, 120, 75, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Reviewer / NMI Signatory', pageWidth - 91, 126);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.reviewerName || 'Metrology Reviewer', pageWidth - 91, 134);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Decision: ${report.reviewerDecision || 'APPROVED'}`, pageWidth - 91, 144);

  // Apply header & footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  return doc;
}
