// CONFIGURAÇÃO DO SEU SUPABASE (Mantenha suas chaves aqui)
const SUPABASE_URL = "SUA_URL_DO_SUPABASE";
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_DO_SUPABASE";

// Cliente Supabase inicializado de forma segura
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Vídeo padrão de backup caso o banco falhe ou esteja vazio
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
        container.innerHTML = '<p style="font-style: italic; color: #666; padding: 10px;">Nenhum vídeo encontrado para esta seleção.</p>';
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
    if (!container) return;
    
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
        console.log("Erro ao carregar vídeos do Supabase. Usando dados padrão de backup:", e);
        renderizarVideos(videosPadrao);
    }
}

// 3. FUNÇÃO: Filtra os vídeos no Supabase de acordo com a tag selecionada
async function filtrarVideosPorTag(tag) {
    const container = document.getElementById('videoContainer');
    if (!container) return;

    container.innerHTML = `Filtrando por #${tag}...`;

    try {
        // Busca na tabela filtrando onde a coluna 'tags' (ou categoria) contenha o nome da tag
        let { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .ilike('tags', `%${tag}%`)
            .order('id', { ascending: false });

        if (error) throw error;
        renderizarVideos(data);
    } catch (e) {
        console.error("Erro ao filtrar vídeos por tag:", e);
        container.innerHTML = `<span style="color: red;">Erro ao filtrar vídeos.</span>`;
    }
}

// 4. FUNÇÃO: Pega os criadores reais que publicaram vídeos recentemente e coloca na Barra Lateral
async function carregarUsuariosRecentes() {
    const authorsList = document.getElementById('dynamicAuthors');
    if (!authorsList) return;

    try {
        // Pega os 5 vídeos mais novos para descobrir quem são os criadores ativos
        let { data, error } = await supabaseClient
            .from('videos')
            .select('autor')
            .order('id', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            authorsList.innerHTML = `<li style="color: #666; font-style: italic;">Nenhum criador ativo ainda.</li>`;
            return;
        }

        // Remove duplicados da lista usando um Set
        const autoresUnicos = [...new Set(data.map(item => item.autor))].slice(0, 5);

        authorsList.innerHTML = '';
        autoresUnicos.forEach(autor => {
            const li = document.createElement('li');
            li.innerHTML = `• <a href="canais.html?user=${encodeURIComponent(autor)}" style="color: #0033CC; font-weight: bold; text-decoration: none;">${autor}</a>`;
            authorsList.appendChild(li);
        });

    } catch (e) {
        console.warn("Erro ao buscar criadores recentes do banco:", e);
        authorsList.innerHTML = `<li style="color: #666;">Erro ao carregar criadores.</li>`;
    }
}

// ==========================================
// CONFIGURAÇÃO DOS EVENTOS (TAGS & CLIQUES)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Configura o evento de clique em cada tag da nuvem de tags
    document.querySelectorAll('.tag-link').forEach(tagEl => {
        tagEl.addEventListener('click', async () => {
            // Remove o destaque visual de todas as tags
            document.querySelectorAll('.tag-link').forEach(t => t.classList.remove('active-tag'));
            
            // Ativa visualmente apenas a tag que foi clicada
            tagEl.classList.add('active-tag');
            
            const tagSelecionada = tagEl.getAttribute('data-tag');
            
            const tituloSecao = document.getElementById('secaoTituloVideo');
            if (tituloSecao) tituloSecao.innerText = `📺 Vídeos Marcados com: #${tagSelecionada}`;
            
            const btnLimpar = document.getElementById('limparFiltro');
            if (btnLimpar) btnLimpar.style.display = 'inline';

            // Executa a busca filtrada no seu banco Supabase
            await filtrarVideosPorTag(tagSelecionada);
        });
    });

    // Configura o botão para limpar filtro e mostrar tudo novamente
    const btnLimpar = document.getElementById('limparFiltro');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', async () => {
            document.querySelectorAll('.tag-link').forEach(t => t.classList.remove('active-tag'));
            
            const tituloSecao = document.getElementById('secaoTituloVideo');
            if (tituloSecao) tituloSecao.innerText = "📺 Vídeos Sendo Assistidos Agora";
            
            btnLimpar.style.display = 'none';
            
            // Recarrega todos os vídeos originais
            await carregarTodosOsVideos(); 
        });
    }

    // Executa as cargas iniciais ao abrir a página
    carregarTodosOsVideos();
    carregarUsuariosRecentes();
});
