import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:3000';

class PdfService {
  async generateDocumentPdf(type, id, token, queryParams = '') {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
      
      const page = await browser.newPage();
      
      // Set a standard desktop viewport
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Construct the secure rendering URL
      const url = `${FRONTEND_URL}/print/${type}/${id}?token=${token}${queryParams}`;
      
      // Navigate and wait for network idle to ensure fonts/images are loaded
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Additional small wait to ensure React finishes any immediate rendering 
      // (like evaluating the components if there's a slight delay after network)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for error messages rendered by the component
      const errorText = await page.evaluate(() => {
        const errEl = document.querySelector('.text-rose-500');
        return errEl ? errEl.innerText : null;
      });

      if (errorText) {
        throw new Error(`PDF Render Error: ${errorText}`);
      }

      // Generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Puppeteer PDF generation error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export default new PdfService();
