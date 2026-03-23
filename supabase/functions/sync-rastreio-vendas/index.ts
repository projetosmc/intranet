import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JOBS_API_BASE = "http://hubapi.redemontecarlo.com.br/jobs/rastreio-vendas";
const ENTIDADE = "rastreio_vendas";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 360; // 30 min max (5s * 360)

async function startJob(
  token: string,
  dtIni: string,
  dtFim: string,
  limit: number = 10000,
): Promise<string> {
  const response = await fetch(JOBS_API_BASE, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dt_ini: dtIni, dt_fim: dtFim, limit }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao iniciar job: ${response.status} - ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  console.log(`[sync] Job criado: ${data.job_id}, status: ${data.status}`);
  return data.job_id;
}

async function pollJobStatus(
  token: string,
  jobId: string,
  supabase: any,
): Promise<any[]> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;

    const response = await fetch(`${JOBS_API_BASE}/${jobId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao consultar job: ${response.status} - ${text.substring(0, 200)}`);
    }

    const result = await response.json();

    if (result.status === "completed") {
      console.log(`[sync] Job ${jobId} concluído com ${result.data?.length || 0} registros`);
      return result.data || [];
    }

    if (result.status === "failed" || result.status === "error") {
      throw new Error(`Job falhou: ${JSON.stringify(result)}`);
    }

    // Update progress
    if (result.progress) {
      console.log(`[sync] Job ${jobId}: ${result.progress.processed}/${result.progress.total_estimated}`);
      await supabase
        .from("tab_sync_controle")
        .update({
          num_registros_processados: result.progress.processed,
          num_total_registros: result.progress.total_estimated,
          dta_atualizacao: new Date().toISOString(),
        })
        .eq("des_entidade", ENTIDADE);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Job ${jobId} excedeu o tempo máximo de polling (${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s)`);
}

async function upsertRecords(supabase: any, data: any[]): Promise<number> {
  if (!data || data.length === 0) return 0;

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

  return records.length;
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
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
        );
      }
    }

    await supabase
      .from("tab_sync_controle")
      .update({
        des_status: "running",
        dta_inicio_sync: new Date().toISOString(),
        num_registros_processados: 0,
        num_total_registros: 0,
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

    console.log(`[sync] Mode=${mode}, período: ${dtIni} ~ ${dtFim}`);

    // Step 1: Start async job
    const jobId = await startJob(mcHubApiToken, dtIni, dtFim);

    // Step 2: Poll until completed
    const allData = await pollJobStatus(mcHubApiToken, jobId, supabase);

    // Step 3: Upsert all records
    const totalProcessed = await upsertRecords(supabase, allData);

    const maxSeqTitulo = allData.length > 0
      ? Math.max(...allData.map((item: any) => item.seq_titulo || 0))
      : 0;

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
      JSON.stringify({ success: true, totalProcessed, maxSeqTitulo, jobId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
