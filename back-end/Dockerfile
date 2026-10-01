FROM eclipse-temurin:25-jdk-alpine

LABEL maintainer="Matheus" \
      description="Docker image para a rede PitcherX" \
      version="1.0" \
      url="https://github.com/matheusvinmi/PitcherX-BackEnd.git"

WORKDIR /app

COPY target/**.jar app/pitcherx.jar

EXPOSE 8080

LABEL authors="matheus"

ENTRYPOINT ["java", "-jar", "pitcherx.jar"]