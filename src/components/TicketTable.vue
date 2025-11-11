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

    <!-- DESKTOP -->
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

    <!-- MOBILE -->
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
          <div class="label">Tanggal &amp; Rute</div>
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

// utility buang junk
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

  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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
/* (style sama seperti versi kamu, tidak diubah) */
</style>
