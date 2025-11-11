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

      <!-- SEARCH BAR -->
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
                  <span
                    v-if="cleanOrigin(t) && cleanDestination(t)"
                  >
                    &nbsp;| {{ cleanOrigin(t) }} ➜ {{ cleanDestination(t) }}
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
                <span
                  v-if="cleanOrigin(t) && cleanDestination(t)"
                >
                  &nbsp;| {{ cleanOrigin(t) }} ➜ {{ cleanDestination(t) }}
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

      <!-- PAGINATION -->
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
const isFilterMode = ref(false);

// Range modal
const showModal = ref(false);
const startDate = ref('');
const endDate = ref('');

// Search nama
const showSearch = ref(false);
const searchName = ref('');

// Checkbox
const selectedKeys = ref([]);

/* AUTH */
const logout = () => {
  clearAuth();
  router.push({ name: 'Login' });
};

/* Utils */

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

// Hapus kalimat marketing / junk
const cleanJunk = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/Kami akan segera menerbitkan tiket Anda/gi, ' ')
    .replace(/Kami tengah memantau status penerbitan tiket dengan saksama/gi, ' ')
    .replace(/Kami telah menerima pembayaran tiket pesawat Anda/gi, ' ')
    .replace(/Kami akan segera memprosesnya!?/gi, ' ')
    .replace(/Tiket akan diterbitkan dalam waktu[^.\n]*/gi, ' ')
    .replace(/\bicon\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/* FETCH: MODE NORMAL */

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

/* Passenger & Route cleaning */

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

  raw = cleanJunk(raw);

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

const cleanOrigin = (t) => cleanJunk(t.origin || '');
const cleanDestination = (t) => cleanJunk(t.destination || '');

const depDate = (t) =>
  t.date || t.departure_date || t.flight_date || '';

const depTime = (t) =>
  cleanJunk(t.time || t.departure_time || '');

const airline = (t) =>
  cleanJunk(t.operator || t.airline || '');

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
/* (style tetap persis seperti yang kamu kirim, tidak diubah) */
</style>
