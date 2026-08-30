import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// price_... por plano/ciclo — precisa bater exatamente com o PRICE_TIER_MAP em functions/index.js
export const STRIPE_PRICE_IDS = {
    bronze: { monthly: 'price_1UAHGXLOoGy5dacxvh5TrcZY', annual: 'price_1UAHJ1LOoGy5dacxDBNyToyb' },
    prata: { monthly: 'price_1UAHKdLOoGy5dacxbBMQXXLh', annual: 'price_1UAHL4LOoGy5dacxupSkrmTj' },
    ouro: { monthly: 'price_1UAHLyLOoGy5dacx3RsUj17N', annual: 'price_1UAHN1LOoGy5dacxgyLoxMqG' },
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
