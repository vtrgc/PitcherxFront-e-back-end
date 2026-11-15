FROM eclipse-temurin:21-jdk-alpine as builder

LABEL maintainer="Matheus" \
      description="Docker image para a rede PitcherX" \
      version="1.0" \
      url="https://github.com/matheusvinmi/PitcherX-BackEnd.git"

WORKDIR /workspace

# Copy maven project files and cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source code and build application
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="Matheus" \
      description="Docker image para a rede PitcherX - JRE only" \
      version="1.0" \
      url="https://github.com/matheusvinmi/PitcherX-BackEnd.git"

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /workspace/target/pitcherx-*.jar app/pitcherx.jar

# Set proper ownership
RUN chown -R appuser:appgroup /app

# Expose application port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM performance options
ENV JAVA_OPTS="-Xms512m -Xmx512m -XX:+UseContainerSupport"

# Run as non-root user
USER appuser

ENTRYPOINT ["java", "-jar", "/app/pitcherx.jar"]