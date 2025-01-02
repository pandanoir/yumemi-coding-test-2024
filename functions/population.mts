const apiEndpoint = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const apiKey = process.env.API_KEY ?? '';

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const prefCode = url.searchParams.get('prefCode');
    if (prefCode === null) {
      throw new Error('invalid prefCode');
    }

    return new Response(
      JSON.stringify(
        await fetch(
          `${apiEndpoint}/api/v1/population/composition/perYear?prefCode=${prefCode}`,
          {
            headers: {
              accept: 'application/json',
              'X-API-KEY': apiKey,
            },
          },
        ).then((res) => res.json()),
      ),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  }
};
