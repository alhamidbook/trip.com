<template>
  <div class="ticket-table">
    <div class="card-head">
      <div>
        <div class="title">Tiket Issued Trip.com</div>
        <div class="total-label">Total: {{ total }}</div>
      </div>

      <div class="actions">
        <button @click="fetchTickets(currentPage)" :disabled="loading">
          {{ loading ? 'Refresh...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th>Nomor Pemesanan</th>
            <th>Penumpang &amp; Rute</th>
            <th>Download PDF Ticket</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && pagedTickets.length === 0">
            <td colspan="4" class="empty">Belum ada data tiket.</td>
          </tr>

          <tr v-for="t in pagedTickets" :key="t.id || t.pnr">
            <td class="pnr">
              {{ t.pnr || t.booking_no || '-' }}
            </td>
            <td class="flight-info">
              <div class="line-main">
                <span v-if="safePassenger(t)" class="passenger">
                  {{ safePassenger(t) }}
                </span>
                <span class="date">
                  {{ depDate(t) || '-' }}
                </span>
                <span class="airline" v-if="airline(t)">
                  • {{ airline(t) }}
                </span>
              </div>
              <div class="line-sub">
                <span v-if="depTime(t)">{{ depTime(t) }}</span>
                <span
                  v-if="cleanRouteText(t.origin) && cleanRouteText(t.destination)"
                >
                  &nbsp;| {{ cleanRouteText(t.origin) }} ➜ {{ cleanRouteText(t.destination) }}
                </span>
              </div>
            </td>
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
            <td class="price">
              {{ formatPrice(t.price || t.total_price) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mobile-list">
      <div v-if="!loading && pagedTickets.length === 0" class="empty">
        Belum ada data tiket.
      </div>

      <div
        v-for="t in pagedTickets"
        :key="t.id || t.pnr"
        class="ticket-card"
      >
        <div class="row">
          <div class="label">Nomor Pemesanan</div>
          <div class="value strong">
            {{ t.pnr || t.booking_no || '-' }}
          </div>
        </div>

        <div class="row" v-if="safePassenger(t)">
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
              <span
                v-if="cleanRouteText(t.origin) && cleanRouteText(t.destination)"
              >
                &nbsp;| {{ cleanRouteText(t.origin) }} ➜ {{ cleanRouteText(t.destination) }}
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

    <div v-if="totalPages > 1" class="pagination">
      <button
        class="nav-btn"
        @click="prevPage"
        :disabled="currentPage === 1 || loading"
      >
        ← Prev
      </button>
      <span class="page-info">
        Page {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        class="nav-btn"
        @click="nextPage"
        :disabled="currentPage === totalPages || loading"
      >
        Next →
      </button>
    </div>

    <p v-if="error" class="error">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const API_URL = 'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const pageSize = 10;

const fetchTickets = async (page = 1) => {
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch(`${API_URL}?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');

    const data = await res.json();
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    tickets.value = items;
    currentPage.value = data.page || page;
    totalPages.value =
      data.totalPages ||
      Math.max(1, Math.ceil((data.total || items.length) / pageSize));
    total.value = data.total != null ? data.total : items.length;
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

const pagedTickets = computed(() => tickets.value);

const nextPage = () => {
  if (currentPage.value < totalPages.value && !loading.value) {
    fetchTickets(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (currentPage.value > 1 && !loading.value) {
    fetchTickets(currentPage.value - 1);
  }
};

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
    .replace(/^icon\b.*$/gim, '')
    .replace(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+-\s*[A-Za-zÀ-ÖØ-öø-ÿ\s]+.*$/gim,
      ''
    );

  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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

onMounted(() => fetchTickets(1));
</script>

<style scoped>
.ticket-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.total-label {
  margin-top: 2px;
  font-size: 12px;
  color: #1f2937;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions button {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #3b82f6;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.actions button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.actions button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  padding: 8px 10px;
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
  font-size: 10px;
  letter-spacing: 0.06em;
  color: #1f2937;
}

.pnr {
  font-weight: 600;
  color: #111827;
}

.flight-info .line-main {
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
  font-size: 11px;
  color: #6b7280;
}

.price {
  font-weight: 600;
  color: #111827;
}

.link {
  color: #2563eb;
  font-size: 11px;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.pending {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

.empty {
  text-align: center;
  padding: 12px 4px;
  font-size: 12px;
  color: #9ca3af;
}

.mobile-list {
  display: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.ticket-card {
  padding: 10px 10px 8px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 16px rgba(148, 163, 253, 0.12);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 9px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 12px;
  color: #111827;
}

.value.strong {
  font-weight: 600;
}

.sub {
  font-size: 11px;
  color: #6b7280;
}

.pagination {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  font-size: 11px;
  color: #4b5563;
}

.nav-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-info {
  font-size: 10px;
  color: #6b7280;
}

.error {
  margin-top: 4px;
  font-size: 11px;
  color: #dc2626;
}

@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
  .mobile-list {
    display: block;
  }
  .pagination {
    justify-content: center;
  }
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }
}
</style>
