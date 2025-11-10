export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS & method
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,X-API-KEY'
        }
      });
    }

    if (url.pathname !== '/api/upload-itinerary' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    // Auth sederhana pakai X-API-KEY
    const apiKey =
      request.headers.get('X-API-KEY') ||
      request.headers.get('x-api-key');

    if (!env.UPLOAD_API_KEY || apiKey !== env.UPLOAD_API_KEY) {
      return json({ success: false, message: 'Unauthorized' }, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.pnr || !body.fileBase64) {
      return json(
        { success: false, message: 'pnr dan fileBase64 wajib dikirim.' },
        400
      );
    }

    const pnr = String(body.pnr).trim().toUpperCase();
    const fileBase64 = String(body.fileBase64).trim();

    if (!/^[A-Z0-9]{5,6}$/.test(pnr)) {
      return json(
        { success: false, message: 'Format PNR tidak valid.' },
        400
      );
    }

    if (!env.GITHUB_PAT) {
      return json(
        { success: false, message: 'GITHUB_PAT belum dikonfigurasi di Cloudflare.' },
        500
      );
    }

    const GITHUB_OWNER = 'alhamidbook';
    const GITHUB_REPO = 'server';
    const GITHUB_BRANCH = 'main';
    const path = `pdf/${pnr}.pdf`;

    const apiBase = 'https://api.github.com';
    const headers = {
      'Authorization': `token ${env.GITHUB_PAT}`,
      'User-Agent': 'upload-itinerary-worker',
      'Accept': 'application/vnd.github+json'
    };

    // Cek apakah file sudah ada → ambil sha kalau mau update
    let sha = null;
    const getRes = await fetch(
      `${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
        path
      )}?ref=${GITHUB_BRANCH}`,
      { headers }
    );

    if (getRes.status === 200) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404 && getRes.status !== 200) {
      const txt = await getRes.text();
      console.log('GitHub check error:', getRes.status, txt);
    }

    // Buat atau update file
    const putBody = {
      message: `Add/update itinerary for PNR ${pnr}`,
      content: fileBase64,
      branch: GITHUB_BRANCH
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(
      `${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
        path
      )}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      }
    );

    if (putRes.status < 200 || putRes.status >= 300) {
      const txt = await putRes.text();
      console.log('GitHub upload error:', putRes.status, txt);
      return json(
        { success: false, message: 'Gagal upload PDF ke GitHub.' },
        502
      );
    }

    // pdf_url menggunakan endpoint Worker /pdf/:pnr
    const pdfUrl = `https://tripcom-worker.alhamidbook.workers.dev/pdf/${pnr}`;

    return json({
      success: true,
      pnr,
      pdf_url: pdfUrl
    });
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
