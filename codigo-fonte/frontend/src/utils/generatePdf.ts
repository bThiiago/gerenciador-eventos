import { jsPDF } from 'jspdf';

const generatePdf = (filename: string, elements: string): void => {
    const htmlElements = `
        <div style="
            width: 780px;
            letter-spacing: 0.6px;
            cellwidth: wrap;
        ">
            ${elements}
        </div>
    `;

    const doc = new jsPDF('p', 'pt', 'a4');
    doc.html(htmlElements, {
        callback: function (doc) {
            const totalPages = doc.internal.pages.length;
            for (let i = 1; i <= totalPages - 1; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(
                    `Página ${i} de ${totalPages - 1}`,
                    doc.internal.pageSize.getWidth() - 80,
                    doc.internal.pageSize.getHeight() - 10
                );
            }

            doc.save(filename ? filename : 'relatorio');
        },
        x: 20,
        y: 16,
        html2canvas: {
            scale: 0.65,
        },
        margin: 28,
    });
};

export default generatePdf;