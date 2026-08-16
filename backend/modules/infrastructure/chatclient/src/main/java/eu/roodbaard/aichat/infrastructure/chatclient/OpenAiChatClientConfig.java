package eu.roodbaard.aichat.infrastructure.chatclient;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAiChatClientConfig {

    @Bean
    public ChatClient openAiChatClient(OpenAiChatModel openAiChatModel) {
        ChatClient.Builder builder = ChatClient.builder(openAiChatModel);

        return builder.build();
    }

}
