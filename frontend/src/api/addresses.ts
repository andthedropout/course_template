import { getCSRFToken } from '@/lib/getCookie';

const API_BASE = '/api/v1/users/addresses';

export interface UserAddress {
  id: number;
  label: string;
  first_name: string;
  last_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  label?: string;
  first_name: string;
  last_name: string;
  street_address: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function fetchWithCsrf(url: string, options: RequestInit = {}) {
  const csrfToken = getCSRFToken();
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Fetch all saved addresses for the current user
 */
export async function fetchAddresses(): Promise<UserAddress[]> {
  return fetchWithAuth(`${API_BASE}/`);
}

/**
 * Fetch a single address by ID
 */
export async function fetchAddress(id: number): Promise<UserAddress> {
  return fetchWithAuth(`${API_BASE}/${id}/`);
}

/**
 * Create a new saved address
 */
export async function createAddress(address: CreateAddressInput): Promise<UserAddress> {
  return fetchWithCsrf(`${API_BASE}/`, {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

/**
 * Update an existing address
 */
export async function updateAddress(id: number, address: UpdateAddressInput): Promise<UserAddress> {
  return fetchWithCsrf(`${API_BASE}/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(address),
  });
}

/**
 * Delete a saved address
 */
export async function deleteAddress(id: number): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Set an address as the default
 */
export async function setDefaultAddress(id: number): Promise<UserAddress> {
  return fetchWithCsrf(`${API_BASE}/${id}/set_default/`, {
    method: 'POST',
  });
}
