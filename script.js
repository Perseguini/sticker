const canvas = document.getElementById('sticker-canvas');
const ctx = canvas.getContext('2d');
const tamanho = 400;
let imagemOriginal = null, imagemSemFundo = null;

const inputFoto = document.getElementById('foto-input');
const comandoUsuario = document.getElementById('comando-usuario');
const aplicarComandoBtn = document.getElementById('aplicar-comando');
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

const mapaCores = {
    branco:'#ffffff', preto:'#000000', vermelho:'#ff0000', azul:'#0066ff',
    verde:'#00cc00', amarelo:'#ffdd00', rosa:'#ff69b4', roxo:'#9933ff',
    laranja:'#ff9900', dourado:'#ffd700', cinza:'#888888'
};

inputFoto.addEventListener('change', carregarImagem);
aplicarComandoBtn.addEventListener('click', interpretarComando);
removerFundoBtn.addEventListener('click', removerFotoFundo);
tamanhoContorno.addEventListener('input', ()=>{
    valorContorno.textContent = tamanhoContorno.value;
    desenharSticker();
});
[corContorno,corFundo,fundoTransparente,formato,textoSticker].forEach(el=>el.addEventListener('input',desenharSticker));
baixarBtn.addEventListener('click',baixarSticker);

function carregarImagem(e){
    const arq = e.target.files[0]; if(!arq) return;
    const leitor = new FileReader();
    leitor.onload = evt=>{
        const img = new Image();
        img.onload = ()=>{imagemOriginal=img; imagemSemFundo=null; desenharSticker();};
        img.src = evt.target.result;
    };
    leitor.readAsDataURL(arq);
}

async function removerFotoFundo(){
    if(!imagemOriginal) return alert('📷 Envie uma foto primeiro!');
    processandoEl.className='processando-ativo';
    removerFundoBtn.disabled=true; removerFundoBtn.textContent='Processando...';
    try{
        const tempC = document.createElement('canvas');
        tempC.width=imagemOriginal.width; tempC.height=imagemOriginal.height;
        tempC.getContext('2d').drawImage(imagemOriginal,0,0);
        const blob = await new Promise(r=>tempC.toBlob(r,'image/png'));
        const res = await imglyRemoveBackground(blob,{model:'medium',output:{format:'image/png'}});
        const imgSF = new Image(); imgSF.src=URL.createObjectURL(res);
        await new Promise(r=>imgSF.onload=r);
        imagemSemFundo=imgSF; desenharSticker(); alert('✅ Fundo removido!');
    }catch(e){console.error(e); alert('⚠️ Erro ao remover fundo.');}
    finally{processandoEl.className='processando-oculto'; removerFundoBtn.disabled=false; removerFundoBtn.textContent='🗑️ Remover Agora';}
}

function interpretarComando(){
    if(!imagemOriginal) return alert('📷 Envie uma foto primeiro!');
    const txt = comandoUsuario.value.toLowerCase(); if(!txt.trim()) return alert('✍️ Digite seu pedido!');
    if((txt.includes('remover fundo')||txt.includes('sem fundo')||txt.includes('transparente'))&&!imagemSemFundo) removerFotoFundo();
    
    for(const [nome,cod] of Object.entries(mapaCores)){
        if(txt.includes(nome)){
            if(txt.includes('contorno')||txt.includes('borda')) corContorno.value=cod;
            if(txt.includes('fundo')&&!txt.includes('sem fundo')){corFundo.value=cod; fundoTransparente.checked=false;}
        }
    }
    if(txt.includes('grosso')||txt.includes('largo')) tamanhoContorno.value=12;
    if(txt.includes('fino')||txt.includes('delgado')) tamanhoContorno.value=3;
    valorContorno.textContent=tamanhoContorno.value;
    
    if(txt.includes('círculo')||txt.includes('circular')) formato.value='circulo';
    if(txt.includes('quadrado')) formato.value='quadrado';
    if(txt.includes('arredondado')) formato.value='arredondado';
    if(txt.includes('transparente')||txt.includes('sem fundo')) fundoTransparente.checked=true;
    
    const m = txt.match(/(escreva|texto|diga):?\s*["']?([^"'\n]+)["']?/);
    if(m) textoSticker.value=m[2].trim().replace(/[.!]$/,'');
    
    desenharSticker(); alert('✅ Pedido aplicado! 👇');
}

function desenharSticker(){
    const imgUsar = imagemSemFundo||imagemOriginal; if(!imgUsar) return;
    ctx.clearRect(0,0,tamanho,tamanho);
    if(!fundoTransparente.checked){ctx.fillStyle=corFundo.value; ctx.fillRect(0,0,tamanho,tamanho);}
    
    const altImg = textoSticker.value ? tamanho-70 : tamanho;
    const margem=20; const tamImg = altImg - margem*2;
    ctx.save(); ctx.beginPath(); desenharFormato(tamanho/2,altImg/2,tamImg/2); ctx.clip();
    
    ctx.strokeStyle=corContorno.value; ctx.lineWidth=tamanhoContorno.value;
    ctx.beginPath(); desenharFormato(tamanho/2,altImg/2,tamImg/2); ctx.stroke();
    
    const pr = Math.min(tamImg/imgUsar.width, tamImg/imgUsar.height);
    const w = imgUsar.width*pr, h=imgUsar.height*pr;
    const x=tamanho/2-w/2, y=altImg/2-h/2;
    ctx.drawImage(imgUsar,x,y,w,h); ctx.restore();
    
    if(textoSticker.value){
        ctx.fillStyle='#333'; ctx.font='bold 32px Segoe UI'; ctx.textAlign='center';
        ctx.fillText(textoSticker.value,tamanho/2,tamanho-25);
    }
}

function desenharFormato(cx,cy,r){
    switch(formato.value){
        case 'circulo': ctx.arc(cx,cy,r,0,Math.PI*2); break;
        case 'quadrado': ctx.rect(cx-r,cy-r,r*2,r*2); break;
        case 'arredondado': ctx.roundRect(cx-r,cy-r,r*2,r*2,30); break;
    }
}

function baixarSticker(){
    if(!imagemOriginal) return alert('📷 Envie uma foto primeiro!');
    const a = document.createElement('a');
    a.download='meu-sticker.png'; a.href=canvas.toDataURL('image/png'); a.click();
}
