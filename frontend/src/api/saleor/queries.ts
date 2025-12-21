import { query, DEFAULT_CHANNEL } from '@/lib/saleor';

// Type definitions
export interface Money {
  amount: number;
  currency: string;
}

export interface ProductThumbnail {
  url: string;
  alt?: string;
}

export interface ProductPricing {
  priceRange: {
    start: {
      gross: Money;
    };
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  pricing?: {
    price: {
      gross: Money;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: ProductThumbnail;
  pricing?: ProductPricing;
  variants?: ProductVariant[];
}

export interface ProductEdge {
  node: Product;
}

export interface ProductsResponse {
  products: {
    edges: ProductEdge[];
  };
}

export interface ProductResponse {
  product: Product | null;
}

export interface CheckoutLine {
  id: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnail?: ProductThumbnail;
    };
  };
  totalPrice: {
    gross: Money;
  };
}

export interface Checkout {
  id: string;
  email?: string;
  lines: CheckoutLine[];
  totalPrice: {
    gross: Money;
  };
}

export interface CheckoutResponse {
  checkout: Checkout | null;
}

// Stored payment methods types
export interface StoredPaymentMethod {
  id: string;
  type: string;
  name?: string;
  data?: {
    brand?: string;
    lastDigits?: string;
    expMonth?: number;
    expYear?: number;
  };
}

export interface CheckoutStoredPaymentMethodsResponse {
  checkout: {
    storedPaymentMethods: StoredPaymentMethod[];
  } | null;
}

export interface UserStoredPaymentMethodsResponse {
  me: {
    storedPaymentMethods: StoredPaymentMethod[];
  } | null;
}

// Queries
const PRODUCTS_QUERY = `
  query Products($channel: String!, $first: Int) {
    products(first: $first, channel: $channel) {
      edges {
        node {
          id
          name
          slug
          description
          thumbnail {
            url
            alt
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query Product($slug: String!, $channel: String!) {
    product(slug: $slug, channel: $channel) {
      id
      name
      slug
      description
      thumbnail {
        url
        alt
      }
      pricing {
        priceRange {
          start {
            gross {
              amount
              currency
            }
          }
        }
      }
      variants {
        id
        name
        pricing {
          price {
            gross {
              amount
              currency
            }
          }
        }
      }
    }
  }
`;

const CHECKOUT_QUERY = `
  query Checkout($id: ID!) {
    checkout(id: $id) {
      id
      email
      lines {
        id
        quantity
        variant {
          id
          name
          product {
            id
            name
            slug
            thumbnail {
              url
              alt
            }
          }
        }
        totalPrice {
          gross {
            amount
            currency
          }
        }
      }
      totalPrice {
        gross {
          amount
          currency
        }
      }
    }
  }
`;

// Stored payment methods queries
const CHECKOUT_STORED_PAYMENT_METHODS_QUERY = `
  query CheckoutStoredPaymentMethods($id: ID!, $channel: String!) {
    checkout(id: $id) {
      storedPaymentMethods(channel: $channel) {
        id
        type
        name
        data
      }
    }
  }
`;

const USER_STORED_PAYMENT_METHODS_QUERY = `
  query UserStoredPaymentMethods($channel: String!) {
    me {
      storedPaymentMethods(channel: $channel) {
        id
        type
        name
        data
      }
    }
  }
`;

// Query functions
export async function fetchProducts(first: number = 100): Promise<Product[]> {
  const data = await query<ProductsResponse>(PRODUCTS_QUERY, {
    channel: DEFAULT_CHANNEL,
    first,
  });
  return data.products.edges.map((edge) => edge.node);
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  const data = await query<ProductResponse>(PRODUCT_QUERY, {
    slug,
    channel: DEFAULT_CHANNEL,
  });
  return data.product;
}

export async function fetchCheckout(id: string): Promise<Checkout | null> {
  const data = await query<CheckoutResponse>(CHECKOUT_QUERY, { id });
  return data.checkout;
}

/**
 * Fetch stored payment methods for a checkout.
 * These are cards saved by the customer for future use.
 */
export async function fetchCheckoutStoredPaymentMethods(
  checkoutId: string
): Promise<StoredPaymentMethod[]> {
  const data = await query<CheckoutStoredPaymentMethodsResponse>(
    CHECKOUT_STORED_PAYMENT_METHODS_QUERY,
    {
      id: checkoutId,
      channel: DEFAULT_CHANNEL,
    }
  );
  return data.checkout?.storedPaymentMethods || [];
}

/**
 * Fetch stored payment methods for the current user.
 * Requires the user to be authenticated with Saleor.
 */
export async function fetchUserStoredPaymentMethods(): Promise<StoredPaymentMethod[]> {
  const data = await query<UserStoredPaymentMethodsResponse>(
    USER_STORED_PAYMENT_METHODS_QUERY,
    {
      channel: DEFAULT_CHANNEL,
    }
  );
  return data.me?.storedPaymentMethods || [];
}
