"""Embute a imagem de cada fase num .js (data URL), para o jogo funcionar abrindo os arquivos direto, sem servidor.
Uso: python embutir.py <pasta Teoria-das-cores>   (rode de novo sempre que trocar uma imagem)"""
import base64, io, json, os, re, sys

pasta = sys.argv[1]
TIPOS = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
os.makedirs(os.path.join(pasta, "img", "embutidas"), exist_ok=True)

for nome in sorted(os.listdir(pasta)):
    if not (nome.startswith("prototipo-") and nome.endswith(".html")):
        continue
    caminho = os.path.join(pasta, nome)
    s = io.open(caminho, encoding="utf-8", newline="").read()
    m_foto, m_svg = re.search(r'const FOTO = "([^"]+)";', s), re.search(r'const SVG = "([^"]+)";', s)
    if not (m_foto or m_svg) or "pergunta.js" not in s:
        continue                                   # protótipos antigos, fora do jogo
    arquivo = (m_foto or m_svg).group(1)
    base = os.path.splitext(os.path.basename(arquivo))[0]
    dados = io.open(os.path.join(pasta, arquivo), "rb").read()
    if m_svg:
        conteudo = "window.SVG_EMBUTIDO = " + json.dumps(dados.decode("utf-8")) + ";\n"
    else:
        uri = "data:" + TIPOS[os.path.splitext(arquivo)[1].lower()] + ";base64," + base64.b64encode(dados).decode()
        conteudo = 'window.IMAGEM_EMBUTIDA = "' + uri + '";\n'
    js = f"img/embutidas/{base}.js"
    io.open(os.path.join(pasta, js), "w", encoding="utf-8", newline="\n").write(
        f"// {arquivo} embutida (gerado por embutir.py): permite abrir o jogo sem servidor\n" + conteudo)
    # a página carrega o .js e usa a imagem embutida quando existir
    tag = f'<script src="{js}"></script>\n'
    if tag not in s:
        s = s.replace('<script src="pergunta.js"></script>\n', tag + '<script src="pergunta.js"></script>\n', 1)
    s = s.replace("img.src = FOTO;", "img.src = window.IMAGEM_EMBUTIDA || FOTO;   // embutida = funciona sem servidor")
    s = s.replace("fetch(SVG).then((r) => r.text()).then((txt) => {",
                  "(window.SVG_EMBUTIDO ? Promise.resolve(window.SVG_EMBUTIDO) : fetch(SVG).then((r) => r.text())).then((txt) => {   // embutido = funciona sem servidor")
    io.open(caminho, "w", encoding="utf-8", newline="").write(s)
    print(f"{nome}: {js} ({len(conteudo) // 1024} KB)")
