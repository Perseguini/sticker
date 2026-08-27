// ==============================================
// VERSÃO 4.0 — FOTO VIRA STICKER DE VERDADE ✅
// Recorte centralizado + máscara + borda + transparência
// ==============================================

const canvas = document.getElementById('sticker');
const ctx = canvas.getContext('2d', {willReadFrequently:true});
const TAM = 512; // Padrão WhatsApp

let imagem = null;
let imagemSemFundo = null;

// Elementos
const inputFoto = document.getElementById('foto-input');
const pedidoEl = document.getElementById('pedido');
const aplicarBtn = document.getElementById('aplicar-btn');
const corBorda = document.getElementById('cor-borda');
const espessura = document.getElementById('espessura');
const valEspessura = document.getElementById('val-espessura');
const transparente = document.getElementById('transparente');
const formato = document.getElementById('formato');
const textoEl = document.getElementById('texto');
const removerFundoBtn = document.getElementById('remover-fundo');
const baixarBtn = document.getElementById('baixar');
const processando = document.getElementById('processando');

const cores = {
    branco:'#ffffff', preto:'#000000', vermelho:'#ff0000', azul:'#0066ff',
    verde:'#00cc00', rosa:'#ff69b4', roxo:'#9933ff', dourado:'#ffd700'
};

// EVENTOS
inputFoto.addEventListener('change', carregarFoto);
aplicarBtn.addEventListener('click', aplicarPedido);
removerFundoBtn.addEventListener('click', removerFundo);
espessura.addEventListener('input', ()=>{
    valEspessura.textContent = espessura.value;
    desenhar();
});
[corBorda, transparente, formato, textoEl].forEach(el=>el.addEventListener('input',desenhar));
baixarBtn.addEventListener('click', baixar);

function carregarFoto(e){
    const arq = e.target.files[0];
    if(!arq) return;
    const leitor = new FileReader();
    leitor.onload = evt=>{
        const img = new Image();
        img.onload = ()=>{
            imagem = img;
            imagemSemFundo = null;
            desenhar(); // ✅ Já vira sticker automaticamente
        };
        img.src = evt.target.result;
    };
    leitor.readAsDataURL(arq);
}

// ✅ FUNÇÃO PRINCIPAL — FOTO VIRA STICKER
function desenhar(){
    const imgUsar = imagemSemFundo || imagem;
    if(!imgUsar) return;

    ctx.clearRect(0,0,TAM,TAM);

    // Fundo
    if(!transparente.checked){
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,TAM,TAM);
    }

    const borda = Number(espessura.value);
    const margem = borda + 25; // Espaço da borda
    const areaUtil = TAM - margem * 2;

    // Recorte + máscara
    ctx.save();
    ctx.beginPath();
    desenharMascara(TAM/2, TAM/2, areaUtil/2);
    ctx.clip();

    // Desenha borda
    if(borda > 0){
        ctx.strokeStyle = corBorda.value;
        ctx.lineWidth = borda;
        ctx.beginPath();
        desenharMascara(TAM/2, TAM/2, areaUtil/2);
        ctx.stroke();
    }

    // ✅ FOTO REDIMENSIONADA E CENTRALIZADA — NÃO FICA NORMAL!
    const escala = Math.min(areaUtil / imgUsar.width, areaUtil / imgUsar.height);
    const w = imgUsar.width * escala;
    const h = imgUsar.height * escala;
    const x = TAM/2 - w/2;
    const y = TAM/2 - h/2;

    ctx.drawImage(imgUsar, x, y, w, h);
    ctx.restore();

    // Texto
    if(textoEl.value.trim()){
        ctx.fillStyle = '#222';
        ctx.font = 'bold 36px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(textoEl.value, TAM/2, TAM - 35);
    }
}

function desenharMascara(cx, cy, r){
    switch(formato.value){
        case 'circulo': ctx.arc(cx, cy, r, 0, Math.PI*2); break;
        case 'quadrado': ctx.rect(cx-r, cy-r, r*2, r*2); break;
        case 'arredondado': ctx.roundRect(cx-r, cy-r, r*2, r*2, 40); break;
    }
}

function aplicarPedido(){
    if(!imagem) return alert('📷 Envie uma foto primeiro!');
    const txt = pedidoEl.value.toLowerCase().trim();
    if(!txt) return alert('✍️ Escreva seu pedido!');

    // Cores
    for(const [nome,cod] of Object.entries(cores)){
        if(txt.includes(nome)){
            if(txt.includes('borda')||txt.includes('contorno')) corBorda.value = cod;
        }
    }
    // Espessura
    if(txt.includes('grosso')) espessura.value = 14;
    if(txt.includes('fino')) espessura.value = 4;
    if(txt.includes('sem borda')||txt.includes('sem contorno')) espessura.value = 0;
    valEspessura.textContent = espessura.value;
    // Formato
    if(txt.includes('circulo')||txt.includes('circular')) formato.value = 'circulo';
    if(txt.includes('quadrado')) formato.value = 'quadrado';
    if(txt.includes('arredondado')) formato.value = 'arredondado';
    // Transparente
    if(txt.includes('sem fundo')||txt.includes('transparente')) transparente.checked = true;
    // Remover fundo
    if(txt.includes('remover fundo')||txt.includes('sem fundo')) removerFundo();
    // Texto
    const m = txt.match(/(escreva|texto):?\s*["']?([^"'\n]+)["']?/);
    if(m) textoEl.value = m[2].trim();

    desenhar();
    alert('✅ Sticker aplicado! 👇');
}

async function removerFundo(){
    if(!imagem) return alert('📷 Envie uma foto primeiro!');
    processando.className = 'processando-ativo';
    removerFundoBtn.disabled = true;
    removerFundoBtn.textContent = 'Processando...';

    try{
        const temp = document.createElement('canvas');
        temp.width = imagem.width; temp.height = imagem.height;
        temp.getContext('2d').drawImage(imagem,0,0);
        const blob = await new Promise(r=>temp.toBlob(r,'image/png',1));
        const res = await imglyRemoveBackground(blob, {model:'medium', output:{format:'image/png'}});
        
        const imgSF = new Image();
        imgSF.src = URL.createObjectURL(res);
        await new Promise(r=>imgSF.onload=r);
        imagemSemFundo = imgSF;
        desenhar();
        alert('✅ Fundo removido!');
    }catch(e){
        console.error(e);
        alert('⚠️ Erro ao remover fundo.');
    }finally{
        processando.className = 'processando-oculto';
        removerFundoBtn.disabled = false;
        removerFundoBtn.textContent = '🗑️ Remover Fundo da Foto';
    }
}

function baixar(){
    if(!imagem) return alert('📷 Envie uma foto primeiro!');
    const a = document.createElement('a');
    a.download = `sticker_${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    setTimeout(()=>alert('✅ Sticker baixado! Envie no WhatsApp 📱'), 300);
}
