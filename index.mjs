import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import { PNG } from 'pngjs';
import sharp from 'sharp';

const processImage = async (img, pageNum, j) => {
    if (img && img.data) {
        const numChannels = img.data.length / (img.width * img.height);

        if (numChannels === 4) { // could it be PNG
            const png = new PNG({ width: img.width, height: img.height });
            png.data = img.data;
            const imgPath = `./images/image-${pageNum}-${j}.png`;
            png.pack().pipe(fs.createWriteStream(imgPath));
            console.log(`Image PNG: ${imgPath}`);
        } else if (numChannels === 3) { // could it be JPEG
            const imgPath = `./images/image-${pageNum}-${j}.jpg`;
            await sharp(img.data, { raw: { width: img.width, height: img.height, channels: numChannels } })
                .toFormat('jpeg')
                .toFile(imgPath);
            console.log(`Image JPEG: ${imgPath}`);
        } else {
            console.log(`Unknown image format on page ${pageNum}, index ${j}`);
        }
    }
};

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
                await processImage(images[j], pageNum, j);
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

extractImagesFromPDF(pdf1)
    .then(() => console.log('Extração concluída'))
    .catch(err => console.error('Erro durante a extração:', err));