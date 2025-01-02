const apiEndpoint = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const apiKey = process.env.API_KEY ?? '';

export default async () => {
  try {
    return new Response(
      JSON.stringify(
        await fetch(`${apiEndpoint}/api/v1/prefectures`, {
          headers: {
            accept: 'application/json',
            'X-API-KEY': apiKey,
          },
        }).then((res) => res.json()),
      ),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  }
};
