<template>
  <div class="ticket-table">
    <!-- HEADER DALAM CARD -->
    <div class="card-head">
      <div class="head-left">
        <div class="title">Tiket Issued Trip.com</div>
        <div class="count-under">
          Total: <strong>{{ total }}</strong>
        </div>
      </div>

      <div class="actions">
        <!-- 1. Cari Nama -->
        <button
          class="btn"
          @click="toggleNameSearch"
          :disabled="loading"
        >
          Cari Nama
        </button>

        <!-- 2. Pilih Rentang Tanggal -->
        <button
          class="btn"
          @click="openDateModal"
          :disabled="loading"
        >
          Pilih Rentang Tanggal
        </button>

        <!-- 3. Refresh -->
        <button
          class="btn"
          @click="fetchTickets(1)"
          :disabled="loading"
        >
          {{ loading ? 'Refresh...' : 'Refresh' }}
        </button>

        <!-- 4. Logout -->
        <button
          class="btn logout-btn"
          @click="handleLogout"
          :disabled="loading"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- INPUT CARI NAMA -->
    <div
      v-if="showNameInput"
      class="search-name-row"
    >
      <input
        v-model="nameInput"
        type="text"
        placeholder="Input nama penumpang"
        @keyup.enter="applyNameSearch"
      />
      <button
        class="btn small"
        @click="applyNameSearch"
        :disabled="loading || !nameInput.trim()"
      >
        OK
      </button>
      <button
        v-if="activeNameFilter || nameInput"
        class="link-clear"
        type="button"
        @click="clearNameSearch"
      >
        Reset
      </button>
    </div>

    <!-- BADGE FILTER RENTANG TANGGAL -->
    <div
      v-if="activeStartDate || activeEndDate"
      class="filter-badge"
    >
      Rentang:
      <strong>{{ activeStartDate || '...' }}</strong>
      <span>→</span>
      <strong>{{ activeEndDate || '...' }}</strong>
      <button
        type="button"
        class="link-clear"
        @click="clearDateRange"
      >
        ✕
      </button>
    </div>

    <!-- BADGE FILTER NAMA -->
    <div
      v-if="activeNameFilter"
      class="filter-badge"
    >
      Nama:
      <strong>{{ activeNameFilter }}</strong>
      <button
        type="button"
        class="link-clear"
        @click="clearNameSearch"
      >
        ✕
      </button>
    </div>

    <!-- TOTAL TERPILIH -->
    <div
      v-if="selectedKeys.length > 0"
      class="selected-total"
    >
      Total terpilih: <strong>{{ formatPrice(selectedTotal) }}</strong>
    </div>

    <!-- DESKTOP TABLE (scroll area) -->
    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th class="check-col"></th>
            <th>Nomor Pemesanan / PNR</th>
            <th>Penumpang &amp; Rute</th>
            <th>Download PDF Ticket</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && pagedTickets.length === 0">
            <td colspan="5" class="empty">Belum ada data tiket.</td>
          </tr>

          <tr
            v-for="t in pagedTickets"
            :key="ticketKey(t)"
          >
            <!-- Checkbox pilih -->
            <td class="check-col">
              <input
                type="checkbox"
                :value="ticketKey(t)"
                v-model="selectedKeys"
              />
            </td>

            <!-- PNR -->
            <td class="pnr">
              {{ t.pnr || t.booking_no || '-' }}
            </td>

            <!-- Penumpang & Rute -->
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

            <!-- Harga -->
            <td class="price">
              {{ formatPrice(t.price || t.total_price) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MOBILE LIST (scroll area) -->
    <div class="mobile-list">
      <div
        v-if="!loading && pagedTickets.length === 0"
        class="empty"
      >
        Belum ada data tiket.
      </div>

      <div
        v-for="t in pagedTickets"
        :key="ticketKey(t)"
        class="ticket-card"
      >
        <div class="row check-row">
          <label>
            <input
              type="checkbox"
              :value="ticketKey(t)"
              v-model="selectedKeys"
            />
            Pilih
          </label>
        </div>

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

    <!-- PAGINATION (mode normal & filter nama) -->
    <div
      v-if="totalPages > 1"
      class="pagination"
    >
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

    <!-- MODAL RENTANG TANGGAL -->
    <div
      v-if="showDateModal"
      class="modal-backdrop"
      @click.self="closeDateModal"
    >
      <div class="modal">
        <h3>Pilih Rentang Tanggal</h3>
        <label>
          Start Date
          <input
            type="date"
            v-model="tempStartDate"
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            v-model="tempEndDate"
          />
        </label>
        <div class="modal-actions">
          <button
            class="btn"
            @click="applyDateRange"
            :disabled="loading"
          >
            Tampilkan
          </button>
          <button
            class="btn ghost"
            @click="clearDateRange"
            :disabled="loading"
          >
            Reset
          </button>
          <button
            class="btn ghost"
            @click="closeDateModal"
            :disabled="loading"
          >
            Tutup
          </button>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuth } from '../stores/auth';

const API_URL =
  'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

const router = useRouter();

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const pageSize = 10;

/* Filter nama */
const showNameInput = ref(false);
const nameInput = ref('');
const activeNameFilter = ref('');

/* Filter tanggal */
const showDateModal = ref(false);
const tempStartDate = ref('');
const tempEndDate = ref('');
const activeStartDate = ref('');
const activeEndDate = ref('');

/* Checkbox total */
const selectedKeys = ref([]);

/* Build query string sesuai filter & pagination */
const buildQuery = (page = 1) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('pageSize', pageSize);

  if (activeNameFilter.value) {
    params.set('name', activeNameFilter.value);
  }
  if (activeStartDate.value) {
    params.set('startDate', activeStartDate.value);
  }
  if (activeEndDate.value) {
    params.set('endDate', activeEndDate.value);
  }

  return params.toString();
};

/* Ambil data dari server per halaman / filter */
const fetchTickets = async (page = 1) => {
  loading.value = true;
  error.value = '';

  try {
    const qs = buildQuery(page);
    const res = await fetch(`${API_URL}?${qs}`);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');

    const data = await res.json();

    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

    tickets.value = items;
    currentPage.value = data.page || page || 1;
    totalPages.value =
      data.totalPages ||
      Math.max(1, Math.ceil((data.total || items.length || 0) / pageSize));
    total.value =
      data.total != null
        ? data.total
        : items.length;

    // Bersihkan selection untuk tiket yang sudah tidak ada
    const validKeys = new Set(items.map(ticketKey));
    selectedKeys.value = selectedKeys.value.filter((k) =>
      validKeys.has(k)
    );
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

/* Data yang ditampilkan = hasil dari API (sudah per-page / per-filter) */
const pagedTickets = computed(() => tickets.value);

/* Next/Prev panggil server lagi */
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

/* Cari Nama */
const toggleNameSearch = () => {
  showNameInput.value = !showNameInput.value;
  if (!showNameInput.value) {
    // jika ditutup, tidak langsung reset filter; biar badge tetap
    nameInput.value = activeNameFilter.value;
  }
};

const applyNameSearch = () => {
  activeNameFilter.value = nameInput.value.trim();
  currentPage.value = 1;
  fetchTickets(1);
};

const clearNameSearch = () => {
  nameInput.value = '';
  activeNameFilter.value = '';
  currentPage.value = 1;
  fetchTickets(1);
};

/* Rentang tanggal (modal) */
const openDateModal = () => {
  tempStartDate.value = activeStartDate.value;
  tempEndDate.value = activeEndDate.value;
  showDateModal.value = true;
};

const closeDateModal = () => {
  showDateModal.value = false;
};

const applyDateRange = () => {
  activeStartDate.value = tempStartDate.value || '';
  activeEndDate.value = tempEndDate.value || '';
  currentPage.value = 1;
  fetchTickets(1);
  showDateModal.value = false;
};

const clearDateRange = () => {
  tempStartDate.value = '';
  tempEndDate.value = '';
  activeStartDate.value = '';
  activeEndDate.value = '';
  currentPage.value = 1;
  fetchTickets(1);
  showDateModal.value = false;
};

/* Logout */
const handleLogout = () => {
  clearAuth();
  router.push({ name: 'Login' });
};

/* Helper key tiket */
const ticketKey = (t) =>
  t.id ||
  t.pnr ||
  t.booking_no ||
  `${t.operator || ''}-${t.origin || ''}-${t.destination || ''}-${t.date || ''}-${t.time || ''}`;

/* Total harga terpilih */
const selectedTotal = computed(() => {
  if (!selectedKeys.value.length) return 0;

  const keySet = new Set(selectedKeys.value);
  let sum = 0;

  tickets.value.forEach((t) => {
    const key = ticketKey(t);
    if (!keySet.has(key)) return;

    const raw = t.price != null && t.price !== ''
      ? t.price
      : t.total_price;

    if (raw == null || raw === '') return;

    const n = Number(
      typeof raw === 'string'
        ? raw.replace(/[^\d.-]/g, '')
        : raw
    );
    if (!isNaN(n)) {
      sum += n;
    }
  });

  return sum;
});

/* Bersihkan passenger */
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
  gap: 6px;
  flex: 1;
  min-height: 0;
}

/* Header */
.card-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.count-under {
  font-size: 11px;
  color: #1d4ed8;
  background: #eff6ff;
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
}

/* Actions */
.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 10px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #3b82f6;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
  transition: background 0.15s ease, transform 0.05s ease,
    box-shadow 0.1s ease;
  white-space: nowrap;
}

.btn.small {
  padding: 5px 9px;
  font-size: 10px;
}

.btn.ghost {
  background: #ffffff;
  color: #2563eb;
  box-shadow: none;
  border: 1px solid #bfdbfe;
}

.btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn.ghost:hover:not(:disabled) {
  background: #eff6ff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.logout-btn {
  background: #ef4444;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
}

.logout-btn:hover:not(:disabled) {
  background: #dc2626;
}

/* Search nama row */
.search-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -2px;
}

.search-name-row input {
  flex: 1;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 11px;
  outline: none;
}

.search-name-row input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12);
}

/* Filter badges */
.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 9px;
  color: #1f2937;
  margin-top: 2px;
  margin-right: 4px;
}

.link-clear {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 9px;
  cursor: pointer;
  padding: 0 2px;
}

/* Total terpilih */
.selected-total {
  margin-top: 2px;
  font-size: 10px;
  color: #111827;
}

/* Table area */
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

.check-col {
  width: 32px;
  text-align: center;
}

.check-col input {
  cursor: pointer;
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

/* Links & status */
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

/* Mobile */
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

.check-row {
  align-items: flex-start;
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

/* Pagination */
.pagination {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
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

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.modal {
  width: 100%;
  max-width: 320px;
  background: #f9fafb;
  border-radius: 16px;
  padding: 14px 14px 10px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #111827;
}

.modal h3 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}

.modal label {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal input[type="date"] {
  padding: 6px 8px;
  border-radius: 9px;
  border: 1px solid #cbd5e1;
  font-size: 11px;
}

.modal-actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

/* Responsive */
@media (max-width: 767px) {
  .card-head {
    gap: 6px;
    align-items: flex-start;
  }

  .title {
    font-size: 15px;
  }

  .actions {
    justify-content: flex-start;
  }

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
