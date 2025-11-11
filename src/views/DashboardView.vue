<template>
  <div class="page">
    <div class="card">
      <!-- HEADER DALAM CARD -->
      <div class="card-head">
        <div>
          <div class="title">Tiket Issued Trip.com</div>
          <div class="total-label">
            Total: {{ total }}
            <span v-if="isFilterMode" class="badge-filter">
              (filter aktif)
            </span>
          </div>
        </div>

        <div class="actions">
          <!-- 1. Cari Nama -->
          <button
            type="button"
            class="btn"
            @click="openSearch"
            :disabled="loading"
          >
            Cari
          </button>

          <!-- 2. Pilih Rentang Tanggal -->
          <button
            type="button"
            class="btn outline"
            @click="openRangeModal"
            :disabled="loading"
          >
            Pilih Tanggal
          </button>

          <!-- 3. Refresh -->
          <button
            type="button"
            class="btn"
            @click="refresh"
            :disabled="loading"
          >
            {{ loading ? 'Refresh...' : 'Refresh' }}
          </button>

          <!-- 4. Logout -->
          <button
            type="button"
            class="btn danger"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- SEARCH BAR (muncul setelah klik "Cari Nama") -->
      <div v-if="showSearch" class="search-bar">
        <input
          v-model="searchName"
          type="text"
          class="search-input"
          placeholder="Input nama"
        />
        <button
          class="btn small"
          type="button"
          @click="applySearch"
          :disabled="loading || !searchName.trim()"
        >
          Ok
        </button>
        <button
          class="btn small outline"
          type="button"
          @click="cancelSearch"
          :disabled="loading"
        >
          Batal
        </button>
      </div>

      <!-- DESKTOP TABLE -->
      <div class="table-wrap desktop-only">
        <table>
          <thead>
            <tr>
              <th>Pilih</th>
              <th>Nomor Pemesanan / PNR</th>
              <th>Penumpang &amp; Rute</th>
              <th>Download PDF Ticket</th>
              <th>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && tickets.length === 0">
              <td colspan="5" class="empty">Belum ada data tiket.</td>
            </tr>

            <tr v-for="t in tickets" :key="ticketKey(t)">
              <td class="select">
                <input
                  type="checkbox"
                  :value="ticketKey(t)"
                  v-model="selectedKeys"
                />
              </td>
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
                {{ formatPrice(t.price || t.total_price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MOBILE LIST -->
      <div class="mobile-list">
        <div v-if="!loading && tickets.length === 0" class="empty">
          Belum ada data tiket.
        </div>

        <div
          v-for="t in tickets"
          :key="ticketKey(t)"
          class="ticket-card"
        >
          <div class="row select-row">
            <label>
              <input
                type="checkbox"
                :value="ticketKey(t)"
                v-model="selectedKeys"
              />
              Pilih tiket ini
            </label>
          </div>

          <div class="row">
            <div class="label">Nomor Pemesanan / PNR</div>
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
            <div class="label">Tanggal & Rute</div>
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

      <!-- PAGINATION: hanya mode normal (tanpa filter) -->
      <div
        v-if="!isFilterMode && totalPages > 1"
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

      <!-- TOTAL TERPILIH -->
      <div v-if="selectedKeys.length" class="selected-total">
        Total harga tiket terpilih:
        <strong>{{ formatPrice(selectedTotal) }}</strong>
      </div>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <!-- MODAL RENTANG TANGGAL -->
      <div v-if="showModal" class="modal-backdrop">
        <div class="modal">
          <h3>Pilih Rentang Tanggal</h3>

          <label>
            Tanggal mulai
            <input type="date" v-model="startDate" />
          </label>

          <label>
            Tanggal akhir
            <input type="date" v-model="endDate" />
          </label>

          <div class="modal-actions">
            <button
              class="modal-submit"
              type="button"
              @click="applyRange"
              :disabled="loading"
            >
              {{ loading ? 'Memuat...' : 'Tampilkan' }}
            </button>
            <button
              class="modal-cancel"
              type="button"
              @click="closeRangeModal"
              :disabled="loading"
            >
              Batal
            </button>
          </div>

          <p class="hint">
            Kosongkan salah satu jika hanya ingin filter dari / hingga tanggal
            tertentu.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuth, getAuth } from '../stores/auth';

const API_URL =
  'https://tripcom-worker.alhamidbook.workers.dev/api/tickets';

const router = useRouter();
const auth = getAuth();
const authUser = auth ? auth.user : null;

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

// Filter modes
const isFilterMode = ref(false); // true jika cari nama atau rentang tanggal aktif

// Range modal
const showModal = ref(false);
const startDate = ref('');
const endDate = ref('');

// Search nama
const showSearch = ref(false);
const searchName = ref('');

// Checkbox total
const selectedKeys = ref([]);

/* AUTH */
const logout = () => {
  clearAuth();
  router.push({ name: 'Login' });
};

/* Helpers */

const ticketKey = (t) =>
  t.id ||
  t.pnr ||
  t.booking_no ||
  `${t.source || 'trip'}-${t.pnr || ''}-${t.date || ''}-${t.time || ''}`;

const parsePriceNumber = (price) => {
  if (price == null || price === '') return 0;
  if (typeof price === 'number') return price;
  const n = Number(String(price).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const selectedTotal = computed(() => {
  const set = new Set(selectedKeys.value);
  return tickets.value.reduce((sum, t) => {
    const key = ticketKey(t);
    if (!set.has(key)) return sum;
    const num = parsePriceNumber(t.price ?? t.total_price);
    return sum + num;
  }, 0);
});

/* FETCH: MODE NORMAL (PAGINATED) */

const fetchPage = async (page = 1) => {
  loading.value = true;
  error.value = '';
  isFilterMode.value = false;
  selectedKeys.value = [];

  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');

    const data = await res.json();
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    tickets.value = items;
    total.value =
      typeof data.total === 'number' ? data.total : items.length;
    currentPage.value =
      typeof data.page === 'number' ? data.page : page;
    totalPages.value =
      typeof data.totalPages === 'number'
        ? data.totalPages
        : Math.max(1, Math.ceil(total.value / pageSize));
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

/* FETCH: RANGE */

const fetchRangeTickets = async () => {
  loading.value = true;
  error.value = '';
  selectedKeys.value = [];

  try {
    const params = new URLSearchParams();
    if (startDate.value) params.append('startDate', startDate.value);
    if (endDate.value) params.append('endDate', endDate.value);

    const url =
      params.toString().length > 0
        ? `${API_URL}?${params.toString()}`
        : API_URL;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');

    const data = await res.json();
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    tickets.value = items;
    total.value =
      typeof data.total === 'number' ? data.total : items.length;
    currentPage.value = 1;
    totalPages.value = 1;
    isFilterMode.value = true;
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

/* FETCH: SEARCH NAMA */

const fetchByName = async (name) => {
  loading.value = true;
  error.value = '';
  selectedKeys.value = [];

  try {
    const params = new URLSearchParams();
    params.append('name', name);

    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil data tiket');

    const data = await res.json();
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    tickets.value = items;
    total.value =
      typeof data.total === 'number' ? data.total : items.length;
    currentPage.value = 1;
    totalPages.value = 1;
    isFilterMode.value = true;
  } catch (e) {
    error.value = e.message || 'Failed to fetch';
  } finally {
    loading.value = false;
  }
};

/* ACTIONS */

// Refresh ke mode normal halaman 1
const refresh = () => {
  startDate.value = '';
  endDate.value = '';
  searchName.value = '';
  showSearch.value = false;
  isFilterMode.value = false;
  fetchPage(1);
};

const nextPage = () => {
  if (!isFilterMode.value && currentPage.value < totalPages.value && !loading.value) {
    fetchPage(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (!isFilterMode.value && currentPage.value > 1 && !loading.value) {
    fetchPage(currentPage.value - 1);
  }
};

// Range modal
const openRangeModal = () => {
  showModal.value = true;
};

const closeRangeModal = () => {
  showModal.value = false;
};

const applyRange = async () => {
  showModal.value = false;
  await fetchRangeTickets();
};

// Search nama
const openSearch = () => {
  showSearch.value = true;
};

const cancelSearch = () => {
  showSearch.value = false;
  searchName.value = '';
};

const applySearch = async () => {
  const name = searchName.value.trim();
  if (!name) return;
  showSearch.value = false;
  await fetchByName(name);
};

/* Passenger cleaning */

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
  const n = parsePriceNumber(price);
  if (!n) return '-';
  return n.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  });
};

onMounted(() => {
  fetchPage(1);
});
</script>

<style scoped>
.page {
  height: 100vh;
  padding: 18px;
  box-sizing: border-box;
  background: linear-gradient(
    135deg,
    #0052ff 0%,
    #1da0ff 35%,
    #4fd5ff 65%,
    #ff6ad5 100%
  );
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.card {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  background: #f5f7fb;
  border-radius: 18px;
  padding: 18px 18px 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(148, 163, 253, 0.18);
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

/* Header */
.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.total-label {
  margin-top: 2px;
  font-size: 13px;
  color: #111827;
}

.badge-filter {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 10px;
}

/* Actions */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
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
  transition: all 0.15s ease;
}

.btn.small {
  padding: 4px 10px;
  font-size: 10px;
  box-shadow: none;
}

.btn.outline {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  box-shadow: none;
}

.btn.danger {
  background: #ef4444;
  color: #f9fafb;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.35);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #2563eb;
}

.btn.outline:hover:not(:disabled) {
  background: #dbeafe;
  transform: translateY(-1px);
}

.btn.danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -4px;
  margin-bottom: 2px;
  font-size: 11px;
}

.search-input {
  flex: 0 0 180px;
  padding: 5px 8px;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  font-size: 11px;
  outline: none;
}

/* Table wrap */
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

.select {
  width: 40px;
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

.select-row {
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
  margin-top: 6px;
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

/* Selected total */
.selected-total {
  margin-top: 4px;
  font-size: 11px;
  color: #111827;
}

/* Error */
.error {
  margin-top: 4px;
  font-size: 11px;
  color: #dc2626;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #ffffff;
  padding: 16px 16px 12px;
  border-radius: 14px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #111827;
}

.modal h3 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.modal label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10px;
  color: #4b5563;
}

.modal input[type='date'] {
  padding: 5px 6px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 11px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.modal-submit {
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
}

.modal-cancel {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  font-size: 10px;
  cursor: pointer;
}

.hint {
  margin: 2px 0 0;
  font-size: 9px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 767px) {
  .page {
    padding: 10px;
  }

  .card {
    padding: 12px 10px 8px;
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

  .actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }
}
</style>
