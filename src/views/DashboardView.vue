<template>
  <div class="page">
    <header class="topbar">
      <div>
        <h1>Daftar Tiket Issued Trip.com</h1>
        <p>Data otomatis dari email "Konfirmasi Pemesanan Tiket Pesawat".</p>
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
  background: #020817;
  color: #e5e7eb;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(14px);
  background: rgba(2, 8, 23, 0.96);
  border-bottom: 1px solid rgba(75, 85, 99, 0.5);
}
h1 {
  margin: 0;
  font-size: 18px;
}
p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #9ca3af;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #4b5563;
}
button {
  padding: 6px 10px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #ef4444;
  color: #f9fafb;
}
.content {
  padding: 14px 18px 20px;
}
</style>
