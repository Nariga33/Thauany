import { getLancamentos, getOrcamentos } from "@/lib/db";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [lancamentos, orcamentos] = await Promise.all([getLancamentos(), getOrcamentos()]);
  return <Dashboard initialLancamentos={lancamentos} initialOrcamentos={orcamentos} />;
}
