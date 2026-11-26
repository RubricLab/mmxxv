# MMXXV

A forecasting game with friends, one season a year. Each season is named for its year in Roman numerals: MMXXV, MMXXVII.

## A season

1. **Propose.** Players propose up to 5 yes or no questions about the year and vote on each other's. The top 25 make the board.
2. **Forecast.** Everyone gives each market on the board a probability. Forecasts stay sealed until they lock.
3. **Watch.** Markets resolve as the year unfolds. An admin marks each one yes or no.
4. **Score.** A forecast scores `100 × (1 − 4 × miss²)`: 0 for a coin flip, +100 for certainty when right, −300 when wrong. Most points wins.

A season is one row in `Season`: `year`, `boardSize`, `proposalsCloseAt`, `forecastsLockAt`, `endsAt`. The phase comes from the dates. The newest season is the one on the home page.

```sql
insert into "Season" (year, "boardSize", "proposalsCloseAt", "forecastsLockAt", "endsAt")
values (2028, 25, '2028-01-16T05:00Z', '2028-02-01T05:00Z', '2029-01-01T05:00Z');
```

Admins can resolve and delete markets: `update "User" set admin = true where username = '…'`.

## Develop

```sh
bun install
cp .env.example .env   # URL, DATABASE_URL (Neon), RESEND_API_KEY
bun db:push
bun dev
```

In development, sign-in links also print to the server log.

Next.js 16, Prisma 7 on Neon Postgres, Resend, Vercel. `bun check` runs Biome and TypeScript.

## Map

- `prisma/schema.prisma`: seasons, players, markets, votes, forecasts, comments
- `src/lib/season.ts`: phases, numerals, ranking proposals
- `src/lib/score.ts`: the scoring rule
- `src/lib/data.ts`: what each page reads
- `src/lib/actions.ts`: everything a player can do
- `src/app`: pages; `src/components`: the pieces they share
