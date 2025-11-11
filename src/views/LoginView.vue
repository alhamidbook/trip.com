<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Al-Hamid Ticket Monitor</h1>
      <p class="subtitle">Masuk untuk melihat tiket issued dari Trip.com</p>

      <form @submit.prevent="handleLogin">
        <label>
          Username
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
          />
        </label>

        <label>
          Password
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
          />
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
  padding: 24px 16px;
  /* Gradient mirip banner Trip.com: biru -> cyan -> pink */
  background: linear-gradient(
    135deg,
    #0052ff 0%,
    #1da0ff 35%,
    #4fd5ff 65%,
    #ff6ad5 100%
  );
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 22px;
  padding: 26px 24px 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
}

.subtitle {
  margin: 0 0 18px;
  font-size: 13px;
  color: #6b7280;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  font-size: 12px;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input {
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid #cbd5f5;
  outline: none;
  font-size: 13px;
  background: #f9fafb;
  color: #111827;
  transition: all 0.15s ease;
}

input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
  background: #ffffff;
}

button {
  margin-top: 6px;
  padding: 10px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(to right, #2563eb, #38bdf8);
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  transition: all 0.15s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 9px 22px rgba(37, 99, 235, 0.45);
}

button:disabled {
  opacity: 0.65;
  cursor: default;
  box-shadow: none;
}

.error {
  margin-top: 6px;
  font-size: 11px;
  color: #dc2626;
}
</style>
