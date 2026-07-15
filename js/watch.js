// Obtém o ID do vídeo da URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');

// Vídeo padrão de backup (mesmo que no main.js)
const videosPadrao = [
    {
        id: "1",
        titulo: "Me at the zoo - O primeiro vídeo do YouTube!",
        autor: "jawed",
        descricao: "Vídeo de exemplo",
        visualizacoes: "399,580,346",
        data: "Há 21 anos",
        thumb: "https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg",
        embedurl: "https://www.youtube.com/embed/jNQXAC9IVRw",
        tipo: "youtube",
        copyright_strike: false
    }
];

// Função principal para carregar o vídeo
async function carregarVideo() {
    if (!videoId) {
        document.getElementById('videoTitulo').innerText = "Erro: Vídeo não encontrado.";
        return;
    }

    // Inicializa o cliente Supabase
    const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    try {
        // Busca o vídeo pelo ID
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();

        // Se não encontrar no Supabase, usa fallback
        if (error || !data) {
            console.warn("Vídeo não encontrado no Supabase, usando fallback:", error);

            const videoPadrao = videosPadrao.find(v => v.id === videoId);
            if (videoPadrao) {
                document.getElementById('videoTitulo').innerText = videoPadrao.titulo;
                document.getElementById('videoAutor').innerText = videoPadrao.autor;
                document.getElementById('videoDescricao').innerText = videoPadrao.descricao;

                const embedArea = document.getElementById('videoEmbed');
                embedArea.innerHTML = `
                    <iframe width="100%" height="450"
                            src="${videoPadrao.embedurl}"
                            frameborder="0" allowfullscreen>
                    </iframe>`;
            } else {
                document.getElementById('videoTitulo').innerText = "Erro ao carregar vídeo.";
            }
            return;
        }

        // Preenche os elementos da página com dados do Supabase
        document.getElementById('videoTitulo').innerText = data.titulo;
        document.getElementById('videoAutor').innerText = data.autor;
        document.getElementById('videoDescricao').innerText = data.descricao || "";

        // Lógica do Player (YouTube, Mux ou Local)
        const embedArea = document.getElementById('videoEmbed');

        if (data.tipo === "youtube") {
            embedArea.innerHTML = `
                <iframe width="100%" height="450" 
                        src="${data.embedurl}" 
                        frameborder="0" 
                        allowfullscreen>
                </iframe>`;
        } else if (data.tipo === "mux") {
            embedArea.innerHTML = `
                <video id="muxPlayer" controls width="100%" height="450" playsinline>
                    <source src="https://stream.mux.com/${data.playback_id}.m3u8" type="application/x-mpegURL">
                    Seu navegador não suporta reprodução de vídeo Mux.
                </video>`;
        } else if (data.embedurl === "local_file") {
            embedArea.innerHTML = `<p>Este vídeo é um arquivo local e não pode ser exibido via link direto.</p>`;
        } else {
            embedArea.innerHTML = `<p>Formato de vídeo não suportado.</p>`;
        }
    } catch (err) {
        document.getElementById('videoTitulo').innerText = "Erro inesperado.";
        console.error("Erro geral:", err);
    }
}

// Executa a função ao carregar a página
carregarVideo();