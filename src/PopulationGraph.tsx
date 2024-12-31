import { use, useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as v from 'valibot';
import { fetchApiWithCache } from './api/fetchApiWithCache';
import { populationApiSchema, prefectureListApiSchema } from './api/schema';

const prefectureApiPromise = fetchApiWithCache('/api/v1/prefectures').then(
  (res) => v.parse(prefectureListApiSchema, res),
);

const usePopulationApiData = (
  prefCodes: number[],
): Record<number, v.InferOutput<typeof populationApiSchema>['result']> =>
  use(
    useMemo(
      () =>
        Promise.all(
          prefCodes.map(
            async (prefCode) =>
              [
                prefCode,
                await fetchApiWithCache(
                  `/api/v1/population/composition/perYear?prefCode=${prefCode}`,
                )
                  .then((res) => v.parse(populationApiSchema, res))
                  .then(({ result }) => result)
                  .catch(() => null),
              ] as const,
          ),
        ).then((res) => {
          const populationData: Record<
            number,
            NonNullable<(typeof res)[number][1]>
          > = {};
          for (const [prefCode, data] of res) {
            if (data) {
              populationData[prefCode] = data;
            }
          }
          return populationData;
        }),
      [prefCodes],
    ),
  );

export const PopulationGraph = ({
  label,
  prefectureCodes,
}: {
  label: number;
  prefectureCodes: number[];
}) => {
  const populationApiData = usePopulationApiData(prefectureCodes);
  const prefectures = use(prefectureApiPromise).result;
  const prefNameMap = prefectures.reduce<Record<number, string>>(
    (acc, { prefCode, prefName }) => {
      acc[prefCode] = prefName;
      return acc;
    },
    {},
  );

  // { year:number, [県名]:number(人口) }[]
  const graphData = useMemo(() => {
    const yearValueMap: Record<
      number,
      { prefCode: number; population: number }[]
    > = {};
    for (const prefCode of prefectureCodes) {
      const cache = populationApiData[prefCode];
      if (!cache) continue;
      for (const { year, value } of cache.data[label].data) {
        yearValueMap[year] ??= [];
        yearValueMap[year].push({ prefCode, population: value });
      }
    }
    const graphData: Record<string, string | number>[] = [];
    for (const [year, values] of Object.entries(yearValueMap)) {
      const data: Record<string, string | number> = { year };
      for (const { prefCode, population } of values) {
        data[`${prefCode}`] = population / 10000;
      }
      graphData.push(data);
    }
    return graphData;
  }, [populationApiData, prefectureCodes, label]);

  return (
    <div className="graph-container">
      <div>
        <ResponsiveContainer>
          <LineChart
            width={500}
            height={300}
            data={graphData}
            margin={{ top: 5, right: 40, left: 22, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" unit="年" />
            <YAxis unit="万人" />
            <Tooltip />
            <Legend />
            {prefectureCodes.map((prefCode) => (
              <Line
                key={prefCode}
                type="monotone"
                dataKey={prefCode}
                name={prefNameMap[prefCode]}
                stroke={`hsl(${(360 / 47) * prefCode}deg 80% 40%)`}
                activeDot={{ r: 8 }}
                isAnimationActive={false}
                unit="万人"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
