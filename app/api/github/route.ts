import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, token, year: rawYear } = (await request.json()) as {
    username?: string;
    token?: string;
    year?: number;
  };

  if (!username) return NextResponse.json({ days: [] });

  const year = rawYear ?? new Date().getFullYear();
  const from = `${year}-01-01T00:00:00Z`;
  const to   = `${year}-12-31T23:59:59Z`;

  const query = `query($username:String!,$from:DateTime!,$to:DateTime!){
    user(login:$username){
      contributionsCollection(from:$from,to:$to){
        contributionCalendar{
          totalContributions
          weeks{ contributionDays{ date contributionCount } }
        }
      }
    }
  }`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "hayati-app",
  };
  if (token) headers["Authorization"] = `bearer ${token}`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { username, from, to } }),
    next: { revalidate: 300 },
  });

  if (!res.ok) return NextResponse.json({ days: [] }, { status: res.status });

  const json = await res.json();
  const weeks =
    json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days = weeks
    .flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) =>
      w.contributionDays.map(d => ({ date: d.date, count: d.contributionCount }))
    )
    .filter((d: { date: string; count: number }) => d.count > 0);

  return NextResponse.json({
    days,
    total:
      json?.data?.user?.contributionsCollection?.contributionCalendar
        ?.totalContributions ?? 0,
  });
}
