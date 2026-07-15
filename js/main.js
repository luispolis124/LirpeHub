// js/main.js - Lógica principal do LirpeHub

let supabaseClient = null;

// Inicializa o cliente apenas se o config.js estiver carregado
if (typeof CONFIG !== 'undefined') {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} else {
    console.error("Erro: js/config.js não carregado. O Supabase não será inicializado.");
}

// Vídeo padrão de backup
const videosPadrao = [
    {
        id: "1",
        titulo: "Me at the zoo - O primeiro vídeo do YouTube!",
        autor: "jawed",
        visualizacoes: "399,580,346",
        data: "Há 21 anos",
        thumb: "https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg", 
        embedurl: "https://www.youtube.com/embed/jNQXAC9IVRw"
    }
];

// 1. FUNÇÃO AUXILIAR: Desenha os cards de vídeo na tela
function renderizarVideos(videos) {
    const container = document.getElementById('videoContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!videos || videos.length === 0) {
        container.innerHTML = '<p style="font-style: italic; color: #666; padding: 10px;">Nenhum vídeo encontrado.</p>';
        return;
    }
    
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <a href="watch.html?v=${video.id}">
                <img src="${video.thumb}" alt="${video.titulo}" class="thumb" onerror="this.src='https://placehold.co/300x180?text=LirpeHub';">
                <h3><a href="watch.html?v=${video.id}">${video.titulo}</a></h3>
            </a>
            <p>Por: <strong><a href="canais.html?user=${encodeURIComponent(video.autor)}" style="color: #0033CC; text-decoration: none;">${video.autor}</a></strong></p>
            <p>${video.visualizacoes} views • ${video.data}</p>
        `;
        container.appendChild(card);
    });
}

// 2. FUNÇÃO: Carrega todos os vídeos da página inicial
async function carregarTodosOsVideos() {
    const container = document.getElementById('videoContainer');
    if (!container || !supabaseClient) return;
    
    container.innerHTML = 'Carregando vídeos...';

    try {
        let { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .order('id', { ascending: false });

        if (error || !data || data.length === 0) {
            renderizarVideos(videosPadrao);
        } else {
            renderizarVideos(data);
        }
    } catch (e) {
        console.warn("Erro ao carregar vídeos:", e);
        renderizarVideos(videosPadrao);
    }
}

// 3. FUNÇÃO: Filtra os vídeos no Supabase
async function filtrarVideosPorTag(tag) {
    const container = document.getElementById('videoContainer');
    if (!container || !supabaseClient) return;

    container.innerHTML = `Filtrando por #${tag}...`;

    try {
        let { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .ilike('tags', `%${tag}%`)
            .order('id', { ascending: false });

        if (error) throw error;
        renderizarVideos(data);
    } catch (e) {
        container.innerHTML = `<span style="color: red;">Erro ao filtrar vídeos.</span>`;
    }
}

// 4. FUNÇÃO: Busca vídeos por título ou autor
async function buscarVideos() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const termo = searchInput.value.trim();
    const container = document.getElementById('videoContainer');
    
    if (!termo) {
        carregarTodosOsVideos();
        return;
    }

    container.innerHTML = `Pesquisando por: "${termo}"...`;

    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .or(`titulo.ilike.%${termo}%,autor.ilike.%${termo}%`)
            .order('id', { ascending: false });

        if (error) throw error;
        
        document.getElementById('secaoTituloVideo').innerText = ` Resultados para: "${termo}"`;
        renderizarVideos(data);
    } catch (e) {
        console.error("Erro na busca:", e);
        container.innerHTML = `<p>Erro ao realizar a busca.</p>`;
    }
}

// 5. FUNÇÃO: Carrega criadores recentes
async function carregarUsuariosRecentes() {
    const authorsList = document.getElementById('dynamicAuthors');
    if (!authorsList || !supabaseClient) return;

    try {
        let { data } = await supabaseClient
            .from('videos')
            .select('autor')
            .order('id', { ascending: false })
            .limit(10);

        if (data) {
            const autoresUnicos = [...new Set(data.map(item => item.autor))].slice(0, 5);
            authorsList.innerHTML = autoresUnicos.map(autor => 
                `<li>• <a href="canais.html?user=${encodeURIComponent(autor)}" style="color: #0033CC; font-weight: bold; text-decoration: none;">${autor}</a></li>`
            ).join('');
        }
    } catch (e) {
        console.warn("Erro ao buscar criadores:", e);
    }
}

// ==========================================
// CONFIGURAÇÃO DOS EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Evento tags
    document.querySelectorAll('.tag-link').forEach(tagEl => {
        tagEl.addEventListener('click', async () => {
            document.querySelectorAll('.tag-link').forEach(t => t.classList.remove('active-tag'));
            tagEl.classList.add('active-tag');
            
            const tagSelecionada = tagEl.getAttribute('data-tag');
            document.getElementById('secaoTituloVideo').innerText = ` Vídeos Marcados com: #${tagSelecionada}`;
            document.getElementById('limparFiltro').style.display = 'inline';

            await filtrarVideosPorTag(tagSelecionada);
        });
    });

    // Evento limpar filtro
    document.getElementById('limparFiltro')?.addEventListener('click', async () => {
        document.querySelectorAll('.tag-link').forEach(t => t.classList.remove('active-tag'));
        document.getElementById('secaoTituloVideo').innerText = " Vídeos Sendo Assistidos Agora";
        document.getElementById('limparFiltro').style.display = 'none';
        await carregarTodosOsVideos(); 
    });

    // Evento busca (Enter)
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarVideos();
    });

    // Início
    if (supabaseClient) {
        carregarTodosOsVideos();
        carregarUsuariosRecentes();
    } else {
        renderizarVideos(videosPadrao);
    }
});
