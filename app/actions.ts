"use server";

import { revalidatePath } from "next/cache";
import { addLancamento, deleteLancamento, setOrcamento } from "@/lib/db";
import { DESPESA_CATEGORIAS, RECEITA_CATEGORIAS, FORMAS_PAGAMENTO } from "@/lib/categories";

const despesaCategorias: readonly string[] = DESPESA_CATEGORIAS;
const receitaCategorias: readonly string[] = RECEITA_CATEGORIAS;
const formasPagamento: readonly string[] = FORMAS_PAGAMENTO;

export async function criarLancamento(formData: FormData) {
  const tipo = formData.get("tipo");
  const data = formData.get("data");
  const descricao = formData.get("descricao");
  const categoria = formData.get("categoria");
  const formaPagamento = formData.get("formaPagamento");
  const valor = Number(formData.get("valor"));

  if (tipo !== "receita" && tipo !== "despesa") throw new Error("Tipo inválido.");
  if (typeof data !== "string" || !data) throw new Error("Informe a data.");
  if (typeof descricao !== "string" || !descricao.trim()) throw new Error("Informe a descrição.");
  if (typeof categoria !== "string" || !categoria) throw new Error("Selecione a categoria.");
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor maior que zero.");

  const categoriasValidas = tipo === "receita" ? receitaCategorias : despesaCategorias;
  if (!categoriasValidas.includes(categoria)) throw new Error("Categoria inválida.");

  let formaPagamentoFinal: string | null = null;
  if (tipo === "despesa") {
    if (typeof formaPagamento !== "string" || !formasPagamento.includes(formaPagamento)) {
      throw new Error("Selecione a forma de pagamento.");
    }
    formaPagamentoFinal = formaPagamento;
  }

  await addLancamento({
    tipo,
    data,
    descricao: descricao.trim().slice(0, 200),
    categoria,
    formaPagamento: formaPagamentoFinal,
    valor: Math.round(valor * 100) / 100,
  });

  revalidatePath("/");
}

export async function removerLancamento(id: number) {
  await deleteLancamento(id);
  revalidatePath("/");
}

export async function atualizarOrcamento(categoria: string, valor: number) {
  if (!despesaCategorias.includes(categoria)) throw new Error("Categoria inválida.");
  if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor de orçamento inválido.");
  await setOrcamento(categoria, Math.round(valor * 100) / 100);
  revalidatePath("/");
}
