const GITHUB_OWNER = 'alhamidbook';
const GITHUB_REPO = 'server';
const USER_JSON_PATH = 'user.json';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405);
  }

  const body = await request.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;

  if (!username || !password) {
    return jsonResponse({ success: false, message: 'Username & password wajib diisi' }, 400);
  }

  if (!env.GITHUB_PAT) {
    return jsonResponse(
      { success: false, message: 'Server login belum dikonfigurasi (GITHUB_PAT kosong).' },
      500
    );
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${USER_JSON_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'tripcom-login'
      }
    }
  );

  if (!ghRes.ok) {
    return jsonResponse(
      { success: false, message: 'Gagal mengambil data user dari GitHub. Cek PAT/permission/path.' },
      500
    );
  }

  const userConfig = await ghRes.json();
  const users = Array.isArray(userConfig)
    ? userConfig
    : Array.isArray(userConfig.users)
    ? userConfig.users
    : [];

  const found = users.find(
    (u) =>
      typeof u.username === 'string' &&
      u.username.toLowerCase() === String(username).toLowerCase()
  );

  if (!found || String(found.password) !== String(password)) {
    return jsonResponse({ success: false, message: 'Username atau password salah.' }, 401);
  }

  const token = generateToken(found.username);
  const safeUser = {
    username: found.username,
    name: found.name || found.username,
    role: found.role || 'user'
  };

  return jsonResponse({ success: true, token, user: safeUser }, 200);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateToken(username) {
  const base = `${username}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  return btoa(base);
}
