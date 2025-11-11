<template>
  <div class="ticket-table">
    <!-- HEADER DI DALAM CARD -->
    <div class="card-head">
      <div class="head-left">
        <div class="title">Tiket Issued Trip.com</div>
        <div class="total-label">Total tiket: {{ total }}</div>
      </div>

      <div class="actions">
        <!-- 1. CARI NAMA -->
        <div class="search-group">
          <button
            class="btn"
            @click="toggleNameSearch"
            :disabled="loading"
          >
            Cari Nama
          </button>
          <div
            v-if="showNameInput"
            class="search-inline"
          >
            <input
              v-model="searchName"
              type="text"
              placeholder="Input nama"
              @keyup.enter="applyNameSearch"
            />
            <button
              class="btn small"
              @click="applyNameSearch"
              :disabled="loading"
            >
              Ok
            </button>
          </div>
        </div>

        <!-- 2. PILIH RENTANG TANGGAL -->
        <button
          class="btn"
          @click="openDateModal"
          :disabled="loading"
        >
          Pilih Rentang Tanggal
        </button>

        <!-- 3. REFRESH -->
        <button
          class="btn"
          @click="resetFiltersAndReload"
          :disabled="loading"
        >
          {{ loading ? 'Refresh...' : 'Refresh' }}
        </button>

        <!-- 4. LOGOUT -->
        <button
          class="btn logout"
          @click="logout"
          :disabled="loading"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- SELECTED TOTAL SUMMARY -->
    <div class="selected-summary">
      Total harga tercentang:
      <strong>{{ formattedSelectedTotal }}</strong>
    </div>

    <!-- DESKTOP TABLE (scroll area) -->
    <div class="table-wrap desktop-only">
      <table>
        <thead>
          <tr>
            <th>Nomor Pemesanan / PNR</th>
            <th>Penumpang &amp; Rute</th>
            <th>Download PDF Ticket</th>
            <th>Total Harga (centang)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && pagedTickets.length === 0">
            <td colspan="4" class="empty">Belum ada data tiket.</td>
          </tr>

          <tr
            v-for="t in pagedTickets"
            :key="t.id || t.pnr"
          >
            <td class="pnr">
              {{ t.pnr || t.booking_no || '-' }}
            </td>

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
              <label class="price-check">
                <input
                  type="checkbox"
                  :checked="isSelected(t)"
                  @change="toggleSelected(t, $event)"
                />
                <span>{{ formatPrice(t.price || t.total_price) }}</span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MOBILE LIST -->
    <div class="mobile-list">
      <div
        v-if="!loading && pagedTickets.length === 0"
        class="empty"
      >
        Belum ada data tiket.
      </div>

      <div
        v-for="t in pagedTickets"
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
          <div class="label">Total Harga (centang)</div>
          <div class="value strong">
            <label class="price-check">
              <input
                type="checkbox"
                :checked="isSelected(t)"
                @change="toggleSelected(t, $event)"
              />
              <span>{{ formatPrice(t.price || t.total_price) }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGINATION (hanya mode normal; filter range/nama dikontrol dari API yg balikin totalPages=1) -->
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

    <!-- ERROR -->
    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>

    <!-- MODAL RENTANG TANGGAL -->
    <div
      v-if="showDateModal"
      class="modal-overlay"
    >
      <div class="modal">
        <h3>Pilih Rentang Tanggal</h3>
        <label>
          Start date
          <input
            type="date"
            v-model="rangeStart"
          />
        </label>
        <label>
          End date
          <input
            type="date"
            v-model="rangeEnd"
          />
        </label>
        <div class="modal-actions">
          <button
            class="btn small"
            @click="applyDateRange"
            :disabled="loading"
          >
            Tampilkan
          </button>
          <button
            class="btn ghost small"
            @click="closeDateModal"
            :disabled="loading"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuth } from '../stores/auth';

const router = useRouter();

const API_URL =
  'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const pageSize = 10;

/* Filter state */
const currentFilters = ref({
  startDate: '',
  endDate: '',
  name: ''
});

/* Cari nama */
const showNameInput = ref(false);
const searchName = ref('');

/* Rentang tanggal modal */
const showDateModal = ref(false);
const rangeStart = ref('');
const rangeEnd = ref('');

/* Checkbox total harga */
const selectedTickets = ref({}); // key -> numeric price

const buildQueryUrl = (page) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('pageSize', pageSize);

  if (currentFilters.value.startDate) {
    params.set('startDate', currentFilters.value.startDate);
  }
  if (currentFilters.value.endDate) {
    params.set('endDate', currentFilters.value.endDate);
  }
  if (currentFilters.value.name) {
    params.set('name', currentFilters.value.name);
  }

  return `${API_URL}?${params.toString()}`;
};

/* Ambil data dari server per halaman / filter */
const fetchTickets = async (page = 1) => {
  loading.value = true;
  error.value = '';

  try {
    const url = buildQueryUrl(page);
    const res = await fetch(url);
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

    // reset centang setiap kali data berubah
    selectedTickets.value = {};
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

/* Data yang ditampilkan = tickets dari server */
const pagedTickets = computed(() => tickets.value);

/* Next/Prev mengikuti filter aktif */
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

/* ====== Cari Nama ====== */

const toggleNameSearch = () => {
  showNameInput.value = !showNameInput.value;

  if (!showNameInput.value) {
    // tutup → reset nama & reload normal
    searchName.value = '';
    currentFilters.value.name = '';
    fetchTickets(1);
  }
};

const applyNameSearch = () => {
  currentFilters.value.name = searchName.value.trim();
  fetchTickets(1);
};

/* ====== Rentang Tanggal ====== */

const openDateModal = () => {
  showDateModal.value = true;
};

const closeDateModal = () => {
  showDateModal.value = false;
};

const applyDateRange = () => {
  currentFilters.value.startDate = rangeStart.value || '';
  currentFilters.value.endDate = rangeEnd.value || '';
  showDateModal.value = false;
  fetchTickets(1);
};

/* ====== Refresh: reset semua filter ====== */

const resetFiltersAndReload = () => {
  currentFilters.value = {
    startDate: '',
    endDate: '',
    name: ''
  };
  searchName.value = '';
  rangeStart.value = '';
  rangeEnd.value = '';
  showNameInput.value = false;
  showDateModal.value = false;
  fetchTickets(1);
};

/* ====== Logout ====== */

const logout = () => {
  try {
    clearAuth && clearAuth();
  } catch (e) {
    // ignore
  }
  router.push({ name: 'Login' });
};

/* ====== Checkbox & Total Harga Tercentang ====== */

const rowKey = (t) =>
  t.id ||
  t.pnr ||
  t.booking_no ||
  `${t.pnr || ''}-${t.date || ''}-${t.time || ''}`;

const getNumericPrice = (t) => {
  const raw = t.price != null && t.price !== ''
    ? t.price
    : t.total_price;
  if (raw == null || raw === '') return 0;

  const n = Number(
    typeof raw === 'string'
      ? raw.replace(/[^\d.-]/g, '')
      : raw
  );
  return isNaN(n) ? 0 : n;
};

const isSelected = (t) => {
  const key = rowKey(t);
  return !!selectedTickets.value[key];
};

const toggleSelected = (t, event) => {
  const checked = event.target.checked;
  const key = rowKey(t);
  const copy = { ...selectedTickets.value };

  if (checked) {
    copy[key] = getNumericPrice(t);
  } else {
    delete copy[key];
  }

  selectedTickets.value = copy;
};

const selectedTotal = computed(() =>
  Object.values(selectedTickets.value).reduce(
    (sum, v) => sum + (v || 0),
    0
  )
);

const formattedSelectedTotal = computed(() => {
  if (!selectedTotal.value) return '-';
  return selectedTotal.value.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  });
});

/* ====== Helper display ====== */

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

/* Initial load: 10 tiket pertama (page=1, tanpa filter) */
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

/* Header */
.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
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

.total-label {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
}

/* Actions */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #3b82f6;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
  transition: background 0.15s ease, transform 0.05s ease, box-shadow 0.1s ease;
  white-space: nowrap;
}

.btn.small {
  padding: 4px 9px;
  font-size: 10px;
  box-shadow: none;
}

.btn.logout {
  background: #ef4444;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
}

.btn.ghost {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn.logout:hover:not(:disabled) {
  background: #dc2626;
}

.btn.ghost:hover:not(:disabled) {
  background: #f3f4ff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

/* Cari nama inline */
.search-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-inline {
  display: flex;
  gap: 4px;
  align-items: center;
}

.search-inline input {
  padding: 5px 8px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 10px;
  min-width: 120px;
  outline: none;
}

.search-inline input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

/* Selected total summary */
.selected-summary {
  font-size: 10px;
  color: #4b5563;
}

.selected-summary strong {
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

/* Checkbox + harga */
.price-check {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-check input[type='checkbox'] {
  width: 13px;
  height: 13px;
  cursor: pointer;
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

/* Mobile list */
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

/* Modal rentang tanggal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal {
  background: #ffffff;
  padding: 14px 16px 12px;
  border-radius: 14px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
  font-size: 12px;
  color: #111827;
}

.modal h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.modal label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: #4b5563;
}

.modal input[type='date'] {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 11px;
  outline: none;
}

.modal input[type='date']:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

/* Responsive */
@media (max-width: 767px) {
  .card-head {
    gap: 6px;
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
