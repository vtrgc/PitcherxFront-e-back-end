package com.pitcherx.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.originPatterns:default}")
    private String corsOriginPatterns;

    @Value("${app.upload.dir}")
    private String diretorioUpload;

    @Value("${app.upload.base-url}")
    private String baseUrl;

    @Value("${app.upload.base-path}")
    private String basePath;

    @Value("${app.upload.video-dir}")
    private String diretorioUploadVideos;

    @Value("${app.upload.video-base-url}")
    private String baseUrlVideos;

    @Value("${app.upload.video-base-path}")
    private String basePathVideos;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var alowedOrigins = corsOriginPatterns.split(",");
        registry.addMapping("/**")
                .allowedOrigins(alowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String diretorioAbsoluto = Paths.get(diretorioUpload)
                .toAbsolutePath().normalize().toString();

        registry.addResourceHandler(basePath + "/**")
                .addResourceLocations("file:" + diretorioAbsoluto + "/");

        String diretorioAbsolutoVideos = Paths.get(diretorioUploadVideos)
                .toAbsolutePath().normalize().toString();

        registry.addResourceHandler(basePathVideos + "/**")
                .addResourceLocations("file:" + diretorioAbsolutoVideos + "/");
    }
}
