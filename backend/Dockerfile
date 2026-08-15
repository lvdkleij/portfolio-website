FROM eclipse-temurin:21 AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY modules/ modules/

RUN chmod +x mvnw \
    && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

COPY --from=build \
    /app/modules/bootstrap/target/bootstrap-0.0.1-SNAPSHOT.jar \
    app.jar

EXPOSE 8080

USER 10001

ENTRYPOINT ["java", "-jar", "app.jar"]