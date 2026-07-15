document.addEventListener('DOMContentLoaded', () => {
    const regras = [
        "Seja respeitoso: Não toleramos discurso de ódio ou assédio.",
        "Conteúdo original: Publique apenas vídeos que você criou ou tem permissão.",
        "Sem spam: Não poste links repetitivos nos comentários.",
        "Privacidade: Não compartilhe dados pessoais de outros usuários.",
        "Denúncias: Se vir algo errado, use o botão 'Denunciar' para nossa equipe analisar."
    ];

    const container = document.getElementById('regrasContainer');
    const ul = document.createElement('ul');

    regras.forEach(regra => {
        const li = document.createElement('li');
        li.innerText = regra;
        ul.appendChild(li);
    });

    container.appendChild(ul);
});
