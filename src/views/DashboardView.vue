<template>
  <div class="page">
    <div class="wrapper">
      <!-- Topbar jadi header card -->
      <header class="topbar">
        <div>
          <h1>Daftar Tiket Issued Trip.com</h1>
          <p>Data otomatis dari email "Fwd: Pembayaran Berhasil" &amp; "Fwd: Konfirmasi Pemesanan Tiket Pesawat:".</p>
        </div>
        <div class="right">
          <span class="user" v-if="authUser">
            {{ authUser.name || authUser.username || 'User' }}
          </span>
          <button @click="logout">Logout</button>
        </div>
      </header>

      <!-- Card utama: di dalamnya ada TicketTable; yang scroll hanya isi list -->
      <main class="card">
        <TicketTable />
      </main>
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
  padding: 16px;
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

/* Wrapper width maksimum */
.wrapper {
  width: 100%;
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Topbar sekarang bagian dari card (bukan bar gelap terpisah) */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 4px;
  color: #0f172a;
}

.topbar h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.topbar p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #4b5563;
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

/* Card utama yang menampung TicketTable.
   Tingginya memenuhi sisa layar, dan isi di dalam yang akan scroll. */
.card {
  flex: 1;
  background: #f5f7fb;
  border-radius: 18px;
  padding: 10px 10px 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(148, 163, 253, 0.18);
  overflow: hidden; /* penting: page tidak ikut scroll */
}

/* Responsif kecil */
@media (max-width: 767px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 8px 0;
  }

  .topbar h1 {
    font-size: 16px;
  }

  .topbar p {
    font-size: 10px;
  }

  .card {
    padding: 8px 6px 6px;
  }
}
</style>
