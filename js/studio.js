let supabaseClient = null;

window.addEventListener('DOMContentLoaded', async () => {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // Verifica autenticação
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    carregarMeusVideos(session.user.email);
});

async function carregarMeusVideos(email) {
    const tbody = document.getElementById('listaMeusVideos');
    
    // Busca apenas vídeos do usuário logado
    let { data: videos, error } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('email_autor', email)
        .order('id', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar vídeos.</td></tr>';
        return;
    }

    if (videos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Você ainda não publicou nenhum vídeo.</td></tr>';
        return;
    }

    tbody.innerHTML = videos.map(v => `
        <tr>
            <td><img src="${v.thumb}" width="80" onerror="this.src='https://placehold.co/80x50'"></td>
            <td><strong>${v.titulo}</strong></td>
            <td>
                ${v.denunciado ? '<span class="status-alert">⚠️ Sob Revisão</span>' : '<span style="color:green;">✅ Ativo</span>'}
                ${v.copyright_strike ? '<br><span class="status-alert">🚫 Direitos Autorais</span>' : ''}
            </td>
            <td>
                <span class="btn-del" onclick="excluirVideo('${v.id}')">Excluir</span>
            </td>
        </tr>
    `).join('');
}

async function excluirVideo(id) {
    if (!confirm("Tem certeza que deseja deletar este vídeo do LirpeHub?")) return;
    
    const { error } = await supabaseClient.from('videos').delete().eq('id', id);
    
    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        alert("Vídeo removido com sucesso.");
        location.reload();
    }
}
