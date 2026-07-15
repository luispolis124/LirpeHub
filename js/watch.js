const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');

async function carregarVideo() {
    if (!videoId) {
        document.getElementById('videoTitulo').innerText = "Erro: Vídeo não encontrado.";
        return;
    }

    const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // Busca o vídeo pelo ID no banco
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

    if (error || !data) {
        document.getElementById('videoTitulo').innerText = "Erro ao carregar vídeo.";
        console.error("Erro Supabase:", error);
        return;
    }

    // Preenche a página
    document.getElementById('videoTitulo').innerText = data.titulo;
    document.getElementById('videoAutor').innerText = data.autor;
    document.getElementById('videoDescricao').innerText = data.descricao;

    // Lógica do Player (YouTube ou Local)
    const embedArea = document.getElementById('videoEmbed');
    if (data.embedurl === "local_file") {
        embedArea.innerHTML = `<p>Este vídeo é um arquivo local e não pode ser exibido via link direto.</p>`;
    } else {
        embedArea.innerHTML = `<iframe width="100%" height="450" src="${data.embedurl}" frameborder="0" allowfullscreen></iframe>`;
    }
}

carregarVideo();
