import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// price_... por plano/ciclo — precisa bater exatamente com o PRICE_TIER_MAP em functions/index.js
export const STRIPE_PRICE_IDS = {
    bronze: { monthly: 'price_1UAHGXLOoGy5dacxvh5TrcZY', quarterly: 'price_1US1TvLOoGy5dacxiw3p8TlJ', annual: 'price_1UAHJ1LOoGy5dacxDBNyToyb' },
    prata: { monthly: 'price_1US1V0LOoGy5dacxDFVWDO74', quarterly: 'price_1US1W0LOoGy5dacxFk7MIijI', annual: 'price_1US1WsLOoGy5dacxsh2q1hQd' },
    ouro: { monthly: 'price_1US1XcLOoGy5dacxFg8vW4xM', quarterly: 'price_1US1YxLOoGy5dacxJOICieY4', annual: 'price_1US1ZbLOoGy5dacxwE9Do7L0' },
};

export const startCheckout = async (priceId) => {
    const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
    const { data } = await createCheckoutSession({ priceId, origin: window.location.origin });
    if (data?.url) {
        window.location.href = data.url;
    } else {
        throw new Error('Não foi possível iniciar o checkout.');
    }
};

export const openBillingPortal = async () => {
    const createPortalSession = httpsCallable(functions, 'createPortalSession');
    const { data } = await createPortalSession({ origin: window.location.origin });
    if (data?.url) {
        window.location.href = data.url;
    } else {
        throw new Error('Não foi possível abrir o portal de assinatura.');
    }
};
