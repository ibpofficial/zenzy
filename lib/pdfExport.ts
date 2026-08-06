import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generatePdfFromElement(
  element: HTMLElement,
  fileName: string = "quotation.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // 1. Hide print-hidden elements before capture
    const printHiddenElements = element.querySelectorAll<HTMLElement>(".print\\:hidden, .no-pdf");
    printHiddenElements.forEach((el) => {
      el.style.display = "none";
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 10000,
      onclone: (clonedDoc) => {
        // Convert interactive input fields into clean text spans in the PDF capture
        const inputs = clonedDoc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
        inputs.forEach((input) => {
          const val = input.value;
          const span = clonedDoc.createElement("span");
          span.textContent = val;
          span.className = input.className;
          span.style.border = "none";
          span.style.background = "transparent";
          input.parentNode?.replaceChild(span, input);
        });

        // Strip modern CSS color functions unsupported by html2canvas
        const styleEls = clonedDoc.querySelectorAll("style");
        styleEls.forEach((style) => {
          if (style.textContent) {
            style.textContent = style.textContent
              .replace(/lab\([^)]*\)/gi, "transparent")
              .replace(/oklch\([^)]*\)/gi, "transparent")
              .replace(/color-mix\([^)]*\)/gi, "transparent");
          }
        });

        const allEls = clonedDoc.querySelectorAll<HTMLElement>("*");
        allEls.forEach((el) => {
          const styleAttr = el.getAttribute("style");
          if (
            styleAttr &&
            (styleAttr.includes("lab(") ||
              styleAttr.includes("oklch(") ||
              styleAttr.includes("color-mix("))
          ) {
            el.setAttribute(
              "style",
              styleAttr
                .replace(/lab\([^)]*\)/gi, "transparent")
                .replace(/oklch\([^)]*\)/gi, "transparent")
                .replace(/color-mix\([^)]*\)/gi, "transparent")
            );
          }
        });
      },
    });

    // Restore print-hidden elements
    printHiddenElements.forEach((el) => {
      el.style.display = "";
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 210; // A4 width mm
    const pdfHeight = 297; // A4 height mm
    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
    heightLeft -= (pdfHeight - margin * 2);

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }

    pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  } catch (error) {
    console.warn("Direct PDF generation fallback to clean document print:", error);
    printElementInIsolatedIframe(element, fileName);
  }
}

/**
 * Clean Document Print Fallback: Prints ONLY the quotation document in an isolated iframe,
 * completely hiding website headers, sidebars, dashboard menus, and footers.
 */
function printElementInIsolatedIframe(element: HTMLElement, title: string) {
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((s) => s.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 10mm; }
            body { background: white !important; font-family: sans-serif; padding: 0; margin: 0; }
            .print\\:hidden, .no-pdf, button { display: none !important; }
            input, select, textarea { border: none !important; background: transparent !important; }
          </style>
        </head>
        <body>
          <div style="max-width: 100%; margin: 0 auto;">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 400);
  } catch (e) {
    console.error("Iframe print fallback error:", e);
    window.print();
  }
}
