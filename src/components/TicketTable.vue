<template>
  <div class="card">
    <div class="card-head">
      <div>
        <div class="title">Tiket Issued Trip.com</div>
        <div class="subtitle">
          Data otomatis dari email Trip.com:
          <strong>"Fwd: Pembayaran Berhasil"</strong>
          &amp;
          <strong>"Fwd: Konfirmasi Pemesanan Tiket Pesawat:"</strong>
        </div>
      </div>

      <div class="actions">
        <span class="count">Total: {{ tickets.length }}</span>
        <button @click="fetchTickets" :disabled="loading">
          {{ loading ? 'Refresh...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- DESKTOP TABLE -->
    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th>Nomor Pemesanan / PNR</th>
            <th>Penumpang &amp; Rute</th>
            <th>Download PDF Ticket</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && tickets.length === 0">
            <td colspan="4" class="empty">Belum ada data tiket.</td>
          </tr>

          <tr v-for="t in tickets" :key="t.id || t.pnr">
            <!-- PNR / Booking No -->
            <td class="pnr">
              {{ t.pnr || t.booking_no || '-' }}
            </td>

            <!-- Penumpang + Info Penerbangan -->
            <td class="flight-info">
              <div class="line-main">
                <span
                  v-if="safePassenger(t)"
                  class="passenger"
                >
                  {{ safePassenger(t) }}
                </span>
                <span class="date">
                  {{ depDate(t) || '-' }}
                </span>
                <span
                  class="airline"
                  v-if="airline(t)"
                >
                  • {{ airline(t) }}
                </span>
              </div>
              <div class="line-sub">
                <span v-if="depTime(t)">{{ depTime(t) }}</span>
                <span v-if="t.origin && t.destination">
                  &nbsp;| {{ t.origin }} ➜ {{ t.destination }}
                </span>
              </div>
            </td>

            <!-- PDF -->
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
              <span v-else class="pending">Akan segera terbit</span>
            </td>

            <!-- Total Harga -->
            <td class="price">
              {{ formatPrice(t.price || t.total_price) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MOBILE LIST -->
    <div class="mobile-list">
      <div
        v-if="!loading && tickets.length === 0"
        class="empty"
      >
        Belum ada data tiket.
      </div>

      <div
        v-for="t in tickets"
        :key="t.id || t.pnr"
        class="ticket-card"
      >
        <div class="row">
          <div class="label">Nomor Pemesanan / PNR</div>
          <div class="value strong">
            {{ t.pnr || t.booking_no || '-' }}
          </div>
        </div>

        <div
          class="row"
          v-if="safePassenger(t)"
        >
          <div class="label">Penumpang</div>
          <div class="value">
            {{ safePassenger(t) }}
          </div>
        </div>

        <div class="row">
          <div class="label">Tanggal &amp; Rute</div>
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
            </div>
          </div>
        </div>

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
            <span v-else class="pending">Akan segera terbit</span>
          </div>
        </div>

        <div class="row">
          <div class="label">Total Harga</div>
          <div class="value strong">
            {{ formatPrice(t.price || t.total_price) }}
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_URL =
  'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

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

// Passenger cleaning: buang teks status seperti
// "Kami akan segera menerbitkan tiket Anda", "Tiket akan diterbitkan...", dsb.
const safePassenger = (t) => {
  let raw = t.passenger || '';
  if (!raw) return '';

  raw = String(raw);

  const paxMatch = raw.match(
    /([A-ZÀ-ÖØ-Ý' \.]+)\(Nama depan\)\s*([A-ZÀ-ÖØ-Ý' \.]+)\(Nama belakang\)/i
  );
  if (paxMatch) {
    const first = paxMatch[1].trim().replace(/\s+/g, ' ');
    const last = paxMatch[2].trim().replace(/\s+/g, ' ');
    return `${first} ${last}`.trim();
  }

  raw = raw
    .replace(/Kami akan segera menerbitkan tiket Anda.*$/gim, '')
    .replace(/Kami tengah memantau status penerbitan tiket dengan saksama.*$/gim, '')
    .replace(/Tiket akan diterbitkan dalam waktu.*$/gim, '')
    .replace(/^icon\b.*$/gim, '');

  raw = raw.replace(
    /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+-\s*[A-Za-zÀ-ÖØ-öø-ÿ\s]+.*$/gim,
    ''
  );

  const cleaned = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

const depDate = (t) =>
  t.date || t.departure_date || t.flight_date || '';

const depTime = (t) =>
  t.time || t.departure_time || '';

const airline = (t) =>
  t.operator || t.airline || '';

const formatPrice = (price) => {
  if (price == null || price === '') return '-';
  const n = Number(
    typeof price === 'string'
      ? price.replace(/[^\d.-]/g, '')
      : price
  );
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
  background: #ffffff;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.subtitle {
  font-size: 11px;
  color: #6b7280;
}

.subtitle strong {
  color: #2563eb;
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.count {
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.actions button {
  padding: 5px 12px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #2563eb;
  color: #ffffff;
  transition: background 0.15s ease, transform 0.05s ease,
    box-shadow 0.1s ease;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.actions button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.actions button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

/* TABLE */
.table-wrap {
  max-height: 70vh;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

th,
td {
  padding: 7px 8px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: #eff6ff;
  z-index: 1;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: #1f2937;
}

.pnr {
  font-weight: 600;
  color: #111827;
}

.flight-info .line-main {
  font-size: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: baseline;
}

.flight-info .passenger {
  font-weight: 600;
  margin-right: 4px;
  color: #111827;
}

.flight-info .date {
  font-weight: 500;
  color: #111827;
}

.flight-info .airline {
  color: #6b7280;
}

.flight-info .line-sub {
  font-size: 9px;
  color: #6b7280;
}

.price {
  font-weight: 600;
  color: #111827;
}

.link {
  color: #2563eb;
  font-size: 9px;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.pending {
  font-size: 9px;
  color: #9ca3af;
  font-style: italic;
}

.empty {
  text-align: center;
  padding: 10px 4px;
  font-size: 10px;
  color: #9ca3af;
}

/* MOBILE */
.mobile-list {
  display: none;
}

.ticket-card {
  padding: 9px 9px 8px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
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
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 10px;
  color: #111827;
}

.value.strong {
  font-weight: 600;
}

.sub {
  font-size: 9px;
  color: #6b7280;
}

.error {
  margin-top: 6px;
  font-size: 10px;
  color: #dc2626;
}

/* Responsive */
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
