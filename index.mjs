import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import { PNG } from 'pngjs';

const getImageBuffer = async (page, ops, pageNum) => {
    return new Promise(async (resolve, reject) => {
        try {
            const images = [];

            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === OPS.paintImageXObject || ops.fnArray[i] === OPS.paintInlineImageXObject) {
                    const imgName = ops.argsArray[i][0];
            
                    if (page.objs.has(imgName)) {
                        const imgObj = await page.objs.get(imgName);
                        images.push(imgObj);
                    }
                }
            }

            for (let j = 0; j < images.length; j++) {
                const img = images[j];

                if (img && img.width && img.height && img.data) {
                    const png = new PNG({
                        width: img.width,
                        height: img.height
                    });

                    png.data = img.data;

                    const imgPath = `./images/image-${pageNum}-${j}.png`;
                    png.pack().pipe(fs.createWriteStream(imgPath));

                    console.log(`Imagem salva em: ${imgPath}`);
                }
            }

            if (images.length === 0) {
                console.log(`Nenhuma imagem encontrada na página ${pageNum}`);
            }
            resolve(true);
        } catch (error) {
            reject(error);
        }
    })
}

const extractImagesFromPDF = async (pdfPath) => {
    const loadingTask = getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const ops = await page.getOperatorList();
        
        await getImageBuffer(page, ops, pageNum);
    }
};

const pdf1 = './meuPdf.pdf';
const pdf2 = './Diorgenes_2024_pt.pdf';

extractImagesFromPDF(pdf2)
    .then(() => console.log('Extração concluída'))
    .catch(err => console.error('Erro durante a extração:', err));