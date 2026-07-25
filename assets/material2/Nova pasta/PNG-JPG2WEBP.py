from PIL import Image
from pathlib import Path
import traceback

# Pasta onde o script está salvo
pasta_script = Path(__file__).parent

# Pasta de entrada: mesma pasta do script
pasta_entrada = pasta_script

# Pasta de saída: subpasta "webp"
pasta_saida = pasta_script / "webp"
pasta_saida.mkdir(exist_ok=True)

# Tamanho máximo da miniatura
TAMANHO_MINIATURA = 500

# Extensões de imagem aceitas (png e jpg/jpeg, maiúsculas e minúsculas)
EXTENSOES_ACEITAS = ["*.png", "*.PNG", "*.jpg", "*.JPG", "*.jpeg", "*.JPEG"]

try:
    print("""
Escolha uma opção:

1 - Converter para WEBP em qualidade máxima
2 - Converter para WEBP miniatura
3 - Converter os dois
""")

    opcao = input("Digite a opção desejada: ").strip()

    if opcao not in ["1", "2", "3"]:
        print("Opção inválida. Digite apenas 1, 2 ou 3.")
    else:
        # Captura PNG e JPG/JPEG, evitando duplicatas
        arquivos_imagem = sorted(set(
            arquivo
            for padrao in EXTENSOES_ACEITAS
            for arquivo in pasta_entrada.glob(padrao)
        ))

        if not arquivos_imagem:
            print("Nenhum arquivo PNG ou JPG encontrado na mesma pasta do script.")
        else:
            for arquivo in arquivos_imagem:
                print(f"\nProcessando: {arquivo.name}")

                imagem = Image.open(arquivo).convert("RGBA")

                # Opção 1: qualidade máxima
                if opcao == "1" or opcao == "3":
                    nome_saida = pasta_saida / f"{arquivo.stem}.webp"

                    imagem.save(
                        nome_saida,
                        "WEBP",
                        lossless=True,
                        quality=100,
                        method=6
                    )

                    print(f"Criado em qualidade máxima: {nome_saida.name}")

                # Opção 2: miniatura
                if opcao == "2" or opcao == "3":
                    miniatura = imagem.copy()

                    miniatura.thumbnail(
                        (TAMANHO_MINIATURA, TAMANHO_MINIATURA),
                        Image.LANCZOS
                    )

                    nome_mini = pasta_saida / f"{arquivo.stem}_mini.webp"

                    miniatura.save(
                        nome_mini,
                        "WEBP",
                        quality=75,
                        method=6
                    )

                    print(f"Criado em miniatura: {nome_mini.name}")

            print("\nConversão finalizada.")

except Exception:
    print("\nOcorreu um erro:")
    traceback.print_exc()

input("\nPressione ENTER para fechar...")
