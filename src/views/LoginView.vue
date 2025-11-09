<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Trip.com Ticket Monitor</h1>
      <p class="subtitle">Masuk untuk melihat tiket issued dari Trip.com</p>

      <form @submit.prevent="handleLogin">
        <label>
          Username
          <input v-model="username" type="text" required autocomplete="username" />
        </label>

        <label>
          Password
          <input v-model="password" type="password" required autocomplete="current-password" />
        </label>

        <button type="submit" :disabled="loading">
          <span v-if="loading">Memproses...</span>
          <span v-else>Masuk</span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setAuth } from '../stores/auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Username atau password salah.');
    }

    setAuth({
      token: data.token || 'ok',
      user: data.user || { username: username.value }
    });

    router.push({ name: 'Dashboard' });
  } catch (err) {
    error.value = err.message || 'Login gagal.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1d2433, #020817);
  padding: 16px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: rgba(15, 23, 42, 0.98);
  border-radius: 18px;
  padding: 24px 22px 26px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.8);
  color: #e5e7eb;
}
h1 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}
.subtitle {
  margin: 0 0 18px;
  font-size: 12px;
  color: #9ca3af;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
label {
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
input {
  padding: 8px 9px;
  border-radius: 9px;
  border: 1px solid #374151;
  outline: none;
  font-size: 13px;
  background: #020817;
  color: #e5e7eb;
}
input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2);
}
button {
  margin-top: 4px;
  padding: 9px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(to right, #22c55e, #22d3ee);
  color: #020817;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: default;
}
.error {
  margin-top: 6px;
  font-size: 11px;
  color: #f97316;
}
</style>
