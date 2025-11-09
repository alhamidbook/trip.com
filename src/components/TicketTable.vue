<template>
  <div class="card">
    <div class="card-head">
      <div>
        <div class="title">Tiket Issued Trip.com</div>
        <div class="subtitle">
          Data otomatis dari email <strong>"Konfirmasi Pemesanan Tiket Pesawat"</strong>.
        </div>
      </div>
      <div class="actions">
        <span class="count">Total: {{ tickets.length }}</span>
        <button @click="fetchTickets" :disabled="loading">
          {{ loading ? 'Refresh...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- DESKTOP TABLE (4 KOLOM) -->
    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th>Nomor Pemesanan</th>
            <th>Tanggal Terbang</th>
            <th>Download PDF Ticket</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && tickets.length === 0">
            <td colspan="4" class="empty">Belum ada data tiket.</td>
          </tr>

          <tr v-for="t in tickets" :key="t.id">
            <!-- 1. Nomor Pemesanan -->
            <td class="pnr">
              {{ t.pnr || t.booking_no || '-' }}
            </td>

            <!-- 2. Tanggal Terbang (tanggal + maskapai + jam + rute + transit jika ada) -->
            <td class="flight-info">
              <div class="line-main">
                <span class="date">
                  {{ depDate(t) || '-' }}
                </span>
                <span class="airline" v-if="airline(t)">
                  • {{ airline(t) }}
                </span>
              </div>
              <div class="line-sub">
                <span v-if="depTime(t)">{{ depTime(t) }}</span>
                <span v-if="t.origin && t.destination">
                  &nbsp;| {{ t.origin }} ➜ {{ t.destination }}
                </span>
                <span v-if="t.transit || t.stops">
                  &nbsp;| Transit: {{ t.transit || t.stops }}
                </span>
              </div>
            </td>

            <!-- 3. Download PDF Ticket -->
            <td>
              <a
                v-if="t.pdf_url"
                :href="t.pdf_url"
                target="_blank"
                rel="noopener"
                class="link"
              >
                Download
              </a>
              <span v-else>-</span>
            </td>

            <!-- 4. Total Harga -->
            <td class="price">
              {{ formatPrice(t.price || t.total_price) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MOBILE CARD VIEW (4 ITEM UTAMA) -->
    <div class="mobile-list">
      <div v-if="!loading && tickets.length === 0" class="empty">
        Belum ada data tiket.
      </div>

      <div v-for="t in tickets" :key="t.id" class="ticket-card">
        <!-- 1. Nomor Pemesanan -->
        <div class="row">
          <div class="label">Nomor Pemesanan</div>
          <div class="value strong">
            {{ t.pnr || t.booking_no || '-' }}
          </div>
        </div>

        <!-- 2. Tanggal Terbang + detail -->
        <div class="row">
          <div class="label">Tanggal Terbang</div>
          <div class="value">
            <div>
              {{ depDate(t) || '-' }}
              <span v-if="airline(t)"> • {{ airline(t) }}</span>
            </div>
            <div class="sub">
              <span v-if="depTime(t)">{{ depTime(t) }}</span>
              <span v-if="t.origin && t.destination">
                &nbsp;| {{ t.origin }} ➜ {{ t.destination }}
              </span>
              <span v-if="t.transit || t.stops">
                &nbsp;| Transit: {{ t.transit || t.stops }}
              </span>
            </div>
          </div>
        </div>

        <!-- 3. Download PDF Ticket -->
        <div class="row">
          <div class="label">PDF Ticket</div>
          <div class="value">
            <a
              v-if="t.pdf_url"
              :href="t.pdf_url"
              target="_blank"
              rel="noopener"
              class="link"
            >
              Download
            </a>
            <span v-else>-</span>
          </div>
        </div>

        <!-- 4. Total Harga -->
        <div class="row">
          <div class="label">Total Harga</div>
          <div class="value strong">
            {{ formatPrice(t.price || t.total_price) }}
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Ganti dengan URL Worker kamu:
const API_URL = 'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const fetchTickets = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');
    const data = await res.json();
    tickets.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

const depDate = (t) => t.departure_date || t.date || '';
const depTime = (t) => t.departure_time || t.time || '';
const airline = (t) => t.airline || t.operator || '';

const formatPrice = (price) => {
  if (price == null || price === '') return '-';
  const n = Number(price);
  if (isNaN(n)) return price;
  return n.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  });
};

onMounted(fetchTickets);
</script>

<style scoped>
.card {
  background: #020817;
  border-radius: 16px;
  padding: 10px;
  border: 1px solid rgba(75, 85, 99, 0.7);
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.8);
  color: #e5e7eb;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.subtitle {
  font-size: 10px;
  color: #9ca3af;
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.count {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #4b5563;
}

.actions button {
  padding: 4px 10px;
  font-size: 10px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #22c55e;
  color: #020817;
}

.table-wrap {
  max-height: 70vh;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

th,
td {
  padding: 6px 6px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.7);
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: #020817;
  z-index: 1;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.06em;
}

.pnr {
  font-weight: 600;
}

.flight-info .line-main {
  font-size: 10px;
}

.flight-info .date {
  font-weight: 500;
}

.flight-info .airline {
  color: #9ca3af;
}

.flight-info .line-sub {
  font-size: 9px;
  color: #9ca3af;
}

.price {
  font-weight: 600;
}

.link {
  color: #38bdf8;
  font-size: 9px;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.empty {
  text-align: center;
  padding: 10px 4px;
  font-size: 10px;
  color: #6b7280;
}

/* MOBILE */
.mobile-list {
  display: none;
}

.ticket-card {
  padding: 9px 9px 8px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(9, 9, 11, 0.96);
  border: 1px solid rgba(75, 85, 99, 0.9);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 8px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 10px;
}

.value.strong {
  font-weight: 600;
}

.sub {
  font-size: 9px;
  color: #9ca3af;
}

.error {
  margin-top: 6px;
  font-size: 10px;
  color: #f97316;
}

/* Responsive switch */
@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
  .mobile-list {
    display: block;
    max-height: 70vh;
    overflow-y: auto;
  }
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }
}
</style>
