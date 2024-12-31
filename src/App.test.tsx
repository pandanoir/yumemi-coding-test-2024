// @vitest-environment jsdom

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
  vi,
} from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { JSX } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import prefecturesFixture from '../test/fixtures/prefectures.json';
import population47Fixture from '../test/fixtures/population47.json';

const handlers = [
  http.get(
    'https://yumemi-frontend-engineer-codecheck-api.vercel.app/api/v1/prefectures',
    () => HttpResponse.json(prefecturesFixture),
  ),
  http.get(
    'https://yumemi-frontend-engineer-codecheck-api.vercel.app/api/v1/population/composition/perYear?prefCode=47',
    () => HttpResponse.json(population47Fixture),
  ),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

window.ResizeObserver ??= ResizeObserver;

describe('App', () => {
  let App: () => JSX.Element;
  beforeAll(async () => {
    App = (await import('./App')).App;
  });
  beforeEach(() => {
    vi.resetModules(); // 各テストの前にモジュールキャッシュをリセット
  });

  test('snapshot', async () => {
    const { asFragment } = await act(() => render(<App />));
    expect(asFragment()).toMatchSnapshot();
  });

  it('は選択された都道府県の折れ線グラフを表示する', async () => {
    const { asFragment } = await act(() => render(<App />));
    await act(async () => {
      screen.getByRole('checkbox', { name: '沖縄県' }).click();
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('は選択解除された都道府県の折れ線グラフを表示しない', async () => {
    const { asFragment } = await act(() => render(<App />));
    await act(async () => {
      screen.getByRole('checkbox', { name: '沖縄県' }).click();
    });
    await act(async () => {
      screen.getByRole('checkbox', { name: '沖縄県' }).click();
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('はAPIサーバーが落ちていた場合になにも表示しない', async () => {
    // Appは読み込んだ時点でfetchを開始するので、サーバーレスポンスをエラーに設定してからdynamic importしている
    server.use(
      http.get(
        'https://yumemi-frontend-engineer-codecheck-api.vercel.app/api/v1/prefectures',
        () => HttpResponse.error(),
      ),
    );
    const App = (await import('./App')).App;
    const { asFragment } = await act(() => render(<App />));
    expect(asFragment()).toMatchSnapshot();
  });

  it('は選択した人口を表示できる', async () => {
    const { asFragment } = await act(() => render(<App />));
    await act(async () => {
      screen.getByRole('option', { name: '生産年齢人口' }).click();
    });
    expect(asFragment()).toMatchSnapshot();
  });
});
