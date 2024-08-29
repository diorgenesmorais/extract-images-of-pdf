import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PNG } from 'pngjs';
import sharp from 'sharp';

const processImage = async (img, pageNum, j) => {
    if (img && img.data) {
        const numChannels = img.data.length / (img.width * img.height);

        let base64Data = '';
        let mimeType = '';
        let fig = '';

        if (numChannels === 4) { // could it be PNG
            const png = new PNG({ width: img.width, height: img.height });
            png.data = img.data;

            // Convert PNG to base64
            const chunks = [];
            png.on('data', (chunk) => chunks.push(chunk));
            await new Promise((resolve) => png.on('end', resolve));
            base64Data = Buffer.concat(chunks).toString('base64');
            mimeType = 'image/png';
            fig = img.name;
        } else if (numChannels === 3) { // could it be JPEG
            // Convert JPEG to base64
            const buffer = await sharp(img.data, { raw: { width: img.width, height: img.height, channels: numChannels } })
                .toFormat('jpeg')
                .toBuffer();
            base64Data = buffer.toString('base64');
            mimeType = 'image/jpeg';
            fig = img.name;
        } else {
            console.log(`Unknown image format on page ${pageNum}, index ${j}`);
            return null; // Unknown format
        }

        return {
            ref: img.ref,
            data: base64Data,
            mimiType: mimeType,
            fig: fig
        };
    }
    return null;
};

const getImageBuffer = async (page, ops, pageNum) => {
    const attachments = [];

    for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === OPS.paintImageXObject || ops.fnArray[i] === OPS.paintInlineImageXObject) {
            const imgName = ops.argsArray[i][0];
    
            if (page.objs.has(imgName)) {
                const imgObj = await page.objs.get(imgName);
                imgObj['name'] = imgName;
                const attachment = await processImage(imgObj, pageNum, i);
                if (attachment) {
                    attachments.push(attachment);
                }
            }
        }
    }
    
    return attachments;
}

const extractImagesFromPDF = async (pdfPath) => {
    try {
        const loadingTask = getDocument(pdfPath);
        const pdfDocument = await loadingTask.promise;
        let allAttachments = [];
    
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const ops = await page.getOperatorList();
            
            const attachments = await getImageBuffer(page, ops, pageNum);
            if (attachments.length > 0) {
                allAttachments = [...allAttachments, ...attachments];
            }
        }
        return allAttachments;
    } catch (error) {
        throw error;
    }
};

const pdf1 = './meuPdf.pdf';
const pdf2 = './Diorgenes_2024_pt.pdf';

async function main() {
    console.log('Initial');
    try {
        const result = await extractImagesFromPDF(pdf2);
        console.log('result: ', result);
    } catch (error) {
        console.log('error: ', error);
    }
}

main();
