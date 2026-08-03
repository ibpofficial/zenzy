import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generatePdfFromElement(
  element: HTMLElement,
  fileName: string = "quotation.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // Hide print-hidden elements during PDF generation
    const printHiddenElements = element.querySelectorAll<HTMLElement>(".print\\:hidden");
    printHiddenElements.forEach((el) => {
      el.style.display = "none";
    });

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution capture
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Sanitize modern CSS color functions unsupported by html2canvas (lab, oklch, color-mix)
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

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to export PDF. Printing window will open instead.");
    window.print();
  }
}
