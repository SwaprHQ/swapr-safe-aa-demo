import { NextRequest, NextResponse } from "next/server";

const headers = {
  headers: {
    Authorization: "Bearer d2QXijx360GWXIJfxAjuVuOraX8f5uOM",
    accept: "application/json",
  },
};
const apiBaseUrl = "https://api.1inch.dev/swap/v5.2/100/";

function apiRequestUrl(methodName: string, queryParams: any) {
  return (
    apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString()
  );
}
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const response = await fetch(
    apiRequestUrl("approve/transaction", url.searchParams.toString()),
    headers
  );
  const transaction = await response.json();

  return NextResponse.json(transaction);
}
