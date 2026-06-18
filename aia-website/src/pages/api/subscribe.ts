import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { email, firstName, listId, pdfSlug } = body;

  if (!email || !firstName) {
    return new Response(JSON.stringify({ error: 'Nome e email sono obbligatori.' }), { status: 400 });
  }

  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRe.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400 });
  }
  if (listId !== undefined && (typeof listId !== 'number' || !Number.isInteger(listId))) {
    return new Response(JSON.stringify({ error: 'Invalid list ID' }), { status: 400 });
  }

  const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Servizio temporaneamente non disponibile.' }), { status: 503 });
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, PDF_SLUG: pdfSlug },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (res.ok || res.status === 204) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const data = await res.json().catch(() => ({}));

    if (data.code === 'duplicate_parameter') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    console.error('Brevo error:', data);
    return new Response(JSON.stringify({ error: 'Errore nella registrazione.' }), { status: 500 });
  } catch (err) {
    console.error('Brevo fetch error:', err);
    return new Response(JSON.stringify({ error: 'Errore di connessione al servizio.' }), { status: 502 });
  }
};
