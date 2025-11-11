import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Facility endpoints
  async createFacility(data: any) {
    const response = await this.client.post('/facilities', data);
    return response.data;
  }

  async getAllFacilities() {
    const response = await this.client.get('/facilities');
    return response.data;
  }

  async getFacilityById(id: number) {
    const response = await this.client.get(`/facilities/${id}`);
    return response.data;
  }

  async updateFacility(id: number, data: any) {
    const response = await this.client.put(`/facilities/${id}`, data);
    return response.data;
  }

  async deleteFacility(id: number) {
    const response = await this.client.delete(`/facilities/${id}`);
    return response.data;
  }

  // Invoice endpoints
  async createInvoice(formData: FormData) {
    const response = await this.client.post('/invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAllInvoices(params?: any) {
    const response = await this.client.get('/invoices', { params });
    return response.data;
  }

  async getInvoiceById(id: number) {
    const response = await this.client.get(`/invoices/${id}`);
    return response.data;
  }

  async updateInvoiceStatus(id: number, status: string) {
    const response = await this.client.put(`/invoices/${id}/status`, { status });
    return response.data;
  }

  async deleteInvoice(id: number) {
    const response = await this.client.delete(`/invoices/${id}`);
    return response.data;
  }

  async getInvoiceStats() {
    const response = await this.client.get('/invoices/stats');
    return response.data;
  }

  // Payment endpoints
  async uploadPaymentProof(formData: FormData) {
    const response = await this.client.post('/payments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPaymentProofs(invoiceId: number) {
    const response = await this.client.get(`/payments/invoice/${invoiceId}`);
    return response.data;
  }

  async getAllPaymentProofs() {
    const response = await this.client.get('/payments/all');
    return response.data;
  }

  async deletePaymentProof(id: number) {
    const response = await this.client.delete(`/payments/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();
