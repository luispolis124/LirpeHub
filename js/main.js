// js/main.js - Lógica principal do LirpeHub (Unificada e Segura)

let supabaseClient = null;

// Inicializa o cliente Supabase (apenas em navegadores modernos)
if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} else {
    console.error("Erro: js/config.js não carregado ou inválido.");
}

// Vídeo padrão de backup (Caso o banco falhe ou esteja vazio)
const videosPadrao = [
    {
        id: "1",
        titulo: "Me at the zoo - O primeiro vídeo do YouTube!",
        autor: "jawed",
        visualizacoes: "399,580,346",
        data: "Há 21 anos",
        thumb: "https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg",
        embedurl: "https://www.youtube.com/embed/jNQXAC9IVRw", //  aqui
        tipo: "youtube", //  define o tipo
        copyright_strike: false
    }
];

// ==========================================
// DETECÇÃO DE NAVEGADOR ANTIGO (DS/Wii)
// ==========================================
const navegadorAntigo = (typeof Promise === "undefined" || typeof fetch === "undefined");

// Fallback para navegadores antigos
function carregarVideosFallback() {
    const container = document.getElementById('videoContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="video-card">
            <a href="watch.html?v=1">
                <img src="https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg" alt="Me at the zoo">
                <h3>Me at the zoo - O primeiro vídeo do YouTube!</h3>
            </a>
            <p>Por: <strong>jawed</strong></p>
            <p>399,580,346 views • Há 21 anos</p>
        </div>
        <p style="font-style: italic; color: #666;">Versão simplificada para navegadores antigos (Nintendo DS / Wii).</p>
    `;
}

// ==========================================
// FUNÇÕES MODERNAS (Supabase)
// ==========================================

// 1. Renderiza vídeos
function renderizarVideos(videos) {
    const container = document.getElementById('videoContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!videos || videos.length === 0) {
        container.innerHTML = '<p style="font-style: italic; color: #666; padding: 10px;">Nenhum vídeo encontrado.</p>';
        return;
    }
    
    const videosSeguros = videos.filter(v => v.copyright_strike !== true);

    videosSeguros.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const dataExibicao = video.created_at ? new Date(video.created_at).toLocaleDateString() : (video.data || "Recente");
        
        card.innerHTML = `
            <a href="watch.html?v=${video.id}">
                <img src="${video.thumb}" alt="${video.titulo}" class="thumb" 
                     onerror="this.src='https://placehold.co/300x180?text=LirpeHub';">
                <h3><a href="watch.html?v=${video.id}">${video.titulo}</a></h3>
            </a>
            <p>Por: <strong><a href="canais.html?user=${encodeURIComponent(video.autor)}" 
                style="color: #0033CC; text-decoration: none;">${video.autor}</a></strong></p>
            <p>${video.visualizacoes || 0} views • ${dataExibicao}</p>
        `;
        container.appendChild(card);
    });
}

// 2. Carrega todos os vídeos
async function carregarTodosOsVideos() {
    const container = document.getElementById('videoContainer');
    if (!container) return;
    
    container.innerHTML = 'Carregando vídeos...';

    if (!supabaseClient) {
        renderizarVideos(videosPadrao);
        return;
    }

    try {
        let { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .eq('copyright_strike', false)
            .order('id', { ascending: false });

        if (error || !data || data.length === 0) {
            renderizarVideos(videosPadrao);
        } else {
            renderizarVideos(data);
        }
    } catch (e) {
        console.warn("Erro ao carregar:", e);
        renderizarVideos(videosPadrao);
    }
}

// ==========================================
// CONFIGURAÇÃO DOS EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (navegadorAntigo) {
        carregarVideosFallback();
        return;
    }

    // Eventos modernos
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarVideos();
    });

    if (supabaseClient) {
        carregarTodosOsVideos();
        carregarUsuariosRecentes();
    } else {
        renderizarVideos(videosPadrao);
    }
});