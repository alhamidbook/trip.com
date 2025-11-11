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
              {{ displayPnr(t) }}
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
            {{ displayPnr(t) }}
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

/* PNR DISPLAY HELPERS */

const extractRealPnr = (t) => {
  if (t.real_pnr) return String(t.real_pnr).trim();
  const extra = t.extra ? String(t.extra) : '';
  const m = extra.match(/PNR=([A-Z0-9]{5,8})/i);
  return m ? m[1].toUpperCase() : '';
};

const extractBookingNo = (t) => {
  const p = t.pnr ? String(t.pnr).trim() : '';
  if (/^\d{8,}$/.test(p)) return p;

  const extra = t.extra ? String(t.extra) : '';
  const m = extra.match(/NoPemesanan=(\d+)/i);
  return m ? m[1] : '';
};

const displayPnr = (t) => {
  const booking = extractBookingNo(t);
  const real = extractRealPnr(t);

  const dbPnr = t.pnr ? String(t.pnr).trim() : '';
  const isDbPnrCode = dbPnr && !/^\d{8,}$/.test(dbPnr);
  const finalPnr = real || (isDbPnrCode ? dbPnr : '');

  if (booking && finalPnr && booking !== finalPnr) {
    return `${booking} / ${finalPnr}`;
  }

  return booking || finalPnr || dbPnr || '-';
};

/* Passenger helpers */

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
/* (CSS sama seperti sebelumnya, tidak diubah kecuali teks PNR pakai helper) */
.ticket-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

/* ...dst, biarkan sesuai kode asli... */
</style>
