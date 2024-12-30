import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as v from 'valibot';

const apiEndpoint = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const apiKey = '8FzX5qLmN3wRtKjH7vCyP9bGdEaU4sYpT6cMfZnJ';

const prefectureListApiSchema = v.object({
  result: v.array(v.object({ prefCode: v.number(), prefName: v.string() })),
});

const populationApiSchema = v.object({
  message: v.nullable(v.string()),
  result: v.object({
    boundaryYear: v.number(),
    data: v.array(
      v.object({
        label: v.union([
          v.literal('総人口'),
          v.literal('年少人口'),
          v.literal('生産年齢人口'),
          v.literal('老年人口'),
        ]),

        data: v.array(
          v.object({
            year: v.number(),
            value: v.number(),
            rate: v.optional(v.number()),
          }),
        ),
      }),
    ),
  }),
});

export function App() {
  const [prefectures, setPrefectures] = useState<
    v.InferOutput<typeof prefectureListApiSchema>['result']
  >([]);
  const prefNameMap = prefectures.reduce<Record<number, string>>(
    (acc, { prefCode, prefName }) => {
      acc[prefCode] = prefName;
      return acc;
    },
    {},
  );

  const [populationData, setPopulationData] = useState<
    Record<
      string,
      v.InferOutput<typeof populationApiSchema>['result'] | undefined
    >
  >({});
  const [selectedPrefectureCodes, setSelectedPrefectures] = useState<number[]>(
    [],
  );
  const [selectedLabel, setSelectedLabel] = useState(0);

  // 都道府県リストをAPIから取得
  useEffect(() => {
    let hasCancelled = false;
    fetch(`${apiEndpoint}/api/v1/prefectures`, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': apiKey,
      },
    })
      .then((res) => res.json())
      .then((res) => v.parse(prefectureListApiSchema, res))
      .then(({ result }) => {
        if (hasCancelled) {
          return;
        }
        setPrefectures(result);
      })
      .catch(() => {});
    return () => {
      hasCancelled = true;
    };
  }, []);

  // 人口情報を取得
  useEffect(() => {
    let hasCancelled = false;
    const prefCodesNotFetchedYet = selectedPrefectureCodes.filter(
      (pref) => !(pref in populationData),
    );

    for (const prefCode of prefCodesNotFetchedYet) {
      const url = new URL(
        `${apiEndpoint}/api/v1/population/composition/perYear`,
      );
      url.searchParams.append('prefCode', `${prefCode}`);

      fetch(url.toString(), {
        headers: { accept: 'application/json', 'X-API-KEY': apiKey },
      })
        .then((res) => res.json())
        .then((res) => v.parse(populationApiSchema, res))
        .then(({ result }) => {
          if (hasCancelled) {
            return;
          }
          setPopulationData((cache) => ({ ...cache, [prefCode]: result }));
        })
        .catch(() => {});
    }
    return () => {
      hasCancelled = true;
    };
  }, [selectedPrefectureCodes, populationData]);

  const graphData = useMemo(() => {
    const yearValueMap = selectedPrefectureCodes.reduce<
      Record<number, { prefCode: number; value: number }[]>
    >((acc, prefCode) => {
      const cache = populationData[prefCode];
      if (!cache) return acc;
      for (const { year, value } of cache.data[selectedLabel].data) {
        const arr: { prefCode: number; value: number }[] = acc[year] ?? [];
        arr.push({ prefCode, value });
        acc[year] = arr;
      }
      return acc;
    }, {});
    return Object.entries(yearValueMap).reduce<
      Record<string, string | number>[]
    >((acc, [year, values]) => {
      const data: Record<string, string | number> = { year };
      for (const { prefCode, value } of values) {
        data[`${prefCode}`] = value;
      }
      acc.push(data);
      return acc;
    }, []);
  }, [populationData, selectedPrefectureCodes, selectedLabel]);

  return (
    <div>
      <h1>コーディングテスト</h1>
      <select
        onChange={({ target }) => {
          setSelectedLabel(target.selectedIndex);
        }}
      >
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
                setSelectedPrefectures((list) => [...list, prefCode]);
              else
                setSelectedPrefectures((list) =>
                  list.filter((x) => x !== prefCode),
                );
            }}
          />
          {prefName}
        </label>
      ))}

      <br />
      {selectedPrefectureCodes.length === 0 ? (
        '表示したい都道府県を選択してください'
      ) : (
        <LineChart
          width={500}
          height={300}
          data={graphData}
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" unit="年" />
          <YAxis unit="人" />
          <Tooltip />
          <Legend />
          {selectedPrefectureCodes.map((prefCode) => (
            <Line
              key={prefCode}
              type="monotone"
              dataKey={prefCode}
              name={prefNameMap[prefCode]}
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      )}
    </div>
  );
}
