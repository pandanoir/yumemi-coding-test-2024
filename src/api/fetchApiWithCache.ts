const cache: Record<string, Promise<Response>> = {};

const apiEndpoint = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const apiKey = '8FzX5qLmN3wRtKjH7vCyP9bGdEaU4sYpT6cMfZnJ';

export const fetchApiWithCache = (path: string) => {
  cache[path] ??= fetch(`${apiEndpoint}${path}`, {
    headers: {
      accept: 'application/json',
      'X-API-KEY': apiKey,
    },
  }).then((res) => res.json());
  return cache[path];
};
