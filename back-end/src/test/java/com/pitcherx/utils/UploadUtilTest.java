package com.pitcherx.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UploadUtilTest {

    @TempDir
    Path diretorioImagens;

    @TempDir
    Path diretorioVideos;

    private UploadUtil uploadUtil;

    @BeforeEach
    void configurar() {
        uploadUtil = new UploadUtil();
        ReflectionTestUtils.setField(uploadUtil, "diretorioUploadImagens", diretorioImagens.toString());
        ReflectionTestUtils.setField(uploadUtil, "diretorioUploadVideos", diretorioVideos.toString());
        ReflectionTestUtils.setField(uploadUtil, "baseUrlImagens", "http://localhost:8080/imagens/");
        ReflectionTestUtils.setField(uploadUtil, "baseUrlVideos", "http://localhost:8080/videos/");
    }

    @Test
    void salvaEDeletaImagemDentroDoDiretorioConfigurado() throws Exception {
        String url = uploadUtil.salvarImagem(imagem("foto.jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}));
        Path arquivoSalvo = diretorioImagens.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/imagens/"));

        uploadUtil.deletarImagem(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void rejeitaExtensaoImagemNaoPermitida() {
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarImagem(imagem("script.svg", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaConteudoImagemQueNaoCorrespondeAExtensao() {
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarImagem(imagem("foto.png", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaGaleriaImagensAcimaDeDez() {
        List<MultipartFile> arquivos = java.util.stream.IntStream.range(0, 11)
                .<MultipartFile>mapToObj(i -> imagem("foto" + i + ".jpg",
                        new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}))
                .toList();

        assertThrows(IllegalArgumentException.class, () -> uploadUtil.salvarImagens(arquivos));
    }

    @Test
    void salvaEDeletaVideoDentroDoDiretorioConfigurado() throws Exception {
        // MP4: ftyp box at bytes 4-7 (need 8 bytes: 4 bytes size + 4 bytes ftyp)
        byte[] mp4Bytes = new byte[12];
        mp4Bytes[4] = 'f'; mp4Bytes[5] = 't'; mp4Bytes[6] = 'y'; mp4Bytes[7] = 'p';
        String url = uploadUtil.salvarVideo(video("video.mp4", mp4Bytes));
        Path arquivoSalvo = diretorioVideos.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/videos/"));

        uploadUtil.deletarVideo(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void rejeitaExtensaoVideoNaoPermitida() {
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarVideo(video("script.svg", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaConteudoVideoQueNaoCorrespondeAExtensao() {
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarVideo(video("video.mp4", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaGaleriaVideosAcimaDeDez() {
        List<MultipartFile> arquivos = java.util.stream.IntStream.range(0, 11)
                .<MultipartFile>mapToObj(i -> video("video" + i + ".mp4",
                        new byte[]{'f', 't', 'y', 'p', 0, 0, 0, 0}))
                .toList();

        assertThrows(IllegalArgumentException.class, () -> uploadUtil.salvarVideos(arquivos));
    }

    @Test
    void salvaWebmVideo() throws Exception {
        String url = uploadUtil.salvarVideo(video("video.webm", new byte[]{(byte) 0x1A, (byte) 0x45, (byte) 0xDF, (byte) 0xA3}));
        Path arquivoSalvo = diretorioVideos.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/videos/"));

        uploadUtil.deletarVideo(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void salvaMovVideo() throws Exception {
        // MOV: ftyp box at bytes 4-7
        byte[] movBytes = new byte[12];
        movBytes[4] = 'f'; movBytes[5] = 't'; movBytes[6] = 'y'; movBytes[7] = 'p';
        String url = uploadUtil.salvarVideo(video("video.mov", movBytes));
        Path arquivoSalvo = diretorioVideos.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/videos/"));

        uploadUtil.deletarVideo(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void salvaMkvVideo() throws Exception {
        // MKV: EBML header at bytes 0-3
        byte[] mkvBytes = new byte[]{(byte) 0x1A, (byte) 0x45, (byte) 0xDF, (byte) 0xA3};
        String url = uploadUtil.salvarVideo(video("video.mkv", mkvBytes));
        Path arquivoSalvo = diretorioVideos.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/videos/"));

        uploadUtil.deletarVideo(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void salvaPngImagem() throws Exception {
        String url = uploadUtil.salvarImagem(imagem("foto.png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}));
        Path arquivoSalvo = diretorioImagens.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/imagens/"));

        uploadUtil.deletarImagem(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void salvaWebpImagem() throws Exception {
        byte[] webpBytes = new byte[12];
        webpBytes[0] = 'R'; webpBytes[1] = 'I'; webpBytes[2] = 'F'; webpBytes[3] = 'F';
        webpBytes[8] = 'W'; webpBytes[9] = 'E'; webpBytes[10] = 'B'; webpBytes[11] = 'P';
        String url = uploadUtil.salvarImagem(imagem("foto.webp", webpBytes));
        Path arquivoSalvo = diretorioImagens.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/imagens/"));

        uploadUtil.deletarImagem(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void rejeitaArquivoVazio() {
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarImagem(imagem("empty.jpg", new byte[]{})));
        assertThrows(IllegalArgumentException.class,
                () -> uploadUtil.salvarVideo(video("empty.mp4", new byte[]{})));
    }

    private MockMultipartFile imagem(String nome, byte[] conteudo) {
        return new MockMultipartFile("arquivo", nome, "application/octet-stream", conteudo);
    }

    private MockMultipartFile video(String nome, byte[] conteudo) {
        return new MockMultipartFile("arquivo", nome, "application/octet-stream", conteudo);
    }
}