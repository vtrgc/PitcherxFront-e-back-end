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
    }
}
