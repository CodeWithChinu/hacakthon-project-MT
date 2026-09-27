/**
 * DOCX Pattern Evaluation Report Generator according to OIML R 76-2
 * Generates structured, editable Word document reports.
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { EvaluationReport } from '../types/metrology';

export async function generateOimlReportDocx(report: EvaluationReport): Promise<Blob> {
  const inst = report.instrument;

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'ORGANISATION INTERNATIONALE DE MÉTROLOGIE LÉGALE',
        bold: true,
        size: 26,
        color: '1E3A8A',
      }),
    ],
  });

  const subtitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'PATTERN EVALUATION REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENTS (OIML R 76-2)',
        bold: true,
        size: 20,
        color: '334155',
      }),
    ],
  });

  const divider = new Paragraph({
    text: '_________________________________________________________________________________',
    alignment: AlignmentType.CENTER,
  });

  const metaRows = [
    ['Report Number:', report.reportNumber, 'Application Number:', inst.applicationNumber],
    ['Pattern Designation:', inst.patternDesignation, 'Category:', inst.instrumentCategory],
    ['Manufacturer:', inst.manufacturer, 'Accuracy Class:', `Class ${inst.accuracyClass}`],
    ['Max Capacity:', `${inst.ranges.map((r) => r.max).join('/')} ${inst.units}`, 'Scale Interval (e):', `${inst.ranges.map((r) => r.e).join('/')} ${inst.units}`],
    ['Overall Result:', report.overallResult, 'Evaluation Standard:', report.ruleVersion.name],
  ];

  const tableRows = metaRows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, idx) =>
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      bold: idx % 2 === 0,
                      size: 18,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  // Summary Table of Tests 1 - 17
  const summaryHeader = new TableRow({
    children: ['Test #', 'Description (OIML Reference)', 'Compliance Result', 'Remarks'].map(
      (headerText, i) =>
        new TableCell({
          width: { size: i === 1 ? 50 : 20, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: headerText, bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        })
    ),
  });

  const testsSummaryData = [
    ['1', 'Weighing Performance (A.4.4)', report.test1?.overallResult || 'INCOMPLETE', report.test1?.remarks || ''],
    ['2', 'Temperature Effect on No-load (A.5.3.2)', report.test2?.overallResult || 'INCOMPLETE', report.test2?.remarks || ''],
    ['3', 'Eccentricity (A.4.7)', report.test3?.overallResult || 'INCOMPLETE', report.test3?.remarks || ''],
    ['4', 'Discrimination and Sensitivity (A.4.8)', report.test4?.overallResult || 'INCOMPLETE', report.test4?.remarks || ''],
    ['5', 'Repeatability (A.4.10)', report.test5?.overallResult || 'INCOMPLETE', report.test5?.remarks || ''],
    ['6', 'Time-Dependence: Zero Return & Creep (A.4.11)', report.test6?.overallResult || 'INCOMPLETE', report.test6?.remarks || ''],
    ['7', 'Stability of Equilibrium (A.4.12)', report.test7?.overallResult || 'INCOMPLETE', report.test7?.remarks || ''],
    ['8', 'Tilting (A.5.1, 2 and 3)', report.test8?.overallResult || 'INCOMPLETE', report.test8?.remarks || ''],
    ['9', 'Tare (Weighing Test) (A.4.6.1)', report.test9?.overallResult || 'INCOMPLETE', report.test9?.remarks || ''],
    ['10', 'Warm-Up Time (A.5.2)', report.test10?.overallResult || 'INCOMPLETE', report.test10?.remarks || ''],
    ['11', 'Variations of Voltage (A.5.4)', report.test11?.overallResult || 'INCOMPLETE', report.test11?.remarks || ''],
    ['12', 'Electrical Disturbances / EMC (B.3)', report.test12?.overallResult || 'INCOMPLETE', report.test12?.remarks || ''],
    ['13', 'Damp Heat, Steady State (B.2.2)', report.test13?.overallResult || 'INCOMPLETE', report.test13?.remarks || ''],
    ['14', 'Span Stability (B.4)', report.test14?.overallResult || 'INCOMPLETE', report.test14?.remarks || ''],
    ['15', 'Endurance (A.6)', report.test15?.overallResult || 'INCOMPLETE', report.test15?.remarks || ''],
    ['16', 'Examination of Construction (Clause 4 & 6)', report.test16?.overallResult || 'INCOMPLETE', report.test16?.remarks || ''],
    ['17', 'Complete Checklist (Clause 3, 4, 5, 7)', report.test17?.overallResult || 'INCOMPLETE', report.test17?.remarks || ''],
  ];

  const summaryRows = testsSummaryData.map(
    (row) =>
      new TableRow({
        children: row.map(
          (text, idx) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: idx === 0 || idx === 2,
                      color: idx === 2 && text === 'PASS' ? '15803D' : idx === 2 && text === 'FAIL' ? 'B91C1C' : '000000',
                      size: 16,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [summaryHeader, ...summaryRows],
  });

  const sigBlock = new Paragraph({
    children: [
      new TextRun({ text: '\nLEGAL METROLOGY VERIFICATION & SIGNATURE SPECIFICATION:\n', bold: true, size: 20 }),
      new TextRun({
        text: `Canonical SHA-256 Hash Digest: ${report.signature?.reportHashSha256 || 'Generated on export'}\n` +
          `Status: ${report.signature?.isSigned ? 'Digitally Sealed' : 'Pending Formal PKI Certification'}\n` +
          `Evaluating Observer: ${report.observerName}\n` +
          `Reviewing Officer: ${report.reviewerName || 'Unassigned'}\n` +
          `Evaluation Decision: ${report.reviewerDecision || 'APPROVED'} (${report.reviewerDecisionDate || 'Pending'})\n`,
        size: 16,
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          titleParagraph,
          subtitleParagraph,
          divider,
          new Paragraph({
            children: [
              new TextRun({ text: '\n1. GENERAL INFORMATION\n', bold: true, size: 22 }),
            ],
          }),
          metaTable,
          new Paragraph({
            children: [
              new TextRun({ text: '\n2. SUMMARY OF PATTERN EVALUATION TESTS 1 TO 17\n', bold: true, size: 22 }),
            ],
          }),
          summaryTable,
          sigBlock,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
