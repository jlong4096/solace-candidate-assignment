"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvocatesTable from "./components/AdvocatesTable";

const client = new QueryClient();

export default function Home() {
  return (
    <main style={{ margin: "24px" }}>
      <QueryClientProvider client={client}>
        <AdvocatesTable />
      </QueryClientProvider>
    </main>
  );
}
