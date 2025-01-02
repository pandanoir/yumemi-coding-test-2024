const apiEndpoint = `${location.origin}/api`;

const cache: Record<string, Promise<Response>> = {};
export const fetchApiWithCache = (path: string) => {
  cache[path] ??= fetch(`${apiEndpoint}${path}`, {
    headers: { accept: 'application/json' },
  }).then((res) => res.json());
  return cache[path];
};
