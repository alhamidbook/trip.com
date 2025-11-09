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

    <!-- Desktop table -->
    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>PNR</th>
            <th>Dari</th>
            <th>Ke</th>
            <th>Tgl Berangkat</th>
            <th>Jam Berangkat</th>
            <th>Tgl Pulang</th>
            <th>Jam Pulang</th>
            <th>Maskapai</th>
            <th>Tiket PDF</th>
            <th>Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && tickets.length === 0">
            <td colspan="11" class="empty">Belum ada data tiket.</td>
          </tr>
          <tr v-for="t in tickets" :key="t.id">
            <td>{{ t.passenger || '-' }}</td>
            <td>{{ t.pnr || '-' }}</td>
            <td>{{ t.origin || '-' }}</td>
            <td>{{ t.destination || '-' }}</td>
            <td>{{ depDate(t) || '-' }}</td>
            <td>{{ depTime(t) || '-' }}</td>
            <td>{{ retDate(t) || '-' }}</td>
            <td>{{ retTime(t) || '-' }}</td>
            <td>{{ airline(t) || '-' }}</td>
            <td>
              <a
                v-if="t.pdf_url"
                :href="t.pdf_url"
                target="_blank"
                rel="noopener"
                class="link"
              >Download</a>
              <span v-else>-</span>
            </td>
            <td>{{ formatPrice(t.price) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="mobile-list mobile-only">
      <div v-if="!loading && tickets.length === 0" class="empty">
        Belum ada data tiket.
      </div>

      <div v-for="t in tickets" :key="t.id" class="ticket-card">
        <div class="row-top">
          <div class="passenger">
            <div class="label">Nama</div>
            <div class="value strong">{{ t.passenger || '-' }}</div>
          </div>
          <div class="pnr" v-if="t.pnr">
            PNR: <span>{{ t.pnr }}</span>
          </div>
        </div>

        <div class="row-route">
          <div class="city">
            <div class="city-label">Dari</div>
            <div class="city-code">{{ t.origin || '???' }}</div>
          </div>
          <div class="route-arrow">➜</div>
          <div class="city">
            <div class="city-label">Ke</div>
            <div class="city-code">{{ t.destination || '???' }}</div>
          </div>
        </div>

        <div class="row-time">
          <div class="time-item">
            <div class="label">Tgl Berangkat</div>
            <div class="value">{{ depDate(t) || '-' }}</div>
          </div>
          <div class="time-item">
            <div class="label">Jam Berangkat</div>
            <div class="value">{{ depTime(t) || '-' }}</div>
          </div>
        </div>

        <div class="row-time">
          <div class="time-item">
            <div class="label">Tgl Pulang</div>
            <div class="value">{{ retDate(t) || '-' }}</div>
          </div>
          <div class="time-item">
            <div class="label">Jam Pulang</div>
            <div class="value">{{ retTime(t) || '-' }}</div>
          </div>
        </div>

        <div class="row-meta">
          <div class="meta-item">
            <div class="label">Maskapai</div>
            <div class="value">{{ airline(t) || '-' }}</div>
          </div>
        </div>

        <div class="row-meta">
          <div class="meta-item">
            <div class="label">Tiket PDF</div>
            <div class="value">
              <a
                v-if="t.pdf_url"
                :href="t.pdf_url"
                target="_blank"
                rel="noopener"
                class="link"
              >Download</a>
              <span v-else>-</span>
            </div>
          </div>
        </div>

        <div class="row-meta">
          <div class="meta-item">
            <div class="label">Harga</div>
            <div class="value strong">{{ formatPrice(t.price) }}</div>
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
const API_URL = 'https://tripcom-worker.YOUR_SUBDOMAIN.workers.dev/api/tickets';

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const fetchTickets = async () => {
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Gagal mengambil data tiket.');
    const data = await res.json();
    tickets.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || 'Terjadi kesalahan.';
  } finally {
    loading.value = false;
  }
};

const depDate = (t) => t.departure_date || t.date || '';
const depTime = (t) => t.departure_time || t.time || '';
const retDate = (t) => t.return_date || '';
const retTime = (t) => t.return_time || '';
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
/* (styles similar to previous; kept concise) */
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
.title { font-size: 14px; font-weight: 600; }
.subtitle { font-size: 10px; color: #9ca3af; }
.actions { display: flex; align-items: center; gap: 6px; font-size: 10px; }
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
.table-wrap { max-height: 70vh; overflow-y: auto; }
table { width: 100%; border-collapse: collapse; font-size: 10px; }
th, td {
  padding: 6px 4px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.7);
  text-align: left;
  white-space: nowrap;
}
th {
  position: sticky; top: 0; background: #020817; z-index: 1;
  font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: .06em;
}
tr:hover { background: rgba(15, 23, 42, 0.95); }
.empty { text-align: center; padding: 10px 4px; font-size: 10px; color: #6b7280; }
.link { color: #38bdf8; font-size: 9px; text-decoration: none; }
.link:hover { text-decoration: underline; }

/* mobile cards */
.mobile-list { display: none; }
.ticket-card {
  padding: 9px 9px 8px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(9,9,11,.96);
  border: 1px solid rgba(75,85,99,.9);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row-top { display: flex; align-items: flex-start; gap: 8px; }
.label {
  font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em;
}
.value { font-size: 10px; }
.value.strong { font-weight: 600; }
.pnr { margin-left: auto; font-size: 8px; color: #93c5fd; }
.pnr span { font-weight: 600; }
.row-route { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
.city-label { font-size: 7px; color: #6b7280; text-transform: uppercase; }
.city-code { font-size: 13px; font-weight: 600; }
.route-arrow { font-size: 11px; color: #38bdf8; }
.row-time, .row-meta { display: flex; gap: 14px; margin-top: 2px; }
.meta-item, .time-item { display: flex; flex-direction: column; gap: 1px; }
.error { margin-top: 6px; font-size: 10px; color: #f97316; }

@media (max-width: 767px) {
  .desktop-only { display: none; }
  .mobile-list { display: block; max-height: 70vh; overflow-y: auto; }
}
@media (min-width: 768px) {
  .desktop-only { display: block; }
  .mobile-only { display: none; }
}
</style>
