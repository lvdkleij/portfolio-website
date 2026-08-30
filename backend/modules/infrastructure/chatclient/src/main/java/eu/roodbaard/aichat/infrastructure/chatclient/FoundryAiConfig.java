package eu.roodbaard.aichat.infrastructure.chatclient;

import com.azure.identity.AuthenticationUtil;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.openai.credential.BearerTokenCredential;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FoundryAiConfig {

    @Bean
    OpenAiChatModel openAiChatModel(
            @Value("${spring.ai.openai.base-url}") String baseUrl,
            @Value("${spring.ai.openai.chat.model}") String deploymentName) {

        var tokenCredential = new DefaultAzureCredentialBuilder().build();

        var credential = BearerTokenCredential.create(
                AuthenticationUtil.getBearerTokenSupplier(
                        tokenCredential,
                        "https://ai.azure.com/.default"
                )
        );

        var options = OpenAiChatOptions.builder()
                .baseUrl(baseUrl)
                .credential(credential)
                .microsoftFoundry(true)
                .deploymentName(deploymentName)
                .maxTokens(500)
                .build();

        return OpenAiChatModel.builder()
                .options(options)
                .build();
    }
}