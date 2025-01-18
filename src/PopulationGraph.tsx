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

const prefectureApiPromise = fetchApiWithCache('/prefectures').then((res) =>
  v.parse(prefectureListApiSchema, res),
);

export const PopulationGraph = ({
  label,
  selectedPrefectureCodes,
}: {
  label: number;
  selectedPrefectureCodes: number[];
}) => {
  // {[prefCode]: prefCodeのAPIデータ}
  const populationApiData = Object.fromEntries(
    selectedPrefectureCodes
      .map(
        (prefCode) =>
          [
            prefCode,
            fetchApiWithCache(`/population?prefCode=${prefCode}`),
          ] as const,
      )
      .map(([prefCode, promise]) => [
        prefCode,
        v.parse(populationApiSchema, use(promise)).result,
      ]),
  );
  const prefNameMap = use(prefectureApiPromise).result.reduce<
    Record<number, string>
  >((acc, { prefCode, prefName }) => {
    acc[prefCode] = prefName;
    return acc;
  }, {});

  // { year:string, 県1:number(人口), 県2:number(人口), ... }[]
  const graphData = useMemo(() => {
    const yearValueMap: {
      [year in number]: { prefCode: number; population: number }[];
    } = {};
    for (const prefCode of selectedPrefectureCodes) {
      const cache = populationApiData[prefCode];
      if (!cache) continue;
      for (const { year, value } of cache.data[label].data) {
        yearValueMap[year] ??= [];
        yearValueMap[year].push({ prefCode, population: value });
      }
    }
    return Object.entries(yearValueMap).map(([year, values]) => {
      const data: Record<string, string | number> = { year };
      for (const { prefCode, population } of values) {
        data[`${prefCode}`] = population / 10000;
      }
      return data;
    });
  }, [populationApiData, selectedPrefectureCodes, label]);

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
            {selectedPrefectureCodes.map((prefCode) => (
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
