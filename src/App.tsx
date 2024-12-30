import { Suspense, use, useDeferredValue, useState } from 'react';
import * as v from 'valibot';
import { fetchApiWithCache } from './api/fetchApiWithCache';
import { PopulationGraph } from './PopulationGraph';
import { prefectureListApiSchema } from './api/schema';

const prefectureApiPromise = fetchApiWithCache('/api/v1/prefectures').then(
  (res) => v.parse(prefectureListApiSchema, res),
);

export function App() {
  const prefectures = use(prefectureApiPromise).result;
  const [selectedPrefectureCodes, setSelectedPrefectures] = useState<number[]>(
    [],
  );
  const [selectedLabel, setSelectedLabel] = useState(0);

  const deferredSelectedPrefectureCodes = useDeferredValue(
    selectedPrefectureCodes,
  );
  const deferredSelectedLabel = useDeferredValue(selectedLabel);
  return (
    <div>
      <h1>コーディングテスト</h1>
      <select onChange={({ target }) => setSelectedLabel(target.selectedIndex)}>
        <option>総人口</option>
        <option>年少人口</option>
        <option>生産年齢人口</option>
        <option>老年人口</option>
      </select>
      <br />

      {prefectures.map(({ prefCode, prefName }) => (
        <label key={prefCode}>
          <input
            type="checkbox"
            checked={selectedPrefectureCodes.includes(prefCode)}
            onChange={({ target }) => {
              if (target.checked)
                setSelectedPrefectures((l) => [...l, prefCode]);
              else
                setSelectedPrefectures((l) => l.filter((x) => x !== prefCode));
            }}
          />
          {prefName}
        </label>
      ))}
      <br />

      {selectedPrefectureCodes.length === 0 ? (
        '表示したい都道府県を選択してください'
      ) : (
        <Suspense fallback={'loading...'}>
          <div
            style={{
              opacity:
                selectedPrefectureCodes !== deferredSelectedPrefectureCodes ||
                selectedLabel !== deferredSelectedLabel
                  ? 0.5
                  : 1,
            }}
          >
            <PopulationGraph
              prefectureCodes={deferredSelectedPrefectureCodes}
              label={deferredSelectedLabel}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
}
