import { mutate, DEFAULT_CHANNEL } from '@/lib/saleor';
import type { Checkout } from './queries';

// Types for mutation responses
export interface CheckoutError {
  field: string;
  message: string;
  code?: string;
}

export interface CheckoutCreateResponse {
  checkoutCreate: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface CheckoutLinesAddResponse {
  checkoutLinesAdd: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface CheckoutLinesUpdateResponse {
  checkoutLinesUpdate: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface CheckoutLinesDeleteResponse {
  checkoutLineDelete: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface CheckoutEmailUpdateResponse {
  checkoutEmailUpdate: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface CheckoutBillingAddressUpdateResponse {
  checkoutBillingAddressUpdate: {
    checkout: Checkout | null;
    errors: CheckoutError[];
  };
}

export interface AddressInput {
  firstName: string;
  lastName: string;
  streetAddress1: string;
  city: string;
  postalCode: string;
  country: string;
  countryArea?: string;
}

export interface Order {
  id: string;
  number: string;
}

export interface CheckoutCompleteResponse {
  checkoutComplete: {
    order: Order | null;
    errors: CheckoutError[];
  };
}

export interface Payment {
  id: string;
  chargeStatus: string;
}

export interface CheckoutPaymentCreateResponse {
  checkoutPaymentCreate: {
    checkout: Checkout | null;
    payment: Payment | null;
    errors: CheckoutError[];
  };
}

// Mutation definitions
const CHECKOUT_CREATE_MUTATION = `
  mutation CheckoutCreate($channel: String!, $lines: [CheckoutLineInput!]!) {
    checkoutCreate(input: { channel: $channel, lines: $lines }) {
      checkout {
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
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_LINES_ADD_MUTATION = `
  mutation CheckoutLinesAdd($checkoutId: ID!, $lines: [CheckoutLineInput!]!) {
    checkoutLinesAdd(id: $checkoutId, lines: $lines) {
      checkout {
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
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_LINES_UPDATE_MUTATION = `
  mutation CheckoutLinesUpdate($checkoutId: ID!, $lines: [CheckoutLineUpdateInput!]!) {
    checkoutLinesUpdate(id: $checkoutId, lines: $lines) {
      checkout {
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
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_LINE_DELETE_MUTATION = `
  mutation CheckoutLineDelete($checkoutId: ID!, $lineId: ID!) {
    checkoutLineDelete(id: $checkoutId, lineId: $lineId) {
      checkout {
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
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_EMAIL_UPDATE_MUTATION = `
  mutation CheckoutEmailUpdate($checkoutId: ID!, $email: String!) {
    checkoutEmailUpdate(id: $checkoutId, email: $email) {
      checkout {
        id
        email
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_BILLING_ADDRESS_UPDATE_MUTATION = `
  mutation CheckoutBillingAddressUpdate($checkoutId: ID!, $billingAddress: AddressInput!) {
    checkoutBillingAddressUpdate(id: $checkoutId, billingAddress: $billingAddress) {
      checkout {
        id
        billingAddress {
          firstName
          lastName
          country {
            code
          }
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_COMPLETE_MUTATION = `
  mutation CheckoutComplete($checkoutId: ID!) {
    checkoutComplete(id: $checkoutId) {
      order {
        id
        number
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const CHECKOUT_PAYMENT_CREATE_MUTATION = `
  mutation CheckoutPaymentCreate($checkoutId: ID!, $input: PaymentInput!) {
    checkoutPaymentCreate(id: $checkoutId, input: $input) {
      checkout {
        id
      }
      payment {
        id
        chargeStatus
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

// Line input type
export interface CheckoutLineInput {
  variantId: string;
  quantity: number;
}

export interface CheckoutLineUpdateInput {
  lineId: string;
  quantity: number;
}

// Mutation functions
export async function createCheckout(
  lines: CheckoutLineInput[]
): Promise<Checkout> {
  const data = await mutate<CheckoutCreateResponse>(CHECKOUT_CREATE_MUTATION, {
    channel: DEFAULT_CHANNEL,
    lines,
  });

  if (data.checkoutCreate.errors.length > 0) {
    throw new Error(data.checkoutCreate.errors[0].message);
  }

  if (!data.checkoutCreate.checkout) {
    throw new Error('Failed to create checkout');
  }

  return data.checkoutCreate.checkout;
}

export async function addToCheckout(
  checkoutId: string,
  lines: CheckoutLineInput[]
): Promise<Checkout> {
  const data = await mutate<CheckoutLinesAddResponse>(
    CHECKOUT_LINES_ADD_MUTATION,
    {
      checkoutId,
      lines,
    }
  );

  if (data.checkoutLinesAdd.errors.length > 0) {
    throw new Error(data.checkoutLinesAdd.errors[0].message);
  }

  if (!data.checkoutLinesAdd.checkout) {
    throw new Error('Failed to add items to checkout');
  }

  return data.checkoutLinesAdd.checkout;
}

export async function updateCheckoutLine(
  checkoutId: string,
  lineId: string,
  quantity: number
): Promise<Checkout> {
  const data = await mutate<CheckoutLinesUpdateResponse>(
    CHECKOUT_LINES_UPDATE_MUTATION,
    {
      checkoutId,
      lines: [{ lineId, quantity }],
    }
  );

  if (data.checkoutLinesUpdate.errors.length > 0) {
    throw new Error(data.checkoutLinesUpdate.errors[0].message);
  }

  if (!data.checkoutLinesUpdate.checkout) {
    throw new Error('Failed to update checkout line');
  }

  return data.checkoutLinesUpdate.checkout;
}

export async function removeCheckoutLine(
  checkoutId: string,
  lineId: string
): Promise<Checkout> {
  const data = await mutate<CheckoutLinesDeleteResponse>(
    CHECKOUT_LINE_DELETE_MUTATION,
    {
      checkoutId,
      lineId,
    }
  );

  if (data.checkoutLineDelete.errors.length > 0) {
    throw new Error(data.checkoutLineDelete.errors[0].message);
  }

  if (!data.checkoutLineDelete.checkout) {
    throw new Error('Failed to remove checkout line');
  }

  return data.checkoutLineDelete.checkout;
}

export async function updateCheckoutEmail(
  checkoutId: string,
  email: string
): Promise<Checkout> {
  const data = await mutate<CheckoutEmailUpdateResponse>(
    CHECKOUT_EMAIL_UPDATE_MUTATION,
    {
      checkoutId,
      email,
    }
  );

  if (data.checkoutEmailUpdate.errors.length > 0) {
    throw new Error(data.checkoutEmailUpdate.errors[0].message);
  }

  if (!data.checkoutEmailUpdate.checkout) {
    throw new Error('Failed to update checkout email');
  }

  return data.checkoutEmailUpdate.checkout;
}

export async function updateBillingAddress(
  checkoutId: string,
  billingAddress: AddressInput
): Promise<Checkout> {
  const data = await mutate<CheckoutBillingAddressUpdateResponse>(
    CHECKOUT_BILLING_ADDRESS_UPDATE_MUTATION,
    {
      checkoutId,
      billingAddress,
    }
  );

  if (data.checkoutBillingAddressUpdate.errors.length > 0) {
    const err = data.checkoutBillingAddressUpdate.errors[0];
    throw new Error(`${err.field}: ${err.message}`);
  }

  if (!data.checkoutBillingAddressUpdate.checkout) {
    throw new Error('Failed to update billing address');
  }

  return data.checkoutBillingAddressUpdate.checkout;
}

export async function completeCheckout(checkoutId: string): Promise<Order> {
  const data = await mutate<CheckoutCompleteResponse>(
    CHECKOUT_COMPLETE_MUTATION,
    {
      checkoutId,
    }
  );

  if (data.checkoutComplete.errors.length > 0) {
    const err = data.checkoutComplete.errors[0];
    throw new Error(`${err.field}: ${err.message}`);
  }

  if (!data.checkoutComplete.order) {
    throw new Error('Failed to complete checkout');
  }

  return data.checkoutComplete.order;
}

export async function createPayment(
  checkoutId: string,
  gateway: string,
  amount: number,
  currency: string
): Promise<Payment> {
  const data = await mutate<CheckoutPaymentCreateResponse>(
    CHECKOUT_PAYMENT_CREATE_MUTATION,
    {
      checkoutId,
      input: {
        gateway,
        amount,
        token: 'dummy-token',
      },
    }
  );

  if (data.checkoutPaymentCreate.errors.length > 0) {
    const err = data.checkoutPaymentCreate.errors[0];
    throw new Error(`${err.field}: ${err.message}`);
  }

  if (!data.checkoutPaymentCreate.payment) {
    throw new Error('Failed to create payment');
  }

  return data.checkoutPaymentCreate.payment;
}
