import * as v from 'valibot';

export const prefectureListApiSchema = v.object({
  result: v.array(v.object({ prefCode: v.number(), prefName: v.string() })),
});

export const populationApiSchema = v.object({
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
