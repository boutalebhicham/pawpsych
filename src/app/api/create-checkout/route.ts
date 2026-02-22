import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { animalName } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Rapport Âme Animale — Rapport complet',
              description: animalName
                ? `Analyse complète de personnalité pour ${animalName}`
                : 'Analyse complète de personnalité pour votre animal',
            },
            unit_amount: 1499, // 14,99€ en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${baseUrl}/ame-animale.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/ame-animale.html`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe create-checkout error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 });
  }
}
