<template>
  <div class="page">
    <div class="card">
      <!-- Topbar sekarang menyatu di dalam card -->
      <div class="topbar">
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
      </div>

      <!-- Isi list tiket (yang scroll & paginated) -->
      <TicketTable />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import TicketTable from '../components/TicketTable.vue';
import { clearAuth, getAuth } from '../stores/auth';

const router = useRouter();
const auth = getAuth();
const authUser = auth ? auth.user : null;

const logout = () => {
  clearAuth();
  router.push({ name: 'Login' });
};
</script>

<style scoped>
/* Halaman penuh, background gradient lembut */
.page {
  height: 100vh;
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: linear-gradient(
    135deg,
    #0052ff 0%,
    #1da0ff 35%,
    #4fd5ff 65%,
    #ff6ad5 100%
  );
  color: #0f172a;
}

/* Card utama sebagai kontainer seluruh dashboard */
.card {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  background: #f5f7fb;
  border-radius: 18px;
  padding: 12px 14px 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(148, 163, 253, 0.18);
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden; /* yang scroll hanya konten di dalam */
}

/* Topbar di dalam card */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 4px 2px;
}

.topbar h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.topbar p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #4b5563;
}

.topbar strong {
  color: #2563eb;
  font-weight: 600;
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
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

button {
  padding: 6px 10px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #ef4444;
  color: #f9fafb;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 767px) {
  .page {
    padding: 10px;
  }

  .card {
    padding: 8px 8px 6px;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 2px 2px 0;
    gap: 4px;
  }

  .topbar h1 {
    font-size: 16px;
  }

  .topbar p {
    font-size: 10px;
  }
}
</style>
