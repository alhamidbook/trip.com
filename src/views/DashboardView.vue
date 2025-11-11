<template>
  <div class="page">
    <header class="topbar">
      <div>
        <h1>Daftar Tiket Issued Trip.com</h1>
        <p>
          Data otomatis dari email
          <strong>"Fwd: Pembayaran Berhasil"</strong>
          &amp;
          <strong>"Fwd: Konfirmasi Pemesanan Tiket Pesawat:"</strong>
        </p>
      </div>
      <div class="right">
        <span class="user" v-if="authUser">
          {{ authUser.name || authUser.username || 'User' }}
        </span>
        <button @click="logout">Logout</button>
      </div>
    </header>

    <main class="content">
      <TicketTable />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import TicketTable from '../components/TicketTable.vue';
import { clearAuth, getAuth } from '../stores/auth';

const router = useRouter();
const authUser = getAuth()?.user || null;

const logout = () => {
  clearAuth();
  router.push({ name: 'Login' });
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* Sama style gradient dengan login supaya konsisten */
  background: linear-gradient(
    135deg,
    #0052ff 0%,
    #1da0ff 35%,
    #4fd5ff 65%,
    #ff6ad5 100%
  );
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* TOPBAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 14px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  backdrop-filter: blur(14px);
  background: rgba(239, 246, 255, 0.96);
  border-bottom: 1px solid #bfdbfe;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.topbar p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.topbar p strong {
  color: #2563eb;
  font-weight: 600;
}

/* Right section */
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-weight: 500;
}

button {
  padding: 7px 12px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #ef4444;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
  transition: all 0.15s ease;
}

button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* CONTENT */
.content {
  padding: 18px 22px 24px;
}
</style>
