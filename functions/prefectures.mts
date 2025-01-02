const apiKey = process.env.API_KEY ?? '';

export default async () => {
  try {
    const response = await fetch(
      'https://yumemi-frontend-engineer-codecheck-api.vercel.app/api/v1/prefectures',
      {
        headers: { accept: 'application/json', 'X-API-KEY': apiKey },
      },
    );

    return new Response(JSON.stringify(await response.json()), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  }
};
