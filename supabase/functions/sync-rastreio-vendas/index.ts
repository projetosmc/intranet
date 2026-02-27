import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "http://hubapi.redemontecarlo.com.br/financeiro/rastreio-vendas/";
const BATCH_LIMIT = 1000;
const ENTIDADE = "rastreio_vendas";
const EMPRESAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getMonthRanges(dtIni: string, dtFim: string): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = [];
  const startDate = new Date(dtIni + "T00:00:00Z");
  const endDate = new Date(dtFim + "T00:00:00Z");

  let current = new Date(startDate);
  while (current <= endDate) {
    const monthStart = current.toISOString().split("T")[0];
    const monthEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0));
    const end = monthEnd > endDate ? dtFim : monthEnd.toISOString().split("T")[0];
    ranges.push({ start: monthStart, end });
    current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1));
  }
  return ranges;
}

async function fetchAndUpsertBatch(
  supabase: any,
  mcHubApiToken: string,
  codEmpresa: number,
  dtIni: string,
  dtFim: string,
): Promise<{ processed: number; maxSeq: number }> {
  let totalProcessed = 0;
  let maxSeqTitulo = 0;
  let hasMore = true;
  let currentLastSeq = 0;

  while (hasMore) {
    const url = `${API_BASE}?dt_ini=${dtIni}&dt_fim=${dtFim}&cod_empresa=${codEmpresa}&last_seq_titulo=${currentLastSeq}&limit=${BATCH_LIMIT}`;
    console.log(`[sync] Fetching empresa=${codEmpresa} ${dtIni}~${dtFim} seq>${currentLastSeq}`);

    const response = await fetch(url, {
      headers: { accept: "application/json", "X-API-Token": mcHubApiToken },
    });

    if (!response.ok) {
      const text = await response.text();
      // Se for timeout, logar e pular esse lote
      if (response.status === 504) {
        console.warn(`[sync] 504 timeout empresa=${codEmpresa} ${dtIni}~${dtFim}, pulando...`);
        break;
      }
      throw new Error(`API ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
      break;
    }

    const records = data.map((item: any) => ({
      cod_empresa: item.cod_empresa,
      des_nom_resumido: item.des_nom_resumido,
      cod_pessoa_sacado: item.cod_pessoa_sacado,
      nom_pessoa: item.nom_pessoa,
      tipo_titulo: item.tipo_titulo,
      dta_venda: item.dta_venda || null,
      dta_venc_titulo: item.dta_venc_titulo || null,
      dta_faturamento: item.dta_faturamento || null,
      dta_vencimento_fatura: item.dta_vencimento_fatura || null,
      dta_recebimento: item.dta_recebimento || null,
      val_bruto_titulo: item.val_bruto_titulo || 0,
      val_liquido_titulo: item.val_liquido_titulo || 0,
      val_pagamento: item.val_pagamento || 0,
      cod_forma_pagto: item.cod_forma_pagto,
      des_forma_pagto: item.des_forma_pagto,
      seq_titulo: item.seq_titulo,
      seq_cupom: item.seq_cupom,
      num_cupom: item.num_cupom,
      source_key: item.source_key,
      dta_prev_recebimento: item.dta_prev_recebimento || null,
      dta_atualizacao: new Date().toISOString(),
    }));

    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500);
      const { error } = await supabase
        .from("tab_rastreio_venda")
        .upsert(batch, { onConflict: "seq_titulo,cod_empresa" });
      if (error) throw new Error(`Upsert error: ${error.message}`);
    }

    totalProcessed += data.length;
    const batchMaxSeq = Math.max(...data.map((item: any) => item.seq_titulo || 0));
    if (batchMaxSeq > maxSeqTitulo) maxSeqTitulo = batchMaxSeq;
    currentLastSeq = batchMaxSeq;

    if (data.length < BATCH_LIMIT) hasMore = false;
  }

  return { processed: totalProcessed, maxSeq: maxSeqTitulo };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mcHubApiToken = Deno.env.get("MC_HUB_API") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || "incremental";

    const { data: syncControl } = await supabase
      .from("tab_sync_controle")
      .select("*")
      .eq("des_entidade", ENTIDADE)
      .single();

    if (syncControl?.des_status === "running") {
      const startedAt = new Date(syncControl.dta_inicio_sync).getTime();
      if (Date.now() - startedAt < 30 * 60 * 1000) {
        return new Response(
          JSON.stringify({ success: false, message: "Sincronização já em andamento" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }
    }

    await supabase
      .from("tab_sync_controle")
      .update({
        des_status: "running",
        dta_inicio_sync: new Date().toISOString(),
        num_registros_processados: 0,
        des_erro: null,
        dta_atualizacao: new Date().toISOString(),
      })
      .eq("des_entidade", ENTIDADE);

    const now = new Date();
    let dtIni: string;

    if (mode === "full") {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dtIni = sixMonthsAgo.toISOString().split("T")[0];
    } else {
      if (syncControl?.dta_ultima_sync) {
        const lastSync = new Date(syncControl.dta_ultima_sync);
        lastSync.setDate(lastSync.getDate() - 2);
        dtIni = lastSync.toISOString().split("T")[0];
      } else {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dtIni = sevenDaysAgo.toISOString().split("T")[0];
      }
    }

    const dtFim = now.toISOString().split("T")[0];
    const monthRanges = getMonthRanges(dtIni, dtFim);
    let totalProcessed = 0;
    let maxSeqTitulo = 0;

    console.log(`[sync] Mode=${mode}, ${dtIni}~${dtFim}, ${monthRanges.length} meses, ${EMPRESAS.length} empresas`);

    for (const empresa of EMPRESAS) {
      for (const range of monthRanges) {
        try {
          const result = await fetchAndUpsertBatch(supabase, mcHubApiToken, empresa, range.start, range.end);
          totalProcessed += result.processed;
          if (result.maxSeq > maxSeqTitulo) maxSeqTitulo = result.maxSeq;

          // Atualizar progresso
          await supabase
            .from("tab_sync_controle")
            .update({
              num_registros_processados: totalProcessed,
              num_last_seq_titulo: maxSeqTitulo,
              dta_atualizacao: new Date().toISOString(),
            })
            .eq("des_entidade", ENTIDADE);
        } catch (err) {
          console.error(`[sync] Erro empresa=${empresa} ${range.start}~${range.end}:`, err.message);
        }
      }
    }

    await supabase
      .from("tab_sync_controle")
      .update({
        des_status: "completed",
        dta_fim_sync: new Date().toISOString(),
        dta_ultima_sync: new Date().toISOString(),
        num_registros_processados: totalProcessed,
        num_last_seq_titulo: maxSeqTitulo,
        des_erro: null,
        dta_atualizacao: new Date().toISOString(),
      })
      .eq("des_entidade", ENTIDADE);

    console.log(`[sync] Concluído. Total: ${totalProcessed} registros`);

    return new Response(
      JSON.stringify({ success: true, totalProcessed, maxSeqTitulo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync] Error:", error);
    await supabase
      .from("tab_sync_controle")
      .update({
        des_status: "error",
        dta_fim_sync: new Date().toISOString(),
        des_erro: error.message || "Erro desconhecido",
        dta_atualizacao: new Date().toISOString(),
      })
      .eq("des_entidade", ENTIDADE);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
