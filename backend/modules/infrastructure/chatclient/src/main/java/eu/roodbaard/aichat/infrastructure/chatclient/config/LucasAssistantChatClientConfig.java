package eu.roodbaard.aichat.infrastructure.chatclient.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

@Configuration
public class LucasAssistantChatClientConfig {

    @Value("classpath:promptTemplates/systemPromptTemplate.st")
    Resource systemPromptTemplate;

    @Bean
    public ChatClient lucasAssistantChatClient(OpenAiChatModel openAiChatModel) {
        ChatClient.Builder builder = ChatClient.builder(openAiChatModel);

        builder.defaultSystem(systemPromptTemplate);
        
        return builder.build();
    }
}
