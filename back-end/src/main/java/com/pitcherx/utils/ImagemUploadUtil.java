package com.pitcherx.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class ImagemUploadUtil {

    private static final List<String> EXTENSOES_PERMITIDAS = List.of(".jpg", ".jpeg", ".png", ".webp");
    private static final long TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;
    private static final int QUANTIDADE_MAXIMA_IMAGENS = 10;
    private static final String NOME_GERADO_REGEX = "[0-9a-fA-F-]{36}\\.(jpg|jpeg|png|webp)";

    @Value("${app.upload.dir}")
    private String diretorioUpload;

    @Value("${app.upload.base-url}")
    private String baseUrl;

    public String salvarImagem(MultipartFile arquivo) {
        validarArquivo(arquivo);

        try {
            Path diretorio = diretorioUploadPath();
            Files.createDirectories(diretorio);

            String extensao = obterExtensao(arquivo.getOriginalFilename());
            String nomeArquivo = UUID.randomUUID() + extensao;

            Path destino = diretorio.resolve(nomeArquivo);
            Files.write(destino, arquivo.getBytes(), StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

            return urlBaseNormalizada() + "/" + nomeArquivo;

        } catch (IOException e) {
            throw new IllegalStateException("Erro ao salvar a imagem.", e);
        }
    }

    public List<String> salvarImagens(List<MultipartFile> arquivos) {
        if (arquivos == null || arquivos.isEmpty()) {
            throw new IllegalArgumentException("Envie ao menos uma imagem.");
        }
        if (arquivos.size() > QUANTIDADE_MAXIMA_IMAGENS) {
            throw new IllegalArgumentException("Uma galeria pode conter no máximo 10 imagens.");
        }
        arquivos.forEach(this::validarArquivo);

        List<String> urlsSalvas = new ArrayList<>();
        try {
            for (MultipartFile arquivo : arquivos) {
                urlsSalvas.add(salvarImagem(arquivo));
            }
            return List.copyOf(urlsSalvas);
        } catch (RuntimeException e) {
            for (String url : urlsSalvas) {
                try {
                    deletarImagem(url);
                } catch (RuntimeException cleanupException) {
                    e.addSuppressed(cleanupException);
                }
            }
            throw e;
        }
    }

    public void deletarImagem(String urlImagem) {
        if (urlImagem == null || urlImagem.isBlank()) {
            return;
        }
        String prefixo = urlBaseNormalizada() + "/";
        if (!urlImagem.startsWith(prefixo)) {
            return;
        }

        String nomeArquivo = urlImagem.substring(prefixo.length());
        if (!nomeArquivo.matches(NOME_GERADO_REGEX)) {
            throw new IllegalArgumentException("A URL não corresponde a uma imagem gerenciada pelo sistema.");
        }

        try {
            Path diretorio = diretorioUploadPath();
            Path caminho = diretorio.resolve(nomeArquivo).normalize();
            if (!caminho.startsWith(diretorio)) {
                throw new IllegalArgumentException("Caminho de imagem inválido.");
            }
            Files.deleteIfExists(caminho);
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao deletar a imagem.", e);
        }
    }

    public void deletarImagens(List<String> urls) {
        urls.forEach(this::deletarImagem);
    }

    public void limparAposTransacao(List<String> urlsAntigas, List<String> urlsNovas) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("A substituição de imagens exige uma transação ativa.");
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    deletarImagens(urlsAntigas);
                } else {
                    deletarImagens(urlsNovas);
                }
            }
        });
    }

    private Path diretorioUploadPath() {
        return Paths.get(diretorioUpload).toAbsolutePath().normalize();
    }

    private String urlBaseNormalizada() {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo enviado.");
        }

        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("O arquivo excede o tamanho máximo permitido de 10MB.");
        }

        String extensao = obterExtensao(arquivo.getOriginalFilename());
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new IllegalArgumentException("Formato de imagem não suportado. Use: " + EXTENSOES_PERMITIDAS);
        }

        try {
            byte[] conteudo = arquivo.getBytes();
            if (!assinaturaValida(extensao, conteudo)) {
                throw new IllegalArgumentException("O conteúdo do arquivo não corresponde a uma imagem " + extensao + ".");
            }
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível validar o arquivo enviado.", e);
        }
    }

    private boolean assinaturaValida(String extensao, byte[] conteudo) {
        return switch (extensao) {
            case ".jpg", ".jpeg" -> conteudo.length >= 3
                    && (conteudo[0] & 0xFF) == 0xFF
                    && (conteudo[1] & 0xFF) == 0xD8
                    && (conteudo[2] & 0xFF) == 0xFF;
            case ".png" -> conteudo.length >= 8
                    && (conteudo[0] & 0xFF) == 0x89
                    && conteudo[1] == 0x50
                    && conteudo[2] == 0x4E
                    && conteudo[3] == 0x47
                    && conteudo[4] == 0x0D
                    && conteudo[5] == 0x0A
                    && conteudo[6] == 0x1A
                    && conteudo[7] == 0x0A;
            case ".webp" -> conteudo.length >= 12
                    && conteudo[0] == 'R' && conteudo[1] == 'I'
                    && conteudo[2] == 'F' && conteudo[3] == 'F'
                    && conteudo[8] == 'W' && conteudo[9] == 'E'
                    && conteudo[10] == 'B' && conteudo[11] == 'P';
            default -> false;
        };
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            throw new IllegalArgumentException("Arquivo sem extensão válida.");
        }
        return nomeOriginal.substring(nomeOriginal.lastIndexOf('.')).toLowerCase();
    }
}
