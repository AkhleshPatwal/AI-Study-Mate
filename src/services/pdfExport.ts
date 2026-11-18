import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StudyPack } from '../types/study';

export interface PdfExportProgress {
  status: 'preparing' | 'capturing' | 'generating' | 'done' | 'error';
  message: string;
  progressPercent: number;
}

export interface ExportSectionsSelection {
  includeCover: boolean;
  includeSummary: boolean;
  includeDefinitions: boolean;
  includeConcepts: boolean;
  includeNotes: boolean;
  includeQuiz: boolean;
  includeExamTopics: boolean;
}

/**
 * Capture an existing HTML element on the page and export it to a paginated PDF
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: {
    title?: string;
    onProgress?: (progress: PdfExportProgress) => void;
  }
): Promise<void> {
  const onProgress = options?.onProgress || (() => {});

  try {
    onProgress({
      status: 'preparing',
      message: 'Preparing document for high-resolution render...',
      progressPercent: 15,
    });

    // Temporarily ensure element styles are printable (clean background, no hidden overflow)
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    onProgress({
      status: 'capturing',
      message: 'Rendering document canvas (scale 2x for sharp print)...',
      progressPercent: 45,
    });

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp printing
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    element.style.boxShadow = originalShadow;

    onProgress({
      status: 'generating',
      message: 'Compiling paginated PDF document...',
      progressPercent: 75,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210; // A4 width mm
    const pageHeight = 297; // A4 height mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let page = 1;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin * 2);

    // Multi-page loop if content exceeds 1 page
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);
      page++;
    }

    // Add running footer page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      if (options?.title) {
        pdf.text(`AI StudyMate • ${options.title}`, margin, pageHeight - 5);
      }
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5);
    }

    onProgress({
      status: 'done',
      message: 'Download complete!',
      progressPercent: 100,
    });

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
  } catch (error: any) {
    onProgress({
      status: 'error',
      message: error?.message || 'Failed to generate PDF document.',
      progressPercent: 0,
    });
    throw error;
  }
}

/**
 * Builds a dedicated, beautifully formatted printable HTML study pack booklet
 * and compiles it directly into a multi-page PDF using html2canvas & jsPDF.
 */
export async function exportStudyPackBookletToPdf(
  pack: StudyPack,
  sections: ExportSectionsSelection,
  onProgress?: (progress: PdfExportProgress) => void
): Promise<void> {
  const updateProgress = onProgress || (() => {});

  updateProgress({
    status: 'preparing',
    message: 'Compiling selected study modules into print layout...',
    progressPercent: 20,
  });

  // Create temporary container offscreen
  const container = document.createElement('div');
  container.id = 'temp-pdf-export-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px'; // fixed desktop page width for consistent typography
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  container.style.padding = '40px 48px';
  container.style.boxSizing = 'border-box';
  container.style.lineHeight = '1.6';

  let html = '';

  // 1. Cover / Title Header
  if (sections.includeCover) {
    html += `
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #4f46e5; background-color: #e0e7ff; padding: 4px 10px; rounded-radius: 6px;">
            ${pack.subject || 'Academic Curriculum'}
          </span>
          <span style="font-size: 11px; color: #64748b;">
            Generated: ${new Date(pack.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px;">
          ${pack.title}
        </h1>
        <p style="font-size: 13px; color: #475569; margin: 0;">
          AI StudyMate Comprehensive Revision Package • Exam Prep Notes, Definitions & Concept Guide
        </p>
      </div>
    `;
  }

  // 2. Summary Section
  if (sections.includeSummary && pack.summary) {
    html += `
      <div style="margin-bottom: 36px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          1. High-Yield Revision Summary
        </h2>
        
        ${
          pack.summary.quickRevision && pack.summary.quickRevision.length > 0
            ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 8px;">
              Key Takeaways (Top 10 Exam Points)
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155;">
              ${pack.summary.quickRevision.map((pt) => `<li style="margin-bottom: 6px;">${pt}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        ${
          pack.summary.examNotes
            ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
              Formal Exam Notes
            </h3>
            <p style="font-size: 12px; color: #334155; white-space: pre-line; line-height: 1.6; margin: 0;">
              ${pack.summary.examNotes}
            </p>
          </div>
        `
            : ''
        }

        ${
          pack.summary.easyLanguageVersion
            ? `
          <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px; margin-top: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #854d0e; text-transform: uppercase; margin-bottom: 4px;">
              Intuitive Student Analogy (Easy Language)
            </div>
            <p style="font-size: 12px; color: #713f12; margin: 0; white-space: pre-line;">
              ${pack.summary.easyLanguageVersion}
            </p>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  // 3. Definitions Section
  if (sections.includeDefinitions && pack.definitions && pack.definitions.length > 0) {
    html += `
      <div style="margin-bottom: 36px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          2. Important Academic Definitions
        </h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          ${pack.definitions
            .map(
              (d) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background-color: #ffffff;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 14px; font-weight: 700; color: #0f172a;">${d.term}</span>
                ${
                  d.category
                    ? `<span style="font-size: 10px; font-weight: 600; color: #4338ca; background-color: #e0e7ff; padding: 2px 6px; border-radius: 4px;">${d.category}</span>`
                    : ''
                }
              </div>
              <p style="font-size: 12px; color: #334155; margin: 0 0 6px 0;">
                <strong style="color: #475569;">Definition:</strong> ${d.definition}
              </p>
              ${
                d.example
                  ? `<div style="font-size: 11px; color: #64748b; background-color: #f8fafc; padding: 6px 10px; border-radius: 6px;">${d.example}</div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // 4. Concepts Section
  if (sections.includeConcepts && pack.concepts && pack.concepts.length > 0) {
    html += `
      <div style="margin-bottom: 36px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          3. Core Conceptual Frameworks
        </h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
          ${pack.concepts
            .map(
              (c) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background-color: #ffffff;">
              <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">${c.concept}</h3>
              <p style="font-size: 12px; color: #334155; margin: 0 0 6px 0;">${c.simpleExplanation}</p>
              ${
                c.example
                  ? `<p style="font-size: 11px; color: #475569; margin: 0 0 6px 0;"><strong style="color: #0f172a;">Case Example:</strong> ${c.example}</p>`
                  : ''
              }
              ${
                c.whyItMatters
                  ? `<p style="font-size: 11px; color: #64748b; margin: 0;"><strong style="color: #4338ca;">Why It Matters:</strong> ${c.whyItMatters}</p>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // 5. Handwritten Notes Section
  if (sections.includeNotes && pack.handwrittenNotes && pack.handwrittenNotes.length > 0) {
    html += `
      <div style="margin-bottom: 36px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          4. Student Revision Notes
        </h2>
        <div style="background-color: #fffdf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; font-family: 'Kalam', 'Caveat', cursive, sans-serif;">
          ${pack.handwrittenNotes
            .map(
              (note, i) => `
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #1e3a8a; margin: 0 0 4px 0;">
                ${i + 1}. ${note.heading}
              </h3>
              ${
                note.subheading
                  ? `<div style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 8px;">${note.subheading}</div>`
                  : ''
              }
              <div style="font-size: 15px; color: #1e293b; white-space: pre-line; line-height: 1.8; margin-bottom: 10px;">
                ${note.content}
              </div>
              ${
                note.examTip
                  ? `<div style="font-family: sans-serif; font-size: 11px; background-color: #fef3c7; color: #92400e; padding: 8px 12px; border-left: 3px solid #f59e0b; border-radius: 4px; margin-top: 8px;">
                      <strong>Exam Tip:</strong> ${note.examTip}
                    </div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // 6. Quizzes & Exam Questions
  if (sections.includeQuiz && pack.quiz && pack.quiz.length > 0) {
    html += `
      <div style="margin-bottom: 36px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          5. Practice Quizzes & Exam Drill Questions
        </h2>
        <div style="space-y: 12px;">
          ${pack.quiz
            .map(
              (q, i) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; background-color: #ffffff;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                Q${i + 1}. ${q.question}
              </div>
              ${
                q.options && q.options.length > 0
                  ? `<div style="font-size: 11px; color: #475569; margin-bottom: 6px; padding-left: 10px;">
                      ${q.options.map((opt) => `<div>• ${opt}</div>`).join('')}
                    </div>`
                  : ''
              }
              <div style="font-size: 11px; color: #15803d; background-color: #f0fdf4; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px;">
                <strong>Correct Answer:</strong> ${q.correctAnswer}
              </div>
              <div style="font-size: 11px; color: #64748b; font-style: italic;">
                <strong>Explanation:</strong> ${q.explanation}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  document.body.appendChild(container);

  updateProgress({
    status: 'capturing',
    message: 'Rendering PDF layout canvas...',
    progressPercent: 55,
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 820,
    });

    document.body.removeChild(container);

    updateProgress({
      status: 'generating',
      message: 'Compiling high-resolution A4 PDF document...',
      progressPercent: 80,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);
    }

    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`AI StudyMate • ${pack.title}`, margin, pageHeight - 5);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5);
    }

    const filename = `${pack.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_study_pack.pdf`;

    updateProgress({
      status: 'done',
      message: 'Downloaded successfully!',
      progressPercent: 100,
    });

    pdf.save(filename);
  } catch (err: any) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    updateProgress({
      status: 'error',
      message: err?.message || 'Failed to export study pack booklet PDF.',
      progressPercent: 0,
    });
    throw err;
  }
}
