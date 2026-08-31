package eu.roodbaard.aichat.infrastructure.chatclient.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LucasAssistantChatClientConfig {

    @Bean
    public ChatClient lucasAssistantChatClient(OpenAiChatModel openAiChatModel) {
        ChatClient.Builder builder = ChatClient.builder(openAiChatModel);

        builder.defaultSystem(systemPromptTemplate);
        
        return builder.build();
    }
}
