import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "http://hubapi.redemontecarlo.com.br/financeiro/rastreio-vendas/";
const BATCH_LIMIT = 1000;
const ENTIDADE = "rastreio_vendas";

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
    const mode: string = body.mode || "incremental"; // 'full' | 'incremental'

    // Verificar se já existe uma sincronização em andamento
    const { data: syncControl } = await supabase
      .from("tab_sync_controle")
      .select("*")
      .eq("des_entidade", ENTIDADE)
      .single();

    if (syncControl?.des_status === "running") {
      // Verificar se está rodando há mais de 30 minutos (pode ter travado)
      const startedAt = new Date(syncControl.dta_inicio_sync).getTime();
      const now = Date.now();
      if (now - startedAt < 30 * 60 * 1000) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Sincronização já em andamento",
            status: syncControl,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }
      // Se passou de 30 min, considerar como travado e permitir reiniciar
    }

    // Marcar como em execução
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

    // Definir período de busca
    const now = new Date();
    let dtIni: string;
    let lastSeqTitulo = 0;

    if (mode === "full") {
      // Últimos 6 meses
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dtIni = sixMonthsAgo.toISOString().split("T")[0];
    } else {
      // Incremental: desde a última sincronização ou últimos 7 dias como fallback
      if (syncControl?.dta_ultima_sync) {
        const lastSync = new Date(syncControl.dta_ultima_sync);
        lastSync.setDate(lastSync.getDate() - 2); // 2 dias de overlap para segurança
        dtIni = lastSync.toISOString().split("T")[0];
      } else {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dtIni = sevenDaysAgo.toISOString().split("T")[0];
      }
      lastSeqTitulo = syncControl?.num_last_seq_titulo || 0;
    }

    const dtFim = now.toISOString().split("T")[0];
    let totalProcessed = 0;
    let maxSeqTitulo = lastSeqTitulo;
    let hasMore = true;
    let currentLastSeq = mode === "full" ? 0 : lastSeqTitulo;

    console.log(`[sync-rastreio-vendas] Mode: ${mode}, Period: ${dtIni} to ${dtFim}, lastSeq: ${currentLastSeq}`);

    while (hasMore) {
      const url = `${API_BASE}?dt_ini=${dtIni}&dt_fim=${dtFim}&last_seq_titulo=${currentLastSeq}&limit=${BATCH_LIMIT}`;
      console.log(`[sync-rastreio-vendas] Fetching: ${url}`);

      const response = await fetch(url, {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
        break;
      }

      // Preparar dados para upsert
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

      // Upsert em lotes de 500
      for (let i = 0; i < records.length; i += 500) {
        const batch = records.slice(i, i + 500);
        const { error: upsertError } = await supabase
          .from("tab_rastreio_venda")
          .upsert(batch, { onConflict: "seq_titulo,cod_empresa" });

        if (upsertError) {
          console.error(`[sync-rastreio-vendas] Upsert error:`, upsertError);
          throw new Error(`Upsert error: ${upsertError.message}`);
        }
      }

      totalProcessed += data.length;

      // Atualizar o maior seq_titulo encontrado
      const batchMaxSeq = Math.max(...data.map((item: any) => item.seq_titulo || 0));
      if (batchMaxSeq > maxSeqTitulo) {
        maxSeqTitulo = batchMaxSeq;
      }
      currentLastSeq = batchMaxSeq;

      // Atualizar progresso
      await supabase
        .from("tab_sync_controle")
        .update({
          num_registros_processados: totalProcessed,
          num_last_seq_titulo: maxSeqTitulo,
          dta_atualizacao: new Date().toISOString(),
        })
        .eq("des_entidade", ENTIDADE);

      // Se retornou menos que o limite, não há mais dados
      if (data.length < BATCH_LIMIT) {
        hasMore = false;
      }
    }

    // Marcar como concluído
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

    console.log(`[sync-rastreio-vendas] Completed. Total records: ${totalProcessed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída. ${totalProcessed} registros processados.`,
        totalProcessed,
        maxSeqTitulo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-rastreio-vendas] Error:", error);

    // Marcar como erro
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
