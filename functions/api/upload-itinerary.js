// /functions/api/upload-itinerary.js
// Tujuan:
// - Dipanggil dari Google Apps Script
// - Mengupload Itinerary.pdf ke repo private alhamidbook/server/pdf/
// - Menggunakan PAT dari env: GITHUB_PAT
// - Proteksi dengan X-API-KEY (UPLOAD_API_KEY)

const OWNER = 'alhamidbook';
const REPO = 'server';
const PDF_DIR = 'pdf'; // folder di repo private: /pdf/
const BRANCH = 'main';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method not allowed' });
      return;
    }

    const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
    if (!process.env.UPLOAD_API_KEY || apiKey !== process.env.UPLOAD_API_KEY) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { pnr, fileBase64 } = req.body || {};

    if (!pnr || !fileBase64) {
      res.status(400).json({
        success: false,
        message: 'pnr dan fileBase64 wajib diisi.'
      });
      return;
    }

    if (!process.env.GITHUB_PAT) {
      res.status(500).json({
        success: false,
        message: 'GITHUB_PAT belum diset di environment.'
      });
      return;
    }

    // Normalisasi PNR: uppercase, alfanumerik saja
    const safePnr = String(pnr).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const ts = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14); // YYYYMMDDHHMMSS

    const targetFileName = `${safePnr}-${ts}.pdf`;
    const targetPath = `${PDF_DIR}/${targetFileName}`;

    const ghRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(
        targetPath
      )}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PAT}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: `Upload itinerary for PNR ${safePnr}`,
          content: fileBase64,
          branch: BRANCH
        })
      }
    );

    if (!ghRes.ok) {
      const errorText = await ghRes.text();
      res.status(ghRes.status).json({
        success: false,
        message: 'Gagal upload ke GitHub',
        detail: errorText
      });
      return;
    }

    const data = await ghRes.json();
    const downloadUrl =
      data?.content?.download_url || data?.content?.html_url || null;

    res.status(200).json({
      success: true,
      file: targetFileName,
      pdf_url: downloadUrl
    });
  } catch (err) {
    console.error('upload-itinerary error', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      detail: String(err)
    });
  }
}
