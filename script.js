// ==============================================
// CRIADOR DE STICKER - VERSÃO 3.1 - COM ATALHOS ✅
// ==============================================

const canvas = document.getElementById('sticker-canvas');
const ctx = canvas.getContext('2d', {willReadFrequently:true});
const TAMANHO_STICKER = 512;

let imagemOriginal = null;
let imagemSemFundo = null;

// Elementos
const inputFoto = document.getElementById('foto-input');
const pedidoIa = document.getElementById('pedido-ia');
const criarIaBtn = document.getElementById('criar-ia-btn');
const atalhoBtns = document.querySelectorAll('.atalho-btn');
const corContorno = document.getElementById('cor-contorno');
const tamanhoContorno = document.getElementById('tamanho-contorno');
const valorContorno = document.getElementById('valor-contorno');
const corFundo = document.getElementById('cor-fundo');
const fundoTransparente = document.getElementById('fundo-transparente');
const formato = document.getElementById('formato');
const textoSticker = document.getElementById('texto-sticker');
const baixarBtn = document.getElementById('baixar-btn');
const removerFundoBtn = document.getElementById('remover-fundo-btn');
const processandoEl = document.getElementById('processando');

// Mapa de cores
const mapaCores = {
    branco:'#ffffff', preto:'#000000', vermelho:'#ff0000', azul:'#0066ff',
    verde:'#00cc00', amarelo:'#ffdd00', rosa:'#ff69b4', roxo:'#9933ff',
    laranja:'#ff9900', dourado:'#ffd700', cinza:'#888888'
};

// ================= EVENTOS ================
inputFoto.addEventListener('change', carregarImagem);
criarIaBtn.addEventListener('click', criarStickerComIA);
removerFundoBtn.addEventListener('click', removerFotoFundo);

// 🎯 EVENTO DOS ATALHOS — preenche o campo automaticamente
atalhoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        pedidoIa.value = prompt;
        pedidoIa.focus();
        // Efeito visual de confirmação
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
    });
});

// Atualização automática em tempo real
tamanhoContorno.addEventListener('input', ()=>{
    valorContorno.textContent = tamanhoContorno.value;
    desenharSticker();
});
[corContorno, corFundo, fundoTransparente, formato, textoSticker].forEach(el=>{
    el.addEventListener('input', desenharSticker);
});
baixarBtn.addEventListener('click', baixarSticker);

// ================= FUNÇÕES ================
function carregarImagem(e){
    const arq = e.target.files[0];
    if(!arq) return;

    const leitor = new FileReader();
    leitor.onload = evt=>{
        const img = new Image();
        img.onload = ()=>{
            imagemOriginal = img;
            imagemSemFundo = null;
            desenharSticker();
        };
        img.src = evt.target.result;
    };
    leitor.readAsDataURL(arq);
}

async function criarStickerComIA(){
    const pedido = pedidoIa.value.trim();
    if(!pedido) return alert('🤖 Descreva o sticker ou clique em um atalho acima!');

    processandoEl.className = 'processando-ativo';
    criarIaBtn.disabled = true;
    criarIaBtn.textContent = 'Gerando...';

    try{
        const config = interpretarPedido(pedido);
        
        corContorno.value = config.corContorno;
        tamanhoContorno.value = config.tamanhoContorno;
        valorContorno.textContent = config.tamanhoContorno;
        corFundo.value = config.corFundo;
        fundoTransparente.checked = config.fundoTransparente;
        formato.value = config.formato;
        textoSticker.value = config.texto;

        if(imagemOriginal && config.removerFundo){
            await removerFotoFundo();
        }

        desenharSticker();
        alert('✅ Sticker criado com sucesso! 🎉');
    }
    catch(erro){
        console.error(erro);
        alert('⚠️ Erro. Tente outro pedido.');
    }
    finally{
        processandoEl.className = 'processando-oculto';
        criarIaBtn.disabled = false;
        criarIaBtn.textContent = '🚀 Criar Sticker com IA';
    }
}

function interpretarPedido(texto){
    const txt = texto.toLowerCase();
    let config = {
        corContorno: '#000000',
        tamanhoContorno: 6,
        corFundo: '#ffffff',
        fundoTransparente: true,
        formato: 'arredondado',
        texto: '',
        removerFundo: false
    };

    for(const [nome, codigo] of Object.entries(mapaCores)){
        if(txt.includes(nome)){
            if(txt.includes('contorno') || txt.includes('borda')) config.corContorno = codigo;
            if(txt.includes('fundo') && !txt.includes('sem fundo') && !txt.includes('transparente')) config.corFundo = codigo;
        }
    }

    if(txt.includes('grosso') || txt.includes('largo')) config.tamanhoContorno = 14;
    if(txt.includes('fino') || txt.includes('delgado') || txt.includes('sem borda')) config.tamanhoContorno = 0;

    if(txt.includes('círculo') || txt.includes('circular')) config.formato = 'circulo';
    if(txt.includes('quadrado')) config.formato = 'quadrado';
    if(txt.includes('arredondado')) config.formato = 'arredondado';

    if(txt.includes('transparente') || txt.includes('sem fundo')){
        config.fundoTransparente = true;
        config.removerFundo = true;
    }

    const matchTexto = txt.match(/(escreva|texto|diga|com a frase):?\s*["']?([^"'\n]+)["']?/);
    if(matchTexto) config.texto = matchTexto[2].trim().replace(/[.!]$/, '');

    return config;
}

async function removerFotoFundo(){
    if(!imagemOriginal) return alert('📷 Envie uma foto primeiro!');
    
    processandoEl.className = 'processando-ativo';
    removerFundoBtn.disabled = true;
    removerFundoBtn.textContent = 'Processando...';

    try{
        const tempC = document.createElement('canvas');
        tempC.width = imagemOriginal.width;
        tempC.height = imagemOriginal.height;
        tempC.getContext('2d').drawImage(imagemOriginal, 0, 0);
        
        const blob = await new Promise(resolve => tempC.toBlob(resolve, 'image/png', 1.0));
        const resultado = await imglyRemoveBackground(blob, {
            model: 'medium',
            output: { format: 'image/png', quality: 1 }
        });

        const imgSF = new Image();
        imgSF.src = URL.createObjectURL(resultado);
        await new Promise(res => imgSF.onload = res);

        imagemSemFundo = imgSF;
        desenharSticker();
    }
    catch(erro){
        console.error(erro);
        alert('⚠️ Erro ao remover fundo.');
    }
    finally{
        processandoEl.className = 'processando-oculto';
        removerFundoBtn.disabled = false;
        removerFundoBtn.textContent = '🗑️ Remover Fundo';
    }
}

function desenharSticker(){
    const imgUsar = imagemSemFundo || imagemOriginal;
    if(!imgUsar) return;

    ctx.clearRect(0, 0, TAMANHO_STICKER, TAMANHO_STICKER);

    if(!fundoTransparente.checked){
        ctx.fillStyle = corFundo.value;
        ctx.fillRect(0, 0, TAMANHO_STICKER, TAMANHO_STICKER);
    }

    const temTexto = textoSticker.value.trim() !== '';
    const alturaImagem = temTexto ? TAMANHO_STICKER - 90 : TAMANHO_STICKER;
    const margem = 30;
    const tamImagem = alturaImagem - margem * 2;

    ctx.save();
    ctx.beginPath();
    desenharFormato(TAMANHO_STICKER/2, alturaImagem/2, tamImagem/2);
    ctx.clip();

    const espessura = Number(tamanhoContorno.value);
    if(espessura > 0){
        ctx.strokeStyle = corContorno.value;
        ctx.lineWidth = espessura;
        ctx.beginPath();
        desenharFormato(TAMANHO_STICKER/2, alturaImagem/2, tamImagem/2);
        ctx.stroke();
    }

    const escala = Math.min(tamImagem / imgUsar.width, tamImagem / imgUsar.height);
    const w = imgUsar.width * escala;
    const h = imgUsar.height * escala;
    const x = TAMANHO_STICKER/2 - w/2;
    const y = alturaImagem/2 - h/2;
    
    ctx.drawImage(imgUsar, x, y, w, h);
    ctx.restore();

    if(temTexto){
        ctx.fillStyle = '#222';
        ctx.font = 'bold 36px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textoSticker.value, TAMANHO_STICKER/2, TAMANHO_STICKER - 45);
    }
}

function desenharFormato(cx, cy, r){
    switch(formato.value){
        case 'circulo':
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            break;
        case 'quadrado':
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
            break;
        case 'arredondado':
            ctx.roundRect(cx - r, cy - r, r * 2, r * 2, 40);
            break;
    }
}

function baixarSticker(){
    if(!imagemOriginal) return alert('📷 Envie uma foto ou clique em um atalho e crie!');
    
    const link = document.createElement('a');
    link.download = `sticker_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    setTimeout(()=>alert('✅ Sticker baixado! Envie no WhatsApp 📱'), 300);
}
