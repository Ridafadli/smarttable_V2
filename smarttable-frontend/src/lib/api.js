import axios from 'axios';

/**
 * Base URL for the SmartTable REST API (includes `/api` suffix).
 * @type {string}
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Canonical API route paths used across the frontend.
 * Dynamic segments are exposed as functions where applicable.
 * @readonly
 */
export const API_ENDPOINTS = {
  // Health & auth
  HEALTH: '/health',
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  PROFILE: '/profile',

  // Public client
  publicRestaurant: (restaurantId) => `/public/restaurants/${restaurantId}`,
  publicMenus: (restaurantId) => `/menus/public/${restaurantId}`,
  ORDERS: '/orders',
  CHATBOT_MESSAGE: '/chatbot/message',

  // Orders (admin)
  ORDERS_STATS: '/orders/stats',
  order: (id) => `/orders/${id}`,
  orderStatus: (id) => `/orders/${id}/status`,

  // Menus
  MENUS: '/menus',
  menu: (id) => `/menus/${id}`,
  menuRegenerateImage: (id) => `/menus/${id}/regenerate-image`,

  // Tables & QR
  TABLES: '/tables',
  table: (id) => `/tables/${id}`,
  tableReserve: (id) => `/tables/${id}/reserve`,
  tableQrcode: (tableId) => `/tables/${tableId}/qrcode`,
  tableQrcodeDownload: (tableId) => `/tables/${tableId}/qrcode/download`,

  // Reservations
  RESERVATIONS: '/reservations',
  RESERVATIONS_STATS: '/reservations/stats',
  RESERVATIONS_CHECK_CONFLICTS: '/reservations/check-conflicts',
  reservation: (id) => `/reservations/${id}`,

  // Clients
  CLIENTS: '/clients',
  CLIENTS_STATS: '/clients/stats',
  client: (id) => `/clients/${id}`,

  // Invoices
  INVOICES: '/invoices',
  INVOICES_STATS: '/invoices/stats',
  INVOICES_GENERATE: '/invoices/generate',
  invoice: (id) => `/invoices/${id}`,
  invoicePdf: (id) => `/invoices/${id}/pdf`,
  invoicePrint: (id) => `/invoices/${id}/print`,
  invoiceCancel: (id) => `/invoices/${id}/cancel`,

  // Stock & ingredients
  STOCK_STATS: '/stock/stats',
  STOCK_ALERTS: '/stock/alerts',
  STOCK_MOVEMENTS: '/stock/movements',
  INGREDIENTS: '/ingredients',
  ingredient: (id) => `/ingredients/${id}`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  notificationRead: (id) => `/notifications/${id}/read`,
  notification: (id) => `/notifications/${id}`,

  // Employees (Enterprise)
  EMPLOYEES: '/employees',
  EMPLOYEES_STATS: '/employees/stats',
  EMPLOYEES_PERMISSIONS_CONFIG: '/employees/permissions-config',
  EMPLOYEES_ACTIVITY: '/employees/activity',
  employee: (id) => `/employees/${id}`,

  // Statistics (Pro+)
  STATISTICS: '/statistics',
  STATISTICS_DAILY: '/statistics/daily',
  STATISTICS_POPULAR: '/statistics/popular',
  STATISTICS_REPORT: '/statistics/report',
  STATISTICS_EXPORT_PDF: '/statistics/export/pdf',
  STATISTICS_EXPORT_EXCEL: '/statistics/export/excel',
};

/**
 * Shared Axios instance for SmartTable API calls.
 * Attaches the bearer token when present and handles global 401 responses.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
