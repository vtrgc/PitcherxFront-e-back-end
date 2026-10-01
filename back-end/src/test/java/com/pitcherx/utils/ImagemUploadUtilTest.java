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

class ImagemUploadUtilTest {

    @TempDir
    Path diretorio;

    private ImagemUploadUtil imagemUploadUtil;

    @BeforeEach
    void configurar() {
        imagemUploadUtil = new ImagemUploadUtil();
        ReflectionTestUtils.setField(imagemUploadUtil, "diretorioUpload", diretorio.toString());
        ReflectionTestUtils.setField(imagemUploadUtil, "baseUrl", "http://localhost:8080/imagens/");
    }

    @Test
    void salvaEDeletaImagemDentroDoDiretorioConfigurado() throws Exception {
        String url = imagemUploadUtil.salvarImagem(imagem("foto.jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}));
        Path arquivoSalvo = diretorio.resolve(url.substring(url.lastIndexOf('/') + 1));

        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(url.startsWith("http://localhost:8080/imagens/"));

        imagemUploadUtil.deletarImagem(url);

        assertFalse(Files.exists(arquivoSalvo));
    }

    @Test
    void rejeitaExtensaoNaoPermitida() {
        assertThrows(IllegalArgumentException.class,
                () -> imagemUploadUtil.salvarImagem(imagem("script.svg", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaConteudoQueNaoCorrespondeAExtensao() {
        assertThrows(IllegalArgumentException.class,
                () -> imagemUploadUtil.salvarImagem(imagem("foto.png", new byte[]{1, 2, 3})));
    }

    @Test
    void rejeitaGaleriaAcimaDeDezImagens() {
        List<MultipartFile> arquivos = java.util.stream.IntStream.range(0, 11)
                .<MultipartFile>mapToObj(i -> imagem("foto" + i + ".jpg",
                        new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}))
                .toList();

        assertThrows(IllegalArgumentException.class, () -> imagemUploadUtil.salvarImagens(arquivos));
    }

    private MockMultipartFile imagem(String nome, byte[] conteudo) {
        return new MockMultipartFile("arquivo", nome, "application/octet-stream", conteudo);
    }
}
