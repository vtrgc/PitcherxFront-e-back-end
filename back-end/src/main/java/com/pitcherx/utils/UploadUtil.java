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
public class UploadUtil {

    private static final List<String> EXTENSOES_IMAGEM_PERMITIDAS = List.of(".jpg", ".jpeg", ".png", ".webp");
    private static final long TAMANHO_MAXIMO_IMAGEM_BYTES = 10 * 1024 * 1024;
    private static final int QUANTIDADE_MAXIMA_IMAGENS = 10;
    private static final String NOME_GERADO_IMAGEM_REGEX = "[0-9a-fA-F-]{36}\\.(jpg|jpeg|png|webp)";

    private static final List<String> EXTENSOES_VIDEO_PERMITIDAS = List.of(".mp4", ".webm", ".mov", ".mkv");
    private static final long TAMANHO_MAXIMO_VIDEO_BYTES = 256 * 1024 * 1024;
    private static final int QUANTIDADE_MAXIMA_VIDEOS = 10;
    private static final String NOME_GERADO_VIDEO_REGEX = "[0-9a-fA-F-]{36}\\.(mp4|webm|mov|mkv)";

    @Value("${app.upload.dir}")
    private String diretorioUploadImagens;

    @Value("${app.upload.video-dir:./uploads/videos}")
    private String diretorioUploadVideos;

    @Value("${app.upload.base-url}")
    private String baseUrlImagens;

    @Value("${app.upload.video-base-url:http://localhost:8080/videos}")
    private String baseUrlVideos;

    public String salvarImagem(MultipartFile arquivo) {
        return salvarArquivo(arquivo, TipoArquivo.IMAGEM);
    }

    public String salvarVideo(MultipartFile arquivo) {
        return salvarArquivo(arquivo, TipoArquivo.VIDEO);
    }

    public List<String> salvarImagens(List<MultipartFile> arquivos) {
        return salvarArquivos(arquivos, TipoArquivo.IMAGEM);
    }

    public List<String> salvarVideos(List<MultipartFile> arquivos) {
        return salvarArquivos(arquivos, TipoArquivo.VIDEO);
    }

    public void deletarImagem(String urlImagem) {
        deletarArquivo(urlImagem, TipoArquivo.IMAGEM);
    }

    public void deletarVideo(String urlVideo) {
        deletarArquivo(urlVideo, TipoArquivo.VIDEO);
    }

    public void deletarImagens(List<String> urls) {
        urls.forEach(this::deletarImagem);
    }

    public void deletarVideos(List<String> urls) {
        urls.forEach(this::deletarVideo);
    }

    public void limparAposTransacaoImagens(List<String> urlsAntigas, List<String> urlsNovas) {
        limparAposTransacao(urlsAntigas, urlsNovas, TipoArquivo.IMAGEM);
    }

    public void limparAposTransacaoVideos(List<String> urlsAntigas, List<String> urlsNovas) {
        limparAposTransacao(urlsAntigas, urlsNovas, TipoArquivo.VIDEO);
    }

    private String salvarArquivo(MultipartFile arquivo, TipoArquivo tipo) {
        validarArquivo(arquivo, tipo);

        try {
            Path diretorio = diretorioPath(tipo);
            Files.createDirectories(diretorio);

            String extensao = obterExtensao(arquivo.getOriginalFilename());
            String nomeArquivo = UUID.randomUUID() + extensao;

            Path destino = diretorio.resolve(nomeArquivo);
            Files.write(destino, arquivo.getBytes(), StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

            return urlBaseNormalizada(tipo) + "/" + nomeArquivo;

        } catch (IOException e) {
            throw new IllegalStateException("Erro ao salvar o " + tipo.nome + ".", e);
        }
    }

    private List<String> salvarArquivos(List<MultipartFile> arquivos, TipoArquivo tipo) {
        if (arquivos == null || arquivos.isEmpty()) {
            throw new IllegalArgumentException("Envie ao menos um " + tipo.nome + ".");
        }
        int quantidadeMaxima = tipo == TipoArquivo.IMAGEM ? QUANTIDADE_MAXIMA_IMAGENS : QUANTIDADE_MAXIMA_VIDEOS;
        if (arquivos.size() > quantidadeMaxima) {
            throw new IllegalArgumentException("Uma galeria pode conter no máximo " + quantidadeMaxima + " " + tipo.nomePlural + ".");
        }
        arquivos.forEach(a -> validarArquivo(a, tipo));

        List<String> urlsSalvas = new ArrayList<>();
        try {
            for (MultipartFile arquivo : arquivos) {
                urlsSalvas.add(salvarArquivo(arquivo, tipo));
            }
            return List.copyOf(urlsSalvas);
        } catch (RuntimeException e) {
            for (String url : urlsSalvas) {
                try {
                    deletarArquivo(url, tipo);
                } catch (RuntimeException cleanupException) {
                    e.addSuppressed(cleanupException);
                }
            }
            throw e;
        }
    }

    private void deletarArquivo(String url, TipoArquivo tipo) {
        if (url == null || url.isBlank()) {
            return;
        }
        String prefixo = urlBaseNormalizada(tipo) + "/";
        if (!url.startsWith(prefixo)) {
            return;
        }

        String nomeArquivo = url.substring(prefixo.length());
        String regex = tipo == TipoArquivo.IMAGEM ? NOME_GERADO_IMAGEM_REGEX : NOME_GERADO_VIDEO_REGEX;
        if (!nomeArquivo.matches(regex)) {
            throw new IllegalArgumentException("A URL não corresponde a um " + tipo.nome + " gerenciado pelo sistema.");
        }

        try {
            Path diretorio = diretorioPath(tipo);
            Path caminho = diretorio.resolve(nomeArquivo).normalize();
            if (!caminho.startsWith(diretorio)) {
                throw new IllegalArgumentException("Caminho de " + tipo.nome + " inválido.");
            }
            Files.deleteIfExists(caminho);
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao deletar o " + tipo.nome + ".", e);
        }
    }

    private void limparAposTransacao(List<String> urlsAntigas, List<String> urlsNovas, TipoArquivo tipo) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("A substituição de " + tipo.nomePlural + " exige uma transação ativa.");
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    if (tipo == TipoArquivo.IMAGEM) {
                        deletarImagens(urlsAntigas);
                    } else {
                        deletarVideos(urlsAntigas);
                    }
                } else {
                    if (tipo == TipoArquivo.IMAGEM) {
                        deletarImagens(urlsNovas);
                    } else {
                        deletarVideos(urlsNovas);
                    }
                }
            }
        });
    }

    private Path diretorioPath(TipoArquivo tipo) {
        String diretorio = tipo == TipoArquivo.IMAGEM ? diretorioUploadImagens : diretorioUploadVideos;
        return Paths.get(diretorio).toAbsolutePath().normalize();
    }

    private String urlBaseNormalizada(TipoArquivo tipo) {
        String baseUrl = tipo == TipoArquivo.IMAGEM ? baseUrlImagens : baseUrlVideos;
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private void validarArquivo(MultipartFile arquivo, TipoArquivo tipo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo enviado.");
        }

        long tamanhoMaximo = tipo == TipoArquivo.IMAGEM ? TAMANHO_MAXIMO_IMAGEM_BYTES : TAMANHO_MAXIMO_VIDEO_BYTES;
        if (arquivo.getSize() > tamanhoMaximo) {
            throw new IllegalArgumentException("O arquivo excede o tamanho máximo permitido de " + (tamanhoMaximo / (1024 * 1024)) + "MB para " + tipo.nomePlural + ".");
        }

        String extensao = obterExtensao(arquivo.getOriginalFilename());
        List<String> extensoesPermitidas = tipo == TipoArquivo.IMAGEM ? EXTENSOES_IMAGEM_PERMITIDAS : EXTENSOES_VIDEO_PERMITIDAS;
        if (!extensoesPermitidas.contains(extensao)) {
            throw new IllegalArgumentException("Formato de " + tipo.nome + " não suportado. Use: " + extensoesPermitidas);
        }

        try {
            byte[] conteudo = arquivo.getBytes();
            if (!assinaturaValida(tipo, extensao, conteudo)) {
                throw new IllegalArgumentException("O conteúdo do arquivo não corresponde a um " + tipo.nome + " " + extensao + ".");
            }
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível validar o arquivo enviado.", e);
        }
    }

    private boolean assinaturaValida(TipoArquivo tipo, String extensao, byte[] conteudo) {
        if (tipo == TipoArquivo.IMAGEM) {
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
        } else {
            return switch (extensao) {
                case ".mp4", ".mov" -> conteudo.length >= 8
                        && conteudo[4] == 'f' && conteudo[5] == 't' && conteudo[6] == 'y' && conteudo[7] == 'p';
                case ".mkv", ".webm" -> conteudo.length >= 4
                        && (conteudo[0] & 0xFF) == 0x1A
                        && (conteudo[1] & 0xFF) == 0x45
                        && (conteudo[2] & 0xFF) == 0xDF
                        && (conteudo[3] & 0xFF) == 0xA3;
                default -> false;
            };
        }
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            throw new IllegalArgumentException("Arquivo sem extensão válida.");
        }
        return nomeOriginal.substring(nomeOriginal.lastIndexOf('.')).toLowerCase();
    }

    private enum TipoArquivo {
        IMAGEM("imagem", "imagens"),
        VIDEO("video", "videos");

        final String nome;
        final String nomePlural;

        TipoArquivo(String nome, String nomePlural) {
            this.nome = nome;
            this.nomePlural = nomePlural;
        }
    }
}